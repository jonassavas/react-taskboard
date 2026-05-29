import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useBoards } from '../../hooks/useBoards';
import { ColorPicker } from '../common/ColorPicker';
import styles from './BoardView.module.css';
import { TaskGroupColumn } from './TaskGroupColumn';

import {
  DndContext,
  PointerSensor,
  rectIntersection,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
} from '@dnd-kit/sortable';

export function BoardView() {
  const { boardId } = useParams<{ boardId: string }>();
  const parsedBoardId = Number(boardId);

  const {
    loadedBoards,
    isBoardLoading,
    goToOverview,
    openBoard,
    createGroup,
    updateGroup,
    deleteGroup,
    createTask,
    updateTask,
    reorderGroups,
    reorderTasks,
    deleteTask,
  } = useBoards();

  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupColor, setNewGroupColor] = useState<string | null>(null);
  const [isDraggingTask, setIsDraggingTask] = useState(false);

  const activeBoard = loadedBoards[parsedBoardId] ?? null;

  const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: {
      delay: 180,
      tolerance: 5,
    },
  })
); 

  useEffect(() => {
    if (parsedBoardId && !activeBoard && !isBoardLoading) {
      openBoard(parsedBoardId);
    }
  }, [parsedBoardId]);

  if (isBoardLoading || !activeBoard) {
    return <div className={styles.loading}><p>Loading board…</p></div>;
  }

  const sortedGroups = [...activeBoard.taskGroups].sort((a, b) => a.position - b.position);

  // Returns group id that owns a task id, or null
  function findGroupIdOfTask(taskId: number): number | null {
    for (const g of sortedGroups) {
      if (g.tasks.some(t => t.id === taskId)) return g.id;
    }
    return null;
  }
 
  function handleDragEnd(event: DragEndEvent) {
  const { active, over } = event;

  setIsDraggingTask(false);

  if (!over) return;

  const activeType = active.data.current?.type;
  const overType = over.data.current?.type;

  // ───────────────── TASKS ─────────────────

  if (activeType === 'task') {
    const activeTaskId = Number(active.id);

    const sourceGroupId = active.data.current?.groupId;

    let destGroupId: number | null = null;

    // dropped over another task
    if (overType === 'task') {
      destGroupId = over.data.current?.groupId ?? null;
    }

    // dropped over a group container
    // dropped over empty column space
    if (overType === 'group-dropzone') {
      destGroupId = over.data.current?.groupId ?? null;
    } 

    // dropped over droppable container
    if (!destGroupId) {
      destGroupId = resolveGroupId(over.id);
    }

    if (!sourceGroupId || !destGroupId) return;

    const sourceGroup = sortedGroups.find(g => g.id === sourceGroupId);
    const destGroup = sortedGroups.find(g => g.id === destGroupId);

    if (!sourceGroup || !destGroup) return;

    const srcSorted = [...sourceGroup.tasks].sort(
      (a, b) => a.position - b.position
    );

    // SAME COLUMN
    if (sourceGroupId === destGroupId) {
      if (overType !== 'task') return;

      const oldIdx = srcSorted.findIndex(t => t.id === activeTaskId);
      const newIdx = srcSorted.findIndex(t => t.id === Number(over.id));

      if (oldIdx === -1 || newIdx === -1 || oldIdx === newIdx) return;

      const reordered = arrayMove(srcSorted, oldIdx, newIdx);

      reorderTasks(
        parsedBoardId,
        sourceGroupId,
        destGroupId,
        reordered.map(t => t.id),
        reordered.map(t => t.id),
      );

      return;
    }

    // CROSS COLUMN
    const dstSorted = [...destGroup.tasks].sort(
      (a, b) => a.position - b.position
    );

    const movedTask = srcSorted.find(t => t.id === activeTaskId);

    if (!movedTask) return;

    const newSrc = srcSorted.filter(t => t.id !== activeTaskId);

    let insertAt = dstSorted.length;

    if (overType === 'task') {
      const idx = dstSorted.findIndex(t => t.id === Number(over.id));

      if (idx !== -1) {
        insertAt = idx;
      }
    }

    const newDst = [...dstSorted];

    newDst.splice(insertAt, 0, movedTask);

    reorderTasks(
      parsedBoardId,
      sourceGroupId,
      destGroupId,
      newSrc.map(t => t.id),
      newDst.map(t => t.id),
    );

    return;
  }

  // ───────────────── GROUPS ─────────────────

  if (activeType === 'group' && overType === 'group') {
    const activeGroupId = active.data.current?.groupId;
    const overGroupId = over.data.current?.groupId;

    if (
      !activeGroupId ||
      !overGroupId ||
      activeGroupId === overGroupId
    ) {
      return;
    }

    const oldIdx = sortedGroups.findIndex(g => g.id === activeGroupId);

    const newIdx = sortedGroups.findIndex(g => g.id === overGroupId);

    const reordered = arrayMove(sortedGroups, oldIdx, newIdx);

    reorderGroups(parsedBoardId, reordered.map(g => g.id));
  }
}

  function resolveGroupId(id: UniqueIdentifier): number | null {
    const raw = String(id).replace('droppable-', '');
    const asNum = Number(raw);
    if (sortedGroups.some(g => g.id === asNum)) return asNum;
    return null;
  }


  async function handleCreateGroup(e: React.FormEvent) {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    await createGroup(parsedBoardId, {
      taskGroupName: newGroupName.trim(),
      taskBoardId: parsedBoardId,
      color: newGroupColor ?? undefined,
    });
    setNewGroupName('');
    setNewGroupColor(null);
    setIsAddingGroup(false);
  }

  // One flat list of all task ids for the SortableContext


  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button className={styles.backBtn} onClick={goToOverview}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Overview
          </button>
          <h1 className={styles.boardTitle}>{activeBoard.taskBoardName}</h1>
        </div>
      </div>

     <DndContext
  sensors={sensors}
  collisionDetection={rectIntersection}
  onDragStart={({ active }) => {
    setIsDraggingTask(active.data.current?.type === 'task');
  }}
  onDragCancel={() => setIsDraggingTask(false)}
  onDragEnd={handleDragEnd}
>
  {/* GROUP SORTABLE CONTEXT ONLY */}
  <SortableContext
    items={sortedGroups.map(g => g.id)}
    strategy={rectSortingStrategy}
  >
    <div className={styles.columns}>
      {sortedGroups.map(group => (
        <TaskGroupColumn
          key={group.id}
          group={group}
          boardId={activeBoard.id}
          isDraggingTask={isDraggingTask}
          onUpdateGroup={async (groupId, data) =>
            updateGroup(activeBoard.id, groupId, data)
          }
          onDeleteGroup={async (groupId) =>
            deleteGroup(activeBoard.id, groupId)
          }
          onCreateTask={async (groupId, data) =>
            createTask(activeBoard.id, groupId, data)
          }
          onUpdateTask={async (taskId, data) =>
            updateTask(activeBoard.id, taskId, data)
          }
          onDeleteTask={async (groupId, taskId) =>
            deleteTask(activeBoard.id, groupId, taskId)
          }
        />
      ))}

      {isAddingGroup ? (
        <form className={styles.newGroupForm} onSubmit={handleCreateGroup}>
          <div className={styles.newGroupTitleRow}>
            <input
              className={styles.newGroupInput}
              type="text"
              placeholder="Column name"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
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
  </SortableContext>
</DndContext> 
    </div>
  );
}
