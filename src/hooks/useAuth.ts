import { useStore } from '../store/AppStore';
import { authApi, ApiError } from '../services/api';
import type { LoginRequest, RegisterRequest } from '../types';

export function useAuth() {
  const { state, dispatch } = useStore();

  async function login(data: LoginRequest) {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    try {
      const response = await authApi.login(data);
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user: response.state.user,
          token: response.token,
          boards: response.state.taskBoards,
        },
      });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Login failed';
      dispatch({ type: 'SET_ERROR', payload: msg });
      throw err;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }

  async function register(data: RegisterRequest) {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    try {
      const response = await authApi.register(data);
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user: response.state.user,
          token: response.token,
          boards: response.state.taskBoards,
        },
      });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Registration failed';
      dispatch({ type: 'SET_ERROR', payload: msg });
      throw err;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }

  function logout() {
    dispatch({ type: 'LOGOUT' });
  }

  return {
    user: state.user,
    isAuthenticated: !!state.token,
    isLoading: state.isLoading,
    error: state.error,
    login,
    register,
    logout,
  };
}
