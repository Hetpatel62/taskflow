# ⚡ TaskFlow — MERN Kanban App

A full-stack task management application built with MongoDB, Express, React, and Node.js.

## Features
- JWT Authentication (register / login)
- Create multiple Kanban boards with custom colors
- Drag-and-drop tasks between columns (To Do → In Progress → Done)
- Task priorities (low / medium / high), due dates, and tags
- Edit and delete tasks inline
- Persistent order saved to MongoDB
- Responsive dark UI

## Tech Stack
| Layer | Tech |
|---|---|
| Frontend | React 18, React Router v6, @hello-pangea/dnd |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcryptjs |
| Styling | Custom CSS (no UI library) |

## Project Structure
```
taskflow/
├── server/
│   ├── index.js          # Express entry point
│   ├── models/
│   │   ├── User.js
│   │   ├── Board.js
│   │   └── Task.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── boards.js
│   │   └── tasks.js
│   └── middleware/
│       └── auth.js       # JWT protect middleware
└── client/
    └── src/
        ├── App.js
        ├── context/
        │   └── AuthContext.js
        ├── pages/
        │   ├── Login.js
        │   ├── Register.js
        │   ├── Dashboard.js
        │   └── BoardPage.js
        └── components/
            └── Navbar.js
```

## Setup & Run

### 1. Clone and install server dependencies
```bash
cd taskflow
npm install
```

### 2. Set up environment variables
```bash
cp .env.example .env
# Edit .env with your MongoDB URI and a strong JWT_SECRET
```

### 3. Install client dependencies
```bash
cd client
npm install
```

### 4. Run both servers
```bash
# From the root taskflow/ folder
npm run dev:full
```

- Backend: http://localhost:5000
- Frontend: http://localhost:3000

## API Endpoints

### Auth
| Method | Route | Description |
|--------|-------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Get current user |

### Boards
| Method | Route | Description |
|--------|-------|-------------|
| GET | /api/boards | Get all user boards |
| POST | /api/boards | Create board |
| GET | /api/boards/:id | Get board + tasks |
| PUT | /api/boards/:id | Update board |
| DELETE | /api/boards/:id | Delete board + tasks |

### Tasks
| Method | Route | Description |
|--------|-------|-------------|
| POST | /api/tasks | Create task |
| PUT | /api/tasks/:id | Update task |
| PUT | /api/tasks/bulk/reorder | Bulk reorder after drag |
| DELETE | /api/tasks/:id | Delete task |
