import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
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
import styles from './BoardView.module.css';
import { TaskGroupColumn } from './TaskGroupColumn';

interface Task {
  id: number;
  taskName: string;
  position: number;
  taskGroupId: number;
}

interface TaskGroup {
  id: number;
  taskGroupName: string;
  tasks: Task[];
  color?: string | null;
}

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

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    // Check if it's a task or a group to parse IDs safely
    const type = active.data.current?.type;
    if (type === 'group') {
      setActiveId(Number(active.data.current.groupId));
    } else {
      setActiveId(Number(active.id));
    }
    setActiveType(type === 'group' ? 'group' : 'task');
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    setActiveType(null);

    if (!over) return;

    // Standardize IDs out of metadata wrappers
    const sourceId = active.data.current?.type === 'group' ? Number(active.data.current.groupId) : Number(active.id);
    const destId = over.data.current?.type === 'group' ? Number(over.data.current.groupId) : Number(over.id);

    if (activeType === 'group') {
      if (sourceId === destId) return;
      
      const oldIdx = sortedGroups.findIndex(g => g.id === sourceId);
      const newIdx = sortedGroups.findIndex(g => g.id === destId);
      if (oldIdx === -1 || newIdx === -1) return;

      const reordered = arrayMove(sortedGroups, oldIdx, newIdx);
      setSortedGroups(reordered);
      groupsApi.reorder(parsedBoardId, reordered.map(g => g.id));
      return;
    }

    if (activeType === 'task') {
      const sourceGroupId = active.data.current?.groupId;
      let destGroupId = over.data.current?.groupId;

      // Handle dropzone data fallbacks cleanly
      if (over.data.current?.type === 'group-dropzone') {
        destGroupId = over.data.current?.groupId;
      }

      if (!sourceGroupId || !destGroupId) return;

      if (sourceGroupId === destGroupId) {
        const group = sortedGroups.find(g => g.id === sourceGroupId);
        if (!group) return;

        const tasksCopy = [...group.tasks].sort((a, b) => a.position - b.position);
        const oldIdx = tasksCopy.findIndex(t => t.id === sourceId);
        const newIdx = tasksCopy.findIndex(t => t.id === destId);

        if (oldIdx === -1 || newIdx === -1 || oldIdx === newIdx) return;

        const reorderedTasks = arrayMove(tasksCopy, oldIdx, newIdx);
        setSortedGroups(prev => prev.map(g => g.id === sourceGroupId ? { ...g, tasks: reorderedTasks } : g));
        
        tasksApi.reorder({
          sourceGroupId,
          destinationGroupId: destGroupId,
          sourceTaskIds: reorderedTasks.map(t => t.id),
          destinationTaskIds: reorderedTasks.map(t => t.id)
        });
        return;
      }

      const srcGroup = sortedGroups.find(g => g.id === sourceGroupId);
      const dstGroup = sortedGroups.find(g => g.id === destGroupId);
      if (!srcGroup || !dstGroup) return;

      const srcTasks = [...srcGroup.tasks].sort((a, b) => a.position - b.position);
      const dstTasks = [...dstGroup.tasks].sort((a, b) => a.position - b.position);

      const movedTask = srcTasks.find(t => t.id === sourceId);
      if (!movedTask) return;

      const updatedSrcTasks = srcTasks.filter(t => t.id !== sourceId);
      let insertIdx = dstTasks.length;

      const targetIdx = dstTasks.findIndex(t => t.id === destId);
      if (targetIdx !== -1) insertIdx = targetIdx;

      const updatedDstTasks = [...dstTasks];
      updatedDstTasks.splice(insertIdx, 0, { ...movedTask, taskGroupId: destGroupId });

      setSortedGroups(prev => prev.map(g => {
        if (g.id === sourceGroupId) return { ...g, tasks: updatedSrcTasks };
        if (g.id === destGroupId) return { ...g, tasks: updatedDstTasks };
        return g;
      }));

      tasksApi.reorder({
        sourceGroupId,
        destinationGroupId: destGroupId,
        sourceTaskIds: updatedSrcTasks.map(t => t.id),
        destinationTaskIds: updatedDstTasks.map(t => t.id)
      });
    }
  }

  const activeGroup = activeType === 'group' ? sortedGroups.find(g => g.id === activeId) : null;
  const activeTask = activeType === 'task' ? sortedGroups.flatMap(g => g.tasks).find(t => t.id === activeId) : null;

  if (isLoading) {
    return <div className={styles.loading}>Loading board columns...</div>;
  }

  if (errorMsg) {
    return (
      <div className={styles.loading} style={{ color: '#f87171' }}>
        {errorMsg} 
        <button onClick={() => navigate('/overview')} style={{ marginLeft: 10, background: '#333', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: 4, cursor: 'pointer' }}>
          Back
        </button>
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
          {activeType === 'group' && activeGroup && (
            <div style={{ width: 320, background: '#15151b', borderRadius: 14, padding: '0.75rem', opacity: 0.8, border: '1px solid #6366f1' }}>
              <strong style={{ color: '#fff' }}>{activeGroup.taskGroupName}</strong>
            </div>
          )}

          {activeType === 'task' && activeTask && (
            <div style={{ background: '#1e1e2a', border: '1px solid #6366f1', padding: '0.5rem 0.6rem', borderRadius: 8, color: '#fff', boxShadow: '0px 5px 15px rgba(0,0,0,0.4)', width: 280 }}>
              {activeTask.taskName}
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}