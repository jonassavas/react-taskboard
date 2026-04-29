import { useState } from 'react';
import { useBoards } from '../../hooks/useBoards';
import { useAuth } from '../../hooks/useAuth';
import styles from './BoardsListPage.module.css';

export function BoardsListPage() {
  const { boardSummaries, openBoard, createBoard, deleteBoard, isBoardLoading } = useBoards();
  const { user, logout } = useAuth();
  const [newBoardName, setNewBoardName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [openingBoardId, setOpeningBoardId] = useState<number | null>(null);

  async function handleCreateBoard(e: React.FormEvent) {
    e.preventDefault();
    if (!newBoardName.trim()) return;
    await createBoard({ taskBoardName: newBoardName.trim() });
    setNewBoardName('');
    setIsCreating(false);
  }

  async function handleOpenBoard(boardId: number) {
    setOpeningBoardId(boardId);
    await openBoard(boardId);
    setOpeningBoardId(null);
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.brandMark}>T</span>
          <span className={styles.brandName}>TaskBoard</span>
        </div>
        <div className={styles.userArea}>
          <span className={styles.username}>{user?.username}</span>
          <button className={styles.logoutBtn} onClick={logout}>Sign out</button>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>Your boards</h1>
          <button
            className={styles.newBoardBtn}
            onClick={() => setIsCreating(true)}
          >
            + New board
          </button>
        </div>

        {isCreating && (
          <form className={styles.createForm} onSubmit={handleCreateBoard}>
            <input
              className={styles.createInput}
              type="text"
              placeholder="Board name"
              value={newBoardName}
              onChange={e => setNewBoardName(e.target.value)}
              autoFocus
            />
            <div className={styles.createActions}>
              <button className={styles.confirmBtn} type="submit">
                Create board
              </button>
              <button
                className={styles.cancelBtn}
                type="button"
                onClick={() => { setIsCreating(false); setNewBoardName(''); }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {boardSummaries.length === 0 && !isCreating ? (
          <div className={styles.empty}>
            <p className={styles.emptyTitle}>No boards yet</p>
            <p className={styles.emptySubtitle}>Create your first board to get started</p>
            <button
              className={styles.emptyCreateBtn}
              onClick={() => setIsCreating(true)}
            >
              + Create a board
            </button>
          </div>
        ) : (
          <div className={styles.grid}>
            {boardSummaries.map(board => (
              <div key={board.id} className={styles.card}>
                <button
                  className={styles.cardMain}
                  onClick={() => handleOpenBoard(board.id)}
                  disabled={isBoardLoading}
                >
                  <span className={styles.cardIcon}>
                    {board.taskBoardName.charAt(0).toUpperCase()}
                  </span>
                  <span className={styles.cardName}>{board.taskBoardName}</span>
                  {openingBoardId === board.id && (
                    <span className={styles.cardLoading}>Loading…</span>
                  )}
                </button>
                <button
                  className={styles.cardDelete}
                  onClick={async () => {
                    if (confirm(`Delete "${board.taskBoardName}"? This cannot be undone.`)) {
                      await deleteBoard(board.id);
                    }
                  }}
                  title="Delete board"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
