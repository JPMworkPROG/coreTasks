# Web Application

> Modern React frontend for coreTasks

**Ports**: `8080`, `8081` | **Tech Stack**: React 18 + Vite + TanStack Router + Shadcn UI

## Overview

The Web Application is a modern, responsive frontend built with React, providing a beautiful user interface for the coreTasks system.

## Features

- ✅ Type-safe routing with TanStack Router
- ✅ Beautiful UI components from Shadcn UI
- ✅ Real-time notifications via WebSocket
- ✅ Responsive design with TailwindCSS
- ✅ Form validation with React Hook Form
- ✅ State management with TanStack Query
- ✅ Authentication flow with JWT

## Tech Stack

- **React 18**: UI library
- **Vite**: Build tool and dev server
- **TanStack Router**: Type-safe routing
- **TanStack Query**: Server state management
- **Shadcn UI**: Component library
- **TailwindCSS**: Styling
- **Socket.IO Client**: Real-time notifications
- **Axios**: HTTP client
- **React Hook Form**: Form management
- **Zod**: Schema validation

## Project Structure

```
apps/web/
├── public/
├── src/
│   ├── components/
│   │   ├── ui/           # Shadcn UI components
│   │   ├── layout/       # Layout components
│   │   └── features/     # Feature components
│   ├── hooks/            # Custom hooks
│   ├── lib/              # Utilities
│   ├── routes/           # Route components
│   ├── services/         # API services
│   ├── styles/           # Global styles
│   ├── types/            # TypeScript types
│   ├── App.tsx
│   └── main.tsx
├── .env
├── index.html
├── package.json
├── tailwind.config.js
└── vite.config.ts
```

## Routes

- `/` - Landing page
- `/login` - Login page
- `/register` - Registration page
- `/dashboard` - Main dashboard
- `/tasks` - Task list
- `/tasks/:id` - Task details
- `/profile` - User profile

## Environment Variables

```env
VITE_API_URL=http://localhost:3000
VITE_WS_URL=http://localhost:3003
```

## Running

### Development

```bash
npm install
npm run dev
```

Access at:
- Instance 1: http://localhost:8080
- Instance 2: http://localhost:8081

### Production Build

```bash
npm run build
npm run preview
```

### Docker

```bash
docker-compose up web-1 web-2
```

## Development Tips

### Add New Route

```typescript
// src/routes/tasks.$id.tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/tasks/$id')({
  component: TaskDetail,
})

function TaskDetail() {
  const { id } = Route.useParams()
  // ...
}
```

### API Call with TanStack Query

```typescript
import { useQuery } from '@tanstack/react-query'

function useTask(id: string) {
  return useQuery({
    queryKey: ['task', id],
    queryFn: () => api.get(`/tasks/${id}`)
  })
}
```

### WebSocket Connection

```typescript
import { useEffect } from 'react'
import { socket } from '@/lib/socket'

useEffect(() => {
  socket.on('notification', (data) => {
    console.log('Notification:', data)
  })

  return () => {
    socket.off('notification')
  }
}, [])
```

[← Back to Main README](../../README.md)
