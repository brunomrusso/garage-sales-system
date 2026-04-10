import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import api from '../services/api';

export interface User {
  id: number;
  email: string;
  role: 'admin' | 'admin_master' | 'cliente';
  nome?: string;
  telefone?: string;
  empresa_id?: number;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchEmpresaSlug = async (empresaId: number) => {
    try {
      const response = await api.get(`/empresas/${empresaId}`);
      return response.data.slug;
    } catch {
      return 'principal';
    }
  };

  const loginAdmin = useCallback(async (email: string, senha: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.loginAdmin(email, senha);
      const { token, user: userData } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      
      // Se for admin master, ir para seleção de empresa
      if (userData.role === 'admin_master') {
        console.log('[AUTH] Admin master detectado, redirecionando para seleção de empresa');
        navigate('/admin/selecionar-empresa');
        return;
      }
      
      // Admin comum - buscar slug da empresa automaticamente
      const slug = await fetchEmpresaSlug(userData.empresa_id || 1);
      localStorage.setItem('empresa_slug', slug);
      navigate('/admin/dashboard');
    } catch (err: any) {
      const message = err.response?.data?.error || 'Erro ao fazer login';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const loginCliente = useCallback(async (email: string, senha: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.loginCliente(email, senha);
      const { token, user: userData } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      // Buscar slug da empresa automaticamente
      const slug = await fetchEmpresaSlug(userData.empresa_id || 1);
      localStorage.setItem('empresa_slug', slug);
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
