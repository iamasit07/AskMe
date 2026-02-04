# AI Agent Chat Application

A production-ready, full-stack AI chat application featuring real-time streaming, tool usage (web search), and robust workspace management. Built with modern technologies focusing on security, scalability, and user experience.

![Project Status](https://img.shields.io/badge/Status-Production%20Ready-success)
![License](https://img.shields.io/badge/License-MIT-blue)

## 🚀 Key Features

- **🤖 Advanced AI Agent**: Powered by **LangGraph** & **OpenAI/OpenRouter**, capable of multi-step reasoning and tool usage (Tavily Web Search).
- **⚡ Real-time Streaming**: Custom server-sent events (SSE) implementation for token-by-token responses.
- **🔐 Secure Authentication**: HttpOnly cookie-based JWT authentication with access/refresh token rotation. No localStorage tokens.
- **🏢 Workspace Management**: Organize chats into workspaces; users can manage multiple distinct contexts.
- **💬 Rich Chat Interface**: Markdown support, code highlighting, auto-scrolling, and tool call visualization.
- **🛡️ Robust Security**: Strict data isolation (ownership checks), input validation (Zod), and secure headers.
- **🎨 Modern UI**: Responsive design built with React, Tailwind CSS, and Shadcn/ui.

## 🏗️ Architecture

The application follows a clean 3-tier architecture:

1.  **Frontend (SPA)**: React + Vite. Handles UI, auth context, and optimistic updates.
2.  **Backend (API)**: Node.js + Express. Exposes REST endpoints and manages the LangChain/LangGraph agent runtime.
3.  **Database**: MongoDB (via Prisma). Stores users, workspaces, chat history, and messages.

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18, Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS, Shadcn/ui, Lucide React
- **State**: Context API (Auth, Workspaces) + Custom Hooks
- **HTTP**: Axios (Centralized client with interceptors)

### Backend
- **Runtime**: Node.js, Express
- **Language**: TypeScript
- **Database**: MongoDB, Prisma ORM
- **AI/LLM**: LangChain, LangGraph, OpenRouter (GPT-4o)
- **Tools**: Tavily Search API
- **Auth**: JSON Web Tokens (JWT), Bcrypt

## 📋 Prerequisites

- Node.js (v18+)
- npm or yarn
- MongoDB Database (Local or Atlas URI)
- API Keys:
  - OpenRouter API Key (for LLM)
  - Tavily API Key (for web search tool)

## ⚙️ Setup Instructions

### 1. Clone the repository
```bash
git clone <repository-url>
cd assessment
```

### 2. Backend Setup
```bash
cd backend
npm install

# Create .env file
cp .env.example .env
# Update .env with your credentials (DATABASE_URL, API keys)

# Push database schema
npx prisma db push

# Start development server
npm run dev
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install

# Create .env file
cp .env.example .env
# Update .env (VITE_API_URL=http://localhost:8080)

# Start development server
npm run dev
```

The application should now be running at `http://localhost:5173` (frontend) and `http://localhost:8080` (backend).

## 🔑 Environment Variables

### Backend (`backend/.env`)
```env
PORT=8080
DATABASE_URL="mongodb+srv://..."
JWT_SECRET="complex-secret-key"
REFRESH_SECRET="complex-refresh-secret"
FRONTEND_URL="http://localhost:5173"
OPENROUTER_API_KEY="sk-or-..."
TAVILY_API_KEY="tvly-..."
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL="http://localhost:8080"
```

## 📚 API Endpoints

### Authentication
- `POST /api/auth/signup`: Create account
- `POST /api/auth/login`: Login (returns httpOnly cookies)
- `POST /api/auth/logout`: Logout
- `POST /api/auth/refresh`: Refresh access token
- `GET /api/auth/me`: Get current user

### Workspaces
- `GET /api/workspaces`: List workspaces
- `POST /api/workspaces`: Create workspace
- `PUT /api/workspaces/:id`: Update workspace
- `DELETE /api/workspaces/:id`: Delete workspace

### Chat
- `GET /api/chat-pages/workspace/:id`: List chats
- `POST /api/chat-pages/workspace/:id`: Create chat
- `GET /api/chat-pages/:id/messages`: Get message history
- `POST /api/chat/:id/stream`: Stream AI response (SSE)

## 🧪 Testing
Run the backend build verification:
```bash
cd backend
npm run build
```

Run frontend linting:
```bash
cd frontend
npm run lint
```

## 🤝 Contributing
1. Fork the repo
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📄 License
MIT
