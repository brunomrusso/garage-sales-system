import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { usePermissions } from '../hooks/usePermissions';
import { useTenant } from '../contexts/TenantContext';
import { clienteService, loteService, garagemService } from '../services/api';
import { LogOut, Users, ShoppingBag, RefreshCw, Plus, Trash2, Eye, Check, X, Image, Warehouse, Send, Archive, Search, Shield, Settings } from 'lucide-react';
import { PermissionsModal } from '../components/PermissionsModal';

export const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const { empresa } = useTenant();
  const { 
    canCreateLote, canDeleteLote,
    canCreateCliente, canDeleteCliente,
    canManagePermissions,
    canViewGaragem,
    canEditGaragem,
    canUploadFotoGaragem
  } = usePermissions(user?.id || 0);
  const [clientes, setClientes] = useState<any[]>([]);
  const [adminsPendentes, setAdminsPendentes] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'clientes' | 'vendas' | 'garagem' | 'admins'>('clientes');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ nome: '', email: '', senha: '', telefone: '' });

  const [lotes, setLotes] = useState<any[]>([]);
  const [selectedAdminForPerms, setSelectedAdminForPerms] = useState<any>(null);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [lotesArquivados, setLotesArquivados] = useState<any[]>([]);
  const [selectedLote, setSelectedLote] = useState<any>(null);
  const [mostrarArquivados, setMostrarArquivados] = useState(false);
  const [vendasLote, setVendasLote] = useState<any[]>([]);
  const [showLoteForm, setShowLoteForm] = useState(false);
  const [showVendaForm, setShowVendaForm] = useState(false);
  const [loteFormData, setLoteFormData] = useState({ numero_lote: '', nome: '', descricao: '', foto: '', status_lote: '' });
  const [vendaFormData, setVendaFormData] = useState({
    cliente_id: '', carrinhos_comprados: '', preco: '', pago: false,
    comprovante_pagamento: '', data_pagamento: '', observacoes: ''
  });
  const [buscaCliente, setBuscaCliente] = useState('');
  const [resultadosBusca, setResultadosBusca] = useState<any[]>([]);
  const [showMigrarButton, setShowMigrarButton] = useState(false);

  const [selectedClienteGaragem, setSelectedClienteGaragem] = useState<any>(null);
  const [fotosGaragem, setFotosGaragem] = useState<any[]>([]);
  const [solicitacoes, setSolicitacoes] = useState<any[]>([]);
  const [showFotoForm, setShowFotoForm] = useState(false);
  const [fotoFormData, setFotoFormData] = useState({ foto: '', descricao: '' });
  const [savingFoto, setSavingFoto] = useState(false);

  useEffect(() => {
    loadClientes();
    loadLotes();
    loadAdminsPendentes();
    const interval = setInterval(loadClientes, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadClientes = async () => {
    setLoading(true);
    try {
      const response = await clienteService.listar();
      setClientes(response.data);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAdminsPendentes = async () => {
    try {
      const response = await clienteService.listarAdminsPendentes();
      setAdminsPendentes(response.data);
    } catch (error) {
      console.error('Erro ao carregar admins pendentes:', error);
    }
  };

  const handleAprovarAdmin = async (adminId: number) => {
    try {
      await clienteService.aprovarAdmin(adminId);
      alert('Admin aprovado com sucesso!');
      loadAdminsPendentes();
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Erro ao aprovar admin';
      alert(message);
    }
  };

  const handleRejeitarAdmin = async (adminId: number) => {
    if (window.confirm('Tem certeza que deseja rejeitar este admin? Ele será permanentemente deletado.')) {
      try {
        await clienteService.rejeitarAdmin(adminId);
        alert('Admin rejeitado com sucesso!');
        loadAdminsPendentes();
      } catch (error: any) {
        const message = error.response?.data?.detail || 'Erro ao rejeitar admin';
        alert(message);
      }
    }
  };

  const handleCreateCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await clienteService.criar(formData);
      setFormData({ nome: '', email: '', senha: '', telefone: '' });
      setShowForm(false);
      loadClientes();
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Erro ao criar cliente';
      alert(message);
      console.error('Erro ao criar cliente:', error);
    }
  };

  const handleDeleteCliente = async (id: number) => {
    if (window.confirm('Tem certeza que deseja deletar este cliente?')) {
      try {
        await clienteService.deletar(id);
        loadClientes();
      } catch (error) {
        console.error('Erro ao deletar cliente:', error);
      }
    }
  };

  const loadLotes = async () => {
    try {
      const response = await loteService.listar();
      const lotesAtivos = response.data.filter((lote: any) => !lote.arquivado);
      setLotes(lotesAtivos);
      
      // Verificar se algum lote não tem número (precisa migrar)
      const precisaMigrar = response.data.some((lote: any) => !lote.numero_lote || !lote.numero_lote.startsWith('#'));
      setShowMigrarButton(precisaMigrar);
      
      // Carregar lotes arquivados
      const arquivadosResponse = await loteService.listarArquivados();
      setLotesArquivados(arquivadosResponse.data);
    } catch (error) {
      console.error('Erro ao carregar lotes:', error);
    }
  };

  const loadVendasLote = async (loteId: number) => {
    try {
      const response = await loteService.listarVendas(loteId);
      setVendasLote(response.data);
    } catch (error) {
      console.error('Erro ao carregar vendas:', error);
    }
  };

  const handleSelectLote = async (lote: any) => {
    setSelectedLote(lote);
    await loadVendasLote(lote.id);
  };

  const handleCreateLote = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await loteService.criar(loteFormData);
      setLoteFormData({ numero_lote: '', nome: '', descricao: '', foto: '', status_lote: '' });
      setShowLoteForm(false);
      loadLotes();
    } catch (error) {
      console.error('Erro ao criar lote:', error);
    }
  };

  const handleMigrarLotes = async () => {
    if (window.confirm('Tem certeza que deseja migrar todos os lotes existentes para numeração automática?')) {
      try {
        await loteService.migrar();
        loadLotes();
        alert('Lotes migrados com sucesso!');
      } catch (error) {
        console.error('Erro ao migrar lotes:', error);
        alert('Erro ao migrar lotes');
      }
    }
  };

  const handleDesarquivarLote = async (loteId: number) => {
    try {
      await loteService.desarquivar(loteId);
      loadLotes();
      alert('Lote desarquivado com sucesso!');
    } catch (error) {
      console.error('Erro ao desarquivar lote:', error);
    }
  };

  const handleBuscaClientes = async (termo: string) => {
    setBuscaCliente(termo);
    if (termo.length > 2) {
      try {
        const response = await loteService.buscarClientes(termo);
        setResultadosBusca(response.data);
      } catch (error) {
        console.error('Erro ao buscar clientes:', error);
      }
    } else {
      setResultadosBusca([]);
    }
  };

  const handleDeleteLote = async (id: number) => {
    if (window.confirm('Tem certeza que deseja deletar este lote e todas as vendas associadas?')) {
      try {
        await loteService.deletar(id);
        if (selectedLote?.id === id) {
          setSelectedLote(null);
          setVendasLote([]);
        }
        loadLotes();
      } catch (error) {
        console.error('Erro ao deletar lote:', error);
      }
    }
  };

  const handleCreateVenda = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLote) return;
    try {
      await loteService.criarVenda({
        lote_id: selectedLote.id,
        cliente_id: parseInt(vendaFormData.cliente_id),
        carrinhos_comprados: vendaFormData.carrinhos_comprados,
        preco: parseFloat(vendaFormData.preco),
        pago: vendaFormData.pago,
        data_pagamento: vendaFormData.data_pagamento || null,
        observacoes: vendaFormData.observacoes || null,
        comprovante_pagamento: vendaFormData.comprovante_pagamento || null,
      });
      setVendaFormData({
        cliente_id: '', carrinhos_comprados: '', preco: '', pago: false,
        comprovante_pagamento: '', data_pagamento: '', observacoes: ''
      });
      setShowVendaForm(false);
      loadVendasLote(selectedLote.id);
      loadLotes();
    } catch (error) {
      console.error('Erro ao criar venda:', error);
    }
  };

  const handleTogglePago = async (venda: any) => {
    try {
      await loteService.atualizarVenda(venda.id, {
        pago: !venda.pago,
        data_pagamento: !venda.pago ? new Date().toISOString() : null
      });
      if (selectedLote) loadVendasLote(selectedLote.id);
    } catch (error) {
      console.error('Erro ao atualizar pagamento:', error);
    }
  };

  const handleDeleteVenda = async (vendaId: number) => {
    if (window.confirm('Tem certeza que deseja deletar esta venda?')) {
      try {
        await loteService.deletarVenda(vendaId);
        if (selectedLote) loadVendasLote(selectedLote.id);
        loadLotes();
      } catch (error) {
        console.error('Erro ao deletar venda:', error);
      }
    }
  };

  const handleLoteFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        setLoteFormData({ ...loteFormData, foto: base64 });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleComprovante = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        setVendaFormData({ ...vendaFormData, comprovante_pagamento: base64 });
      };
      reader.readAsDataURL(file);
    }
  };

  const statusEntregaOptions = [
    { value: 'aguardando_pagamento', label: 'Aguardando Pagamento', color: 'bg-gray-100 text-gray-700' },
    { value: 'pago', label: 'Pago', color: 'bg-yellow-100 text-yellow-700' },
    { value: 'chegou_eua', label: 'Chegou EUA', color: 'bg-blue-100 text-blue-700' },
    { value: 'importado_brasil', label: 'Importado p/ Brasil', color: 'bg-indigo-100 text-indigo-700' },
    { value: 'alfandega', label: 'Alfândega/Tributação', color: 'bg-orange-100 text-orange-700' },
    { value: 'centro_distribuicao', label: 'Centro Distribuição', color: 'bg-green-100 text-green-700' },
    { value: 'entregue', label: 'Entregue', color: 'bg-emerald-100 text-emerald-700' },
  ];

  const handleChangeStatusEntrega = async (vendaId: number, novoStatus: string) => {
    try {
      await loteService.atualizarVenda(vendaId, { status_entrega: novoStatus });
      if (selectedLote) loadVendasLote(selectedLote.id);
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  const loadFotosGaragem = async (clienteId: number) => {
    try {
      const response = await garagemService.listarFotos(clienteId);
      setFotosGaragem(response.data);
    } catch (error) {
      console.error('Erro ao carregar fotos:', error);
    }
  };

  const loadSolicitacoes = async () => {
    try {
      const response = await garagemService.listarTodasSolicitacoes();
      setSolicitacoes(response.data);
    } catch (error) {
      console.error('Erro ao carregar solicitações:', error);
    }
  };

  const handleSelectClienteGaragem = async (cliente: any) => {
    setSelectedClienteGaragem(cliente);
    await loadFotosGaragem(cliente.id);
  };

  const handleAddFotoGaragem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClienteGaragem) return;
    setSavingFoto(true);
    try {
      await garagemService.adicionarFoto({
        cliente_id: selectedClienteGaragem.id,
        foto: fotoFormData.foto,
        descricao: fotoFormData.descricao || null
      });
      setFotoFormData({ foto: '', descricao: '' });
      setShowFotoForm(false);
      loadFotosGaragem(selectedClienteGaragem.id);
      alert('Foto adicionada com sucesso!');
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Erro ao adicionar foto';
      alert(message);
      console.error('Erro ao adicionar foto:', error);
    } finally {
      setSavingFoto(false);
    }
  };

  const handleDeleteFotoGaragem = async (fotoId: number) => {
    if (window.confirm('Deletar esta foto?')) {
      try {
        await garagemService.deletarFoto(fotoId);
        if (selectedClienteGaragem) loadFotosGaragem(selectedClienteGaragem.id);
      } catch (error) {
        console.error('Erro ao deletar foto:', error);
      }
    }
  };

  const handleFotoGaragemFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        setFotoFormData({ ...fotoFormData, foto: base64 });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateSolicitacao = async (solId: number, novoStatus: string, codigoRastreio?: string) => {
    try {
      const dados: any = { status: novoStatus };
      if (codigoRastreio !== undefined) dados.codigo_rastreio = codigoRastreio;
      await garagemService.atualizarSolicitacao(solId, dados);
      loadSolicitacoes();
    } catch (error) {
      console.error('Erro ao atualizar solicitação:', error);
    }
  };

  const handleEnviarComRastreio = async (sol: any) => {
    const itensNaoPagos = (sol.itens || []).filter((i: any) => !i.pago);
    if (itensNaoPagos.length > 0) {
      const nomes = itensNaoPagos.map((i: any) => `• ${i.carrinhos_comprados} (R$ ${i.preco.toFixed(2)})`).join('\n');
      const confirmar = window.confirm(
        `⚠️ ATENÇÃO: Este cliente possui ${itensNaoPagos.length} item(ns) NÃO PAGO(S) na garagem:\n\n${nomes}\n\nDeseja enviar mesmo assim?`
      );
      if (!confirmar) return;
    }
    const codigo = prompt('Digite o código de rastreio:');
    if (codigo !== null && codigo.trim() !== '') {
      await handleUpdateSolicitacao(sol.id, 'enviado', codigo.trim());
    }
  };

  const handleSalvarRastreio = async (solId: number) => {
    const codigo = prompt('Digite/atualize o código de rastreio:');
    if (codigo !== null && codigo.trim() !== '') {
      try {
        await garagemService.atualizarSolicitacao(solId, { codigo_rastreio: codigo.trim() });
        loadSolicitacoes();
      } catch (error) {
        console.error('Erro ao salvar rastreio:', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <nav className="bg-gradient-to-r from-red-700 via-red-600 to-orange-500 text-white p-3 md:p-4 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-2 md:gap-3">
          <span className="text-2xl md:text-3xl">🏎️</span>
          <div className="flex flex-col">
            {empresa && (
              <span className="text-lg md:text-2xl font-extrabold tracking-wider uppercase leading-none">
                {empresa.nome}
              </span>
            )}
            <span className="text-xs md:text-sm font-medium text-white/70 leading-tight">
              GarageSales
            </span>
          </div>
          <span className="text-xs bg-black/30 px-2 py-1 rounded font-mono hidden sm:inline">ADMIN</span>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <span className="text-xs md:text-sm opacity-90 hidden sm:inline">{user?.email}</span>
          <button
            onClick={logout}
            className="flex items-center gap-1 md:gap-2 bg-black/30 hover:bg-black/50 px-3 py-2 rounded transition text-sm"
          >
            <LogOut size={18} />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </nav>

      <div className="flex flex-col md:flex-row">
        <div className="md:w-52 bg-gray-800 shadow-lg md:min-h-screen border-b md:border-b-0 md:border-r border-gray-700">
          <div className="p-2 md:p-4 flex md:flex-col md:space-y-2 gap-1 md:gap-0 overflow-x-auto">
            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-0 md:mb-3 px-3 hidden md:block">Navegação</p>
            <button
              onClick={() => setActiveTab('clientes')}
              className={`flex items-center gap-2 p-2 md:p-3 rounded font-semibold transition whitespace-nowrap text-sm md:text-base md:w-full ${
                activeTab === 'clientes' ? 'bg-red-600 text-white shadow-md' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <Users size={18} />
              Clientes
            </button>
            <button
              onClick={() => { setActiveTab('vendas'); loadLotes(); }}
              className={`flex items-center gap-2 p-2 md:p-3 rounded font-semibold transition whitespace-nowrap text-sm md:text-base md:w-full ${
                activeTab === 'vendas' ? 'bg-red-600 text-white shadow-md' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <ShoppingBag size={18} />
              Vendas
            </button>
            <button
              onClick={() => { if (canViewGaragem()) { setActiveTab('garagem'); loadSolicitacoes(); } }}
              disabled={!canViewGaragem()}
              title={!canViewGaragem() ? 'Você não tem permissão para acessar garagem' : ''}
              className={`flex items-center gap-2 p-2 md:p-3 rounded font-semibold transition whitespace-nowrap text-sm md:text-base md:w-full ${
                !canViewGaragem() 
                  ? 'text-gray-600 cursor-not-allowed opacity-50' 
                  : activeTab === 'garagem' ? 'bg-red-600 text-white shadow-md' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <Warehouse size={18} />
              Garagem
            </button>
            <button
              onClick={() => { setActiveTab('admins'); loadAdminsPendentes(); }}
              className={`flex items-center gap-2 p-2 md:p-3 rounded font-semibold transition whitespace-nowrap text-sm md:text-base md:w-full ${
                activeTab === 'admins' ? 'bg-red-600 text-white shadow-md' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <Shield size={18} />
              Admins Pendentes
              {adminsPendentes.length > 0 && (
                <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                  {adminsPendentes.length}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="flex-1 p-4 md:p-8">
          {activeTab === 'clientes' && (
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl md:text-3xl font-extrabold text-white uppercase tracking-wide">Clientes</h2>
                  <span className="bg-red-600/20 text-red-400 px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-semibold border border-red-600/30">
                    {clientes.length} cadastrado{clientes.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 items-center w-full sm:w-auto">
                  <div className="relative flex-1 sm:flex-none">
                    <input
                      type="text"
                      placeholder="Buscar..."
                      value={buscaCliente}
                      onChange={(e) => handleBuscaClientes(e.target.value)}
                      className="bg-gray-700 border border-gray-600 rounded px-3 py-2 pl-10 text-white placeholder-gray-400 focus:border-red-500 focus:outline-none w-full sm:w-80"
                    />
                    <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
                    {resultadosBusca.length > 0 && buscaCliente.length > 2 && (
                      <div className="absolute top-full mt-1 w-full bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                        {resultadosBusca.map((cliente) => (
                          <div
                            key={cliente.id}
                            className="p-3 hover:bg-gray-700 cursor-pointer border-b border-gray-600 last:border-b-0"
                            onClick={() => {
                              setBuscaCliente('');
                              setResultadosBusca([]);
                              // Opcional: selecionar cliente ou fazer alguma ação
                            }}
                          >
                            <div className="text-white font-medium">{cliente.nome}</div>
                            <div className="text-gray-400 text-sm">{cliente.email}</div>
                            {cliente.telefone && (
                              <div className="text-gray-500 text-xs">{cliente.telefone}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={loadClientes}
                    disabled={loading}
                    className="flex items-center gap-2 bg-gray-700 text-gray-200 px-4 py-2 rounded hover:bg-gray-600 disabled:opacity-50 transition"
                  >
                    <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    Atualizar
                  </button>
                  <button
                    onClick={() => canCreateCliente() && setShowForm(!showForm)}
                    disabled={!canCreateCliente()}
                    title={!canCreateCliente() ? 'Você não tem permissão para criar clientes' : ''}
                    className={`px-4 py-2 rounded font-semibold transition ${
                      canCreateCliente()
                        ? 'bg-red-600 text-white hover:bg-red-700 cursor-pointer'
                        : 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'
                    }`}
                  >
                    {showForm ? 'Cancelar' : 'Novo Cliente'}
                  </button>
                </div>
              </div>

              {showForm && (
                <form onSubmit={handleCreateCliente} className="bg-gray-800 p-4 md:p-6 rounded-lg shadow-lg mb-6 border border-gray-700">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Nome"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-red-500 focus:outline-none"
                      required
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-red-500 focus:outline-none"
                      required
                    />
                    <input
                      type="password"
                      placeholder="Senha"
                      value={formData.senha}
                      onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                      className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-red-500 focus:outline-none"
                      required
                    />
                    <input
                      type="tel"
                      placeholder="Telefone"
                      value={formData.telefone}
                      onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                      className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-red-500 focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 font-semibold transition"
                  >
                    Criar Cliente
                  </button>
                </form>
              )}

              {loading && clientes.length === 0 ? (
                <div className="bg-gray-800 rounded-lg shadow p-8 text-center text-gray-400 border border-gray-700">
                  <RefreshCw size={32} className="animate-spin mx-auto mb-4 text-red-500" />
                  Carregando clientes...
                </div>
              ) : clientes.length === 0 ? (
                <div className="bg-gray-800 rounded-lg shadow p-8 text-center text-gray-400 border border-gray-700">
                  <Users size={48} className="mx-auto mb-4 text-gray-600" />
                  <p className="text-lg">Nenhum cliente cadastrado ainda</p>
                  <p className="text-sm mt-2 text-gray-500">Clientes que se registrarem aparecerão aqui automaticamente</p>
                </div>
              ) : (
                <div className="bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-700 overflow-x-auto">
                  <table className="w-full min-w-[600px]">
                    <thead className="bg-gray-900/50">
                      <tr>
                        <th className="px-3 md:px-6 py-3 text-left text-gray-400 uppercase text-xs font-bold tracking-wider">Nome</th>
                        <th className="px-3 md:px-6 py-3 text-left text-gray-400 uppercase text-xs font-bold tracking-wider">Email</th>
                        <th className="px-3 md:px-6 py-3 text-left text-gray-400 uppercase text-xs font-bold tracking-wider hidden sm:table-cell">Telefone</th>
                        <th className="px-3 md:px-6 py-3 text-left text-gray-400 uppercase text-xs font-bold tracking-wider hidden md:table-cell">Role</th>
                        <th className="px-3 md:px-6 py-3 text-left text-gray-400 uppercase text-xs font-bold tracking-wider hidden md:table-cell">Data Cadastro</th>
                        <th className="px-3 md:px-6 py-3 text-left text-gray-400 uppercase text-xs font-bold tracking-wider">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientes.map((cliente) => (
                        <tr key={cliente.id} className={`border-t border-gray-700 hover:bg-gray-700/50 transition ${cliente.role !== 'cliente' ? 'bg-gray-700/20' : ''}`}>
                          <td className="px-3 md:px-6 py-3 text-white font-medium">
                            <div className="flex items-center gap-2">
                              {cliente.nome}
                              {cliente.role !== 'cliente' && (
                                <span className={`text-xs px-2 py-1 rounded font-semibold ${
                                  cliente.role === 'admin_master' 
                                    ? 'bg-purple-600/30 text-purple-300 border border-purple-600/50' 
                                    : 'bg-orange-600/30 text-orange-300 border border-orange-600/50'
                                }`}>
                                  {cliente.role === 'admin_master' ? 'Master' : 'Admin'}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 md:px-6 py-3 text-gray-300 text-sm">{cliente.email}</td>
                          <td className="px-3 md:px-6 py-3 text-gray-300 hidden sm:table-cell">{cliente.telefone || '-'}</td>
                          <td className="px-3 md:px-6 py-3 text-gray-400 text-sm hidden md:table-cell">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${
                              cliente.role === 'admin_master' 
                                ? 'bg-purple-600/20 text-purple-400 border border-purple-600/30' 
                                : cliente.role === 'admin'
                                ? 'bg-orange-600/20 text-orange-400 border border-orange-600/30'
                                : 'bg-gray-600/20 text-gray-400 border border-gray-600/30'
                            }`}>
                              {cliente.role === 'admin_master' ? 'Admin Master' : cliente.role === 'admin' ? 'Admin' : 'Cliente'}
                            </span>
                          </td>
                          <td className="px-3 md:px-6 py-3 text-gray-400 text-sm hidden md:table-cell">{new Date(cliente.data_cadastro).toLocaleString('pt-BR')}</td>
                          <td className="px-3 md:px-6 py-3">
                            <div className="flex gap-2">
                              {(user?.role === 'admin_master' || canManagePermissions()) && cliente.role !== 'cliente' && (
                                <button
                                  onClick={() => {
                                    setSelectedAdminForPerms(cliente);
                                    setShowPermissionsModal(true);
                                  }}
                                  className="text-blue-500 hover:text-blue-400 transition"
                                  title="Editar permissões"
                                >
                                  <Settings size={16} />
                                </button>
                              )}
                              <button
                                onClick={() => canDeleteCliente() && handleDeleteCliente(cliente.id)}
                                disabled={!canDeleteCliente()}
                                title={!canDeleteCliente() ? 'Você não tem permissão para deletar clientes' : ''}
                                className={`transition ${
                                  canDeleteCliente()
                                    ? 'text-red-500 hover:text-red-400 cursor-pointer'
                                    : 'text-gray-600 cursor-not-allowed opacity-50'
                                }`}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'vendas' && (
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl md:text-3xl font-extrabold text-white uppercase tracking-wide">Vendas / Lotes</h2>
                  <span className="bg-orange-600/20 text-orange-400 px-3 py-1 rounded-full text-sm font-semibold border border-orange-600/30">
                    {lotes.length} lote{lotes.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button onClick={loadLotes} className="flex items-center gap-2 bg-gray-700 text-gray-200 px-4 py-2 rounded hover:bg-gray-600 transition">
                    <RefreshCw size={18} />
                    Atualizar
                  </button>
                  <button 
                    onClick={() => canCreateLote() && setShowLoteForm(!showLoteForm)} 
                    disabled={!canCreateLote()}
                    title={!canCreateLote() ? 'Você não tem permissão para criar lotes' : ''}
                    className={`flex items-center gap-2 px-4 py-2 rounded font-semibold transition ${
                      canCreateLote() 
                        ? 'bg-red-600 text-white hover:bg-red-700 cursor-pointer' 
                        : 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'
                    }`}>
                    <Plus size={18} />
                    {showLoteForm ? 'Cancelar' : 'Novo Lote'}
                  </button>
                  {showMigrarButton && (
                    <button onClick={handleMigrarLotes} className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 font-semibold transition">
                      <RefreshCw size={18} />
                      Migrar Lotes
                    </button>
                  )}
                </div>
              </div>

              {showLoteForm && (
                <form onSubmit={handleCreateLote} className="bg-gray-800 p-4 md:p-6 rounded-lg shadow-lg mb-6 border border-gray-700">
                  <h3 className="text-lg font-bold mb-4 text-white">Cadastrar Novo Lote</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Número do Lote (opcional)</label>
                      <input type="text" placeholder="#001, #002, etc." value={loteFormData.numero_lote}
                        onChange={(e) => setLoteFormData({ ...loteFormData, numero_lote: e.target.value })}
                        className="bg-gray-700 border border-gray-600 rounded px-3 py-2 w-full text-white placeholder-gray-400 focus:border-red-500 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Nome do Lote</label>
                      <input type="text" placeholder="Nome do lote" value={loteFormData.nome}
                        onChange={(e) => setLoteFormData({ ...loteFormData, nome: e.target.value })}
                        className="bg-gray-700 border border-gray-600 rounded px-3 py-2 w-full text-white placeholder-gray-400 focus:border-red-500 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Status do Lote (opcional)</label>
                      <select value={loteFormData.status_lote}
                        onChange={(e) => setLoteFormData({ ...loteFormData, status_lote: e.target.value })}
                        className="bg-gray-700 border border-gray-600 rounded px-3 py-2 w-full text-white focus:border-red-500 focus:outline-none">
                        <option value="">Selecione um status</option>
                        <option value="Chegou EUA">Chegou EUA</option>
                        <option value="Importado Brasil">Importado Brasil</option>
                        <option value="Alfandega/Tributação">Alfandega/Tributação</option>
                        <option value="Centro Distribuição">Centro Distribuição</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Foto do Lote</label>
                      <input type="file" accept="image/*" onChange={handleLoteFoto} className="bg-gray-700 border border-gray-600 rounded px-3 py-2 w-full text-gray-300 text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Descrição do Lote</label>
                      <textarea placeholder="Descrição do lote" value={loteFormData.descricao}
                        onChange={(e) => setLoteFormData({ ...loteFormData, descricao: e.target.value })}
                        className="bg-gray-700 border border-gray-600 rounded px-3 py-2 w-full text-white placeholder-gray-400 focus:border-red-500 focus:outline-none" rows={3} />
                    </div>
                  </div>
                  <button type="submit" className="mt-4 w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 font-semibold transition">
                    Criar Lote
                  </button>
                </form>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {lotes.map((lote) => (
                  <div key={lote.id}
                    onClick={() => handleSelectLote(lote)}
                    className={`bg-gray-800 rounded-lg p-4 cursor-pointer transition hover:shadow-xl border-2 ${
                      selectedLote?.id === lote.id ? 'border-red-500 shadow-red-500/20 shadow-lg' : 'border-gray-700 hover:border-gray-500'
                    }`}>
                    {lote.foto ? (
                      <img src={`data:image/jpeg;base64,${lote.foto}`} alt={lote.nome}
                        className="w-full h-48 object-contain rounded mb-3 bg-gray-900" />
                    ) : (
                      <div className="w-full h-32 bg-gray-700 rounded mb-3 flex items-center justify-center">
                        <Image size={32} className="text-gray-500" />
                      </div>
                    )}
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-lg text-white">{lote.numero_lote || lote.nome}</h3>
                          {lote.status_lote && (
                            <span className="text-xs bg-blue-600/20 text-blue-400 px-2 py-1 rounded border border-blue-600/30">
                              {lote.status_lote}
                            </span>
                          )}
                        </div>
                        {lote.descricao && <p className="text-sm text-gray-400 mt-1">{lote.descricao}</p>}
                        <p className="text-sm text-gray-500 mt-1">{new Date(lote.data_criacao).toLocaleDateString('pt-BR')}</p>
                        
                        {/* Indicadores Financeiros */}
                        <div className="mt-2 space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-400">Pagamentos:</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-green-400">{lote.vendas_pagas || 0} pago</span>
                              <span className="text-xs text-red-400">{lote.vendas_nao_pagas || lote.total_vendas || 0} pendente</span>
                            </div>
                          </div>
                          {lote.percentual_pago === 100 && (
                            <span className="text-xs bg-green-600/20 text-green-400 px-2 py-1 rounded border border-green-600/30 inline-block">
                              100% PAGO
                            </span>
                          )}
                          
                          {/* Indicadores de Entrega */}
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-400">Entregas:</span>
                            <span className="text-xs text-blue-400">{lote.vendas_entregues || 0}/{lote.total_vendas || 0}</span>
                          </div>
                          {lote.percentual_entregue === 100 && (
                            <span className="text-xs bg-blue-600/20 text-blue-400 px-2 py-1 rounded border border-blue-600/30 inline-block">
                              100% ENTREGUE
                            </span>
                          )}
                          
                          {/* Se 100% pago e 100% entregue, mostrar badge de arquivável */}
                          {lote.percentual_pago === 100 && lote.percentual_entregue === 100 && (
                            <span className="text-xs bg-yellow-600/20 text-yellow-400 px-2 py-1 rounded border border-yellow-600/30 inline-block">
                              PRONTO PARA ARQUIVAR
                            </span>
                          )}
                        </div>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); canDeleteLote() && handleDeleteLote(lote.id); }}
                        disabled={!canDeleteLote()}
                        title={!canDeleteLote() ? 'Você não tem permissão para deletar lotes' : ''}
                        className={`p-1 transition ${
                          canDeleteLote() 
                            ? 'text-red-500 hover:text-red-400 cursor-pointer' 
                            : 'text-gray-600 cursor-not-allowed opacity-50'
                        }`}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Seção de Lotes Arquivados */}
              {lotesArquivados.length > 0 && (
                <div className="mt-8">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h2 className="text-lg md:text-2xl font-bold text-white flex items-center gap-2">
                        <Archive size={20} className="text-gray-400" />
                        Lotes Arquivados
                      </h2>
                      <span className="bg-gray-600/20 text-gray-400 px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-semibold border border-gray-600/30">
                        {lotesArquivados.length} arquivado{lotesArquivados.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <span className="text-sm text-gray-300">Mostrar arquivados</span>
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={mostrarArquivados}
                            onChange={(e) => setMostrarArquivados(e.target.checked)}
                            className="sr-only"
                          />
                          <div className={`block w-14 h-8 rounded-full transition-colors ${
                            mostrarArquivados ? 'bg-yellow-600' : 'bg-gray-600'
                          }`}></div>
                          <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${
                            mostrarArquivados ? 'translate-x-6' : 'translate-x-0'
                          }`}></div>
                        </div>
                      </label>
                    </div>
                  </div>
                  {mostrarArquivados && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {lotesArquivados.map((lote) => (
                      <div key={lote.id} 
                        onClick={() => handleSelectLote(lote)}
                        className={`bg-gray-900/50 rounded-lg p-4 cursor-pointer transition hover:shadow-xl border-2 opacity-75 ${
                          selectedLote?.id === lote.id ? 'border-yellow-500 shadow-yellow-500/20 shadow-lg' : 'border-gray-700 hover:border-gray-500'
                        }`}>
                        {lote.foto ? (
                          <img src={`data:image/jpeg;base64,${lote.foto}`} alt={lote.numero_lote}
                            className="w-full h-48 object-contain rounded mb-3 grayscale bg-gray-900" />
                        ) : (
                          <div className="w-full h-32 bg-gray-800 rounded mb-3 flex items-center justify-center">
                            <Archive size={32} className="text-gray-600" />
                          </div>
                        )}
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-lg text-gray-300">{lote.numero_lote}</h3>
                              <span className="text-xs bg-green-600/20 text-green-400 px-2 py-1 rounded border border-green-600/30">
                                100% PAGO
                              </span>
                              <span className="text-xs bg-blue-600/20 text-blue-400 px-2 py-1 rounded border border-blue-600/30">
                                100% ENTREGUE
                              </span>
                            </div>
                            {lote.descricao && <p className="text-sm text-gray-500 mt-1">{lote.descricao}</p>}
                            <p className="text-sm text-gray-600 mt-1">{new Date(lote.data_criacao).toLocaleDateString('pt-BR')}</p>
                            <div className="mt-2">
                              <span className="text-xs text-gray-500">{lote.total_vendas} vendas concluídas</span>
                            </div>
                          </div>
                          <button onClick={() => handleDesarquivarLote(lote.id)}
                            className="text-yellow-500 hover:text-yellow-400 p-1 transition"
                            title="Desarquivar lote">
                            <RefreshCw size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                    </div>
                  )}
                </div>
              )}

              {selectedLote && (
                <div className="bg-gray-800 rounded-lg shadow-lg p-4 md:p-6 border border-gray-700 mt-8">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-lg md:text-xl font-bold text-white">Vendas - {selectedLote.nome}</h3>
                      {selectedLote.arquivado && (
                        <span className="bg-yellow-600/20 text-yellow-400 px-3 py-1 rounded-full text-sm font-semibold border border-yellow-600/30">
                          <Archive size={16} className="inline mr-1" />
                          Arquivado
                        </span>
                      )}
                    </div>
                    <button onClick={() => setShowVendaForm(!showVendaForm)}
                      className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 font-semibold transition">
                      <Plus size={18} />
                      {showVendaForm ? 'Cancelar' : 'Adicionar Venda'}
                    </button>
                  </div>

                  {showVendaForm && (
                    <form onSubmit={handleCreateVenda} className="bg-gray-900/50 p-4 rounded-lg mb-4 border border-gray-600">
                      <h4 className="font-semibold mb-3 text-white">Nova Venda</h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm text-gray-400 mb-1">Cliente</label>
                          <select value={vendaFormData.cliente_id}
                            onChange={(e) => setVendaFormData({ ...vendaFormData, cliente_id: e.target.value })}
                            className="bg-gray-700 border border-gray-600 rounded px-3 py-2 w-full text-white focus:border-red-500 focus:outline-none" required>
                            <option value="">Selecione o Cliente</option>
                            {clientes.map((c) => (
                              <option key={c.id} value={c.id}>{c.nome} ({c.email})</option>
                            ))}
                          </select>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm text-gray-400 mb-1">Preço (R$)</label>
                            <input type="number" step="0.01" placeholder="0.00" value={vendaFormData.preco}
                              onChange={(e) => setVendaFormData({ ...vendaFormData, preco: e.target.value })}
                              className="bg-gray-700 border border-gray-600 rounded px-3 py-2 w-full text-white placeholder-gray-400 focus:border-red-500 focus:outline-none" required />
                          </div>
                          <div className="flex items-center gap-2 mt-6">
                            <input type="checkbox" id="pago" checked={vendaFormData.pago}
                              onChange={(e) => setVendaFormData({ ...vendaFormData, pago: e.target.checked })}
                              className="w-4 h-4 accent-red-600" />
                            <label htmlFor="pago" className="text-sm text-gray-300">Já foi pago?</label>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm text-gray-400 mb-1">Carrinhos comprados</label>
                          <textarea placeholder="Ex: Hot Wheels Camaro, Matchbox Fusca" value={vendaFormData.carrinhos_comprados}
                            onChange={(e) => setVendaFormData({ ...vendaFormData, carrinhos_comprados: e.target.value })}
                            className="bg-gray-700 border border-gray-600 rounded px-3 py-2 w-full text-white placeholder-gray-400 focus:border-red-500 focus:outline-none" rows={2} required />
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm text-gray-400 mb-1">Data do Pagamento</label>
                            <input type="datetime-local" value={vendaFormData.data_pagamento}
                              onChange={(e) => setVendaFormData({ ...vendaFormData, data_pagamento: e.target.value })}
                              className="bg-gray-700 border border-gray-600 rounded px-3 py-2 w-full text-white focus:border-red-500 focus:outline-none" />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-400 mb-1">Comprovante de Pagamento</label>
                            <input type="file" accept="image/*" onChange={handleComprovante} className="bg-gray-700 border border-gray-600 rounded px-3 py-2 w-full text-gray-300 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-red-600 file:text-white hover:file:bg-red-700" />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm text-gray-400 mb-1">Observações</label>
                          <textarea placeholder="Informações adicionais (opcional)" value={vendaFormData.observacoes}
                            onChange={(e) => setVendaFormData({ ...vendaFormData, observacoes: e.target.value })}
                            className="bg-gray-700 border border-gray-600 rounded px-3 py-2 w-full text-white placeholder-gray-400 focus:border-red-500 focus:outline-none" rows={2} />
                        </div>
                      </div>
                      <button type="submit" className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 font-semibold transition w-full sm:w-auto">
                        Salvar Venda
                      </button>
                    </form>
                  )}

                  {vendasLote.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      <ShoppingBag size={48} className="mx-auto mb-3 text-gray-600" />
                      <p>Nenhuma venda neste lote ainda</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px]">
                      <thead className="bg-gray-900/50">
                        <tr>
                          <th className="px-3 py-2 text-left text-gray-400 uppercase text-xs font-bold tracking-wider">Cliente</th>
                          <th className="px-3 py-2 text-left text-gray-400 uppercase text-xs font-bold tracking-wider">Carrinhos</th>
                          <th className="px-3 py-2 text-left text-gray-400 uppercase text-xs font-bold tracking-wider">Preço</th>
                          <th className="px-3 py-2 text-left text-gray-400 uppercase text-xs font-bold tracking-wider">Pago</th>
                          <th className="px-3 py-2 text-left text-gray-400 uppercase text-xs font-bold tracking-wider">Data Pgto</th>
                          <th className="px-3 py-2 text-left text-gray-400 uppercase text-xs font-bold tracking-wider">Comprov.</th>
                          <th className="px-3 py-2 text-left text-gray-400 uppercase text-xs font-bold tracking-wider">Entrega</th>
                          <th className="px-3 py-2 text-left text-gray-400 uppercase text-xs font-bold tracking-wider">Obs</th>
                          <th className="px-3 py-2 text-left text-gray-400 uppercase text-xs font-bold tracking-wider">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vendasLote.map((venda) => (
                          <tr key={venda.id} className="border-t border-gray-700 hover:bg-gray-700/50 transition">
                            <td className="px-4 py-2 font-medium text-white">{venda.cliente_nome}</td>
                            <td className="px-4 py-2 text-sm max-w-xs truncate text-gray-300">{venda.carrinhos_comprados}</td>
                            <td className="px-4 py-2 font-semibold text-green-400">R$ {Number(venda.preco).toFixed(2)}</td>
                            <td className="px-4 py-2">
                              <button onClick={() => handleTogglePago(venda)}
                                className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${
                                  venda.pago ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                }`}>
                                {venda.pago ? <><Check size={14} /> Pago</> : <><X size={14} /> Pendente</>}
                              </button>
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-400">
                              {venda.data_pagamento ? new Date(venda.data_pagamento).toLocaleString('pt-BR') : '-'}
                            </td>
                            <td className="px-4 py-2">
                              {venda.comprovante_pagamento ? (
                                <button onClick={() => {
                                  const w = window.open('');
                                  w?.document.write(`<img src="data:image/jpeg;base64,${venda.comprovante_pagamento}" />`);
                                }} className="text-orange-400 hover:text-orange-300 flex items-center gap-1 text-sm transition">
                                  <Eye size={14} /> Ver
                                </button>
                              ) : <span className="text-gray-600">-</span>}
                            </td>
                            <td className="px-4 py-2">
                              <select value={venda.status_entrega || 'aguardando_pagamento'}
                                onChange={(e) => handleChangeStatusEntrega(venda.id, e.target.value)}
                                className={`text-xs font-semibold px-2 py-1 rounded border-0 cursor-pointer ${
                                  statusEntregaOptions.find(o => o.value === venda.status_entrega)?.color || 'bg-gray-100 text-gray-700'
                                }`}>
                                {statusEntregaOptions.map((opt) => (
                                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                              </select>
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-500 max-w-xs truncate">{venda.observacoes || '-'}</td>
                            <td className="px-4 py-2">
                              <button onClick={() => handleDeleteVenda(venda.id)} className="text-red-500 hover:text-red-400 transition">
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'garagem' && (
            <div>
              {!canViewGaragem() ? (
                <div className="bg-red-600/20 border border-red-600/30 rounded-lg p-8 text-center">
                  <Warehouse size={64} className="mx-auto mb-4 text-red-400" />
                  <h2 className="text-2xl font-bold text-red-400 mb-2">Acesso Negado</h2>
                  <p className="text-red-300">Você não tem permissão para acessar a garagem dos clientes.</p>
                  <p className="text-sm text-red-400 mt-2">Solicite ao Admin Master para habilitar essa permissão.</p>
                </div>
              ) : (
                <>
              <h2 className="text-xl md:text-3xl font-extrabold text-white uppercase tracking-wide mb-6">Garagem dos Clientes</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col h-full">
                  <h3 className="text-lg font-semibold mb-3 text-gray-300">Selecione um Cliente</h3>
                  <div className="bg-gray-800 rounded-lg shadow border border-gray-700 flex-1 overflow-y-auto max-h-[600px]">
                    {clientes.map((cliente) => (
                      <div key={cliente.id}
                        onClick={() => handleSelectClienteGaragem(cliente)}
                        className={`p-3 cursor-pointer border-b border-gray-700 transition ${
                          selectedClienteGaragem?.id === cliente.id ? 'bg-red-600/20 border-l-4 border-l-red-500' : 'hover:bg-gray-700/50'
                        }`}>
                        <p className="font-medium text-white">{cliente.nome}</p>
                        <p className="text-sm text-gray-400">{cliente.email}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col h-full">
                  {selectedClienteGaragem ? (
                    <div className="flex flex-col h-full">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-lg font-semibold text-white">Fotos - {selectedClienteGaragem.nome}</h3>
                        <button onClick={() => { if (canUploadFotoGaragem()) setShowFotoForm(!showFotoForm); }}
                          disabled={!canUploadFotoGaragem()}
                          title={!canUploadFotoGaragem() ? 'Você não tem permissão para fazer upload de fotos' : ''}
                          className={`flex items-center gap-2 px-3 py-2 rounded text-sm font-semibold transition ${
                            canUploadFotoGaragem()
                              ? 'bg-red-600 text-white hover:bg-red-700 cursor-pointer'
                              : 'bg-gray-700 text-gray-500 cursor-not-allowed opacity-50'
                          }`}>
                          <Plus size={16} />
                          {showFotoForm ? 'Cancelar' : 'Adicionar Foto'}
                        </button>
                      </div>

                      {showFotoForm && (
                        <form onSubmit={handleAddFotoGaragem} className="bg-gray-900/50 p-4 rounded-lg border border-gray-600 mb-4">
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm text-gray-400 mb-1">Foto</label>
                              <input type="file" accept="image/*" onChange={handleFotoGaragemFile}
                                disabled={!canUploadFotoGaragem()}
                                className="bg-gray-700 border border-gray-600 rounded px-3 py-2 w-full text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed" required />
                            </div>
                            <input type="text" placeholder="Descrição (opcional)" value={fotoFormData.descricao}
                              onChange={(e) => setFotoFormData({ ...fotoFormData, descricao: e.target.value })}
                              disabled={!canUploadFotoGaragem()}
                              className="bg-gray-700 border border-gray-600 rounded px-3 py-2 w-full text-white placeholder-gray-400 focus:border-red-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed" />
                            <button type="submit" className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={!fotoFormData.foto || !canUploadFotoGaragem() || savingFoto}>
                              {savingFoto ? 'Salvando...' : 'Salvar Foto'}
                            </button>
                          </div>
                        </form>
                      )}

                      {fotosGaragem.length === 0 ? (
                        <div className="bg-gray-800 rounded-lg shadow p-8 text-center text-gray-500 border border-gray-700 flex-1 flex items-center justify-center">
                          <Image size={48} className="mx-auto mb-3 text-gray-600" />
                          <p>Nenhuma foto na garagem deste cliente</p>
                        </div>
                      ) : (
                        <div className="flex-1 overflow-y-auto max-h-[600px]">
                          <div className="grid grid-cols-2 gap-3">
                            {fotosGaragem.map((foto) => (
                              <div key={foto.id} className="bg-gray-800 rounded-lg shadow overflow-hidden relative group border border-gray-700">
                                <img src={`data:image/jpeg;base64,${foto.foto}`} alt={foto.descricao || 'Foto garagem'}
                                  className="w-full h-40 object-cover" />
                                <div className="p-2">
                                  {foto.descricao && <p className="text-sm text-gray-300">{foto.descricao}</p>}
                                  <p className="text-xs text-gray-500">{new Date(foto.data_upload).toLocaleString('pt-BR')}</p>
                                </div>
                                <button onClick={() => { if (canEditGaragem()) handleDeleteFotoGaragem(foto.id); }}
                                  disabled={!canEditGaragem()}
                                  title={!canEditGaragem() ? 'Você não tem permissão para deletar fotos' : ''}
                                  className={`absolute top-2 right-2 p-1 rounded transition ${
                                    canEditGaragem()
                                      ? 'bg-red-600 text-white opacity-0 group-hover:opacity-100 cursor-pointer'
                                      : 'bg-gray-700 text-gray-500 opacity-50 cursor-not-allowed'
                                  }`}>
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-gray-800 rounded-lg shadow p-8 text-center text-gray-500 border border-gray-700 flex-1 flex items-center justify-center">
                      <Warehouse size={48} className="mx-auto mb-3 text-gray-600" />
                      <p>Selecione um cliente para gerenciar a garagem</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                  <h3 className="text-lg md:text-xl font-bold text-white">Solicitações de Envio</h3>
                  <button onClick={loadSolicitacoes} className="flex items-center gap-2 bg-gray-700 text-gray-200 px-3 py-2 rounded hover:bg-gray-600 text-sm transition">
                    <RefreshCw size={16} /> Atualizar
                  </button>
                </div>
                {solicitacoes.length === 0 ? (
                  <div className="bg-gray-800 rounded-lg shadow p-6 text-center text-gray-500 border border-gray-700">
                    <Send size={32} className="mx-auto mb-2 text-gray-600" />
                    <p>Nenhuma solicitação de envio pendente</p>
                  </div>
                ) : (
                  <div className="bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-700 overflow-x-auto">
                    <table className="w-full min-w-[600px]">
                      <thead className="bg-gray-900/50">
                        <tr>
                          <th className="px-3 py-2 text-left text-gray-400 uppercase text-xs font-bold tracking-wider">Cliente</th>
                          <th className="px-3 py-2 text-left text-gray-400 uppercase text-xs font-bold tracking-wider">Data</th>
                          <th className="px-3 py-2 text-left text-gray-400 uppercase text-xs font-bold tracking-wider">Status</th>
                          <th className="px-3 py-2 text-left text-gray-400 uppercase text-xs font-bold tracking-wider">Rastreio</th>
                          <th className="px-3 py-2 text-left text-gray-400 uppercase text-xs font-bold tracking-wider">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {solicitacoes.map((sol) => (
                          <tr key={sol.id} className="border-t border-gray-700 hover:bg-gray-700/50 transition">
                            <td className="px-4 py-2 font-medium text-white">{sol.cliente_nome}</td>
                            <td className="px-4 py-2 text-sm text-gray-400">{new Date(sol.data_solicitacao).toLocaleString('pt-BR')}</td>
                            <td className="px-4 py-2">
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                sol.status === 'pendente' ? 'bg-yellow-100 text-yellow-700' :
                                sol.status === 'enviado' ? 'bg-green-100 text-green-700' :
                                sol.status === 'entregue' ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {sol.status}
                              </span>
                            </td>
                            <td className="px-4 py-2">
                              {sol.codigo_rastreio ? (
                                <div className="flex items-center gap-1">
                                  <span className="text-sm font-mono bg-gray-700 text-orange-400 px-2 py-1 rounded">{sol.codigo_rastreio}</span>
                                  <button onClick={() => handleSalvarRastreio(sol.id)}
                                    className="text-xs text-orange-400 hover:text-orange-300 transition">✏️</button>
                                </div>
                              ) : (
                                <span className="text-xs text-gray-600">—</span>
                              )}
                            </td>
                            <td className="px-4 py-2">
                              <div className="flex gap-2">
                                {sol.status === 'pendente' && (
                                  <button onClick={() => handleEnviarComRastreio(sol)}
                                    className="text-xs bg-green-600/20 text-green-400 px-2 py-1 rounded hover:bg-green-600/30 border border-green-600/30 transition">
                                    Enviar + Rastreio
                                  </button>
                                )}
                                {sol.status === 'enviado' && (
                                  <>
                                    <button onClick={() => handleSalvarRastreio(sol.id)}
                                      className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded hover:bg-gray-600 transition">
                                      Editar Rastreio
                                    </button>
                                    <button onClick={() => handleUpdateSolicitacao(sol.id, 'entregue')}
                                      className="text-xs bg-blue-600/20 text-blue-400 px-2 py-1 rounded hover:bg-blue-600/30 border border-blue-600/30 transition">
                                      Entregue
                                    </button>
                                  </>
                                )}
                                {sol.status === 'entregue' && (
                                  <span className="text-xs text-gray-500">✅ Finalizado</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'admins' && (
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl md:text-3xl font-extrabold text-white uppercase tracking-wide">Admins Pendentes</h2>
                  <span className="bg-orange-600/20 text-orange-400 px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-semibold border border-orange-600/30">
                    {adminsPendentes.length} aguardando aprovação
                  </span>
                </div>
                <button onClick={loadAdminsPendentes} className="flex items-center gap-2 bg-gray-700 text-gray-200 px-4 py-2 rounded hover:bg-gray-600 transition">
                  <RefreshCw size={18} />
                  Atualizar
                </button>
              </div>

              {adminsPendentes.length === 0 ? (
                <div className="bg-gray-800 rounded-lg shadow p-8 text-center text-gray-500 border border-gray-700">
                  <Shield size={64} className="mx-auto mb-4 text-gray-600" />
                  <p className="text-lg">Nenhum admin pendente</p>
                  <p className="text-sm mt-2">Todos os admins estão aprovados e ativos</p>
                </div>
              ) : (
                <div className="bg-gray-800 rounded-lg shadow border border-gray-700 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-900/50 border-b border-gray-700">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Nome</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Email</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Telefone</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Tipo</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Data Cadastro</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700">
                        {adminsPendentes.map((admin) => (
                          <tr key={admin.id} className="hover:bg-gray-700/50 transition">
                            <td className="px-4 py-3">
                              <div>
                                <p className="font-medium text-white">{admin.nome}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-sm text-gray-300">{admin.email}</p>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-sm text-gray-300">{admin.telefone || 'Não informado'}</p>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                admin.role === 'admin_master' 
                                  ? 'bg-purple-600/20 text-purple-400 border border-purple-600/30' 
                                  : 'bg-orange-600/20 text-orange-400 border border-orange-600/30'
                              }`}>
                                {admin.role === 'admin_master' ? 'Admin Master' : 'Admin'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-sm text-gray-300">
                                {new Date(admin.data_cadastro).toLocaleDateString('pt-BR')}
                              </p>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleAprovarAdmin(admin.id)}
                                  className="flex items-center gap-1 text-xs bg-green-600/20 text-green-400 px-2 py-1 rounded hover:bg-green-600/30 border border-green-600/30 transition"
                                >
                                  <Check size={12} />
                                  Aprovar
                                </button>
                                <button
                                  onClick={() => handleRejeitarAdmin(admin.id)}
                                  className="flex items-center gap-1 text-xs bg-red-600/20 text-red-400 px-2 py-1 rounded hover:bg-red-600/30 border border-red-600/30 transition"
                                >
                                  <X size={12} />
                                  Rejeitar
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Permissions Modal */}
      {selectedAdminForPerms && (
        <PermissionsModal
          adminId={selectedAdminForPerms.id}
          adminNome={selectedAdminForPerms.nome}
          isOpen={showPermissionsModal}
          onClose={() => {
            setShowPermissionsModal(false);
            setSelectedAdminForPerms(null);
          }}
          onSave={() => {
            loadClientes();
          }}
        />
      )}
    </div>
  );
};
