import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { boardsApi, groupsApi, tasksApi } from '../../services/api';
import type { TaskGroup } from '../../types';
import styles from './BoardView.module.css';
import { TaskGroupColumn } from './TaskGroupColumn';

export function BoardView() {
  const { boardId } = useParams<{ boardId: string }>();
  const parsedBoardId = Number(boardId);
  const navigate = useNavigate();
  
  const [boardTitle, setBoardTitle] = useState<string>('');
  const [sortedGroups, setSortedGroups] = useState<TaskGroup[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [activeId, setActiveId] = useState<number | null>(null);
  const [activeType, setActiveType] = useState<'group' | 'task' | null>(null);

  useEffect(() => {
    if (isNaN(parsedBoardId)) return;
    setIsLoading(true);
    setErrorMsg(null);

    boardsApi.getById(parsedBoardId)
      .then((boardData) => {
        setBoardTitle(boardData.boardName);
        setSortedGroups(boardData.taskGroups || []);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Error loading board:", err);
        setErrorMsg("Failed to load board data.");
        setIsLoading(false);
      });
  }, [parsedBoardId]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3, 
      },
    })
  );

  // ── MUTATION ROUTINES ──────────────────────────────────────────────────────
  async function handleUpdateGroup(groupId: number, data: any) {
    try {
      const updated = await groupsApi.update(parsedBoardId, groupId, {
        taskGroupName: data.taskGroupName,
        color: data.color === null ? undefined : data.color
      });
      setSortedGroups(prev => prev.map(g => g.id === groupId ? updated : g));
    } catch (e) { console.error(e); }
  }

  async function handleDeleteGroup(groupId: number) {
    try {
      await groupsApi.delete(parsedBoardId, groupId);
      setSortedGroups(prev => prev.filter(g => g.id !== groupId));
    } catch (e) { console.error(e); }
  }

  async function handleCreateTask(groupId: number, data: any) {
    try {
      const newTask = await tasksApi.create(groupId, data);
      setSortedGroups(prev => prev.map(g => g.id === groupId ? { ...g, tasks: [...g.tasks, newTask] } : g));
    } catch (e) { console.error(e); }
  }

  async function handleUpdateTask(taskId: number, data: any) {
    try {
      const updated = await tasksApi.update(taskId, data);
      setSortedGroups(prev => prev.map(g => ({
        ...g,
        tasks: g.tasks.map(t => t.id === taskId ? updated : t)
      })));
    } catch (e) { console.error(e); }
  }

  async function handleDeleteTask(groupId: number, taskId: number) {
    try {
      await tasksApi.delete(taskId);
      setSortedGroups(prev => prev.map(g => g.id === groupId ? { ...g, tasks: g.tasks.filter(t => t.id !== taskId) } : g));
    } catch (e) { console.error(e); }
  }

  // ── DRAG ENGINE CORE LIFECYCLES ───────────────────────────────────────────
  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    const type = active.data.current?.type;
    setActiveType(type === 'group' ? 'group' : 'task');
    setActiveId(type === 'group' ? Number(active.data.current.groupId) : Number(active.id));
  }

  // 💡 NEW: Dynamically shifts tasks and opens layout spaces in real-time
  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over || activeType !== 'task') return;

    const sourceId = Number(active.id);
    const destId = Number(over.id);

    const sourceGroupId = active.data.current?.groupId;
    let destGroupId = over.data.current?.groupId;

    if (over.data.current?.type === 'group-dropzone') {
      destGroupId = over.data.current?.groupId;
    }

    if (!sourceGroupId || !destGroupId || sourceGroupId === destGroupId) return;

    setSortedGroups(prev => {
      const srcGroup = prev.find(g => g.id === sourceGroupId);
      const dstGroup = prev.find(g => g.id === destGroupId);
      if (!srcGroup || !dstGroup) return prev;

      const srcTasks = [...srcGroup.tasks].sort((a, b) => a.position - b.position);
      const dstTasks = [...dstGroup.tasks].sort((a, b) => a.position - b.position);

      const movedTask = srcTasks.find(t => t.id === sourceId);
      if (!movedTask) return prev;

      const updatedSrcTasks = srcTasks.filter(t => t.id !== sourceId);
      
      let insertIdx = dstTasks.length;
      if (over.data.current?.type === 'task') {
        const targetIdx = dstTasks.findIndex(t => t.id === destId);
        if (targetIdx !== -1) insertIdx = targetIdx;
      }

      const updatedDstTasks = [...dstTasks];
      updatedDstTasks.splice(insertIdx, 0, { ...movedTask, taskGroupId: destGroupId });

      return prev.map(g => {
        if (g.id === sourceGroupId) return { ...g, tasks: updatedSrcTasks };
        if (g.id === destGroupId) return { ...g, tasks: updatedDstTasks };
        return g;
      });
    });

    // Patch active layout item's parent group reference dynamically
    if (active.data.current) {
      active.data.current.groupId = destGroupId;
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    
    const originalType = activeType;
    setActiveId(null);
    setActiveType(null);

    if (!over) return;

    // ── CASE A: COMMIT COLUMN ROUTING REORDERING ──
    if (originalType === 'group') {
      const sourceGroupId = active.data.current?.groupId;
      const destGroupId = over.data.current?.groupId;

      if (!sourceGroupId || !destGroupId || sourceGroupId === destGroupId) return;
      
      const oldIdx = sortedGroups.findIndex(g => g.id === sourceGroupId);
      const newIdx = sortedGroups.findIndex(g => g.id === destGroupId);
      if (oldIdx === -1 || newIdx === -1) return;

      const reordered = arrayMove(sortedGroups, oldIdx, newIdx);
      setSortedGroups(reordered);
      groupsApi.reorder(parsedBoardId, reordered.map(g => g.id));
      return;
    }

    // ── CASE B: COMMIT TASK POSITION ROUTING ──
    if (originalType === 'task') {
      const sourceId = Number(active.id);
      const sourceGroupId = active.data.current?.groupId;
      
      if (!sourceGroupId) return;
      
      const targetGroup = sortedGroups.find(g => g.id === sourceGroupId);
      if (!targetGroup) return;

      const finalTasks = [...targetGroup.tasks].sort((a, b) => a.position - b.position);

      // If dropped inside same group, handle fallback sorting indices safely
      if (over.data.current?.groupId === sourceGroupId && over.data.current?.type === 'task') {
        const oldIdx = finalTasks.findIndex(t => t.id === sourceId);
        const newIdx = finalTasks.findIndex(t => t.id === Number(over.id));
        if (oldIdx !== -1 && newIdx !== -1 && oldIdx !== newIdx) {
          const locallySorted = arrayMove(finalTasks, oldIdx, newIdx);
          setSortedGroups(prev => prev.map(g => g.id === sourceGroupId ? { ...g, tasks: locallySorted } : g));
          
          tasksApi.reorder({
            sourceGroupId,
            destinationGroupId: sourceGroupId,
            sourceTaskIds: locallySorted.map(t => t.id),
            destinationTaskIds: locallySorted.map(t => t.id)
          });
          return;
        }
      }

      // Fire payload to save cross column adjustments made during handleDragOver
      tasksApi.reorder({
        sourceGroupId,
        destinationGroupId: sourceGroupId,
        sourceTaskIds: finalTasks.map(t => t.id),
        destinationTaskIds: finalTasks.map(t => t.id)
      });
    }
  }

  const activeGroup = originalTypeGroupSelector(activeId, sortedGroups);
  const activeTask = sortedGroups.flatMap(g => g.tasks).find(t => t.id === activeId);

  function originalTypeGroupSelector(id: number | null, groups: TaskGroup[]) {
    if (!id) return null;
    return groups.find(g => g.id === id);
  }

  if (isLoading) {
    return <div className={styles.loading}>Loading board columns...</div>;
  }

  if (errorMsg) {
    return (
      <div className={styles.loading} style={{ color: '#f87171' }}>
        {errorMsg} 
        <button onClick={() => navigate('/overview')} className={styles.backBtn}>Back</button>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button className={styles.backBtn} onClick={() => navigate('/overview')}>← Back</button>
          <h1 className={styles.boardTitle}>{boardTitle}</h1>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver} // 💡 Connected state bridge
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sortedGroups.map(g => `group-${g.id}`)}
          strategy={horizontalListSortingStrategy}
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
          </div>
        </SortableContext>

        <DragOverlay dropAnimation={null}>
          {/* 💡 FIXED: Renders the beautiful column track container skeleton */}
          {activeType === 'group' && activeGroup && (
            <div 
              className={styles.columnOverlayPlaceholder}
              style={{
                width: 300,
                minHeight: 500,
                background: activeGroup.color || '#15151b',
                borderRadius: 14,
                padding: '1rem',
                border: '2px dashed #6366f1',
                boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)',
                opacity: 0.95
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', fontWeight: 'bold', color: '#fff', marginBottom: '1rem' }}>
                ⠿ <span style={{ marginLeft: 8 }}>{activeGroup.taskGroupName}</span>
              </div>
              {activeGroup.tasks.map(t => (
                <div key={t.id} style={{ background: '#1e1e2a', padding: '0.6rem', borderRadius: 8, marginBottom: 8, color: '#aaa', border: '1px solid #2d2d3d' }}>
                  {t.taskName}
                </div>
              ))}
            </div>
          )}

          {activeType === 'task' && activeTask && (
            <div style={{ background: '#1e1e2a', border: '1px solid #6366f1', padding: '0.5rem 0.6rem', borderRadius: 8, color: '#fff', boxShadow: '0px 5px 15px rgba(0,0,0,0.4)', width: 280, transform: 'rotate(2deg)' }}>
              ⠿ {activeTask.taskName}
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}