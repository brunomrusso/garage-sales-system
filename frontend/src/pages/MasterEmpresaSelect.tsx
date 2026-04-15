import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Crown, LogOut } from 'lucide-react';
import { Garage95Logo } from '../components/Garage95Logo';
import { empresaService, authService } from '../services/api';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { useTenant } from '../contexts/TenantContext';

interface Empresa {
  id: number;
  nome: string;
  slug: string;
  ativa: boolean;
  cor_primaria?: string;
}

export const MasterEmpresaSelect = () => {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [empresaSelecionada, setEmpresaSelecionada] = useState('');
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { carregarTenant, setEmpresaSlug: setTenantSlug } = useTenant();

  useEffect(() => {
    // Verificar se é admin master
    if (user?.role !== 'admin_master') {
      navigate('/admin/dashboard');
      return;
    }

    carregarEmpresas();
  }, [user, navigate]);

  const carregarEmpresas = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('[MASTER] Carregando empresas...');
      const response = await empresaService.listarPublicas();
      console.log('[MASTER] Empresas recebidas:', response.data);
      // API pública já retorna apenas empresas ativas, mas filtramos por segurança
      const empresasAtivas = response.data.filter((e: Empresa) => e.ativa !== false);
      console.log('[MASTER] Empresas ativas:', empresasAtivas);
      setEmpresas(empresasAtivas);
      if (empresasAtivas.length === 0) {
        setError('Nenhuma empresa ativa encontrada');
      }
    } catch (err: any) {
      console.error('[MASTER] Erro ao carregar empresas:', err);
      setError(err.response?.data?.detail || 'Erro ao carregar empresas');
    } finally {
      setLoading(false);
    }
  };

  const selecionarEmpresa = async () => {
    if (!empresaSelecionada) return;
    
    const empresa = empresas.find(e => e.slug === empresaSelecionada);
    if (!empresa) return;
    
    setLoading(true);
    try {
      console.log('[MASTER] Trocando para empresa:', empresa.nome);
      
      // Chamar API para trocar empresa e gerar novo token
      const response = await authService.trocarEmpresa(empresa.slug);
      
      // Atualizar token no localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('empresa_master_id', empresa.id.toString());
      
      // Atualizar header do axios imediatamente
      api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      
      // Atualizar TenantContext com a nova empresa
      setTenantSlug(empresa.slug);
      await carregarTenant(empresa.slug);
      
      console.log('[MASTER] Token atualizado com nova empresa:', response.data.user.empresa_id);
      console.log('[MASTER] Redirecionando para dashboard');
      
      navigate('/admin/dashboard');
    } catch (err: any) {
      console.error('[MASTER] Erro ao trocar empresa:', err);
      setError(err.response?.data?.detail || 'Erro ao trocar empresa');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">Carregando empresas...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <button
          onClick={logout}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </button>
      </div>

      <div className="bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl p-8 border border-slate-700">
        <div className="flex flex-col items-center gap-3 mb-2">
          <Garage95Logo size="lg" showText={false} />
          <div className="flex items-center gap-2">
            <Crown className="text-yellow-500 w-6 h-6" />
            <h1 className="text-xl font-bold text-white">Admin Master</h1>
          </div>
        </div>
        
        <p className="text-gray-400 text-center mb-8">
          Bem-vindo, <span className="text-white font-semibold">{user?.nome || user?.email}</span>!
          <br />
          Selecione a empresa que deseja gerenciar:
        </p>

        {error && (
          <div className="bg-red-600/20 border border-red-600/30 text-red-400 px-4 py-3 rounded-lg mb-6 text-center">
            {error}
            <button 
              onClick={carregarEmpresas}
              className="ml-2 text-red-300 hover:text-red-200 underline"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {empresas.length === 0 && !loading && !error && (
          <div className="text-center text-gray-400 py-8">
            Nenhuma empresa cadastrada
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {empresas.map((empresa) => (
            <button
              key={empresa.id}
              onClick={() => setEmpresaSelecionada(empresa.slug)}
              className={`p-6 rounded-xl border-2 text-left transition-all ${
                empresaSelecionada === empresa.slug
                  ? 'border-red-500 bg-red-500/10'
                  : 'border-gray-600 bg-gray-700 hover:border-gray-500'
              }`}
              style={{
                borderColor: empresaSelecionada === empresa.slug 
                  ? empresa.cor_primaria || '#ef4444'
                  : undefined
              }}
            >
              <div className="flex items-start gap-3">
                <Building2 
                  className="w-6 h-6 mt-1" 
                  style={{ color: empresa.cor_primaria || '#ef4444' }}
                />
                <div>
                  <div className="font-bold text-white text-lg">{empresa.nome}</div>
                  <div className="text-sm text-gray-400">{empresa.slug}</div>
                  <div className="text-xs text-gray-500 mt-1">ID: {empresa.id}</div>
                </div>
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={selecionarEmpresa}
          disabled={!empresaSelecionada}
          className="w-full py-4 bg-gradient-to-r from-red-600 to-orange-500 text-white rounded-xl font-bold text-lg hover:from-red-700 hover:to-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Acessar Empresa
        </button>

        <p className="text-center text-gray-500 text-sm mt-6">
          Como admin master, você pode gerenciar qualquer empresa do sistema.
        </p>
      </div>
    </div>
  );
};
