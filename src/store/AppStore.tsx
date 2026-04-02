import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { User, TaskBoard, TaskGroup, Task } from '../types';

interface AppStore {
  user: User | null;
  token: string | null;
  boards: TaskBoard[];
  activeBoardId: number | null;
  isLoading: boolean;
  error: string | null;
}

type Action =
  | { type: 'AUTH_SUCCESS'; payload: { user: User; token: string; boards: TaskBoard[] } }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_ACTIVE_BOARD'; payload: number | null }
  | { type: 'SET_BOARDS'; payload: TaskBoard[] }
  | { type: 'ADD_BOARD'; payload: TaskBoard }
  | { type: 'UPDATE_BOARD'; payload: TaskBoard }
  | { type: 'DELETE_BOARD'; payload: number }
  | { type: 'ADD_GROUP'; payload: { boardId: number; group: TaskGroup } }
  | { type: 'UPDATE_GROUP'; payload: { boardId: number; group: TaskGroup } }
  | { type: 'DELETE_GROUP'; payload: { boardId: number; groupId: number } }
  | { type: 'ADD_TASK'; payload: { boardId: number; groupId: number; task: Task } }
  | { type: 'UPDATE_TASK'; payload: { boardId: number; task: Task } }
  | { type: 'DELETE_TASK'; payload: { boardId: number; groupId: number; taskId: number } }
  | { type: 'MOVE_TASK'; payload: { boardId: number; task: Task; fromGroupId: number } };

const initialState: AppStore = {
  user: null,
  token: null,
  boards: [],
  activeBoardId: null,
  isLoading: false,
  error: null,
};

function reducer(state: AppStore, action: Action): AppStore {
  switch (action.type) {
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        boards: action.payload.boards,
        activeBoardId: action.payload.boards[0]?.id ?? null,
        error: null,
      };

    case 'LOGOUT':
      return { ...initialState };

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    case 'SET_ACTIVE_BOARD':
      return { ...state, activeBoardId: action.payload };

    case 'SET_BOARDS':
      return { ...state, boards: action.payload };

    case 'ADD_BOARD':
      return {
        ...state,
        boards: [...state.boards, action.payload],
        activeBoardId: action.payload.id,
      };

    case 'UPDATE_BOARD':
      return {
        ...state,
        boards: state.boards.map(b =>
          b.id === action.payload.id ? { ...b, ...action.payload } : b
        ),
      };

    case 'DELETE_BOARD': {
      const remaining = state.boards.filter(b => b.id !== action.payload);
      return {
        ...state,
        boards: remaining,
        activeBoardId:
          state.activeBoardId === action.payload
            ? (remaining[0]?.id ?? null)
            : state.activeBoardId,
      };
    }

    case 'ADD_GROUP':
      return {
        ...state,
        boards: state.boards.map(b =>
          b.id === action.payload.boardId
            ? { ...b, taskGroups: [...b.taskGroups, action.payload.group] }
            : b
        ),
      };

    case 'UPDATE_GROUP':
      return {
        ...state,
        boards: state.boards.map(b =>
          b.id === action.payload.boardId
            ? {
                ...b,
                taskGroups: b.taskGroups.map(g =>
                  g.id === action.payload.group.id ? { ...g, ...action.payload.group } : g
                ),
              }
            : b
        ),
      };

    case 'DELETE_GROUP':
      return {
        ...state,
        boards: state.boards.map(b =>
          b.id === action.payload.boardId
            ? {
                ...b,
                taskGroups: b.taskGroups.filter(g => g.id !== action.payload.groupId),
              }
            : b
        ),
      };

    case 'ADD_TASK':
      return {
        ...state,
        boards: state.boards.map(b =>
          b.id === action.payload.boardId
            ? {
                ...b,
                taskGroups: b.taskGroups.map(g =>
                  g.id === action.payload.groupId
                    ? { ...g, tasks: [...g.tasks, action.payload.task] }
                    : g
                ),
              }
            : b
        ),
      };

    case 'UPDATE_TASK':
      return {
        ...state,
        boards: state.boards.map(b =>
          b.id === action.payload.boardId
            ? {
                ...b,
                taskGroups: b.taskGroups.map(g => ({
                  ...g,
                  tasks: g.tasks.map(t =>
                    t.id === action.payload.task.id ? { ...t, ...action.payload.task } : t
                  ),
                })),
              }
            : b
        ),
      };

    case 'DELETE_TASK':
      return {
        ...state,
        boards: state.boards.map(b =>
          b.id === action.payload.boardId
            ? {
                ...b,
                taskGroups: b.taskGroups.map(g =>
                  g.id === action.payload.groupId
                    ? { ...g, tasks: g.tasks.filter(t => t.id !== action.payload.taskId) }
                    : g
                ),
              }
            : b
        ),
      };

    case 'MOVE_TASK':
      return {
        ...state,
        boards: state.boards.map(b =>
          b.id === action.payload.boardId
            ? {
                ...b,
                taskGroups: b.taskGroups.map(g => {
                  if (g.id === action.payload.fromGroupId) {
                    return {
                      ...g,
                      tasks: g.tasks.filter(t => t.id !== action.payload.task.id),
                    };
                  }
                  if (g.id === action.payload.task.taskGroupId) {
                    const tasks = g.tasks.filter(t => t.id !== action.payload.task.id);
                    tasks.splice(action.payload.task.position, 0, action.payload.task);
                    return { ...g, tasks };
                  }
                  return g;
                }),
              }
            : b
        ),
      };

    default:
      return state;
  }
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
