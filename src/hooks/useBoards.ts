import { useStore } from '../store/AppStore';
import { boardsApi, groupsApi, tasksApi, ApiError } from '../services/api';
import type {
  CreateBoardRequest,
  CreateGroupRequest,
  CreateTaskRequest,
  UpdateTaskRequest,
  UpdateGroupRequest,
  UpdateBoardRequest,
} from '../types';

export function useBoards() {
  const { state, dispatch } = useStore();

  const activeBoard = state.boards.find(b => b.id === state.activeBoardId) ?? null;

  function setActiveBoard(boardId: number) {
    dispatch({ type: 'SET_ACTIVE_BOARD', payload: boardId });
  }

  async function createBoard(data: CreateBoardRequest) {
    try {
      const board = await boardsApi.create(data);
      dispatch({ type: 'ADD_BOARD', payload: board });
      return board;
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to create board';
      dispatch({ type: 'SET_ERROR', payload: msg });
      throw err;
    }
  }

  async function updateBoard(id: number, data: UpdateBoardRequest) {
    try {
      const board = await boardsApi.update(id, data);
      dispatch({ type: 'UPDATE_BOARD', payload: board });
      return board;
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to update board';
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
      const msg = err instanceof ApiError ? err.message : 'Failed to create group';
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
      const msg = err instanceof ApiError ? err.message : 'Failed to update group';
      dispatch({ type: 'SET_ERROR', payload: msg });
      throw err;
    }
  }

  async function deleteGroup(boardId: number, groupId: number) {
    try {
      await groupsApi.delete(boardId, groupId);
      dispatch({ type: 'DELETE_GROUP', payload: { boardId, groupId } });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to delete group';
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

  async function moveTask(
    boardId: number,
    taskId: number,
    fromGroupId: number,
    toGroupId: number,
    position: number
  ) {
    try {
      const task = await tasksApi.move(taskId, { groupId: toGroupId, position });
      dispatch({ type: 'MOVE_TASK', payload: { boardId, task, fromGroupId } });
      return task;
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to move task';
      dispatch({ type: 'SET_ERROR', payload: msg });
      throw err;
    }
  }

  return {
    boards: state.boards,
    activeBoard,
    activeBoardId: state.activeBoardId,
    setActiveBoard,
    createBoard,
    updateBoard,
    deleteBoard,
    createGroup,
    updateGroup,
    deleteGroup,
    createTask,
    updateTask,
    deleteTask,
    moveTask,
  };
}
