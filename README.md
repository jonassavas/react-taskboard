# task-board-ui

Frontend for [spring-task-api](https://github.com/yourusername/spring-task-api) — a Trello-like task management system.

Built with **React + TypeScript + Vite**, communicating with the Spring Boot backend via a stateless JWT-authenticated REST API.

## Features

- Login & registration with JWT auth (token persisted in `localStorage`)
- Full task board hierarchy: **boards → groups (columns) → tasks**
- Create, rename, and delete boards, columns, and tasks
- Inline editing for task titles and descriptions
- Global app state with `useReducer` + React Context (no external state library needed)
- Error toast notifications
- Optimistic UI — state updates immediately, API syncs in background

## Tech Stack

| Tool | Purpose |
|---|---|
| React 18 | UI framework |
| TypeScript | Type safety across the entire domain model |
| Vite | Build tooling and dev server |
| CSS Modules | Scoped, maintainable component styles |
| React Context + useReducer | Global state management |
| Fetch API | HTTP client with JWT auth headers |

## Project Structure

```
src/
├── types/          # All domain types (TaskBoard, TaskGroup, Task, etc.)
├── services/       # API layer (api.ts) — all fetch calls live here
├── store/          # AppStore.tsx — global state with useReducer
├── hooks/          # useAuth.ts, useBoards.ts — business logic hooks
└── components/
    ├── auth/       # AuthPage (login + register)
    ├── board/      # Sidebar, BoardView, TaskGroupColumn
    └── task/       # TaskCard
```

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Configure the API URL
cp .env.example .env.local
# Edit .env.local and set VITE_API_URL to your backend URL

# 3. Start the dev server
npm run dev
```

The dev server runs on `http://localhost:5173` and proxies `/api` requests to `http://localhost:8080` by default.

## API Contract

The frontend expects these endpoints from `spring-task-api`:

```
POST   /api/auth/login         → { token, state: { user, taskBoards } }
POST   /api/auth/register      → { token, state: { user, taskBoards } }

GET    /api/boards              → TaskBoard[]
POST   /api/boards              → TaskBoard
PUT    /api/boards/:id          → TaskBoard
DELETE /api/boards/:id          → 204

POST   /api/boards/:id/groups         → TaskGroup
PUT    /api/boards/:id/groups/:gid    → TaskGroup
DELETE /api/boards/:id/groups/:gid    → 204

POST   /api/groups/:id/tasks    → Task
PUT    /api/tasks/:id           → Task
DELETE /api/tasks/:id           → 204
PATCH  /api/tasks/:id/move      → Task  (body: { groupId, position })
```

All authenticated endpoints require `Authorization: Bearer <token>` header.

## Scripts

```bash
npm run dev        # Start development server
npm run build      # Type-check and build for production
npm run typecheck  # Run TypeScript compiler check only
npm run lint       # Run ESLint
npm run preview    # Preview production build locally
```

## Extending

- **Drag-and-drop**: Add `@dnd-kit/core` and wire `moveTask()` from `useBoards` — the hook already handles the API call
- **Due dates / labels**: Extend the `Task` type in `src/types/index.ts` and `TaskCard.tsx`
- **Board sharing**: Add collaborator endpoints and extend `TaskBoard` type
