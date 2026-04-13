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
  const [empresaSlug, setEmpresaSlugState] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Wrapper para setEmpresaSlug que também salva no localStorage e atualiza header
  const setEmpresaSlug = (slug: string) => {
    localStorage.setItem('empresa_slug', slug);
    api.defaults.headers.common['X-Empresa-Slug'] = slug;
    setEmpresaSlugState(slug);
  };

  // Carregar slug do localStorage ao iniciar
  useEffect(() => {
    const slugSalvo = localStorage.getItem('empresa_slug');
    if (slugSalvo) {
      api.defaults.headers.common['X-Empresa-Slug'] = slugSalvo;
      setEmpresaSlugState(slugSalvo);
      carregarTenant(slugSalvo);
    }
  }, []);

  // Monitorar mudanças no localStorage de outras abas
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'empresa_slug' && e.newValue && e.newValue !== empresaSlug) {
        console.log('[TENANT] Slug mudou em outra aba:', e.newValue);
        setEmpresaSlugState(e.newValue);
        api.defaults.headers.common['X-Empresa-Slug'] = e.newValue;
        carregarTenant(e.newValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [empresaSlug]);

  const carregarTenant = async (slug: string) => {
    try {
      setLoading(true);
      console.log('[TENANT] Carregando tenant para slug:', slug);
      
      // Buscar dados reais da empresa da API pública
      let empresaId = 1;
      try {
        const response = await api.get(`/empresas/publicas/listar`);
        const empresas = response.data;
        const empresaEncontrada = empresas.find((e: any) => e.slug === slug);
        
        if (empresaEncontrada) {
          empresaId = empresaEncontrada.id;
          setEmpresa({
            id: empresaEncontrada.id,
            nome: empresaEncontrada.nome,
            slug: empresaEncontrada.slug,
            corPrimaria: empresaEncontrada.cor_primaria || '#3B82F6'
          });
          console.log('[TENANT] Empresa carregada:', empresaEncontrada.nome, 'ID:', empresaEncontrada.id);
        } else {
          console.log('[TENANT] Empresa não encontrada na lista, usando defaults');
          setEmpresa({
            id: 1,
            nome: 'Minha Empresa',
            slug: slug,
            corPrimaria: '#3B82F6'
          });
        }
      } catch (err) {
        console.error('[TENANT] Erro ao buscar empresa:', err);
        setEmpresa({
          id: 1,
          nome: 'Minha Empresa',
          slug: slug,
          corPrimaria: '#3B82F6'
        });
      }
      
      // Buscar módulos habilitados da API
      try {
        console.log('[TENANT] Buscando módulos para empresa_id:', empresaId);
        const modulosResponse = await api.get(`/empresas/${empresaId}/modulos`);
        const modulosData = modulosResponse.data;
        console.log('[TENANT] Módulos carregados:', modulosData);
        setModulos(modulosData);
      } catch (err) {
        console.error('[TENANT] Erro ao buscar módulos:', err);
        // Fallback: apenas core habilitado
        setModulos([
          { id: 1, codigo: 'core', nome: 'Core', descricao: 'Funcionalidades básicas', icone: 'LayoutDashboard', habilitado: true }
        ]);
      }
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
