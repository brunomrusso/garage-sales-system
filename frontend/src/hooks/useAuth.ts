import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';

export interface User {
  id: number;
  email: string;
  role: 'admin' | 'admin_master' | 'cliente';
  nome?: string;
  telefone?: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const loginAdmin = useCallback(async (email: string, senha: string, empresaSlug?: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.loginAdmin(email, senha, empresaSlug);
      const { token, user: userData } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      // Salvar empresa_slug se retornado ou usar o fornecido
      const slugToSave = userData.empresa_slug || empresaSlug || 'principal';
      localStorage.setItem('empresa_slug', slugToSave);
      setUser(userData);
      navigate('/admin/dashboard');
    } catch (err: any) {
      const message = err.response?.data?.error || 'Erro ao fazer login';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const loginCliente = useCallback(async (email: string, senha: string, empresaSlug?: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.loginCliente(email, senha, empresaSlug);
      const { token, user: userData } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      // Salvar empresa_slug se retornado ou usar o fornecido
      const slugToSave = userData.empresa_slug || empresaSlug || 'principal';
      localStorage.setItem('empresa_slug', slugToSave);
      setUser(userData);
      navigate('/cliente/garagem');
    } catch (err: any) {
      const message = err.response?.data?.error || 'Erro ao fazer login';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
  }, [navigate]);

  return { user, loading, error, loginAdmin, loginCliente, logout };
};
