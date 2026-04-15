import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { empresaService, authService } from '../services/api';
import { Building2 } from 'lucide-react';
import { Garage95Logo } from '../components/Garage95Logo';

interface Empresa {
  id: number;
  nome: string;
  slug: string;
}

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [userType, setUserType] = useState<'admin' | 'cliente'>('cliente');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Modal de seleção de empresa
  const [showEmpresaModal, setShowEmpresaModal] = useState(false);
  const [empresasDisponiveis, setEmpresasDisponiveis] = useState<Empresa[]>([]);
  const [empresaSelecionada, setEmpresaSelecionada] = useState('');
  const [loginTemp, setLoginTemp] = useState<{email: string, senha: string, userType: 'admin' | 'cliente'} | null>(null);
  
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Verificar se usuário tem múltiplas empresas
      const empresasResponse = await empresaService.buscarEmpresasUsuario(email);
      
      if (empresasResponse.data.encontrado && empresasResponse.data.empresas.length > 1) {
        // Usuário tem múltiplas empresas - mostrar modal
        setEmpresasDisponiveis(empresasResponse.data.empresas);
        setLoginTemp({ email, senha, userType });
        setShowEmpresaModal(true);
        setLoading(false);
        return;
      }

      // Login normal
      if (userType === 'admin') {
        const response = await authService.loginAdmin(email, senha);
        finalizarLogin(response.data);
      } else {
        const response = await authService.loginCliente(email, senha);
        finalizarLogin(response.data);
      }
    } catch (err: any) {
      const message = err.response?.data?.detail || err.response?.data?.error || 'Erro ao fazer login';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const finalizarLogin = async (data: any) => {
    const { token, user } = data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    // Buscar slug da empresa
    if (user.empresa_id) {
      try {
        const empresaResponse = await empresaService.obterPorId(user.empresa_id);
        localStorage.setItem('empresa_slug', empresaResponse.data.slug);
      } catch {
        localStorage.setItem('empresa_slug', 'principal');
      }
    } else {
      localStorage.setItem('empresa_slug', 'principal');
    }
    
    // Redirecionar
    if (user.role === 'cliente') {
      navigate('/cliente/garagem');
    } else if (user.role === 'admin_master') {
      // Admin master vai para seleção de empresa
      navigate('/admin/selecionar-empresa');
    } else {
      navigate('/admin/dashboard');
    }
  };

  const confirmarEmpresa = async () => {
    if (!loginTemp || !empresaSelecionada) return;
    
    setLoading(true);
    try {
      // Fazer login com empresa selecionada via header
      const headers = { 'X-Empresa-Slug': empresaSelecionada };
      
      let response;
      if (loginTemp.userType === 'admin') {
        response = await authService.loginAdmin(loginTemp.email, loginTemp.senha, headers);
      } else {
        response = await authService.loginCliente(loginTemp.email, loginTemp.senha, headers);
      }
      
      await finalizarLogin(response.data);
      setShowEmpresaModal(false);
    } catch (err: any) {
      const message = err.response?.data?.detail || err.response?.data?.error || 'Erro ao fazer login';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500 to-transparent"></div>
        <div className="absolute top-[calc(50%+4px)] left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-500 to-transparent"></div>
      </div>

      <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-8 border border-gray-700 relative z-10">
        <div className="flex items-center justify-center mb-8">
          <Garage95Logo size="xl" showText={false} />
        </div>
        <div className="text-center mb-8">
          <p className="text-gray-500 text-sm mt-1">Ka-chow! Bem-vindo de volta.</p>
        </div>

        <div className="flex gap-3 mb-8">
          <button
            onClick={() => setUserType('cliente')}
            className={`flex-1 py-2 px-4 rounded-lg font-bold uppercase tracking-wide transition ${
              userType === 'cliente'
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-white'
            }`}
          >
            Cliente
          </button>
          <button
            onClick={() => setUserType('admin')}
            className={`flex-1 py-2 px-4 rounded-lg font-bold uppercase tracking-wide transition ${
              userType === 'admin'
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-white'
            }`}
          >
            Admin
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-400 font-semibold mb-2 text-sm uppercase tracking-wide">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-white placeholder-gray-500"
              placeholder="seu@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-gray-400 font-semibold mb-2 text-sm uppercase tracking-wide">Senha</label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-white placeholder-gray-500"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="bg-red-600/20 border border-red-600/30 text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-red-600 to-orange-500 text-white font-bold py-3 px-4 rounded-lg hover:from-red-700 hover:to-orange-600 transition disabled:opacity-50 uppercase tracking-wider shadow-lg shadow-red-600/20"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        {userType === 'cliente' && (
          <p className="text-center text-gray-500 text-sm mt-6">
            Não tem conta?{' '}
            <button
              onClick={() => navigate('/registro')}
              className="text-red-400 hover:text-red-300 font-semibold transition"
            >
              Registre-se aqui
            </button>
          </p>
        )}

        {userType === 'admin' && (
          <p className="text-center text-gray-500 text-sm mt-6">
            Quer se tornar admin?{' '}
            <button
              onClick={() => navigate('/cadastro-admin')}
              className="text-orange-400 hover:text-orange-300 font-semibold transition"
            >
              Cadastre-se aqui
            </button>
          </p>
        )}
      </div>

      {/* Modal de Seleção de Empresa */}
      {showEmpresaModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <Building2 className="text-red-500 w-8 h-8" />
              <h2 className="text-xl font-bold text-white">Selecione a Empresa</h2>
            </div>
            <p className="text-gray-400 mb-4">
              Você tem cadastro em múltiplas empresas. Selecione qual deseja acessar:
            </p>
            
            <div className="space-y-2 mb-6">
              {empresasDisponiveis.map((empresa) => (
                <button
                  key={empresa.id}
                  onClick={() => setEmpresaSelecionada(empresa.slug)}
                  className={`w-full p-4 rounded-lg border-2 text-left transition ${
                    empresaSelecionada === empresa.slug
                      ? 'border-red-500 bg-red-500/10 text-white'
                      : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  <div className="font-semibold">{empresa.nome}</div>
                  <div className="text-xs opacity-70">{empresa.slug}</div>
                </button>
              ))}
            </div>

            {error && (
              <div className="bg-red-600/20 border border-red-600/30 text-red-400 px-4 py-2 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowEmpresaModal(false)}
                className="flex-1 py-3 px-4 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-600 transition"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarEmpresa}
                disabled={!empresaSelecionada || loading}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-red-600 to-orange-500 text-white rounded-lg font-semibold hover:from-red-700 hover:to-orange-600 transition disabled:opacity-50"
              >
                {loading ? 'Entrando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
