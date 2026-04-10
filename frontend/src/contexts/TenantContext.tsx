import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';

interface Modulo {
  id: number;
  codigo: string;
  nome: string;
  descricao: string;
  icone: string;
  habilitado: boolean;
  config?: Record<string, any>;
}

interface Empresa {
  id: number;
  nome: string;
  slug: string;
  logoUrl?: string;
  corPrimaria: string;
}

interface TenantContextData {
  empresa: Empresa | null;
  modulos: Modulo[];
  modulosHabilitados: string[];
  isModuloHabilitado: (codigo: string) => boolean;
  getConfigModulo: (codigo: string) => any;
  carregarTenant: (slug: string) => Promise<void>;
  setEmpresaSlug: (slug: string) => void;
  empresaSlug: string | null;
  loading: boolean;
}

const TenantContext = createContext<TenantContextData>({} as TenantContextData);

export function TenantProvider({ children }: { children: ReactNode }) {
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [empresaSlug, setEmpresaSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Carregar slug do localStorage ao iniciar
  useEffect(() => {
    const slugSalvo = localStorage.getItem('empresa_slug');
    if (slugSalvo) {
      setEmpresaSlug(slugSalvo);
      carregarTenant(slugSalvo);
    }
  }, []);

  // Salvar slug no localStorage quando mudar
  useEffect(() => {
    if (empresaSlug) {
      localStorage.setItem('empresa_slug', empresaSlug);
      // Atualizar header do API
      api.defaults.headers.common['X-Empresa-Slug'] = empresaSlug;
    }
  }, [empresaSlug]);

  const carregarTenant = async (slug: string) => {
    try {
      setLoading(true);
      // Aqui você pode fazer uma requisição para buscar dados da empresa
      // Por enquanto, vamos usar dados mockados ou do token
      setEmpresaSlug(slug);
      
      // Buscar módulos da empresa (endpoint que precisamos criar)
      // const response = await api.get(`/api/empresas/${slug}/modulos`);
      // setModulos(response.data);
      
      // Por enquanto, mock:
      setModulos([
        { id: 1, codigo: 'core', nome: 'Core', descricao: 'Funcionalidades básicas', icone: 'LayoutDashboard', habilitado: true },
        { id: 2, codigo: 'garagem', nome: 'Garagem', descricao: 'Gestão de garagem', icone: 'Warehouse', habilitado: true },
        { id: 3, codigo: 'relatorios', nome: 'Relatórios', descricao: 'Relatórios avançados', icone: 'BarChart3', habilitado: false },
      ]);
      
      setEmpresa({
        id: 1,
        nome: 'Minha Empresa',
        slug: slug,
        corPrimaria: '#3B82F6'
      });
    } catch (error) {
      console.error('Erro ao carregar tenant:', error);
    } finally {
      setLoading(false);
    }
  };

  const isModuloHabilitado = (codigo: string): boolean => {
    const modulo = modulos.find(m => m.codigo === codigo);
    return modulo?.habilitado ?? false;
  };

  const getConfigModulo = (codigo: string): any => {
    const modulo = modulos.find(m => m.codigo === codigo);
    return modulo?.config ?? {};
  };

  const modulosHabilitados = modulos
    .filter(m => m.habilitado)
    .map(m => m.codigo);

  return (
    <TenantContext.Provider
      value={{
        empresa,
        modulos,
        modulosHabilitados,
        isModuloHabilitado,
        getConfigModulo,
        carregarTenant,
        setEmpresaSlug,
        empresaSlug,
        loading
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant(): TenantContextData {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant deve ser usado dentro de um TenantProvider');
  }
  return context;
}
