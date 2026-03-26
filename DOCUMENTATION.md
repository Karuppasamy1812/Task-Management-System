# TaskBoard — Technical Documentation

## 1. System Overview

TaskBoard is a Real-Time Collaborative Task Management Platform built on the MERN stack. It allows teams to organize projects using boards, lists, and tasks while working together in real time. Changes made by one user are instantly reflected for all other users via Socket.IO. Each task maintains a full history of updates including status changes, list moves, and assignee updates.

---

## 2. Tech Stack

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Node.js | 20 | Runtime |
| Express | 4.x | HTTP framework |
| MongoDB Atlas | Cloud | Database |
| Mongoose | 7.x | ODM |
| Socket.IO | 4.x | Real-time communication |
| JSON Web Token | 9.x | Authentication |
| bcryptjs | 2.x | Password hashing |
| Vitest | 2.x | Testing |

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 19 | UI framework |
| TypeScript | 5.x | Type safety |
| Vite | 8.x | Build tool |
| TailwindCSS | 4.x | Styling |
| TanStack Query | 5.x | Server state management |
| Axios | 1.x | HTTP client |
| Socket.IO Client | 4.x | Real-time communication |
| @dnd-kit | 6.x | Drag-and-drop Kanban |
| Radix UI | latest | Accessible UI components |
| Lucide React | latest | Icons |
| Sonner | latest | Toast notifications |

---

## 3. Database Schema

### User
```js
{
  _id:       ObjectId,
  name:      String (required),
  email:     String (required, unique),
  password:  String (bcrypt hashed),
  role:      String (enum: admin | contributor | viewer, default: contributor),
  avatar:    String,
  createdAt: Date,
  updatedAt: Date
}
```

### Project
```js
{
  _id:         ObjectId,
  name:        String (required),
  description: String,
  owner:       ObjectId (ref: User),
  members: [{
    user: ObjectId (ref: User),
    role: String (enum: admin | contributor | viewer)
  }],
  lists: [{
    title: String,
    order: Number
  }],
  isArchived:  Boolean (default: false),
  createdAt:   Date,
  updatedAt:   Date
}
```

### Task
```js
{
  _id:         ObjectId,
  title:       String (required),
  description: String,
  project:     ObjectId (ref: Project, required),
  listId:      ObjectId (required),
  assignees:   [ObjectId (ref: User)],
  status:      String (enum: todo | in-progress | review | done, default: todo),
  priority:    String (enum: low | medium | high, default: medium),
  dueDate:     Date,
  order:       Number (default: 0),
  labels:      [String],
  comments: [{
    user:      ObjectId (ref: User),
    text:      String,
    createdAt: Date
  }],
  history: [{
    user:      ObjectId (ref: User),
    action:    String,
    from:      String,
    to:        String,
    createdAt: Date
  }],
  createdAt: Date,
  updatedAt: Date
}
```

---

## 4. API Endpoints

### Auth — `/api/auth`
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/register` | Public | Register new user |
| POST | `/login` | Public | Login and receive JWT |
| GET | `/me` | Authenticated | Get current user |
| POST | `/logout` | Authenticated | Logout |

### Projects — `/api/projects`
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/` | Authenticated | List user's projects |
| POST | `/` | Authenticated | Create project |
| GET | `/:projectId` | Authenticated | Get project by ID |
| PUT | `/:projectId` | Admin | Update project |
| POST | `/:projectId/members` | Admin | Add member to project |
| POST | `/:projectId/lists` | Admin, Contributor | Add list to project |
| DELETE | `/:projectId` | Admin | Archive project |

### Tasks — `/api/tasks`
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/project/:projectId` | Authenticated | List tasks by project |
| POST | `/` | Admin, Contributor | Create task |
| PUT | `/:taskId` | Authenticated | Update task |
| POST | `/:taskId/comments` | Authenticated | Add comment |
| DELETE | `/:taskId` | Authenticated | Delete task |

### Users — `/api/users`
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/` | Authenticated | List all users |
| GET | `/:id` | Authenticated | Get user by ID |

---

## 5. Authentication & Authorization

### JWT Authentication
- Token signed with `JWT_SECRET`, expires in 7 days
- Sent as `Authorization: Bearer <token>` header
- `authenticate` middleware verifies token and attaches `req.user`

### Project-Level RBAC
Roles are scoped per project — a user can be admin on one project and contributor on another.

```
Project Owner → admin role (automatic)
Project Member → role defined when added (admin | contributor | viewer)
```

The `authorize(...roles)` middleware:
1. Finds the project by `projectId`
2. Checks if user is the project owner → assigns `admin`
3. Checks if user is a project member → uses their `member.role`
4. Compares against `allowedRoles`

```js
const getProjectRole = async (userId, projectId) => {
  const project = await Project.findById(projectId);
  if (project.owner.toString() === userId.toString()) return 'admin';
  const member = project.members.find(m => m.user.toString() === userId.toString());
  return member ? member.role : null;
};
```

---

## 6. Real-Time Communication

Socket.IO is used for real-time collaboration across all connected clients in the same project.

### Socket Events
| Event | Direction | Description |
|---|---|---|
| `join-project` | Client → Server | Join a project room |
| `leave-project` | Client → Server | Leave a project room |
| `task-created` | Client → Server → Clients | Broadcast new task |
| `task-updated` | Client → Server → Clients | Broadcast task update |
| `task-deleted` | Client → Server → Clients | Broadcast task deletion |
| `task-moved` | Client → Server → Clients | Broadcast drag-drop move |
| `typing` | Client → Server → Clients | Broadcast typing indicator |

### Socket Authentication
Every socket connection is authenticated via JWT:
```js
io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token;
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  socket.user = await User.findById(decoded.id);
  next();
});
```

### Typing Indicator
When a user types in a comment box, a `typing` event is emitted. Other users see animated dots on the TaskCard for 3 seconds.

---

## 7. Task History Tracking

Every significant task change is automatically recorded in the `history` array:

| Action | Trigger |
|---|---|
| `created task` | Task creation |
| `changed status` | Status field updated |
| `moved task` | listId changed (drag-drop) |
| `updated assignees` | Assignees array changed |
| `added comment` | Comment added |

---

## 8. Frontend Architecture

### State Management
- **TanStack Query** — server state (API data, caching, invalidation)
- **React Context** — auth state (user, token, login/logout)
- **useState** — local UI state (modals, drag state, form inputs)

### AutoQueryKey Pattern
A custom `@AutoQueryKey()` decorator auto-generates stable query keys from class method names:
```ts
@AutoQueryKey()
class ProjectsApi {
  static list = async () => { ... }  // key: 'ProjectsApi.list'
  static get  = async () => { ... }  // key: 'ProjectsApi.get'
}
```

### Query Keys
```
['auth.me']                          → current user
['ProjectsApi.list']                 → all projects
['ProjectsApi.get', projectId]       → single project
['TasksApi.listByProject', projectId]→ tasks for a project
['UsersApi.list']                    → all users
```

### Real-Time Cache Updates
Socket events update TanStack Query cache directly:
```ts
socket.on('task-updated', (task) =>
  qc.setQueryData([TasksApi.listByProject.key, projectId], (old) =>
    old.map(t => t._id === task._id ? task : t)
  )
);
```

---

## 9. Project Structure

```
Tasks/
├── backend/
│   ├── config/         AppError, db, logger
│   ├── models/         User, Project, Task
│   ├── services/       auth, project, task services
│   ├── controllers/    auth, project, task, user controllers
│   ├── middleware/     authenticate, authorize, catchAsync, errorHandler
│   ├── routes/         auth, project, task, user routes
│   ├── socket/         socket.handler.js
│   ├── tests/          54 Vitest tests
│   ├── server.js       Entry point
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── api/        AuthApi, ProjectsApi, TasksApi, UsersApi
│   │   ├── queries/    auth, projects, tasks, users query hooks
│   │   ├── context/    AuthContext
│   │   ├── pages/      Login, Register, Dashboard, ProjectBoard
│   │   ├── components/ Sidebar, TaskCard, TaskModal, CreateTaskModal, AddMemberModal
│   │   └── lib/        types, cn, socket, config, AutoQueryKey
│   ├── nginx.conf
│   └── Dockerfile
│
├── docker-compose.yml
├── ARCHITECTURE.md
├── DOCUMENTATION.md
└── REPORT.md
```

---

## 10. Environment Variables

### Backend (.env)
```
PORT=5000
MONGO_URI=mongodb+srv://...
JWT_SECRET=your_secret_key
CLIENT_URL=http://localhost:3001
```

---

## 11. Running the Project

### Development
```bash
# Backend
cd backend && pnpm install && pnpm dev

# Frontend
cd frontend && pnpm install && pnpm dev
```

### Production (Docker)
```bash
docker-compose up --build
```

### Tests
```bash
cd backend && pnpm test
```
