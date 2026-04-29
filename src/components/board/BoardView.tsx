import { useState } from 'react';
import { useBoards } from '../../hooks/useBoards';
import { TaskGroupColumn } from './TaskGroupColumn';
import styles from './BoardView.module.css';

export function BoardView() {
  const {
    activeBoard,
    activeBoardId,
    isBoardLoading,
    goToBoardsList,
    createGroup,
    updateGroup,
    deleteGroup,
    createTask,
    updateTask,
    deleteTask,
  } = useBoards();

  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  if (isBoardLoading) {
    return (
      <div className={styles.loading}>
        <p>Loading board…</p>
      </div>
    );
  }

  if (!activeBoard) return null;

  const sortedGroups = [...activeBoard.taskGroups].sort((a, b) => a.id - b.id);

  async function handleCreateGroup(e: React.FormEvent) {
    e.preventDefault();
    if (!newGroupName.trim() || !activeBoardId) return;
    await createGroup(activeBoardId, {
      taskGroupName: newGroupName.trim(),
      taskBoardId: activeBoardId,
    });
    setNewGroupName('');
    setIsAddingGroup(false);
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button className={styles.backBtn} onClick={goToBoardsList}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Boards
          </button>
          <h1 className={styles.boardTitle}>{activeBoard.taskBoardName}</h1>
        </div>
      </div>

      <div className={styles.columns}>
        {sortedGroups.map(group => (
          <TaskGroupColumn
            key={group.id}
            group={group}
            boardId={activeBoard.id}
            onUpdateGroup={async (groupId, data) => {
              await updateGroup(activeBoard.id, groupId, data);
            }}
            onDeleteGroup={async (groupId) => {
              await deleteGroup(activeBoard.id, groupId);
            }}
            onCreateTask={async (groupId, data) => {
              await createTask(activeBoard.id, groupId, data);
            }}
            onUpdateTask={async (taskId, data) => {
              await updateTask(activeBoard.id, taskId, data);
            }}
            onDeleteTask={async (groupId, taskId) => {
              await deleteTask(activeBoard.id, groupId, taskId);
            }}
          />
        ))}

        {isAddingGroup ? (
          <form className={styles.newGroupForm} onSubmit={handleCreateGroup}>
            <input
              className={styles.newGroupInput}
              type="text"
              placeholder="Column name"
              value={newGroupName}
              onChange={e => setNewGroupName(e.target.value)}
              autoFocus
            />
            <div className={styles.newGroupActions}>
              <button className={styles.confirmBtn} type="submit">Add column</button>
              <button
                className={styles.cancelBtn}
                type="button"
                onClick={() => { setIsAddingGroup(false); setNewGroupName(''); }}
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
  );
}
