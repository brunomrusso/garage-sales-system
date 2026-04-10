import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [userType, setUserType] = useState<'admin' | 'cliente'>('cliente');
  const { loginAdmin, loginCliente, loading, error } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userType === 'admin') {
      await loginAdmin(email, senha);
    } else {
      await loginCliente(email, senha);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500 to-transparent"></div>
        <div className="absolute top-[calc(50%+4px)] left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-500 to-transparent"></div>
      </div>

      <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-8 border border-gray-700 relative z-10">
        <div className="flex items-center justify-center mb-2">
          <span className="text-5xl mr-3">🏎️</span>
        </div>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-white uppercase tracking-wider">GarageSales</h1>
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
    </div>
  );
};
