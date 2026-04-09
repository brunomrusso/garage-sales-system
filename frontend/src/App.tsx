import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { LoginPage } from './pages/LoginPage';
import { RegistroPage } from './pages/RegistroPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { ClienteGaragem } from './pages/ClienteGaragem';
import CadastroAdminPage from './pages/CadastroAdminPage';

const ProtectedRoute = ({ children, requiredRole }: { children: React.ReactNode; requiredRole: 'admin' | 'cliente' }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (user.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/registro" element={<RegistroPage />} />
        <Route path="/cadastro-admin" element={<CadastroAdminPage />} />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cliente/garagem"
          element={
            <ProtectedRoute requiredRole="cliente">
              <ClienteGaragem />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
