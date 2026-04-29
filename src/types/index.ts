export interface Task {
  id: number;
  taskName: string; 
  taskGroupId: number;
}

export interface TaskGroup {
  id: number;
  taskGroupName: string;
  taskBoardId: number;
  tasks: Task[];
}

export interface TaskBoard {
  id: number;
  taskBoardName: string;  
  taskGroups: TaskGroup[];
}

export interface User {
  id: number;
  username: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  expiresIn: number;
  user: User;
}

// Request types stay the same
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
  taskBoardName: string;
}

export interface CreateGroupRequest {
  taskGroupName: string;
  taskBoardId: number;
}

export interface CreateTaskRequest {
  taskName: string;
  taskGroupId: number;
}

export interface UpdateBoardRequest {
  taskBoardName?: string;
}

export interface UpdateGroupRequest {
  taskGroupName?: string;
}

export interface UpdateTaskRequest {
  taskName?: string;
  taskGroupId?: number;
}
