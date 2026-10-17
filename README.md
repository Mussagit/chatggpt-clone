# 🤖 ChatGPT Clone (Full-Stack)

A modern, responsive, full-stack ChatGPT clone powered by the **Google Gemini API**, **Express.js**, **MySQL**, and **React 19 + Vite**.

---

## ✨ Features

- ⚡ **AI-Powered**: Integrates Google's latest `gemini-3.7-flash` model with automatic fallback to `gemini-3.5-flash-lite`.
- 💬 **Real-Time Conversation Flow**: Instant user message rendering, live typing status, and resilient message synchronization.
- 🎨 **State-of-the-Art Dark UI**: Polished ChatGPT aesthetic with glassmorphism, responsive sidebar, and micro-animations.
- 💻 **Syntax Highlighted Code**: Rich Markdown rendering with language tags and 1-click **Copy Code** functionality.
- 💡 **Interactive Prompt Starters**: Dynamic suggested topics to kickstart conversations.
- 🗄️ **Persistent Chat History**: MySQL database schema for storing multi-turn conversations.
- 🔄 **New Chat & Clear History**: Start fresh conversations or reset history directly from the UI.
- 📱 **Fully Responsive**: Seamless experience across mobile, tablet, and desktop viewports.

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js** (v18 or higher recommended)
- **MySQL Server** (running locally or remotely)

### 2. Environment Setup

Configure your **Backend** environment variables in `Backend/.env`:

```env
DB_USER=gpt-admin
DB_PASSWORD=your_password
DB_NAME=gpt-clone
DB_HOST=127.0.0.1
DB_PORT=3306
PORT=3777
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL_NAME=gemini-3.7-flash
```

Make sure the MySQL database and `conversations` table are initialized:
```sql
CREATE DATABASE IF NOT EXISTS `gpt-clone`;
USE `gpt-clone`;

CREATE TABLE IF NOT EXISTS conversations (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  role ENUM('user', 'assistant') NOT NULL,
  content TEXT NOT NULL,
  token_count INT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### 3. Install All Dependencies

```bash
npm run install:all
```

### 4. Run the Application

To run both **Backend** and **Frontend** concurrently with a single command:

```bash
npm run dev
```

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3777

---

## 🛠️ Available Scripts

From the root directory:

| Command | Description |
| :--- | :--- |
| `npm run dev` | Runs both Backend and Frontend concurrently |
| `npm run dev:backend` | Runs the Express.js Backend in watch mode |
| `npm run dev:frontend` | Runs the Vite Frontend development server |
| `npm run build` | Builds the Frontend for production |
| `npm run lint` | Lints the Frontend code with ESLint |
| `npm run start` | Starts the production Backend server |

---

## 📁 Project Architecture

```
ChatGpt/
├── Backend/
│   ├── DB/
│   │   ├── db.config.js        # MySQL connection pool
│   │   └── schema.sql          # Database table schema
│   ├── src/
│   │   ├── api/
│   │   │   ├── chat/           # Chat routes, controller, & Gemini AI service
│   │   │   └── main.routes.js  # Main Express router
│   │   └── middleware/         # Error handler & validation middleware
│   └── index.js                # Server entry point & CORS
│
├── Frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatHeader/     # Top navigation & model selector
│   │   │   ├── ChatInput/      # Auto-resizing textarea with multiline & submit
│   │   │   ├── ChatMessage/    # Markdown renderer with code syntax highlighting & copy
│   │   │   ├── MessageList/    # Message feed, prompt starters, & thinking indicator
│   │   │   └── Sidebar/        # Collapsible sidebar, new chat & clear actions
│   │   ├── App.jsx             # Main application state & polling coordinator
│   │   ├── App.css             # Global design tokens & layout
│   │   └── main.jsx            # React root
│   └── vite.config.js          # Vite configuration with /api proxy
│
└── package.json                # Root workspace configuration
```

---

## 🌐 Production Deployment (Render + Vercel)

This application is fully pre-configured for instant deployment:
- **Backend**: Hosted on [Render](https://render.com) (`render.yaml` blueprint included).
- **Frontend**: Hosted on [Vercel](https://vercel.com) (`vercel.json` SPA configuration included).
- **Database**: Connects to any cloud MySQL instance (e.g., TiDB Serverless, Aiven, or Railway) with automatic table initialization and SSL support.

👉 For step-by-step instructions, see the complete [DEPLOYMENT.md](file:///c:/projects/projects/ChatGpt_clone/chatggpt-clone/DEPLOYMENT.md) guide.

