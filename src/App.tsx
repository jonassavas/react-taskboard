import { useEffect } from 'react';
import { StoreProvider, useStore } from './store/AppStore';
import { AuthPage } from './components/auth/AuthPage';
import { Sidebar } from './components/board/Sidebar';
import { BoardView } from './components/board/BoardView';
import { boardsApi } from './services/api';
import styles from './App.module.css';

function AppInner() {
  const { state, dispatch } = useStore();

  // Load boards after token hydration from localStorage
  useEffect(() => {
    if (state.token && state.boards.length === 0) {
      boardsApi.getAll()
        .then(boards => dispatch({ type: 'SET_BOARDS', payload: boards }))
        .catch(() => {});
    }
  }, [state.token]);

  if (!state.user || !state.token) {
    return <AuthPage />;
  }

  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.main}>
        <BoardView />
      </main>
      {state.error && (
        <div className={styles.toast} role="alert">
          {state.error}
          <button
            className={styles.toastClose}
            onClick={() => dispatch({ type: 'SET_ERROR', payload: null })}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

export function App() {
  return (
    <StoreProvider>
      <AppInner />
    </StoreProvider>
  );
}
