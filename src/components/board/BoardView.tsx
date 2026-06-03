import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  pointerWithin,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent
} from '@dnd-kit/core';

import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
} from '@dnd-kit/sortable';

import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { boardsApi, groupsApi, tasksApi } from '../../services/api';
import type { TaskGroup } from '../../types';
import { ColorPicker } from '../common/ColorPicker';
import styles from './BoardView.module.css';
import { TaskGroupColumn } from './TaskGroupColumn';

export function BoardView() {
  const { boardId } = useParams<{ boardId: string }>();
  const parsedBoardId = Number(boardId);
  const navigate = useNavigate();

  const [boardTitle, setBoardTitle] = useState('');
  const [sortedGroups, setSortedGroups] = useState<TaskGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [activeId, setActiveId] = useState<number | null>(null);
  const [activeType, setActiveType] = useState<'group' | 'task' | null>(null);
  const [dragSourceGroupId, setDragSourceGroupId] = useState<number | null>(null);
  const groupsRef = useRef<TaskGroup[]>([]);

  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupColor, setNewGroupColor] = useState<string | null>(null);

  // ─────────────────────────────────────────────
  // LOAD BOARD
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (isNaN(parsedBoardId)) return;

    setIsLoading(true);
    setErrorMsg(null);

    boardsApi.getById(parsedBoardId)
      .then(board => {
        setBoardTitle(board.taskBoardName);
        setSortedGroups(board.taskGroups || []);
        setIsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setErrorMsg('Failed to load board');
        setIsLoading(false);
      });
  }, [parsedBoardId]);

  useEffect(() => {
  groupsRef.current = sortedGroups;
}, [sortedGroups]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 3 },
    })
  );

  // ─────────────────────────────────────────────
  // GROUP CRUD (FIXED: no refresh needed)
  // ─────────────────────────────────────────────
  async function handleCreateGroup(e: React.FormEvent) {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    try {
      const created = await groupsApi.create(parsedBoardId, {
        taskGroupName: newGroupName.trim(),
        taskBoardId: parsedBoardId,
        color: newGroupColor ?? undefined,
      });

      setSortedGroups(prev => [...prev, { ...created, tasks: [] }]);

      setNewGroupName('');
      setNewGroupColor(null);
      setIsAddingGroup(false);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleUpdateGroup(groupId: number, data: any) {
    const updated = await groupsApi.update(parsedBoardId, groupId, data);
    setSortedGroups(prev =>
      prev.map(g => g.id === groupId ? updated : g)
    );
  }

  async function handleDeleteGroup(groupId: number) {
    await groupsApi.delete(parsedBoardId, groupId);
    setSortedGroups(prev => prev.filter(g => g.id !== groupId));
  }

  // ─────────────────────────────────────────────
  // TASK CRUD (LOCAL FIRST)
  // ─────────────────────────────────────────────
  async function handleCreateTask(groupId: number, data: any) {
    const newTask = await tasksApi.create(groupId, data);

    setSortedGroups(prev =>
      prev.map(g =>
        g.id === groupId
          ? { ...g, tasks: [...g.tasks, newTask] }
          : g
      )
    );
  }

  async function handleUpdateTask(taskId: number, data: any) {
    const updated = await tasksApi.update(taskId, data);

    setSortedGroups(prev =>
      prev.map(g => ({
        ...g,
        tasks: g.tasks.map(t => t.id === taskId ? updated : t),
      }))
    );
  }

  async function handleDeleteTask(groupId: number, taskId: number) {
    await tasksApi.delete(taskId);

    setSortedGroups(prev =>
      prev.map(g =>
        g.id === groupId
          ? { ...g, tasks: g.tasks.filter(t => t.id !== taskId) }
          : g
      )
    );
  }

  // ─────────────────────────────────────────────
  // DRAG START
  // ─────────────────────────────────────────────
  function handleDragStart(event: DragStartEvent) {
    const { active } = event;

    const type = active.data.current?.type;
    setActiveType(type === 'group' ? 'group' : 'task');

    setActiveId(type === 'group'
      ? Number(active.data.current?.groupId)
      : Number(active.id)
    );

    if (type === 'task') {
      setDragSourceGroupId(active.data.current?.groupId ?? null);
    }
  }

  // ─────────────────────────────────────────────
  // DRAG OVER (FIXED: stable + no warmup bug)
  // ─────────────────────────────────────────────
  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over || activeType !== 'task') return;

    const activeTaskId = Number(active.id);

    setSortedGroups(prev => {
      const sourceGroup = prev.find(g =>
        g.tasks.some(t => t.id === activeTaskId)
      );

      if (!sourceGroup) return prev;

      const overGroupId =
        over.data.current?.groupId ??
        Number(over.id.toString().replace('group-dropzone-', ''));

      if (!overGroupId) return prev;

      const destinationGroup = prev.find(g => g.id === overGroupId);
      if (!destinationGroup) return prev;

      const sourceTasks = [...sourceGroup.tasks];

      const destTasks = sourceGroup.id === destinationGroup.id
        ? sourceTasks
        : [...destinationGroup.tasks]; 

      const fromIndex = sourceTasks.findIndex(t => t.id === activeTaskId);
      if (fromIndex === -1) return prev;

      const activeTask = sourceTasks[fromIndex];

      // SAME GROUP
      if (sourceGroup.id === destinationGroup.id) {
        const overIndex = destTasks.findIndex(t => t.id === Number(over.id));

        const toIndex =
          overIndex === -1 ? destTasks.length : overIndex;

        const reordered = arrayMove(sourceTasks, fromIndex, toIndex);

        return prev.map(g =>
          g.id === sourceGroup.id
            ? { ...g, tasks: reordered }
            : g
        );
      }

      // DIFFERENT GROUP
      sourceTasks.splice(fromIndex, 1);

      const overIndex = destTasks.findIndex(t => t.id === Number(over.id));

      const insertIndex =
        overIndex === -1
          ? destTasks.length
          : Math.max(0, Math.min(overIndex, destTasks.length));

      destTasks.splice(insertIndex, 0, {
        ...activeTask,
        taskGroupId: destinationGroup.id,
      });


      return prev.map(g => {
        if (g.id === sourceGroup.id) return { ...g, tasks: sourceTasks };
        if (g.id === destinationGroup.id) return { ...g, tasks: destTasks };
        return g;
      });
    });
  }

  // ─────────────────────────────────────────────
  // DRAG END (ONLY COMMIT GROUP REORDER HERE)
  // ─────────────────────────────────────────────
  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    const type = activeType;

    setActiveId(null);
    setActiveType(null);
    setDragSourceGroupId(null);

    if (!over) return;

    // GROUP REORDER
    if (type === 'group') {
      const sourceId = active.data.current?.groupId;
      const destId = over.data.current?.groupId;

      if (!sourceId || !destId || sourceId === destId) return;

      const oldIndex = sortedGroups.findIndex(g => g.id === sourceId);
      const newIndex = sortedGroups.findIndex(g => g.id === destId);

      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(sortedGroups, oldIndex, newIndex);

      setSortedGroups(reordered);
      await groupsApi.reorder(parsedBoardId, reordered.map(g => g.id));
    }

    if (type === 'task') {
  const sourceGroupId = dragSourceGroupId;

  if (!sourceGroupId) return;

  const destinationGroupId =
    over.data.current?.groupId ??
    Number(over.id.toString().replace('group-dropzone-', ''));

  if (!destinationGroupId) return;

  // ALWAYS use latest UI state (not closure state)
  const currentGroups = groupsRef.current;

  const sourceGroup = currentGroups.find(g => g.id === sourceGroupId);
  const destinationGroup = currentGroups.find(g => g.id === destinationGroupId);

  if (!sourceGroup || !destinationGroup) return;

  const isSameGroup = sourceGroupId === destinationGroupId;

  const payload = {
    sourceGroupId,
    destinationGroupId,

    sourceTaskIds: sourceGroup.tasks.map(t => t.id),

    destinationTaskIds: isSameGroup
      ? sourceGroup.tasks.map(t => t.id)
      : destinationGroup.tasks.map(t => t.id),
  };

  try {
    await tasksApi.reorder(payload);
  } catch (err) {
    console.error('Failed persisting task reorder', err);
  }
}

    
  }


  // ─────────────────────────────────────────────
  // RENDER HELPERS
  // ─────────────────────────────────────────────
  const activeGroup =
    sortedGroups.find(g => g.id === activeId) ?? null;

  const activeTask =
    sortedGroups.flatMap(g => g.tasks)
      .find(t => t.id === activeId);

  if (isLoading) return <div className={styles.loading}>Loading...</div>;

  if (errorMsg) {
    return (
      <div className={styles.loading}>
        {errorMsg}
        <button onClick={() => navigate('/overview')}>Back</button>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button className={styles.backBtn} onClick={() => navigate('/overview')}>
            ← Back
          </button>
          <h1 className={styles.boardTitle}>{boardTitle}</h1>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={(args) =>
          pointerWithin(args).length ? pointerWithin(args) : closestCenter(args)
        }
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={[
            ...sortedGroups.map(g => `group-${g.id}`),
            'add-group'
          ]}
          strategy={rectSortingStrategy}
        >
          <div className={styles.columns}>
            {sortedGroups.map(group => (
              <TaskGroupColumn
                key={group.id}
                group={group}
                boardId={parsedBoardId}
                isDraggingTask={activeType === 'task'}
                onUpdateGroup={handleUpdateGroup}
                onDeleteGroup={handleDeleteGroup}
                onCreateTask={handleCreateTask}
                onUpdateTask={handleUpdateTask}
                onDeleteTask={handleDeleteTask}
              />
            ))}

            {/* ADD GROUP BUTTON */}
            <div className={styles.addGroupSlot}>
              {isAddingGroup ? (
                <form className={styles.newGroupForm} onSubmit={handleCreateGroup}>
                  <div className={styles.newGroupTitleRow}>
                    <input
                      className={styles.newGroupInput}
                      value={newGroupName}
                      onChange={e => setNewGroupName(e.target.value)}
                      placeholder="Column name"
                      autoFocus
                    />
                    <ColorPicker
                      currentColor={newGroupColor}
                      onSelect={setNewGroupColor}
                    />
                  </div>

                  {newGroupColor && (
                    <div
                      className={styles.newGroupColorPreview}
                      style={{ background: newGroupColor }}
                    />
                  )}

                  <div className={styles.newGroupActions}>
                    <button className={styles.confirmBtn} type="submit">
                      Add column
                    </button>
                    <button
                      className={styles.cancelBtn}
                      type="button"
                      onClick={() => {
                        setIsAddingGroup(false);
                        setNewGroupName('');
                        setNewGroupColor(null);
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  className={styles.addGroupBtn}
                  onClick={() => setIsAddingGroup(true)}
                >
                  + Add column
                </button>
              )}
            </div>
          </div>
        </SortableContext>

       <DragOverlay dropAnimation={null}>
 {activeType === 'group' && activeGroup && (
  <div
    className={styles.columnOverlayPlaceholder}
    style={{
      width: 320,
      maxHeight: 410,
      overflow: 'hidden',

      background: activeGroup.color || '#15151b',
      borderRadius: 14,
      padding: '0.75rem',
      border: '2px dashed #6366f1',
      boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)',
      opacity: 0.95,

      display: 'flex',
      flexDirection: 'column',
    }}
  >
    {/* header */}
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        fontWeight: 700,
        color: '#fff',
        marginBottom: '0.75rem',
      }}
    >
      ⠿ <span style={{ marginLeft: 8 }}>{activeGroup.taskGroupName}</span>
    </div>

    {/* IMPORTANT: only preview first 6 tasks */}
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {activeGroup.tasks.slice(0, 6).map(t => (
        <div
          key={t.id}
          style={{
            background: '#1e1e2a',
            padding: '0.5rem',
            borderRadius: 8,
            color: '#aaa',
            border: '1px solid #2d2d3d',
            fontSize: '0.85rem',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {t.taskName}
        </div>
      ))}
    </div>

    {/* fade hint if more tasks exist */}
    {activeGroup.tasks.length > 6 && (
      <div
        style={{
          marginTop: 'auto',
          fontSize: '0.75rem',
          color: 'rgba(255,255,255,0.3)',
          paddingTop: 8,
        }}
      >
        + {activeGroup.tasks.length - 6} more
      </div>
    )}
  </div>
)} 
</DragOverlay> 
      </DndContext>
    </div>
  );
}