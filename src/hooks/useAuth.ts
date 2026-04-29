import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/AppStore';
import { authApi, boardsApi, ApiError } from '../services/api';
import type { LoginRequest, RegisterRequest } from '../types';

export function useAuth() {
  const { state, dispatch } = useStore();
  const navigate = useNavigate();

  async function login(data: LoginRequest) {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    try {
      const response = await authApi.login(data);
      localStorage.setItem('jwt_token', response.token);
      const summaries = await boardsApi.getAll().catch(() => []);
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user: response.user, token: response.token, summaries },
      });
      navigate('/overview');
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
      const summaries = await boardsApi.getAll().catch(() => []);
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user: response.user, token: response.token, summaries },
      });
      navigate('/overview');
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
    navigate('/login');
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
