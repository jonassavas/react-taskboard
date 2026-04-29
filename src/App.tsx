import { useEffect } from 'react';
import { StoreProvider, useStore } from './store/AppStore';
import { AuthPage } from './components/auth/AuthPage';
import { BoardsListPage } from './components/board/BoardsListPage';
import { BoardView } from './components/board/BoardView';
import { boardsApi } from './services/api';
import styles from './App.module.css';

function AppInner() {
  const { state, dispatch } = useStore();

  // On refresh: token is hydrated from localStorage but summaries aren't —
  // re-fetch them so the boards list page works after a page reload
  useEffect(() => {
    if (state.token && state.boardSummaries.length === 0) {
      boardsApi.getAll()
        .then(summaries => {
          // Dispatch a lightweight summaries-only update
          if (state.user) {
            dispatch({
              type: 'AUTH_SUCCESS',
              payload: { user: state.user, token: state.token!, summaries },
            });
          }
        })
        .catch(() => {
          // Token is invalid/expired — log out cleanly
          dispatch({ type: 'LOGOUT' });
        });
    }
  }, [state.token]);

  // Not logged in — show auth page
  if (!state.user || !state.token) {
    return <AuthPage />;
  }

  return (
    <div className={styles.app}>
      {state.view.type === 'BOARDS_LIST' && <BoardsListPage />}
      {state.view.type === 'BOARD' && <BoardView />}

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
