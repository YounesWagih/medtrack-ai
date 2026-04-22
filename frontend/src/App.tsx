import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { Providers } from '@/components/layout/Providers';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { useAuthStore } from '@/stores/auth.store';
import { useEffect } from 'react';
import { LoginPage } from '@/pages/Login';
import { RegisterPage } from '@/pages/Register';
import { DashboardPage } from '@/pages/Dashboard';
import { MedicinesPage } from '@/pages/MedicinesPage';
import { MedicineFormPage } from '@/pages/MedicineForm';
import { MedicineDetailsPage } from '@/pages/MedicineDetails';
import { MedicineViewPage } from '@/pages/MedicineView';
import { ChatPage } from '@/pages/Chat';

function AuthInitializer() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return null;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/medicines"
        element={
          <ProtectedRoute>
            <MedicinesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/medicines/add"
        element={
          <ProtectedRoute>
            <MedicineFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/medicines/details/:slug"
        element={
          <ProtectedRoute>
            <MedicineDetailsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/medicines/view/:id"
        element={
          <ProtectedRoute>
            <MedicineViewPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/medicines/edit/:id"
        element={
          <ProtectedRoute>
            <MedicineFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Providers>
        <AuthInitializer />
        <AppRoutes />
        <Toaster position="top-right" richColors />
      </Providers>
    </BrowserRouter>
  );
}