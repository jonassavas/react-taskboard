import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { User, TaskBoard, TaskBoardSummary, TaskGroup, Task } from '../types';

interface AppStore {
  user: User | null;
  token: string | null;
  boardSummaries: TaskBoardSummary[];
  loadedBoards: Record<number, TaskBoard>;
  isLoading: boolean;
  isBoardLoading: boolean;
  error: string | null;
}

type Action =
  | { type: 'AUTH_SUCCESS'; payload: { user: User; token: string; summaries: TaskBoardSummary[] } }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_BOARD_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'BOARD_LOADED'; payload: TaskBoard }
  | { type: 'ADD_BOARD_SUMMARY'; payload: TaskBoardSummary }
  | { type: 'DELETE_BOARD'; payload: number }
  | { type: 'ADD_GROUP'; payload: { boardId: number; group: TaskGroup } }
  | { type: 'UPDATE_GROUP'; payload: { boardId: number; group: TaskGroup } }
  | { type: 'DELETE_GROUP'; payload: { boardId: number; groupId: number } }
  | { type: 'ADD_TASK'; payload: { boardId: number; groupId: number; task: Task } }
  | { type: 'UPDATE_TASK'; payload: { boardId: number; task: Task } }
  | { type: 'DELETE_TASK'; payload: { boardId: number; groupId: number; taskId: number } };

const initialState: AppStore = {
  user: null,
  token: null,
  boardSummaries: [],
  loadedBoards: {},
  isLoading: false,
  isBoardLoading: false,
  error: null,
};

function reducer(state: AppStore, action: Action): AppStore {
  switch (action.type) {
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        boardSummaries: action.payload.summaries,
        error: null,
      };

    case 'LOGOUT':
      return { ...initialState };

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_BOARD_LOADING':
      return { ...state, isBoardLoading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    case 'BOARD_LOADED':
      return {
        ...state,
        loadedBoards: { ...state.loadedBoards, [action.payload.id]: action.payload },
        isBoardLoading: false,
      };

    case 'ADD_BOARD_SUMMARY':
      return {
        ...state,
        boardSummaries: [...state.boardSummaries, action.payload],
      };

    case 'DELETE_BOARD': {
      const { [action.payload]: _, ...remainingBoards } = state.loadedBoards;
      return {
        ...state,
        boardSummaries: state.boardSummaries.filter(b => b.id !== action.payload),
        loadedBoards: remainingBoards,
      };
    }

    case 'ADD_GROUP':
      return updateLoadedBoard(state, action.payload.boardId, board => ({
        ...board,
        taskGroups: [...board.taskGroups, { ...action.payload.group, tasks: [] }],
      }));

    case 'UPDATE_GROUP':
      return updateLoadedBoard(state, action.payload.boardId, board => ({
        ...board,
        taskGroups: board.taskGroups.map(g =>
          g.id === action.payload.group.id ? { ...g, ...action.payload.group } : g
        ),
      }));

    case 'DELETE_GROUP':
      return updateLoadedBoard(state, action.payload.boardId, board => ({
        ...board,
        taskGroups: board.taskGroups.filter(g => g.id !== action.payload.groupId),
      }));

    case 'ADD_TASK':
      return updateLoadedBoard(state, action.payload.boardId, board => ({
        ...board,
        taskGroups: board.taskGroups.map(g =>
          g.id === action.payload.groupId
            ? { ...g, tasks: [...g.tasks, action.payload.task] }
            : g
        ),
      }));

    case 'UPDATE_TASK':
      return updateLoadedBoard(state, action.payload.boardId, board => ({
        ...board,
        taskGroups: board.taskGroups.map(g => ({
          ...g,
          tasks: g.tasks.map(t =>
            t.id === action.payload.task.id ? { ...t, ...action.payload.task } : t
          ),
        })),
      }));

    case 'DELETE_TASK':
      return updateLoadedBoard(state, action.payload.boardId, board => ({
        ...board,
        taskGroups: board.taskGroups.map(g =>
          g.id === action.payload.groupId
            ? { ...g, tasks: g.tasks.filter(t => t.id !== action.payload.taskId) }
            : g
        ),
      }));

    default:
      return state;
  }
}

function updateLoadedBoard(
  state: AppStore,
  boardId: number,
  updater: (board: TaskBoard) => TaskBoard
): AppStore {
  const board = state.loadedBoards[boardId];
  if (!board) return state;
  return {
    ...state,
    loadedBoards: { ...state.loadedBoards, [boardId]: updater(board) },
  };
}

const StoreContext = createContext<{
  state: AppStore;
  dispatch: React.Dispatch<Action>;
} | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState, (init) => {
    const token = localStorage.getItem('jwt_token');
    const userRaw = localStorage.getItem('user');
    if (token && userRaw) {
      try {
        return { ...init, token, user: JSON.parse(userRaw) };
      } catch {
        return init;
      }
    }
    return init;
  });

  useEffect(() => {
    if (state.token) {
      localStorage.setItem('jwt_token', state.token);
      localStorage.setItem('user', JSON.stringify(state.user));
    } else {
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('user');
    }
  }, [state.token, state.user]);

  return (
    <StoreContext.Provider value={{ state, dispatch }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
