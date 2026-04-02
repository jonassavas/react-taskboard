import { useState } from 'react';
import { useBoards } from '../../hooks/useBoards';
import { TaskGroupColumn } from './TaskGroupColumn';
import styles from './BoardView.module.css';

export function BoardView() {
  const {
    boards,
    activeBoard,
    activeBoardId,
    createGroup,
    updateGroup,
    deleteGroup,
    createTask,
    updateTask,
    deleteTask,
  } = useBoards();

  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [newGroupTitle, setNewGroupTitle] = useState('');

  if (!activeBoard) {
    return (
      <div className={styles.empty}>
        {boards.length === 0 ? (
          <>
            <p className={styles.emptyTitle}>No boards yet</p>
            <p className={styles.emptySubtitle}>Create a board from the sidebar to get started</p>
          </>
        ) : (
          <p className={styles.emptyTitle}>Select a board</p>
        )}
      </div>
    );
  }

  const sortedGroups = [...activeBoard.taskGroups].sort((a, b) => a.position - b.position);

  async function handleCreateGroup(e: React.FormEvent) {
    e.preventDefault();
    if (!newGroupTitle.trim() || !activeBoardId) return;
    await createGroup(activeBoardId, { title: newGroupTitle.trim(), boardId: activeBoardId });
    setNewGroupTitle('');
    setIsAddingGroup(false);
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h1 className={styles.boardTitle}>{activeBoard.title}</h1>
        {activeBoard.description && (
          <p className={styles.boardDesc}>{activeBoard.description}</p>
        )}
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
              await createTask(activeBoard.id, groupId, { ...data, groupId });
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
              value={newGroupTitle}
              onChange={e => setNewGroupTitle(e.target.value)}
              autoFocus
            />
            <div className={styles.newGroupActions}>
              <button className={styles.confirmBtn} type="submit">Add column</button>
              <button
                className={styles.cancelBtn}
                type="button"
                onClick={() => { setIsAddingGroup(false); setNewGroupTitle(''); }}
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
