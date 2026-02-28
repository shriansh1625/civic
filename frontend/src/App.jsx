/**
 * CivicLens AI — App Router
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import SchemeExplorer from './pages/SchemeExplorer';
import ChatAssistant from './pages/ChatAssistant';
import AlertsCenter from './pages/AlertsCenter';
import AdminCrawl from './pages/AdminCrawl';
import Layout from './components/layout/Layout';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-saffron-500"></div></div>;
  return isAuthenticated ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/app" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="schemes" element={<SchemeExplorer />} />
            <Route path="chat" element={<ChatAssistant />} />
            <Route path="alerts" element={<AlertsCenter />} />
            <Route path="admin" element={<AdminCrawl />} />
          </Route>
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
