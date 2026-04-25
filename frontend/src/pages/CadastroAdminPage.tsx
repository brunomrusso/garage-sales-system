import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Phone, Shield, AlertCircle, Building2 } from 'lucide-react';
import { clienteService } from '../services/api';

const CadastroAdminPage: React.FC = () => {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: '',
    telefone: '',
    role: 'admin' as 'admin' | 'admin_master'
  });
  const [empresaSlug, setEmpresaSlug] = useState('principal'); // Empresa padrão
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.senha !== formData.confirmarSenha) {
      setError('As senhas não coincidem');
      return;
    }

    if (formData.senha.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      await clienteService.criar({
        nome: formData.nome,
        email: formData.email,
        senha: formData.senha,
        telefone: formData.telefone || undefined,
        role: formData.role
      }, empresaSlug);
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (err: any) {
      const message = err.response?.data?.detail || 'Erro ao cadastrar admin';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-itgeek-teal to-transparent"></div>
          <div className="absolute top-[calc(50%+4px)] left-0 right-0 h-px bg-gradient-to-r from-transparent via-itgeek-orange to-transparent"></div>
        </div>

        <div className="bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-md p-8 border border-neutral-700 relative z-10 text-center">
          <div className="flex items-center justify-center mb-6">
            <Shield className="w-16 h-16 text-itgeek-teal" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Cadastro Enviado!</h2>
          <p className="text-gray-300 mb-2">
            Seu cadastro como {formData.role === 'admin_master' ? 'Admin Master' : 'Admin'} foi recebido.
          </p>
          <p className="text-gray-400 text-sm">
            Aguarde a aprovação de um administrador para acessar o sistema.
          </p>
          <p className="text-gray-500 text-xs mt-4">
            Redirecionando para a página de login...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-itgeek-teal to-transparent"></div>
        <div className="absolute top-[calc(50%+4px)] left-0 right-0 h-px bg-gradient-to-r from-transparent via-itgeek-orange to-transparent"></div>
      </div>

      <div className="bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-md p-8 border border-neutral-700 relative z-10">
        <div className="flex items-center justify-center mb-6">
          <Shield className="w-12 h-12 text-itgeek-teal mr-3" />
          <h1 className="text-3xl font-bold text-white">Cadastro Admin</h1>
        </div>

        <div className="bg-itgeek-orange/10 border border-itgeek-orange/30 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-itgeek-orange mt-0.5 mr-2 flex-shrink-0" />
            <div className="text-sm">
              <p className="text-itgeek-orange font-semibold mb-1">Aprovação Necessária</p>
              <p className="text-itgeek-orange/80">
                Após o cadastro, um administrador precisará aprovar seu acesso antes que você possa utilizar o sistema.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-6 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Tipo de Admin
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'admin_master' })}
              className="w-full px-4 py-3 bg-neutral-800 border border-neutral-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-itgeek-teal focus:border-transparent"
              required
            >
              <option value="admin">Admin</option>
              <option value="admin_master">Admin Master</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Empresa (Slug)
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={empresaSlug}
                onChange={(e) => setEmpresaSlug(e.target.value.toLowerCase())}
                className="w-full pl-10 pr-4 py-3 bg-neutral-800 border border-neutral-600 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-itgeek-teal focus:border-transparent"
                placeholder="principal"
                required
              />
            </div>
            <p className="text-gray-500 text-xs mt-1">
              Digite o slug da empresa (ex: principal)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nome Completo
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className="w-full pl-10 pr-4 py-3 bg-neutral-800 border border-neutral-600 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-itgeek-teal focus:border-transparent"
                placeholder="Seu nome completo"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-10 pr-4 py-3 bg-neutral-800 border border-neutral-600 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-itgeek-teal focus:border-transparent"
                placeholder="seu@email.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Telefone (Opcional)
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="tel"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                className="w-full pl-10 pr-4 py-3 bg-neutral-800 border border-neutral-600 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-itgeek-teal focus:border-transparent"
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="password"
                value={formData.senha}
                onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                className="w-full pl-10 pr-4 py-3 bg-neutral-800 border border-neutral-600 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-itgeek-teal focus:border-transparent"
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Confirmar Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="password"
                value={formData.confirmarSenha}
                onChange={(e) => setFormData({ ...formData, confirmarSenha: e.target.value })}
                className="w-full pl-10 pr-4 py-3 bg-neutral-800 border border-neutral-600 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-itgeek-teal focus:border-transparent"
                placeholder="Confirme sua senha"
                required
                minLength={6}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-itgeek-teal text-white py-3 rounded-lg font-semibold hover:bg-itgeek-teal-dark transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Cadastrando...
              </>
            ) : (
              <>
                <Shield className="w-5 h-5" />
                Cadastrar como {formData.role === 'admin_master' ? 'Admin Master' : 'Admin'}
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-400">
            Já tem uma conta?{' '}
            <button
              onClick={() => navigate('/')}
              className="text-itgeek-teal hover:text-itgeek-teal-light font-semibold transition"
            >
              Fazer login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default CadastroAdminPage;
