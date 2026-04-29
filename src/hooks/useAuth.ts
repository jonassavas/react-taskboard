import { useStore } from '../store/AppStore';
import { authApi, boardsApi, ApiError } from '../services/api';
import type { LoginRequest, RegisterRequest } from '../types';

export function useAuth() {
  const { state, dispatch } = useStore();

  async function login(data: LoginRequest) {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    try {
      const response = await authApi.login(data);

      // Store token immediately so subsequent calls can use it
      localStorage.setItem('jwt_token', response.token);

      // Fetch board summaries — empty array is fine (new user with no boards)
      const summaries = await boardsApi.getAll().catch(() => []);

      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user: response.user,
          token: response.token,
          summaries,
        },
      });
    } catch (err) {
      localStorage.removeItem('jwt_token');
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

      localStorage.setItem('jwt_token', response.token);

      // New user will have no boards — that's fine
      const summaries = await boardsApi.getAll().catch(() => []);

      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user: response.user,
          token: response.token,
          summaries,
        },
      });
    } catch (err) {
      localStorage.removeItem('jwt_token');
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
