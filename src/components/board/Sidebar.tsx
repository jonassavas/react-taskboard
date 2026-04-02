import { useState } from 'react';
import { useBoards } from '../../hooks/useBoards';
import { useAuth } from '../../hooks/useAuth';
import styles from './Sidebar.module.css';

export function Sidebar() {
  const { boards, activeBoardId, setActiveBoard, createBoard, deleteBoard } = useBoards();
  const { user, logout } = useAuth();
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  async function handleCreateBoard(e: React.FormEvent) {
    e.preventDefault();
    if (!newBoardTitle.trim()) return;
    try {
      await createBoard({ title: newBoardTitle.trim() });
      setNewBoardTitle('');
      setIsCreating(false);
    } catch {
      // error handled in hook
    }
  }

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <span className={styles.brandMark}>T</span>
        <span className={styles.brandName}>TaskBoard</span>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>Boards</span>
          <button
            className={styles.addBtn}
            onClick={() => setIsCreating(v => !v)}
            title="New board"
          >
            +
          </button>
        </div>

        {isCreating && (
          <form className={styles.newBoardForm} onSubmit={handleCreateBoard}>
            <input
              className={styles.newBoardInput}
              type="text"
              placeholder="Board name"
              value={newBoardTitle}
              onChange={e => setNewBoardTitle(e.target.value)}
              autoFocus
            />
            <div className={styles.newBoardActions}>
              <button className={styles.confirmBtn} type="submit">Add</button>
              <button
                className={styles.cancelBtn}
                type="button"
                onClick={() => { setIsCreating(false); setNewBoardTitle(''); }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <nav className={styles.boardList}>
          {boards.map(board => (
            <div
              key={board.id}
              className={`${styles.boardItem} ${board.id === activeBoardId ? styles.active : ''}`}
            >
              <button
                className={styles.boardBtn}
                onClick={() => setActiveBoard(board.id)}
              >
                <span className={styles.boardIcon}>
                  {board.title.charAt(0).toUpperCase()}
                </span>
                <span className={styles.boardTitle}>{board.title}</span>
              </button>
              <button
                className={styles.deleteBtn}
                onClick={async (e) => {
                  e.stopPropagation();
                  if (confirm(`Delete "${board.title}"?`)) {
                    await deleteBoard(board.id);
                  }
                }}
                title="Delete board"
              >
                ×
              </button>
            </div>
          ))}
          {boards.length === 0 && !isCreating && (
            <p className={styles.empty}>No boards yet</p>
          )}
        </nav>
      </div>

      <div className={styles.footer}>
        <div className={styles.userInfo}>
          <div className={styles.avatar}>
            {user?.username.charAt(0).toUpperCase()}
          </div>
          <span className={styles.username}>{user?.username}</span>
        </div>
        <button className={styles.logoutBtn} onClick={logout} title="Sign out">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </div>
    </aside>
  );
}
