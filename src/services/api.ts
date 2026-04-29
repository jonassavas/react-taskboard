import type {
  AuthResponse,
  CreateBoardRequest,
  CreateGroupRequest,
  CreateTaskRequest,
  LoginRequest,
  RegisterRequest,
  Task,
  TaskBoard,
  TaskGroup,
  UpdateBoardRequest,
  UpdateGroupRequest,
  UpdateTaskRequest,
} from '../types';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

class ApiError extends Error {
  constructor(
    public message: string,
    public status: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function getToken(): string | null {
  return localStorage.getItem('jwt_token');
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  authenticated = true
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (authenticated) {
    const token = getToken();
    if (!token) throw new ApiError('Not authenticated', 401);
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    let message = errorText;
    try {
      const parsed = JSON.parse(errorText);
      message = parsed.message ?? parsed.error ?? errorText;
    } catch {
      // use raw text
    }
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) return undefined as T;

  return response.json() as Promise<T>;
}

export const authApi = {
  login: (data: LoginRequest): Promise<AuthResponse> =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }, false),

  register: (data: RegisterRequest): Promise<AuthResponse> =>
    request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }, false),
};

export const boardsApi = {
  getAll: (): Promise<TaskBoard[]> =>
    request<TaskBoard[]>('/taskboards'),

  getById: (boardId: number): Promise<TaskBoard> =>
    request<TaskBoard>(`/taskboards/${boardId}`),

  create: (data: CreateBoardRequest): Promise<TaskBoard> =>
    request<TaskBoard>('/taskboards', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: UpdateBoardRequest): Promise<TaskBoard> =>
    request<TaskBoard>(`/taskboards/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: number): Promise<void> =>
    request<void>(`/taskboards/${id}`, { method: 'DELETE' }),
};

export const groupsApi = {
  create: (boardId: number, data: CreateGroupRequest): Promise<TaskGroup> =>
    request<TaskGroup>(`/taskboards/${boardId}/groups`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (boardId: number, groupId: number, data: UpdateGroupRequest): Promise<TaskGroup> =>
    request<TaskGroup>(`/taskboards/${boardId}/groups/${groupId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (boardId: number, groupId: number): Promise<void> =>
    request<void>(`/taskboards/${boardId}/groups/${groupId}`, { method: 'DELETE' }),
};

export const tasksApi = {
  create: (groupId: number, data: CreateTaskRequest): Promise<Task> =>
    request<Task>(`/groups/${groupId}/tasks`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (taskId: number, data: UpdateTaskRequest): Promise<Task> =>
    request<Task>(`/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (taskId: number): Promise<void> =>
    request<void>(`/tasks/${taskId}`, { method: 'DELETE' }),

  move: (taskId: number, data: { groupId: number; position: number }): Promise<Task> =>
    request<Task>(`/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};

export { ApiError };

