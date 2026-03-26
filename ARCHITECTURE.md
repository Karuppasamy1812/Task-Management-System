# TaskBoard — Architecture Diagram

## System Components

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT BROWSER                             │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                    React Frontend (Vite)                    │   │
│   │                                                             │   │
│   │  ┌──────────┐  ┌──────────┐  ┌───────────┐  ┌──────────┐   │   │
│   │  │  Login   │  │Dashboard │  │ Project   │  │Register  │   │   │
│   │  │          │  │          │  │  Board    │  │          │   │   │
│   │  └──────────┘  └──────────┘  └───────────┘  └──────────┘   │   │
│   │                                                             │   │
│   │  ┌──────────────────────────────────────────────────────┐   │   │
│   │  │               Components                             │   │   │
│   │  │  Sidebar │ TaskCard │ TaskModal │ CreateTaskModal    │   │   │
│   │  │  AddMemberModal                                      │   │   │
│   │  └──────────────────────────────────────────────────────┘   │   │
│   │                                                             │   │
│   │  ┌─────────────────────┐   ┌──────────────────────────┐    │   │
│   │  │  TanStack Query     │   │     Socket.IO Client     │    │   │
│   │  │  (API state mgmt)   │   │   (real-time updates)    │    │   │
│   │  └─────────────────────┘   └──────────────────────────┘    │   │
│   │                                                             │   │
│   │  ┌──────────────────────────────────────────────────────┐   │   │
│   │  │   @dnd-kit (drag-and-drop Kanban)                    │   │   │
│   │  └──────────────────────────────────────────────────────┘   │   │
│   │                                                             │   │
│   │  ┌──────────────────────────────────────────────────────┐   │   │
│   │  │         Axios (HTTP requests + JWT header)           │   │   │
│   │  └──────────────────────────────────────────────────────┘   │   │
│   └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                          │ HTTP/REST          │ WebSocket
                          ▼                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       NODE.JS BACKEND (Express)                     │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                        Middleware                            │   │
│  │  authenticate (JWT) → authorize (project-level role check)  │   │
│  │  catchAsync → errorHandler                                   │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐               │
│  │  Auth    │ │ Project  │ │  Task    │ │  User    │               │
│  │  Routes  │ │  Routes  │ │  Routes  │ │  Routes  │               │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘               │
│       │            │            │            │                     │
│  ┌────▼─────┐ ┌────▼─────┐ ┌────▼─────┐ ┌────▼─────┐               │
│  │  Auth    │ │ Project  │ │  Task    │ │  User    │               │
│  │Controller│ │Controller│ │Controller│ │Controller│               │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘               │
│       │            │            │            │                     │
│  ┌────▼─────┐ ┌────▼─────┐ ┌────▼─────┐      │                     │
│  │  Auth    │ │ Project  │ │  Task    │      │                     │
│  │ Service  │ │ Service  │ │ Service  │      │                     │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘      │                     │
│       │            │            │            │                     │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │                      Mongoose ODM                          │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    Socket.IO Server                          │   │
│  │  join-project / leave-project                                │   │
│  │  task-created / task-updated / task-deleted / task-moved     │   │
│  │  typing                                                      │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        MongoDB Atlas                                │
│                                                                     │
│   ┌──────────┐   ┌──────────────────────────────────────────┐       │
│   │   User   │   │              Project                     │       │
│   │          │   │  owner, members[], lists[]               │       │
│   └──────────┘   └──────────────────────────────────────────┘       │
│                                                                     │
│   ┌──────────────────────────────────────────────────────────┐       │
│   │                        Task                             │       │
│   │  assignees[], comments[], history[], labels[]           │       │
│   └──────────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### Authentication Flow
```
User submits login/register form
  → POST /api/auth/login or /register
    → verify credentials (bcrypt compare)
      → sign JWT token (7d expiry)
        → return token + user info
          → store token in localStorage
            → set axios default Authorization header
              → connect Socket.IO with token
```

### Project-Level RBAC Flow
```
Request hits protected project route
  → authenticate middleware (verify JWT → attach req.user)
    → authorize middleware
        → find project by projectId
          → check if user is owner → role: admin
          → check if user is member → use member.role
            → compare role against allowedRoles
              → 403 if not allowed
              → next() if allowed
```

### Real-Time Kanban Flow
```
User A drags task to new column
  → PUT /api/tasks/:taskId { listId }
    → task saved to MongoDB
      → response sent to User A
        → User A emits 'task-moved' via Socket.IO
          → Socket.IO broadcasts to project room
            → User B receives 'task-moved' event
              → TanStack Query cache updated
                → User B's board updates instantly
```

### Typing Indicator Flow
```
User A types in comment box
  → emitTyping(projectId, taskId, userName)
    → Socket.IO broadcasts 'typing' to project room
      → User B's TaskCard shows typing dots for 3 seconds
```

---

## Role-Based Access Control (Project Level)

```
Project Owner  ──► all project routes
  │
  ├── update project
  ├── add/remove members
  ├── add lists
  ├── create/update/delete tasks
  └── archive project

Project Admin (member with admin role)
  │
  ├── update project
  ├── add/remove members
  ├── add lists
  └── create/update/delete tasks

Contributor (member with contributor role)
  │
  ├── add lists
  └── create/update tasks

Viewer (member with viewer role)
  │
  └── read-only (view tasks, add comments)
```

---

## Deployment Architecture (Docker)

```
┌─────────────────────────────────────┐
│         docker-compose              │
│                                     │
│  ┌─────────────┐  ┌───────────────┐ │
│  │  frontend   │  │   backend     │ │
│  │  nginx:80   │  │  node:5000    │ │
│  │             │  │               │ │
│  │  /api/*  ──────► Express API   │ │
│  │  /socket ──────► Socket.IO     │ │
│  │  /*      → SPA │               │ │
│  └─────────────┘  └───────┬───────┘ │
│                           │         │
└───────────────────────────┼─────────┘
                            │
                            ▼
                    MongoDB Atlas (cloud)
```
