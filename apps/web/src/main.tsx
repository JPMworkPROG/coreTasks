import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { ThemeProvider } from 'next-themes';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { router } from './router';
import { useWebSocket } from '@/hooks/useWebSocket';
import './index.css';

const queryClient = new QueryClient();

function AppContent() {
  // Inicializa WebSocket automaticamente quando autenticado
  useWebSocket();

  return (
    <>
      <Toaster />
      <Sonner />
      <RouterProvider router={router} />
    </>
  );
}

createRoot(document.getElementById('root')!).render(
  // StrictMode removido temporariamente para evitar double-mount em dev
  // <StrictMode>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AppContent />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  // </StrictMode>
);
