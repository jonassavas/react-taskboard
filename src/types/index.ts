export interface User {
  id: number;
  username: string;
  email: string;
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  position: number;
  taskGroupId: number;
  createdAt: string;
  updatedAt: string;
}

export interface TaskGroup {
  id: number;
  title: string;
  position: number;
  taskBoardId: number;
  tasks: Task[];
  createdAt: string;
  updatedAt: string;
}

export interface TaskBoard {
  id: number;
  title: string;
  description?: string;
  taskGroups: TaskGroup[];
  createdAt: string;
  updatedAt: string;
}

export interface AppState {
  user: User;
  taskBoards: TaskBoard[];
}

export interface AuthResponse {
  token: string;
  state: AppState;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface CreateBoardRequest {
  title: string;
  description?: string;
}

export interface CreateGroupRequest {
  title: string;
  boardId: number;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  groupId: number;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  position?: number;
  groupId?: number;
}

export interface UpdateGroupRequest {
  title?: string;
  position?: number;
}

export interface UpdateBoardRequest {
  title?: string;
  description?: string;
}

export interface ApiError {
  message: string;
  status: number;
}
