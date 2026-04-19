# Frontend Project Plan - Medicine Tracker + AI Chat

## 1. Project Overview

A modern React frontend for a medicine tracking application with AI-powered chat assistant.

**Tech Stack:**
- React 19 + Vite
- TypeScript
- Tailwind CSS
- shadcn/ui (components)
- TanStack Query (data fetching)
- React Router v7
- React Hook Form + Zod (forms)

---

## 2. Milestones & Tasks

### Milestone 1: Project Setup
**Goal:** Initialize the project and configure development environment

| Task | Description |
|-----|-------------|
| 1.1 | Initialize Vite + React + TypeScript project |
| 1.2 | Install dependencies: Tailwind, TanStack Query, React Router, React Hook Form, Zod, Axios |
| 1.3 | Configure Tailwind CSS with custom colors |
| 1.4 | Set up shadcn/ui components |
| 1.5 | Configure ESLint and Prettier |
| 1.6 | Create folder structure |
| 1.7 | Test dev server runs successfully |

---

### Milestone 2: Core Infrastructure
**Goal:** Build the foundation for API integration and authentication

| Task | Description |
|-----|-------------|
| 2.1 | Create TypeScript types matching Prisma schema (User, Medicine, ChatSession, ChatMessage) |
| 2.2 | Set up Axios instance with base URL and timeout |
| 2.3 | Add JWT interceptor for automatic token attachment |
| 2.4 | Create auth service (login, register) |
| 2.5 | Create medicine service (CRUD operations) |
| 2.6 | Create chat service (sessions, messages) |
| 2.7 | Implement auth context (AuthProvider) with state management |
| 2.8 | Create protected route wrapper component |
| 2.9 | Implement logout functionality |

---

### Milestone 3: Authentication Pages
**Goal:** User registration and login functionality

| Task | Description |
|-----|-------------|
| 3.1 | Build Login page with form |
| 3.2 | Build Register page with form |
| 3.3 | Add form validation with React Hook Form + Zod |
| 3.4 | Implement password show/hide toggle |
| 3.5 | Add error handling and display |
| 3.6 | Implement redirect after login (to dashboard) |
| 3.7 | Add link between login and register pages |

---

### Milestone 4: Dashboard (Medicines)
**Goal:** Main medicine list and management interface

| Task | Description |
|-----|-------------|
| 4.1 | Build Dashboard layout with header |
| 4.2 | Create stats cards (total, expiring soon, expired counts) |
| 4.3 | Build MedicineList component with loading states |
| 4.4 | Create MedicineCard component with status badges |
| 4.5 | Implement status badge colors (green/yellow/red/gray) |
| 4.6 | Build filter buttons (All, Active, Expiring Soon, Expired) |
| 4.7 | Implement search by medicine name |
| 4.8 | Add sort functionality (name, expiryDate, createdAt) |
| 4.9 | Create Add Medicine dialog/modal |
| 4.10 | Create Edit Medicine dialog/modal |
| 4.11 | Implement remove medicine action |
| 4.12 | Add pagination |

---

### Milestone 5: AI Chat
**Goal:** Chat interface with AI assistant

| Task | Description |
|-----|-------------|
| 5.1 | Build Chat page layout with sidebar |
| 5.2 | Create SessionList component |
| 5.3 | Implement new session creation |
| 5.4 | Build ChatWindow component |
| 5.5 | Create ChatMessage component (user/assistant bubbles) |
| 5.6 | Create ChatInput component |
| 5.7 | Implement streaming response handling |
| 5.8 | Add typing indicator |
| 5.9 | Add auto-scroll to bottom |
| 5.10 | Implement loading states during message send |
| 5.11 | Add session management (switch, delete) |

---

### Milestone 6: Polish & Deployment
**Goal:** Final improvements and production readiness

| Task | Description |
|-----|-------------|
| 6.1 | Implement responsive design for mobile |
| 6.2 | Add skeleton loaders |
| 6.3 | Create error boundaries |
| 6.4 | Add toast notifications for errors |
| 6.5 | Test all user flows end-to-end |
| 6.6 | Run production build |
| 6.7 | Configure environment variables |
| 6.8 | Deploy to Vercel |

---

## 3. API Endpoints

### Base URL
```
VITE_API_URL=http://localhost:3000/api
```

| Method | Endpoint | Auth | Description |
|--------|---------|------|-------------|
| POST | `/auth/register` | No | Register new user |
| POST | `/auth/login` | No | Login user |
| GET | `/medicines` | Yes | List medicines |
| POST | `/medicines` | Yes | Create medicine |
| GET | `/medicines/:id` | Yes | Get medicine by ID |
| PATCH | `/medicines/:id` | Yes | Update medicine |
| PATCH | `/medicines/:id/remove` | Yes | Remove medicine |
| POST | `/chat/sessions` | Yes | Create chat session |
| POST | `/chat/sessions/:id/messages` | Yes | Send message |
| GET | `/chat/sessions/:id/messages` | Yes | Get messages |

---

## 4. Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── ui/                    # shadcn/ui components
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Layout.tsx
│   │   ├── medicine/
│   │   │   ├── MedicineCard.tsx
│   │   │   ├── MedicineList.tsx
│   │   │   ├── MedicineForm.tsx
│   │   │   └── MedicineFilter.tsx
│   │   └── chat/
│   │       ├── ChatWindow.tsx
│   │       ├── ChatMessage.tsx
│   │       ├── ChatInput.tsx
│   │       └── SessionList.tsx
│   ├── pages/
│   │   ├── Home.tsx               # Redirect to dashboard or login
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── Dashboard.tsx          # Medicine list
│   │   ├── MedicineForm.tsx       # Add/Edit medicine
│   │   └── Chat.tsx              # AI chat page
│   ├── services/
│   │   ├── api.ts               # Axios instance
│   │   ├── auth.service.ts
│   │   ├── medicine.service.ts
│   │   └── chat.service.ts
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useMedicines.ts
│   │   └── useChat.ts
│   ├── stores/
│   │   └── auth.store.ts         # Auth state (zustand or context)
│   ├── types/
│   │   └── api.ts               # TypeScript types matching backend
│   ├── lib/
│   │   └── utils.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── postcss.config.js
```

---

## 5. Medicine Status Colors

| Status | Color | Description |
|--------|-------|-------------|
| ACTIVE | green | More than 30 days |
| EXPIRING_SOON | yellow/orange | Less than 30 days |
| EXPIRED | red | Past expiry date |
| REMOVED | gray | User removed |

---

## 6. Acceptance Criteria

- [ ] User can register and login
- [ ] JWT tokens are stored and sent with requests
- [ ] User can view all their medicines
- [ ] User can filter medicines by status
- [ ] User can add new medicine
- [ ] User can edit existing medicine
- [ ] User can remove medicine
- [ ] User can create chat session
- [ ] User can send messages to AI
- [ ] User sees streaming AI responses
- [ ] App is responsive on mobile
- [ ] App handles errors gracefully

---

## 7. Implementation Order

```
Milestone 1 (Tasks 1.1 - 1.7)
         ↓
Milestone 2 (Tasks 2.1 - 2.9)
         ↓
Milestone 3 (Tasks 3.1 - 3.7)
         ↓
Milestone 4 (Tasks 4.1 - 4.12)
         ↓
Milestone 5 (Tasks 5.1 - 5.11)
         ↓
Milestone 6 (Tasks 6.1 - 6.8)
```

---

## 8. Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```