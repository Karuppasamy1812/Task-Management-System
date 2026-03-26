# TaskBoard — Project Report

## 1. Introduction

TaskBoard is a Real-Time Collaborative Task Management Platform built to fulfill Requirement #2. The platform enables teams to organize work using projects, lists, and tasks in a Kanban-style board. All changes are reflected instantly across all connected users via Socket.IO, making it a true real-time collaboration tool.

The core challenges of this project were implementing project-level role-based access control, maintaining a full task history, and ensuring real-time synchronization across multiple clients without data inconsistency.

---

## 2. Approach

### Kanban Board Design

The board is organized as:
```
Project → Lists (columns) → Tasks (cards)
```

Each project starts with 3 default lists: **To Do**, **In Progress**, **Done**. Admins and contributors can add more lists. Tasks can be dragged between lists using @dnd-kit, which triggers a `PUT /api/tasks/:taskId` with the new `listId` and broadcasts a `task-moved` socket event to all other users.

### Project-Level RBAC Design

Roles are scoped per project, not globally. This means a user can be an admin on one project and a viewer on another. Three roles were defined:

- **Admin** — full control over the project (update, add members, add lists, all task operations)
- **Contributor** — can create tasks and add lists
- **Viewer** — read-only access, can add comments

The project owner is always treated as admin regardless of their global user role. This was implemented in the `authorize` middleware which checks project membership on every protected route.

### Task History Tracking

Every significant change to a task is automatically recorded in a `history` array embedded in the task document. This includes status changes, list moves, assignee updates, and comments. This provides a full audit trail without a separate collection, keeping queries simple.

### Real-Time Synchronization

Socket.IO rooms are used to scope broadcasts to project members only. When a user joins a project board, they emit `join-project` to subscribe to that project's room. All task mutations (create, update, delete, move) are broadcast to the room, and the receiving clients update their TanStack Query cache directly — no refetch needed.

---

## 3. System Design

### Backend — Layered Architecture

```
Routes → Controllers → Services → Models
```

- **Routes** — define endpoints and apply middleware chains
- **Controllers** — handle HTTP, delegate to services via `catchAsync`
- **Services** — all business logic (history tracking, populate queries, validation)
- **Models** — Mongoose schemas with embedded subdocuments (comments, history, lists, members)

### Frontend — Query-Driven Architecture

The frontend is built around TanStack Query as the single source of truth for server state. A custom `@AutoQueryKey()` decorator auto-generates stable query keys from API class method names, eliminating manual key management.

The query layer handles both HTTP mutations and socket event cache updates, keeping components clean and focused on rendering.

---

## 4. Trade-offs and Design Decisions

### Trade-off 1 — Embedded vs Referenced subdocuments

**Chosen:** Embedded subdocuments for comments, history, lists, members  
**Alternative:** Separate collections with references

Embedding keeps all task/project data in a single document, making reads fast and simple. The downside is document size growth over time (many comments/history entries). For this use case, embedding is appropriate since tasks are typically short-lived and history is bounded.

### Trade-off 2 — Project-level roles vs Global roles

**Chosen:** Project-level roles (per-project membership)  
**Alternative:** Global roles (one role per user across all projects)

Project-level roles are more flexible and realistic — in real teams, a person might be an admin on one project and a viewer on another. The trade-off is added complexity in the `authorize` middleware which must query the project on every protected request.

### Trade-off 3 — Optimistic updates vs Server-confirmed updates

**Chosen:** Server-confirmed updates with socket broadcast  
**Alternative:** Optimistic updates (update cache before server responds)

Server-confirmed updates ensure data consistency — the cache is only updated after the server confirms the change. Socket broadcasts then propagate the confirmed change to other clients. This avoids the complexity of rolling back optimistic updates on failure.

### Trade-off 4 — Socket.IO vs WebSockets

**Chosen:** Socket.IO  
**Alternative:** Raw WebSockets

Socket.IO provides automatic reconnection, room management, and fallback to long-polling. For a collaborative tool where connection reliability is important, Socket.IO is the better choice despite the added overhead.

### Trade-off 5 — ESM vs CommonJS

**Chosen:** ESM (import/export) — migrated from original CJS  
**Alternative:** CommonJS (require/module.exports)

The codebase was originally written in CommonJS and migrated to ESM to align with modern Node.js standards. Jest was replaced with Vitest which has native ESM support and is faster. The migration required adding `.js` extensions to all local imports and replacing `require('dotenv').config()` with `import 'dotenv/config'`.

### Trade-off 6 — AutoQueryKey decorator vs manual keys

**Chosen:** `@AutoQueryKey()` decorator pattern  
**Alternative:** Manual string query keys

The AutoQueryKey decorator uses JavaScript Proxy to auto-generate query keys from class method names (e.g. `ProjectsApi.list.key` → `'ProjectsApi.list'`). This eliminates typos in query keys and keeps keys co-located with their API functions. The trade-off is added complexity in the utility implementation.

---

## 5. Testing

The backend has 54 tests across 4 test files:

- **auth.test.js** — register, login, get me, logout (12 tests)
- **projects.test.js** — create, list, get, add member, add list, update, archive with full RBAC coverage (18 tests)
- **tasks.test.js** — create, list, update, comments, delete with RBAC coverage (18 tests)
- **users.test.js** — list users, get by ID (6 tests)

All 54 tests pass. Tests use Vitest with supertest for HTTP integration testing against a real MongoDB Atlas test database. Each test file cleans up its own data in `afterAll`.

---

## 6. Conclusion

TaskBoard successfully implements a real-time collaborative task management platform with:

- ✅ Kanban board with drag-and-drop (dnd-kit)
- ✅ Project-level RBAC (admin / contributor / viewer)
- ✅ Full task history tracking (status, moves, assignees, comments)
- ✅ Real-time updates via Socket.IO (task-created, updated, deleted, moved)
- ✅ Live typing indicators on task cards and modals
- ✅ Clean layered architecture (Routes → Controllers → Services → Models)
- ✅ AutoQueryKey decorator for type-safe query key management
- ✅ 54 passing tests
- ✅ Docker + docker-compose for reproducible deployment
- ✅ Production-ready ESM codebase with pnpm
