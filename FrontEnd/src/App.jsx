import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import './App.css';

import Navbar from './Pages/Components/navbar';
import Home from './Pages/Home';
import Login from './Pages/Login';
import SignIn from './Pages/SignIn';
import Dashboard from './Pages/Dashboard';
import ModpackDashboard from './Pages/ModpackDashboard';
import { AuthProvider, useAuth } from './context/authContext';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="auth-page">
        <div style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Loading session…</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signin" element={<SignIn />} />
          
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/modpacks/:modpackId" 
            element={
              <ProtectedRoute>
                <ModpackDashboard />
              </ProtectedRoute>
            } 
          />

          <Route path="*" element={
            <div className="auth-page" style={{ flexDirection: 'column', gap: '1rem' }}>
              <h1 style={{ fontSize: '4rem', opacity: 0.3 }}>404</h1>
              <p style={{ color: 'var(--text-secondary)' }}>Page not found</p>
            </div>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;