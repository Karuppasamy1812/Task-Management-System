# TaskBoard

**TaskBoard** is a **real-time collaborative task management platform** (MERN stack). Teams organize work using **Projects → Lists → Tasks** in a Kanban-style board with instant sync via Socket.IO.

---

## Features

- **Kanban Board:** Drag-and-drop tasks across dynamic lists (To Do, In Progress, Done)
- **Project-level Roles:** Owner/Admin, Contributor, Viewer (flexible permissions per project)
- **Task History:** Tracks changes like status updates, list moves, comments
- **Real-time Sync:** Updates broadcast via Socket.IO; typing indicators included
- **Authentication:** JWT-based with secure Socket.IO handshake
- **AutoQueryKey:** Stable TanStack Query keys auto-generated from API methods

---

## Tech Stack

**Backend:** Node.js, Express, MongoDB Atlas, Mongoose, Socket.IO, JWT  
**Frontend:** React, TypeScript, Vite, TailwindCSS, TanStack Query, @dnd-kit, Zustand  
**DevOps:** Docker, Nginx, pnpm, ESLint  

---

## Database Schema

- **User:** `_id, name, email, password, role, avatar`  
- **Project:** `_id, name, description, owner, members[], lists[], isArchived`  
- **Task:** `_id, title, description, project, listId, assignees[], status, priority, dueDate, labels[], comments[], history[]`

---

## API Endpoints

- **Auth:** `/register, /login, /me, /logout`  
- **Projects:** `/ (GET, POST), /:id (GET, PUT, DELETE), /:id/members, /:id/lists`  
- **Tasks:** `/project/:id, / (POST), /:id (PUT, DELETE), /:id/comments`  
- **Users:** `/ (GET), /:id (GET)`

---

## Socket Events

`join-project, leave-project, task-created, task-updated, task-deleted, task-moved, typing`

---

## Deployment

```bash
docker-compose up --build
