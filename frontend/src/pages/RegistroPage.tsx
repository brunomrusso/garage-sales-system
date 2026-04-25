import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { clienteService, empresaService } from '../services/api';
import { Building2 } from 'lucide-react';

interface Empresa {
  id: number;
  nome: string;
  slug: string;
}

export const RegistroPage = () => {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [telefone, setTelefone] = useState('');
  const [empresaSlug, setEmpresaSlug] = useState('');
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingEmpresas, setLoadingEmpresas] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  // Buscar empresas ao carregar
  useEffect(() => {
    const carregarEmpresas = async () => {
      try {
        const response = await empresaService.listarPublicas();
        setEmpresas(response.data);
        // Selecionar primeira empresa por padrão
        if (response.data.length > 0) {
          setEmpresaSlug(response.data[0].slug);
        }
      } catch {
        // Silencioso - fallback para input manual
      } finally {
        setLoadingEmpresas(false);
      }
    };
    carregarEmpresas();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (senha !== confirmarSenha) {
      setError('As senhas não coincidem');
      return;
    }
    
    setLoading(true);
    setError(null);

    // DEBUG: Verificar valor do empresaSlug
    console.log('[FRONTEND] Empresa selecionada:', empresaSlug);
    console.log('[FRONTEND] Empresas disponíveis:', empresas);

    try {
      await clienteService.criar({ nome, email, senha, telefone }, empresaSlug);
      setSuccess(true);
      setTimeout(() => navigate('/'), 2000);
    } catch (err: any) {
      const message = err.response?.data?.detail || err.response?.data?.error || 'Erro ao registrar';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-itgeek-teal to-transparent"></div>
        <div className="absolute top-[calc(50%+4px)] left-0 right-0 h-px bg-gradient-to-r from-transparent via-itgeek-orange to-transparent"></div>
      </div>

      <div className="bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-md p-8 border border-neutral-700 relative z-10">
        <div className="flex items-center justify-center mb-6">
          <img src="/logo-itgeek-vertical.png" alt="ItGeek Store" style={{ height: 180, width: 'auto' }} />
        </div>

        <h2 className="text-2xl font-bold text-white mb-6">Criar Conta</h2>

        {success && (
          <div className="bg-green-600/20 border border-green-600/30 text-green-400 px-4 py-3 rounded-lg mb-4 text-sm">
            Conta criada com sucesso! Redirecionando...
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-400 font-semibold mb-2 text-sm uppercase tracking-wide">Nome</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full px-4 py-3 bg-neutral-800 border border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-itgeek-teal focus:border-transparent text-white placeholder-neutral-500"
              placeholder="Seu nome"
              required
            />
          </div>

          <div>
            <label className="block text-gray-400 font-semibold mb-2 text-sm uppercase tracking-wide">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-neutral-800 border border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-itgeek-teal focus:border-transparent text-white placeholder-neutral-500"
              placeholder="seu@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-gray-400 font-semibold mb-2 text-sm uppercase tracking-wide">Telefone</label>
            <input
              type="tel"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              className="w-full px-4 py-3 bg-neutral-800 border border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-itgeek-teal focus:border-transparent text-white placeholder-neutral-500"
              placeholder="(11) 99999-9999"
            />
          </div>

          <div>
            <label className="block text-gray-400 font-semibold mb-2 text-sm uppercase tracking-wide">Senha</label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full px-4 py-3 bg-neutral-800 border border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-itgeek-teal focus:border-transparent text-white placeholder-neutral-500"
              placeholder="••••••••"
              required
            />
          </div>

          <div>
            <label className="block text-gray-400 font-semibold mb-2 text-sm uppercase tracking-wide">Confirmar Senha</label>
            <input
              type="password"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              className="w-full px-4 py-3 bg-neutral-800 border border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-itgeek-teal focus:border-transparent text-white placeholder-neutral-500"
              placeholder="••••••••"
              required
            />
          </div>

          <div>
            <label className="block text-gray-400 font-semibold mb-2 text-sm uppercase tracking-wide">
              <Building2 className="inline w-4 h-4 mr-1" />
              Empresa
            </label>
            {loadingEmpresas ? (
              <div className="w-full px-4 py-3 bg-neutral-800 border border-neutral-600 rounded-lg text-neutral-400">
                Carregando empresas...
              </div>
            ) : empresas.length > 0 ? (
              <select
                value={empresaSlug}
                onChange={(e) => setEmpresaSlug(e.target.value)}
                className="w-full px-4 py-3 bg-neutral-800 border border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-itgeek-teal focus:border-transparent text-white"
                required
              >
                <option value="" disabled>Selecione uma empresa</option>
                {empresas.map((empresa) => (
                  <option key={empresa.id} value={empresa.slug}>
                    {empresa.nome}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={empresaSlug}
                onChange={(e) => setEmpresaSlug(e.target.value.toLowerCase())}
                className="w-full px-4 py-3 bg-neutral-800 border border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-itgeek-teal focus:border-transparent text-white placeholder-neutral-500"
                placeholder="principal"
                required
              />
            )}
            <p className="text-gray-500 text-xs mt-1">
              {empresas.length > 0 ? 'Selecione a empresa desejada' : 'Digite o slug da empresa'}
            </p>
          </div>

          {error && (
            <div className="bg-red-600/20 border border-red-600/30 text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-itgeek-teal to-itgeek-teal-dark text-white font-bold py-3 px-4 rounded-lg hover:from-itgeek-teal-dark hover:to-itgeek-teal transition disabled:opacity-50 uppercase tracking-wider shadow-lg shadow-itgeek-teal/20"
          >
            {loading ? 'Registrando...' : 'Registrar'}
          </button>
        </form>

        <p className="text-center text-gray-500 text-sm mt-6">
          Já tem conta?{' '}
          <button
            onClick={() => navigate('/')}
            className="text-itgeek-teal hover:text-itgeek-teal-light font-semibold transition"
          >
            Faça login
          </button>
        </p>
      </div>
    </div>
  );
};
