import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/AppStore';
import { boardsApi, groupsApi, tasksApi, ApiError } from '../services/api';
import type {
  CreateBoardRequest,
  CreateGroupRequest,
  CreateTaskRequest,
  UpdateTaskRequest,
  UpdateGroupRequest,
} from '../types';

export function useBoards() {
  const { state, dispatch } = useStore();
  const navigate = useNavigate();

  async function openBoard(boardId: number) {
    dispatch({ type: 'SET_BOARD_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    try {
      const board = await boardsApi.getById(boardId);
      dispatch({ type: 'BOARD_LOADED', payload: board });
      navigate(`/boards/${boardId}`);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to load board';
      dispatch({ type: 'SET_ERROR', payload: msg });
      dispatch({ type: 'SET_BOARD_LOADING', payload: false });
    }
  }

  function goToOverview() {
    navigate('/overview');
  }

  async function createBoard(data: CreateBoardRequest) {
    try {
      const summary = await boardsApi.create(data);
      dispatch({ type: 'ADD_BOARD_SUMMARY', payload: summary });
      return summary;
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to create board';
      dispatch({ type: 'SET_ERROR', payload: msg });
      throw err;
    }
  }

  async function deleteBoard(id: number) {
    try {
      await boardsApi.delete(id);
      dispatch({ type: 'DELETE_BOARD', payload: id });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to delete board';
      dispatch({ type: 'SET_ERROR', payload: msg });
      throw err;
    }
  }

  async function createGroup(boardId: number, data: CreateGroupRequest) {
    try {
      const group = await groupsApi.create(boardId, data);
      dispatch({ type: 'ADD_GROUP', payload: { boardId, group } });
      return group;
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to create column';
      dispatch({ type: 'SET_ERROR', payload: msg });
      throw err;
    }
  }

  async function updateGroup(boardId: number, groupId: number, data: UpdateGroupRequest) {
    try {
      const group = await groupsApi.update(boardId, groupId, data);
      dispatch({ type: 'UPDATE_GROUP', payload: { boardId, group } });
      return group;
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to update column';
      dispatch({ type: 'SET_ERROR', payload: msg });
      throw err;
    }
  }

  async function deleteGroup(boardId: number, groupId: number) {
    try {
      await groupsApi.delete(boardId, groupId);
      dispatch({ type: 'DELETE_GROUP', payload: { boardId, groupId } });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to delete column';
      dispatch({ type: 'SET_ERROR', payload: msg });
      throw err;
    }
  }

  async function createTask(boardId: number, groupId: number, data: CreateTaskRequest) {
    try {
      const task = await tasksApi.create(groupId, data);
      dispatch({ type: 'ADD_TASK', payload: { boardId, groupId, task } });
      return task;
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to create task';
      dispatch({ type: 'SET_ERROR', payload: msg });
      throw err;
    }
  }

  async function updateTask(boardId: number, taskId: number, data: UpdateTaskRequest) {
    try {
      const task = await tasksApi.update(taskId, data);
      dispatch({ type: 'UPDATE_TASK', payload: { boardId, task } });
      return task;
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to update task';
      dispatch({ type: 'SET_ERROR', payload: msg });
      throw err;
    }
  }

  async function deleteTask(boardId: number, groupId: number, taskId: number) {
    try {
      await tasksApi.delete(taskId);
      dispatch({ type: 'DELETE_TASK', payload: { boardId, groupId, taskId } });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to delete task';
      dispatch({ type: 'SET_ERROR', payload: msg });
      throw err;
    }
  }

  return {
    boardSummaries: state.boardSummaries,
    loadedBoards: state.loadedBoards,
    isBoardLoading: state.isBoardLoading,
    openBoard,
    goToOverview,
    createBoard,
    deleteBoard,
    createGroup,
    updateGroup,
    deleteGroup,
    createTask,
    updateTask,
    deleteTask,
  };
}
