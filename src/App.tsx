import { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { StoreProvider, useStore } from './store/AppStore';
import { AuthPage } from './components/auth/AuthPage';
import { BoardsListPage } from './components/board/BoardsListPage';
import { BoardView } from './components/board/BoardView';
import { boardsApi } from './services/api';
import styles from './App.module.css';

function AppInner() {
  const { state, dispatch } = useStore();
  const navigate = useNavigate();

  // On refresh: re-fetch board summaries if we have a token but no summaries yet
  useEffect(() => {
    if (state.token && state.boardSummaries.length === 0 && state.user) {
      boardsApi.getAll()
        .then(summaries => {
          dispatch({
            type: 'AUTH_SUCCESS',
            payload: { user: state.user!, token: state.token!, summaries },
          });
        })
        .catch(() => {
          dispatch({ type: 'LOGOUT' });
          navigate('/login');
        });
    }
  }, [state.token]);

  if (!state.user || !state.token) {
    return (
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div className={styles.app}>
      <Routes>
        <Route path="/overview" element={<BoardsListPage />} />
        <Route path="/boards/:boardId" element={<BoardView />} />
        <Route path="*" element={<Navigate to="/overview" replace />} />
      </Routes>

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
