import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Dashboard from './pages/Dashboard';
import Layout from './components/Layout';
import Products from './pages/Products';
import Sales from './pages/Sales';
import Customers from './pages/Customers';
import Reports from './pages/Reports';
import Login from './pages/Login';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Admin from './pages/Admin';
import { AdminRoute } from './components/auth/AdminRoute';
import { SalesHistory } from './pages/SalesHistory';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session } = useAuth();
  if (!session) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="products" element={<Products />} />
            <Route path="sales" element={<Sales />} />
            <Route path="customers" element={<Customers />} />
            <Route path="reports" element={<Reports />} />
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<Admin />} />
            </Route>
            <Route path="/sales-history" element={<SalesHistory />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;