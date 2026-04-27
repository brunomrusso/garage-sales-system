import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { usePermissions } from '../hooks/usePermissions';
import { useTenant } from '../contexts/TenantContext';
import { clienteService, loteService, garagemService } from '../services/api';
import { LogOut, Users, ShoppingBag, RefreshCw, Plus, Trash2, Eye, Check, X, Image, Warehouse, Send, Archive, Search, Shield, Settings, Receipt, Pencil, Save, MessageSquare, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { PermissionsModal } from '../components/PermissionsModal';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

export const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const { empresa, isModuloHabilitado } = useTenant();
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
  const [activeTab, setActiveTab] = useState<'clientes' | 'vendas' | 'garagem' | 'admins' | 'tributos' | 'faturamento'>('clientes');
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
  const [loteFormData, setLoteFormData] = useState({ numero_lote: '', nome: '', descricao: '', foto: '', status_lote: '', rastreio_importacao: '', custo: '' });
  const [vendaFormData, setVendaFormData] = useState({
    cliente_id: '', carrinhos_comprados: '', preco: '', pago: false,
    comprovante_pagamento: '', data_pagamento: '', observacoes: '', cotas: '1'
  });
  const [buscaCliente, setBuscaCliente] = useState('');
  const [resultadosBusca, setResultadosBusca] = useState<any[]>([]);
  const [showMigrarButton, setShowMigrarButton] = useState(false);

  const [selectedClienteGaragem, setSelectedClienteGaragem] = useState<any>(null);
  const [fotosGaragem, setFotosGaragem] = useState<any[]>([]);
  const [solicitacoes, setSolicitacoes] = useState<any[]>([]);
  const [showFotoForm, setShowFotoForm] = useState(false);
  const [fotoFormData, setFotoFormData] = useState({ foto: '', descricao: '' });

  // Tributos state
  const [tributos, setTributos] = useState<any[]>([]);
  const [mostrarTributosArquivados, setMostrarTributosArquivados] = useState(false);
  const [showTributoForm, setShowTributoForm] = useState(false);
  const [tributoFormData, setTributoFormData] = useState({ rastreio_importacao: '', valor_total_imposto: '', observacoes: '' });
  const [selectedTributo, setSelectedTributo] = useState<any>(null);
  const [vendasTributo, setVendasTributo] = useState<any[]>([]);
  const [editingTributo, setEditingTributo] = useState<any>(null);
  const [mensagemCobranca, setMensagemCobranca] = useState<{ tributo: any; texto: string } | null>(null);
  const [editingLote, setEditingLote] = useState(false);
  const [editLoteData, setEditLoteData] = useState({ nome: '', descricao: '', status_lote: '', rastreio_importacao: '', foto: '', custo: '' });
  const [savingFoto, setSavingFoto] = useState(false);

  // Faturamento state
  const [allVendas, setAllVendas] = useState<any[]>([]);
  const [allLotesFaturamento, setAllLotesFaturamento] = useState<any[]>([]);
  const [faturamentoPeriodo, setFaturamentoPeriodo] = useState('todos');
  const [loadingFaturamento, setLoadingFaturamento] = useState(false);

  useEffect(() => {
    loadClientes();
    loadLotes();
    loadAdminsPendentes();
    const interval = setInterval(loadClientes, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeTab === 'vendas') {
      loadLotes();
      if (selectedLote) loadVendasLote(selectedLote.id);
    }
    if (activeTab === 'tributos') {
      loadTributos();
      if (selectedTributo) {
        loteService.obterVendasTributo(selectedTributo.rastreio_importacao)
          .then(r => setVendasTributo(r.data))
          .catch(() => {});
      }
    }
  }, [activeTab]);

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
    setEditingLote(false);
    setEditLoteData({
      nome: lote.nome || '',
      descricao: lote.descricao || '',
      status_lote: lote.status_lote || '',
      foto: '',
      rastreio_importacao: lote.rastreio_importacao || '',
      custo: lote.custo?.toString() || '',
    });
    await loadVendasLote(lote.id);
  };

  const handleUpdateLote = async () => {
    if (!selectedLote) return;
    try {
      const { foto, ...rest } = editLoteData;
      const dataToSend = foto ? { ...rest, foto } : rest;
      await loteService.atualizar(selectedLote.id, dataToSend);
      setEditingLote(false);
      loadLotes();
      // Atualizar o lote selecionado com os novos dados
      setSelectedLote({ ...selectedLote, ...editLoteData });
    } catch (error) {
      console.error('Erro ao atualizar lote:', error);
    }
  };

  const handleCreateLote = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await loteService.criar(loteFormData);
      setLoteFormData({ numero_lote: '', nome: '', descricao: '', foto: '', status_lote: '', rastreio_importacao: '', custo: '' });
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
        cotas: vendaFormData.cotas ? parseFloat(vendaFormData.cotas) : 1.0,
      });
      setVendaFormData({
        cliente_id: '', carrinhos_comprados: '', preco: '', pago: false,
        comprovante_pagamento: '', data_pagamento: '', observacoes: '', cotas: '1'
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

  const handleToggleTributo = async (venda: any) => {
    try {
      await loteService.atualizarVenda(venda.id, {
        tributo_pago: !venda.tributo_pago,
        data_pagamento_tributo: !venda.tributo_pago ? new Date().toISOString() : null
      });
      if (selectedLote) loadVendasLote(selectedLote.id);
    } catch (error) {
      console.error('Erro ao atualizar tributo:', error);
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
    { value: 'chegou_eua', label: 'Chegou EUA', color: 'bg-purple-100 text-purple-700' },
    { value: 'importado_brasil', label: 'Importado p/ Brasil', color: 'bg-rose-100 text-rose-700' },
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

  // ========== TRIBUTOS ==========
  const loadTributos = async (arquivados = mostrarTributosArquivados) => {
    try {
      const response = await loteService.listarTributos(arquivados);
      setTributos(response.data);
    } catch (error) {
      console.error('Erro ao carregar tributos:', error);
    }
  };

  // ========== FATURAMENTO ==========
  const loadFaturamento = async () => {
    setLoadingFaturamento(true);
    try {
      const resp = await loteService.obterFaturamento();
      const { lotes, vendas, tributos: tributosData } = resp.data;
      setAllLotesFaturamento(lotes);
      setAllVendas(vendas);
      setTributos(tributosData);
    } catch (err) {
      console.error('Erro ao carregar faturamento:', err);
    } finally {
      setLoadingFaturamento(false);
    }
  };

  const handleCreateTributo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await loteService.criarTributo({
        rastreio_importacao: tributoFormData.rastreio_importacao,
        valor_total_imposto: parseFloat(tributoFormData.valor_total_imposto),
        observacoes: tributoFormData.observacoes || null,
      });
      setTributoFormData({ rastreio_importacao: '', valor_total_imposto: '', observacoes: '' });
      setShowTributoForm(false);
      loadTributos();
    } catch (error: any) {
      const msg = error.response?.data?.detail || 'Erro ao criar tributo';
      alert(msg);
    }
  };

  const handleSelectTributo = async (tributo: any) => {
    setSelectedTributo(tributo);
    try {
      const response = await loteService.obterVendasTributo(tributo.rastreio_importacao);
      setVendasTributo(response.data);
    } catch (error) {
      console.error('Erro ao carregar vendas do tributo:', error);
      setVendasTributo([]);
    }
  };

  const handleUpdateTributo = async (tributoId: number, data: any) => {
    try {
      await loteService.atualizarTributo(tributoId, data);
      loadTributos();
      if (selectedTributo?.id === tributoId) {
        const resp = await loteService.obterTributo(tributoId);
        setSelectedTributo(resp.data);
        const vendasResp = await loteService.obterVendasTributo(resp.data.rastreio_importacao);
        setVendasTributo(vendasResp.data);
      }
      setEditingTributo(null);
    } catch (error) {
      console.error('Erro ao atualizar tributo:', error);
    }
  };

  const handleDeleteTributo = async (tributoId: number) => {
    if (window.confirm('Tem certeza que deseja deletar este tributo?')) {
      try {
        await loteService.deletarTributo(tributoId);
        if (selectedTributo?.id === tributoId) {
          setSelectedTributo(null);
          setVendasTributo([]);
        }
        loadTributos();
      } catch (error) {
        console.error('Erro ao deletar tributo:', error);
      }
    }
  };

  const gerarMensagemCobranca = async (tributo: any) => {
    try {
      const resp = await loteService.obterVendasTributo(tributo.rastreio_importacao);
      const vendas: any[] = resp.data;
      const pendentes = vendas.filter((v: any) => !v.tributo_pago);
      if (pendentes.length === 0) {
        alert('Todos os clientes já pagaram o tributo! 🎉');
        return;
      }
      const formatTel = (tel: string) => {
        if (!tel) return null;
        const digits = tel.replace(/\D/g, '');
        if (digits.startsWith('55') && digits.length >= 12) return digits;
        if (digits.length === 11 || digits.length === 10) return `55${digits}`;
        return digits;
      };
      const linhas = pendentes.map((v: any) => {
        const tel = formatTel(v.cliente_telefone);
        const mencao = tel ? `@${tel}` : '';
        const total = (Number(v.cotas || 1) * Number(tributo.valor_por_cota)).toFixed(2);
        return `${mencao} *${v.cliente_nome || 'Cliente'}*\nCotas: ${v.cotas || 1} | Total: R$ ${total}`;
      }).join('\n\n');
      const texto = [
        `📦 *TRIBUTO DE IMPORTAÇÃO — Rastreio: ${tributo.rastreio_importacao}*`,
        `💰 Valor Total: R$ ${Number(tributo.valor_total_imposto).toFixed(2)} | Valor/Cota: R$ ${Number(tributo.valor_por_cota).toFixed(2)}`,
        ``,
        `⚠️ *Clientes com tributo PENDENTE (${pendentes.length}):*`,
        ``,
        linhas,
        ``,
        `Por favor, realizar o pagamento. Dúvidas, me chamem. 🙏`,
      ].join('\n');
      setMensagemCobranca({ tributo, texto });
    } catch (err) {
      console.error('Erro ao gerar mensagem:', err);
    }
  };

  const handleToggleTributoPago = async (venda: any) => {
    try {
      await loteService.atualizarVenda(venda.id, { tributo_pago: !venda.tributo_pago });
      if (selectedTributo) {
        const vendasResp = await loteService.obterVendasTributo(selectedTributo.rastreio_importacao);
        setVendasTributo(vendasResp.data);
        loadTributos();
      }
    } catch (error) {
      console.error('Erro ao atualizar tributo pago:', error);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950">
      <nav className="bg-gradient-to-r from-itgeek-teal-dark via-itgeek-teal to-itgeek-teal-light text-white p-3 md:p-4 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-2 md:gap-3">
          <img src="/logo-itgeek-icon.png" alt="ItGeek System" style={{ height: 30, width: 'auto' }} />
          <div className="flex flex-col">
            {empresa && (
              <span className="text-lg md:text-2xl font-extrabold tracking-wider uppercase leading-none">
                {empresa.nome}
              </span>
            )}
            <span className="text-xs md:text-sm font-medium text-white/70 leading-tight">
              ItGeek System
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
        <div className="md:w-52 bg-neutral-900 shadow-lg md:min-h-screen border-b md:border-b-0 md:border-r border-neutral-800">
          <div className="p-2 md:p-4 flex md:flex-col md:space-y-2 gap-1 md:gap-0 overflow-x-auto">
            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-0 md:mb-3 px-3 hidden md:block">Navegação</p>
            <button
              onClick={() => setActiveTab('clientes')}
              className={`flex items-center gap-2 p-2 md:p-3 rounded font-semibold transition whitespace-nowrap text-sm md:text-base md:w-full ${
                activeTab === 'clientes' ? 'bg-itgeek-teal text-white shadow-md' : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
              }`}
            >
              <Users size={18} />
              Clientes
            </button>
            <button
              onClick={() => { setActiveTab('vendas'); loadLotes(); }}
              className={`flex items-center gap-2 p-2 md:p-3 rounded font-semibold transition whitespace-nowrap text-sm md:text-base md:w-full ${
                activeTab === 'vendas' ? 'bg-itgeek-teal text-white shadow-md' : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
              }`}
            >
              <ShoppingBag size={18} />
              Vendas
            </button>
            {isModuloHabilitado('garagem') && (
            <button
              onClick={() => { if (canViewGaragem()) { setActiveTab('garagem'); loadSolicitacoes(); } }}
              disabled={!canViewGaragem()}
              title={!canViewGaragem() ? 'Você não tem permissão para acessar garagem' : ''}
              className={`flex items-center gap-2 p-2 md:p-3 rounded font-semibold transition whitespace-nowrap text-sm md:text-base md:w-full ${
                !canViewGaragem() 
                  ? 'text-stone-600 cursor-not-allowed opacity-50' 
                  : activeTab === 'garagem' ? 'bg-itgeek-teal text-white shadow-md' : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
              }`}
            >
              <Warehouse size={18} />
              Garagem
            </button>
            )}
            {isModuloHabilitado('tributos') && (
            <button
              onClick={() => { setActiveTab('tributos'); loadTributos(); }}
              className={`flex items-center gap-2 p-2 md:p-3 rounded font-semibold transition whitespace-nowrap text-sm md:text-base md:w-full ${
                activeTab === 'tributos' ? 'bg-itgeek-teal text-white shadow-md' : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
              }`}
            >
              <Receipt size={18} />
              Tributos
            </button>
            )}
            <button
              onClick={() => { setActiveTab('faturamento'); loadFaturamento(); }}
              className={`flex items-center gap-2 p-2 md:p-3 rounded font-semibold transition whitespace-nowrap text-sm md:text-base md:w-full ${
                activeTab === 'faturamento' ? 'bg-itgeek-teal text-white shadow-md' : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
              }`}
            >
              <DollarSign size={18} />
              Faturamento
            </button>
            <button
              onClick={() => { setActiveTab('admins'); loadAdminsPendentes(); }}
              className={`flex items-center gap-2 p-2 md:p-3 rounded font-semibold transition whitespace-nowrap text-sm md:text-base md:w-full ${
                activeTab === 'admins' ? 'bg-itgeek-teal text-white shadow-md' : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
              }`}
            >
              <Shield size={18} />
              Admins Pendentes
              {adminsPendentes.length > 0 && (
                <span className="bg-itgeek-orange text-white text-xs px-2 py-1 rounded-full">
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
                  <span className="bg-itgeek-teal/20 text-itgeek-teal px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-semibold border border-itgeek-teal/30">
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
                      className="bg-stone-700 border border-stone-600 rounded px-3 py-2 pl-10 text-white placeholder-gray-400 focus:border-itgeek-teal focus:outline-none w-full sm:w-80"
                    />
                    <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
                    {resultadosBusca.length > 0 && buscaCliente.length > 2 && (
                      <div className="absolute top-full mt-1 w-full bg-stone-800 border border-gray-600 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                        {resultadosBusca.map((cliente) => (
                          <div
                            key={cliente.id}
                            className="p-3 hover:bg-stone-700 cursor-pointer border-b border-gray-600 last:border-b-0"
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
                    className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 transition"
                  >
                    <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    Atualizar
                  </button>
                  <button
                    onClick={() => canCreateCliente() && setShowForm(!showForm)}
                    disabled={!canCreateCliente()}
                    title={!canCreateCliente() ? 'Você não tem permissão para criar clientes' : ''}
                    className={`flex items-center gap-2 px-4 py-2 rounded font-semibold transition ${
                      canCreateCliente()
                        ? 'bg-itgeek-teal text-white hover:bg-itgeek-teal-dark cursor-pointer'
                        : 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'
                    }`}
                  >
                    <Plus size={18} />
                    {showForm ? 'Cancelar' : 'Novo Cliente'}
                  </button>
                </div>
              </div>

              {showForm && (
                <form onSubmit={handleCreateCliente} className="bg-stone-800 p-4 md:p-6 rounded-lg shadow-lg mb-6 border border-stone-700">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Nome"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      className="bg-stone-700 border border-stone-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-itgeek-teal focus:outline-none"
                      required
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="bg-stone-700 border border-stone-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-itgeek-teal focus:outline-none"
                      required
                    />
                    <input
                      type="password"
                      placeholder="Senha"
                      value={formData.senha}
                      onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                      className="bg-stone-700 border border-stone-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-itgeek-teal focus:outline-none"
                      required
                    />
                    <input
                      type="tel"
                      placeholder="Telefone"
                      value={formData.telefone}
                      onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                      className="bg-stone-700 border border-stone-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-itgeek-teal focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="mt-4 bg-itgeek-teal text-white px-4 py-2 rounded hover:bg-itgeek-teal-dark font-semibold transition"
                  >
                    Criar Cliente
                  </button>
                </form>
              )}

              {loading && clientes.length === 0 ? (
                <div className="bg-stone-800 rounded-lg shadow p-8 text-center text-gray-400 border border-stone-700">
                  <RefreshCw size={32} className="animate-spin mx-auto mb-4 text-itgeek-teal" />
                  Carregando clientes...
                </div>
              ) : clientes.length === 0 ? (
                <div className="bg-stone-800 rounded-lg shadow p-8 text-center text-gray-400 border border-stone-700">
                  <Users size={48} className="mx-auto mb-4 text-gray-600" />
                  <p className="text-lg">Nenhum cliente cadastrado ainda</p>
                  <p className="text-sm mt-2 text-gray-500">Clientes que se registrarem aparecerão aqui automaticamente</p>
                </div>
              ) : (
                <div className="bg-stone-800 rounded-lg shadow overflow-hidden border border-stone-700 overflow-x-auto">
                  <table className="w-full min-w-[600px]">
                    <thead className="bg-stone-900/50">
                      <tr>
                        <th className="px-3 md:px-6 py-3 text-left text-stone-400 uppercase text-xs font-bold tracking-wider">Nome</th>
                        <th className="px-3 md:px-6 py-3 text-left text-stone-400 uppercase text-xs font-bold tracking-wider">Email</th>
                        <th className="px-3 md:px-6 py-3 text-left text-gray-400 uppercase text-xs font-bold tracking-wider hidden sm:table-cell">Telefone</th>
                        <th className="px-3 md:px-6 py-3 text-left text-gray-400 uppercase text-xs font-bold tracking-wider hidden md:table-cell">Role</th>
                        <th className="px-3 md:px-6 py-3 text-left text-gray-400 uppercase text-xs font-bold tracking-wider hidden md:table-cell">Data Cadastro</th>
                        <th className="px-3 md:px-6 py-3 text-left text-gray-400 uppercase text-xs font-bold tracking-wider">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientes.map((cliente) => (
                        <tr key={cliente.id} className={`border-t border-gray-700 hover:bg-stone-700/50 transition ${cliente.role !== 'cliente' ? 'bg-gray-700/20' : ''}`}>
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
                                  className="text-orange-400 hover:text-orange-300 transition"
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
                  <button onClick={loadLotes} className="flex items-center gap-1.5 bg-green-600 text-white px-2.5 md:px-4 py-2 rounded hover:bg-green-700 transition text-xs md:text-sm">
                    <RefreshCw size={16} />
                    <span className="hidden sm:inline">Atualizar</span>
                  </button>
                  <button 
                    onClick={() => canCreateLote() && setShowLoteForm(!showLoteForm)} 
                    disabled={!canCreateLote()}
                    title={!canCreateLote() ? 'Você não tem permissão para criar lotes' : ''}
                    className={`flex items-center gap-1.5 px-2.5 md:px-4 py-2 rounded font-semibold transition text-xs md:text-sm ${
                      canCreateLote() 
                        ? 'bg-itgeek-teal text-white hover:bg-itgeek-teal-dark cursor-pointer' 
                        : 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'
                    }`}>
                    <Plus size={16} />
                    <span className="hidden sm:inline">{showLoteForm ? 'Cancelar' : 'Novo Lote'}</span>
                  </button>
                  {showMigrarButton && (
                    <button onClick={handleMigrarLotes} className="flex items-center gap-1.5 bg-orange-600 text-white px-2.5 md:px-4 py-2 rounded hover:bg-orange-700 font-semibold transition text-xs md:text-sm">
                      <RefreshCw size={16} />
                      <span className="hidden sm:inline">Migrar Lotes</span>
                    </button>
                  )}
                </div>
              </div>

              {showLoteForm && (
                <form onSubmit={handleCreateLote} className="bg-stone-800 p-4 md:p-6 rounded-lg shadow-lg mb-6 border border-stone-700">
                  <h3 className="text-lg font-bold mb-4 text-white">Cadastrar Novo Lote</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Número do Lote (opcional)</label>
                      <input type="text" placeholder="#001, #002, etc." value={loteFormData.numero_lote}
                        onChange={(e) => setLoteFormData({ ...loteFormData, numero_lote: e.target.value })}
                        className="bg-stone-700 border border-stone-600 rounded px-3 py-2 w-full text-white placeholder-gray-400 focus:border-itgeek-teal focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Nome do Lote</label>
                      <input type="text" placeholder="Nome do lote" value={loteFormData.nome}
                        onChange={(e) => setLoteFormData({ ...loteFormData, nome: e.target.value })}
                        className="bg-stone-700 border border-stone-600 rounded px-3 py-2 w-full text-white placeholder-gray-400 focus:border-itgeek-teal focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Status do Lote (opcional)</label>
                      <select value={loteFormData.status_lote}
                        onChange={(e) => setLoteFormData({ ...loteFormData, status_lote: e.target.value })}
                        className="bg-stone-700 border border-stone-600 rounded px-3 py-2 w-full text-white focus:border-itgeek-teal focus:outline-none">
                        <option value="">Selecione um status</option>
                        <option value="Chegou EUA">Chegou EUA</option>
                        <option value="Importado Brasil">Importado Brasil</option>
                        <option value="Alfandega/Tributação">Alfandega/Tributação</option>
                        <option value="Centro Distribuição">Centro Distribuição</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Rastreio de Importação (opcional)</label>
                      <input type="text" placeholder="Código de rastreio para vincular lotes" value={loteFormData.rastreio_importacao}
                        onChange={(e) => setLoteFormData({ ...loteFormData, rastreio_importacao: e.target.value })}
                        className="bg-stone-700 border border-stone-600 rounded px-3 py-2 w-full text-white placeholder-gray-400 focus:border-itgeek-teal focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Custo do Lote (R$)</label>
                      <input type="number" step="0.01" placeholder="0.00" value={loteFormData.custo}
                        onChange={(e) => setLoteFormData({ ...loteFormData, custo: e.target.value })}
                        className="bg-stone-700 border border-stone-600 rounded px-3 py-2 w-full text-white placeholder-gray-400 focus:border-itgeek-teal focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Foto do Lote</label>
                      <input type="file" accept="image/*" onChange={handleLoteFoto} className="bg-stone-700 border border-stone-600 rounded px-3 py-2 w-full text-gray-300 text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Descrição do Lote</label>
                      <textarea placeholder="Descrição do lote" value={loteFormData.descricao}
                        onChange={(e) => setLoteFormData({ ...loteFormData, descricao: e.target.value })}
                        className="bg-stone-700 border border-stone-600 rounded px-3 py-2 w-full text-white placeholder-gray-400 focus:border-itgeek-teal focus:outline-none" rows={3} />
                    </div>
                  </div>
                  <button type="submit" className="mt-4 w-full bg-itgeek-teal text-white px-4 py-2 rounded hover:bg-itgeek-teal-dark font-semibold transition">
                    Criar Lote
                  </button>
                </form>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {lotes.map((lote) => (
                  <div key={lote.id}
                    onClick={() => handleSelectLote(lote)}
                    className={`bg-stone-800 rounded-lg p-3 cursor-pointer transition hover:shadow-xl border-2 ${
                      selectedLote?.id === lote.id ? 'border-itgeek-teal shadow-itgeek-teal/20 shadow-lg' : 'border-stone-700 hover:border-stone-500'
                    }`}>
                    {lote.foto ? (
                      <div className="relative w-full h-32 mb-2 rounded overflow-hidden bg-stone-900/30 flex items-center justify-center">
                        <img src={`data:image/jpeg;base64,${lote.foto}`} alt={lote.nome}
                          className="max-w-full max-h-full object-contain" />
                      </div>
                    ) : (
                      <div className="w-full h-24 bg-stone-700/50 rounded mb-2 flex items-center justify-center">
                        <Image size={28} className="text-stone-500" />
                      </div>
                    )}
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                          <h3 className="font-bold text-base text-white">{lote.numero_lote || lote.nome}</h3>
                          {lote.status_lote && (
                            <span className="text-xs bg-orange-600/20 text-orange-400 px-1.5 py-0.5 rounded border border-orange-600/30">
                              {lote.status_lote}
                            </span>
                          )}
                          {lote.rastreio_importacao && (
                            <span className="text-xs bg-orange-600/20 text-orange-400 px-1.5 py-0.5 rounded border border-orange-600/30">
                              📦 {lote.rastreio_importacao}
                            </span>
                          )}
                        </div>
                        {lote.descricao && <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{lote.descricao}</p>}
                        <p className="text-xs text-gray-500 mt-0.5">{new Date(lote.data_criacao).toLocaleDateString('pt-BR')}</p>
                        <div className="flex gap-3 mt-1">
                          {lote.custo > 0 && <span className="text-xs font-semibold text-orange-400">Custo: R$ {Number(lote.custo).toFixed(2)}</span>}
                          {lote.valor_total > 0 && <span className="text-xs font-semibold text-itgeek-teal">Receita: R$ {Number(lote.valor_total).toFixed(2)}</span>}
                          {lote.custo > 0 && lote.valor_total > 0 && (
                            <span className={`text-xs font-semibold ${lote.lucro >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              Lucro: R$ {Number(lote.lucro).toFixed(2)}
                            </span>
                          )}
                        </div>
                        
                        {/* Indicadores do lote */}
                        <div className="mt-2 space-y-1">
                          {/* Pagamentos das vendas */}
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-400">Pagamentos:</span>
                            <div className="flex items-center gap-1.5">
                              {lote.percentual_pago === 100
                                ? <span className="text-xs bg-green-600/20 text-green-400 px-1.5 py-0.5 rounded border border-green-600/30">100% PAGO</span>
                                : <>
                                    <span className="text-xs text-green-400">{lote.vendas_pagas || 0} pago</span>
                                    <span className="text-xs text-stone-600">·</span>
                                    <span className="text-xs text-red-400">{lote.vendas_nao_pagas || 0} pendente</span>
                                  </>
                              }
                            </div>
                          </div>

                          {/* Tributos de importação */}
                          {lote.total_vendas > 0 && (
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-400 flex items-center gap-1"><Receipt size={11} /> Tributos:</span>
                              <div className="flex items-center gap-1.5">
                                {lote.percentual_tributo_pago === 100
                                  ? <span className="text-xs bg-green-600/20 text-green-400 px-1.5 py-0.5 rounded border border-green-600/30">100% PAGO</span>
                                  : <>
                                      <span className="text-xs text-green-400">{lote.tributos_pagos || 0} pago</span>
                                      <span className="text-xs text-stone-600">·</span>
                                      <span className="text-xs text-red-400">{lote.tributos_pendentes || 0} pendente</span>
                                    </>
                                }
                              </div>
                            </div>
                          )}

                          {/* Entregas */}
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-400">Entregas:</span>
                            <div className="flex items-center gap-1.5">
                              {lote.percentual_entregue === 100
                                ? <span className="text-xs bg-teal-600/20 text-teal-400 px-1.5 py-0.5 rounded border border-teal-600/30">100% ENTREGUE</span>
                                : <span className="text-xs text-gray-400">{lote.vendas_entregues || 0}/{lote.total_vendas || 0}</span>
                              }
                            </div>
                          </div>

                          {/* Pronto para arquivar */}
                          {lote.percentual_pago === 100 && lote.percentual_entregue === 100 && (
                            <span className="text-xs bg-yellow-600/20 text-yellow-400 px-2 py-1 rounded border border-yellow-600/30 inline-block mt-1">
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
                        className={`bg-stone-900/50 rounded-lg p-4 cursor-pointer transition hover:shadow-xl border-2 opacity-75 ${
                          selectedLote?.id === lote.id ? 'border-yellow-500 shadow-yellow-500/20 shadow-lg' : 'border-stone-700 hover:border-stone-500'
                        }`}>
                        {lote.foto ? (
                          <img src={`data:image/jpeg;base64,${lote.foto}`} alt={lote.numero_lote}
                            className="w-full h-48 object-contain rounded mb-3 grayscale bg-stone-900" />
                        ) : (
                          <div className="w-full h-32 bg-stone-800 rounded mb-3 flex items-center justify-center">
                            <Archive size={32} className="text-stone-600" />
                          </div>
                        )}
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-lg text-gray-300">{lote.numero_lote}</h3>
                              <span className="text-xs bg-green-600/20 text-green-400 px-2 py-1 rounded border border-green-600/30">
                                100% PAGO
                              </span>
                              <span className="text-xs bg-teal-600/20 text-teal-400 px-2 py-1 rounded border border-teal-600/30">
                                100% ENTREGUE
                              </span>
                            </div>
                            {lote.descricao && <p className="text-sm text-gray-500 mt-1">{lote.descricao}</p>}
                            <p className="text-sm text-gray-600 mt-1">{new Date(lote.data_criacao).toLocaleDateString('pt-BR')}</p>
                            <div className="flex gap-3 mt-1">
                              {lote.custo > 0 && <span className="text-xs font-semibold text-orange-400">Custo: R$ {Number(lote.custo).toFixed(2)}</span>}
                              {lote.valor_total > 0 && <span className="text-xs font-semibold text-itgeek-teal">Receita: R$ {Number(lote.valor_total).toFixed(2)}</span>}
                              {lote.custo > 0 && lote.valor_total > 0 && (
                                <span className={`text-xs font-semibold ${lote.lucro >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                  Lucro: R$ {Number(lote.lucro).toFixed(2)}
                                </span>
                              )}
                            </div>
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
                <div className="bg-stone-800 rounded-lg shadow-lg p-4 md:p-6 border border-stone-700 mt-8">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-lg md:text-xl font-bold text-white">Vendas - {selectedLote.nome}</h3>
                      {selectedLote.rastreio_importacao && (
                        <span className="text-xs bg-orange-600/20 text-orange-400 px-2 py-1 rounded border border-orange-600/30">
                          📦 {selectedLote.rastreio_importacao}
                        </span>
                      )}
                      {selectedLote.arquivado && (
                        <span className="bg-yellow-600/20 text-yellow-400 px-3 py-1 rounded-full text-sm font-semibold border border-yellow-600/30">
                          <Archive size={16} className="inline mr-1" />
                          Arquivado
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => setEditingLote(!editingLote)}
                        className={`flex items-center gap-2 px-3 py-2 rounded font-semibold transition text-xs md:text-sm ${
                          editingLote ? 'bg-gray-600 text-gray-200' : 'bg-gray-700 text-gray-300 hover:bg-stone-600'
                        }`}>
                        <Pencil size={16} />
                        {editingLote ? 'Cancelar' : 'Editar Lote'}
                      </button>
                      <button onClick={() => setShowVendaForm(!showVendaForm)}
                        className="flex items-center gap-2 bg-itgeek-teal text-white px-3 md:px-4 py-2 rounded hover:bg-itgeek-teal-dark font-semibold transition text-xs md:text-sm">
                        <Plus size={16} />
                        {showVendaForm ? 'Cancelar' : 'Nova Venda'}
                      </button>
                    </div>
                  </div>

                  {editingLote && (
                    <div className="bg-stone-900/50 p-4 rounded-lg mb-4 border border-stone-600">
                      <h4 className="font-semibold mb-3 text-white">Editar Lote</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-gray-400 mb-1">Nome</label>
                          <input type="text" value={editLoteData.nome}
                            onChange={(e) => setEditLoteData({ ...editLoteData, nome: e.target.value })}
                            className="bg-stone-700 border border-stone-600 rounded px-3 py-2 w-full text-white focus:border-itgeek-teal focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-400 mb-1">Status do Lote</label>
                          <select value={editLoteData.status_lote}
                            onChange={(e) => setEditLoteData({ ...editLoteData, status_lote: e.target.value })}
                            className="bg-stone-700 border border-stone-600 rounded px-3 py-2 w-full text-white focus:border-itgeek-teal focus:outline-none">
                            <option value="">Selecione um status</option>
                            <option value="Chegou EUA">Chegou EUA</option>
                            <option value="Importado Brasil">Importado Brasil</option>
                            <option value="Alfandega/Tributação">Alfandega/Tributação</option>
                            <option value="Centro Distribuição">Centro Distribuição</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm text-gray-400 mb-1">Rastreio de Importação</label>
                          <input type="text" placeholder="Código de rastreio para vincular tributos" value={editLoteData.rastreio_importacao}
                            onChange={(e) => setEditLoteData({ ...editLoteData, rastreio_importacao: e.target.value })}
                            className="bg-stone-700 border border-stone-600 rounded px-3 py-2 w-full text-white placeholder-gray-400 focus:border-itgeek-teal focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-400 mb-1">Descrição</label>
                          <input type="text" value={editLoteData.descricao}
                            onChange={(e) => setEditLoteData({ ...editLoteData, descricao: e.target.value })}
                            className="bg-stone-700 border border-stone-600 rounded px-3 py-2 w-full text-white focus:border-itgeek-teal focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-400 mb-1">Custo do Lote (R$)</label>
                          <input type="number" step="0.01" placeholder="0.00" value={editLoteData.custo}
                            onChange={(e) => setEditLoteData({ ...editLoteData, custo: e.target.value })}
                            className="bg-stone-700 border border-stone-600 rounded px-3 py-2 w-full text-white placeholder-gray-400 focus:border-itgeek-teal focus:outline-none" />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-sm text-gray-400 mb-1">Foto do Lote</label>
                          {selectedLote?.foto && !editLoteData.foto && (
                            <div className="mb-2 flex items-center gap-3">
                              <img src={`data:image/jpeg;base64,${selectedLote.foto}`} alt="Foto atual" className="w-16 h-16 object-cover rounded border border-stone-600" />
                              <span className="text-xs text-gray-500">Foto atual — selecione um arquivo para substituir</span>
                            </div>
                          )}
                          {editLoteData.foto && (
                            <div className="mb-2 flex items-center gap-3">
                              <img src={`data:image/jpeg;base64,${editLoteData.foto}`} alt="Nova foto" className="w-16 h-16 object-cover rounded border border-itgeek-teal" />
                              <span className="text-xs text-green-400">Nova foto selecionada</span>
                            </div>
                          )}
                          <input type="file" accept="image/*" onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                const base64 = (reader.result as string).split(',')[1];
                                setEditLoteData({ ...editLoteData, foto: base64 });
                              };
                              reader.readAsDataURL(file);
                            }
                          }} className="bg-stone-700 border border-stone-600 rounded px-3 py-2 w-full text-gray-300 text-sm file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-itgeek-teal file:text-white hover:file:bg-itgeek-teal-dark" />
                        </div>
                      </div>
                      <button onClick={handleUpdateLote}
                        className="mt-4 flex items-center gap-2 bg-itgeek-teal text-white px-4 py-2 rounded hover:bg-itgeek-teal-dark font-semibold transition">
                        <Save size={16} />
                        Salvar Alterações
                      </button>
                    </div>
                  )}

                  {showVendaForm && (
                    <form onSubmit={handleCreateVenda} className="bg-stone-900/50 p-4 rounded-lg mb-4 border border-stone-600">
                      <h4 className="font-semibold mb-3 text-white">Nova Venda</h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm text-gray-400 mb-1">Cliente</label>
                          <select value={vendaFormData.cliente_id}
                            onChange={(e) => setVendaFormData({ ...vendaFormData, cliente_id: e.target.value })}
                            className="bg-stone-700 border border-stone-600 rounded px-3 py-2 w-full text-white focus:border-itgeek-teal focus:outline-none" required>
                            <option value="">Selecione o Cliente</option>
                            {clientes.map((c) => (
                              <option key={c.id} value={c.id}>{c.nome} ({c.email})</option>
                            ))}
                          </select>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm text-gray-400 mb-1">Preço (R$)</label>
                            <input type="number" step="0.01" placeholder="0.00" value={vendaFormData.preco}
                              onChange={(e) => setVendaFormData({ ...vendaFormData, preco: e.target.value })}
                              className="bg-stone-700 border border-stone-600 rounded px-3 py-2 w-full text-white placeholder-gray-400 focus:border-itgeek-teal focus:outline-none" required />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-400 mb-1">Cotas (padrão: 1)</label>
                            <input type="number" step="0.1" min="0.1" placeholder="1" value={vendaFormData.cotas}
                              onChange={(e) => setVendaFormData({ ...vendaFormData, cotas: e.target.value })}
                              className="bg-stone-700 border border-stone-600 rounded px-3 py-2 w-full text-white placeholder-gray-400 focus:border-itgeek-teal focus:outline-none" />
                          </div>
                          <div className="flex items-center gap-2 mt-6">
                            <input type="checkbox" id="pago" checked={vendaFormData.pago}
                              onChange={(e) => setVendaFormData({ ...vendaFormData, pago: e.target.checked })}
                              className="w-4 h-4 accent-[#19A6A6]" />
                            <label htmlFor="pago" className="text-sm text-gray-300">Já foi pago?</label>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm text-gray-400 mb-1">Carrinhos comprados</label>
                          <textarea placeholder="Ex: Hot Wheels Camaro, Matchbox Fusca" value={vendaFormData.carrinhos_comprados}
                            onChange={(e) => setVendaFormData({ ...vendaFormData, carrinhos_comprados: e.target.value })}
                            className="bg-stone-700 border border-stone-600 rounded px-3 py-2 w-full text-white placeholder-gray-400 focus:border-itgeek-teal focus:outline-none" rows={2} required />
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm text-gray-400 mb-1">Data do Pagamento</label>
                            <input type="datetime-local" value={vendaFormData.data_pagamento}
                              onChange={(e) => setVendaFormData({ ...vendaFormData, data_pagamento: e.target.value })}
                              className="bg-stone-700 border border-stone-600 rounded px-3 py-2 w-full text-white focus:border-itgeek-teal focus:outline-none" />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-400 mb-1">Comprovante de Pagamento</label>
                            <input type="file" accept="image/*" onChange={handleComprovante} className="bg-stone-700 border border-stone-600 rounded px-3 py-2 w-full text-gray-300 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-itgeek-teal file:text-white hover:file:bg-itgeek-teal-dark" />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm text-gray-400 mb-1">Observações</label>
                          <textarea placeholder="Informações adicionais (opcional)" value={vendaFormData.observacoes}
                            onChange={(e) => setVendaFormData({ ...vendaFormData, observacoes: e.target.value })}
                            className="bg-stone-700 border border-stone-600 rounded px-3 py-2 w-full text-white placeholder-gray-400 focus:border-itgeek-teal focus:outline-none" rows={2} />
                        </div>
                      </div>
                      <button type="submit" className="mt-4 bg-itgeek-teal text-white px-4 py-2 rounded hover:bg-itgeek-teal-dark font-semibold transition w-full sm:w-auto">
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
                      <thead className="bg-stone-900/50">
                        <tr>
                          <th className="px-3 py-2 text-left text-stone-400 uppercase text-xs font-bold tracking-wider">Cliente</th>
                          <th className="px-3 py-2 text-left text-stone-400 uppercase text-xs font-bold tracking-wider">Carrinhos</th>
                          <th className="px-3 py-2 text-left text-gray-400 uppercase text-xs font-bold tracking-wider">Preço</th>
                          <th className="px-3 py-2 text-left text-gray-400 uppercase text-xs font-bold tracking-wider">Cotas</th>
                          <th className="px-3 py-2 text-left text-gray-400 uppercase text-xs font-bold tracking-wider">Pago</th>
                          <th className="px-3 py-2 text-left text-gray-400 uppercase text-xs font-bold tracking-wider">Tributo</th>
                          <th className="px-3 py-2 text-left text-gray-400 uppercase text-xs font-bold tracking-wider">Data Pgto</th>
                          <th className="px-3 py-2 text-left text-gray-400 uppercase text-xs font-bold tracking-wider">Comprov.</th>
                          <th className="px-3 py-2 text-left text-gray-400 uppercase text-xs font-bold tracking-wider">Entrega</th>
                          <th className="px-3 py-2 text-left text-gray-400 uppercase text-xs font-bold tracking-wider">Obs</th>
                          <th className="px-3 py-2 text-left text-gray-400 uppercase text-xs font-bold tracking-wider">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vendasLote.map((venda) => {
                          const tributoLote = tributos.find(t => t.rastreio_importacao === selectedLote?.rastreio_importacao);
                          const valorTributoVenda = tributoLote ? (Number(venda.cotas || 1) * Number(tributoLote.valor_por_cota)) : null;
                          return (
                          <tr key={venda.id} className="border-t border-gray-700 hover:bg-stone-700/50 transition">
                            <td className="px-4 py-2 font-medium text-white">{venda.cliente_nome}</td>
                            <td className="px-4 py-2 text-sm max-w-xs truncate text-gray-300">{venda.carrinhos_comprados}</td>
                            <td className="px-4 py-2 font-semibold text-green-400">R$ {Number(venda.preco).toFixed(2)}</td>
                            <td className="px-4 py-2 text-sm text-gray-300">{venda.cotas || 1}</td>
                            <td className="px-4 py-2">
                              <button onClick={() => handleTogglePago(venda)}
                                className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${
                                  venda.pago ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                }`}>
                                {venda.pago ? <><Check size={14} /> Pago</> : <><X size={14} /> Pendente</>}
                              </button>
                            </td>
                            <td className="px-4 py-2">
                              <div className="flex flex-col gap-1">
                                {valorTributoVenda !== null && (
                                  <span className="text-sm font-bold text-orange-400">
                                    R$ {valorTributoVenda.toFixed(2)}
                                  </span>
                                )}
                                <button onClick={() => handleToggleTributo(venda)}
                                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold w-fit ${
                                    venda.tributo_pago ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                                  }`}>
                                  {venda.tributo_pago ? <><Check size={12} /> Pago</> : <><X size={12} /> Pendente</>}
                                </button>
                              </div>
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
                        ); })}
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
                  <div className="bg-stone-800 rounded-lg shadow border border-stone-700 flex-1 overflow-y-auto max-h-[600px]">
                    {clientes.map((cliente) => (
                      <div key={cliente.id}
                        onClick={() => handleSelectClienteGaragem(cliente)}
                        className={`p-3 cursor-pointer border-b border-gray-700 transition ${
                          selectedClienteGaragem?.id === cliente.id ? 'bg-itgeek-teal/20 border-l-4 border-l-itgeek-teal' : 'hover:bg-stone-700/50'
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
                              ? 'bg-itgeek-teal text-white hover:bg-itgeek-teal-dark cursor-pointer'
                              : 'bg-gray-700 text-gray-500 cursor-not-allowed opacity-50'
                          }`}>
                          <Plus size={16} />
                          {showFotoForm ? 'Cancelar' : 'Adicionar Foto'}
                        </button>
                      </div>

                      {showFotoForm && (
                        <form onSubmit={handleAddFotoGaragem} className="bg-stone-900/50 p-4 rounded-lg border border-stone-600 mb-4">
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm text-gray-400 mb-1">Foto</label>
                              <input type="file" accept="image/*" onChange={handleFotoGaragemFile}
                                disabled={!canUploadFotoGaragem()}
                                className="bg-stone-700 border border-stone-600 rounded px-3 py-2 w-full text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed" required />
                            </div>
                            <input type="text" placeholder="Descrição (opcional)" value={fotoFormData.descricao}
                              onChange={(e) => setFotoFormData({ ...fotoFormData, descricao: e.target.value })}
                              disabled={!canUploadFotoGaragem()}
                              className="bg-stone-700 border border-stone-600 rounded px-3 py-2 w-full text-white placeholder-gray-400 focus:border-itgeek-teal focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed" />
                            <button type="submit" className="bg-itgeek-teal text-white px-4 py-2 rounded hover:bg-itgeek-teal-dark font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={!fotoFormData.foto || !canUploadFotoGaragem() || savingFoto}>
                              {savingFoto ? 'Salvando...' : 'Salvar Foto'}
                            </button>
                          </div>
                        </form>
                      )}

                      {fotosGaragem.length === 0 ? (
                        <div className="bg-stone-800 rounded-lg shadow p-8 text-center text-gray-500 border border-stone-700 flex-1 flex items-center justify-center">
                          <Image size={48} className="mx-auto mb-3 text-gray-600" />
                          <p>Nenhuma foto na garagem deste cliente</p>
                        </div>
                      ) : (
                        <div className="flex-1 overflow-y-auto max-h-[600px]">
                          <div className="grid grid-cols-2 gap-3">
                            {fotosGaragem.map((foto) => (
                              <div key={foto.id} className="bg-stone-800 rounded-lg shadow overflow-hidden relative group border border-stone-700">
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
                    <div className="bg-stone-800 rounded-lg shadow p-8 text-center text-gray-500 border border-stone-700 flex-1 flex items-center justify-center">
                      <Warehouse size={48} className="mx-auto mb-3 text-gray-600" />
                      <p>Selecione um cliente para gerenciar a garagem</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                  <h3 className="text-lg md:text-xl font-bold text-white">Solicitações de Envio</h3>
                  <button onClick={loadSolicitacoes} className="flex items-center gap-2 bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 text-sm transition">
                    <RefreshCw size={16} /> Atualizar
                  </button>
                </div>
                {solicitacoes.length === 0 ? (
                  <div className="bg-stone-800 rounded-lg shadow p-6 text-center text-gray-500 border border-stone-700">
                    <Send size={32} className="mx-auto mb-2 text-gray-600" />
                    <p>Nenhuma solicitação de envio pendente</p>
                  </div>
                ) : (
                  <div className="bg-stone-800 rounded-lg shadow overflow-hidden border border-stone-700 overflow-x-auto">
                    <table className="w-full min-w-[600px]">
                      <thead className="bg-stone-900/50">
                        <tr>
                          <th className="px-3 py-2 text-left text-stone-400 uppercase text-xs font-bold tracking-wider">Cliente</th>
                          <th className="px-3 py-2 text-left text-stone-400 uppercase text-xs font-bold tracking-wider">Data</th>
                          <th className="px-3 py-2 text-left text-gray-400 uppercase text-xs font-bold tracking-wider">Status</th>
                          <th className="px-3 py-2 text-left text-gray-400 uppercase text-xs font-bold tracking-wider">Rastreio</th>
                          <th className="px-3 py-2 text-left text-gray-400 uppercase text-xs font-bold tracking-wider">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {solicitacoes.map((sol) => (
                          <tr key={sol.id} className="border-t border-gray-700 hover:bg-stone-700/50 transition">
                            <td className="px-4 py-2 font-medium text-white">{sol.cliente_nome}</td>
                            <td className="px-4 py-2 text-sm text-gray-400">{new Date(sol.data_solicitacao).toLocaleString('pt-BR')}</td>
                            <td className="px-4 py-2">
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                sol.status === 'pendente' ? 'bg-yellow-100 text-yellow-700' :
                                sol.status === 'enviado' ? 'bg-green-100 text-green-700' :
                                sol.status === 'entregue' ? 'bg-purple-100 text-purple-700' :
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
                                      className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded hover:bg-stone-600 transition">
                                      Editar Rastreio
                                    </button>
                                    <button onClick={() => handleUpdateSolicitacao(sol.id, 'entregue')}
                                      className="text-xs bg-purple-600/20 text-purple-400 px-2 py-1 rounded hover:bg-purple-600/30 border border-purple-600/30 transition">
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

          {activeTab === 'tributos' && isModuloHabilitado('tributos') && (
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-lg md:text-3xl font-extrabold text-white uppercase tracking-wide">Tributos de Importação</h2>
                  <span className="bg-orange-600/20 text-orange-400 px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-semibold border border-orange-600/30">
                    {tributos.length} registro{tributos.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => {
                    const novo = !mostrarTributosArquivados;
                    setMostrarTributosArquivados(novo);
                    loadTributos(novo);
                  }} className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 rounded font-semibold transition text-xs md:text-sm ${
                    mostrarTributosArquivados ? 'bg-orange-600/30 text-orange-300 border border-orange-600/40' : 'bg-gray-700 text-gray-300 hover:bg-stone-600'
                  }`}>
                    <Archive size={16} />
                    <span className="hidden sm:inline">{mostrarTributosArquivados ? 'Ocultar Arquivados' : 'Ver Arquivados'}</span>
                    <span className="sm:hidden">{mostrarTributosArquivados ? 'Ocultar' : 'Arquivados'}</span>
                  </button>
                  <button onClick={() => loadTributos()} className="flex items-center gap-1.5 md:gap-2 bg-green-600 text-white px-3 md:px-4 py-2 rounded hover:bg-green-700 transition text-xs md:text-sm">
                    <RefreshCw size={16} />
                    Atualizar
                  </button>
                  <button onClick={() => setShowTributoForm(!showTributoForm)}
                    className="flex items-center gap-1.5 md:gap-2 bg-itgeek-teal text-white px-3 md:px-4 py-2 rounded hover:bg-itgeek-teal-dark font-semibold transition text-xs md:text-sm">
                    <Plus size={16} />
                    {showTributoForm ? 'Cancelar' : 'Novo Tributo'}
                  </button>
                </div>
              </div>

              {showTributoForm && (
                <form onSubmit={handleCreateTributo} className="bg-stone-800 p-4 md:p-6 rounded-lg shadow-lg mb-6 border border-stone-700">
                  <h3 className="text-lg font-bold mb-4 text-white">Cadastrar Novo Tributo</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Código Rastreio de Importação</label>
                      <input type="text" placeholder="Ex: BR123456789" value={tributoFormData.rastreio_importacao}
                        onChange={(e) => setTributoFormData({ ...tributoFormData, rastreio_importacao: e.target.value })}
                        className="bg-stone-700 border border-stone-600 rounded px-3 py-2 w-full text-white placeholder-gray-400 focus:border-itgeek-teal focus:outline-none" required />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Valor Total do Imposto (R$)</label>
                      <input type="number" step="0.01" placeholder="0.00" value={tributoFormData.valor_total_imposto}
                        onChange={(e) => setTributoFormData({ ...tributoFormData, valor_total_imposto: e.target.value })}
                        className="bg-stone-700 border border-stone-600 rounded px-3 py-2 w-full text-white placeholder-gray-400 focus:border-itgeek-teal focus:outline-none" required />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm text-gray-400 mb-1">Observações (opcional)</label>
                    <textarea placeholder="Notas sobre este tributo..." value={tributoFormData.observacoes}
                      onChange={(e) => setTributoFormData({ ...tributoFormData, observacoes: e.target.value })}
                      className="bg-stone-700 border border-stone-600 rounded px-3 py-2 w-full text-white placeholder-gray-400 focus:border-itgeek-teal focus:outline-none" rows={2} />
                  </div>
                  <button type="submit" className="mt-4 w-full bg-itgeek-teal text-white px-4 py-2 rounded hover:bg-itgeek-teal-dark font-semibold transition">
                    Criar Tributo
                  </button>
                </form>
              )}

              {tributos.length === 0 ? (
                <div className="bg-stone-800 rounded-lg shadow p-8 text-center text-gray-500 border border-stone-700">
                  <Receipt size={64} className="mx-auto mb-4 text-gray-600" />
                  <p className="text-lg">Nenhum tributo cadastrado</p>
                  <p className="text-sm mt-2">Crie um tributo vinculando-o a um código de rastreio de importação</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                  {tributos.map((tributo) => (
                    <div key={tributo.id}
                      onClick={() => handleSelectTributo(tributo)}
                      className={`bg-stone-800 rounded-lg p-4 cursor-pointer transition hover:shadow-xl border-2 ${
                        tributo.arquivado ? 'border-gray-600 opacity-60' :
                        selectedTributo?.id === tributo.id ? 'border-orange-500 shadow-orange-500/20 shadow-lg' : 'border-gray-700 hover:border-gray-500'
                      }`}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <h3 className="font-bold text-lg text-white">📦 {tributo.rastreio_importacao}</h3>
                            {tributo.arquivado && (
                              <span className="text-xs bg-gray-600/40 text-gray-400 px-2 py-1 rounded border border-gray-600/40">
                                <Archive size={10} className="inline mr-1" />Arquivado
                              </span>
                            )}
                            <span className="text-xs bg-itgeek-orange/20 text-itgeek-orange px-2 py-1 rounded border border-itgeek-orange/30 font-semibold">
                              R$ {Number(tributo.valor_total_imposto).toFixed(2)}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm mb-3">
                            <div>
                              <span className="text-gray-500">Cotas:</span>
                              <span className="text-white ml-1 font-semibold">{tributo.total_cotas}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Valor/Cota:</span>
                              <span className="text-orange-400 ml-1 font-semibold">R$ {Number(tributo.valor_por_cota).toFixed(2)}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Vendas:</span>
                              <span className="text-white ml-1">{tributo.vendas_count}</span>
                            </div>
                          </div>

                          {/* Lotes vinculados */}
                          {tributo.lotes_vinculados?.length > 0 && (
                            <div className="mb-3">
                              <span className="text-xs text-gray-500 mr-2">Lotes vinculados:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {tributo.lotes_vinculados.map((l: any) => (
                                  <span key={l.id} className="text-xs bg-orange-600/20 text-orange-400 px-2 py-1 rounded border border-orange-600/30 font-semibold">
                                    {l.numero_lote}{l.nome ? ` · ${l.nome}` : ''} <span className="text-orange-300/60">({l.total_vendas} vendas)</span>
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Status financeiro */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs bg-green-600/20 text-green-400 px-2 py-1 rounded border border-green-600/30 font-semibold">
                              ✓ Pago: R$ {Number(tributo.valor_pago ?? 0).toFixed(2)} ({tributo.tributos_pagos})
                            </span>
                            {tributo.tributos_pendentes > 0 && (
                              <span className="text-xs bg-orange-600/20 text-orange-400 px-2 py-1 rounded border border-orange-600/30 font-semibold">
                                ⏳ Falta: R$ {Number(tributo.valor_pendente ?? 0).toFixed(2)} ({tributo.tributos_pendentes})
                              </span>
                            )}
                          </div>
                          {tributo.observacoes && <p className="text-xs text-gray-500 mt-2">{tributo.observacoes}</p>}
                        </div>
                        <div className="flex gap-1">
                          {!tributo.arquivado && tributo.tributos_pendentes > 0 && (
                            <button onClick={(e) => { e.stopPropagation(); gerarMensagemCobranca(tributo); }}
                              className="text-gray-400 hover:text-green-400 p-1 transition" title="Gerar mensagem WhatsApp">
                              <MessageSquare size={16} />
                            </button>
                          )}
                          <button onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              if (tributo.arquivado) {
                                await loteService.desarquivarTributo(tributo.id);
                              } else {
                                await loteService.arquivarTributo(tributo.id);
                              }
                              loadTributos();
                            } catch (err) { console.error(err); }
                          }}
                            className="text-gray-400 hover:text-yellow-400 p-1 transition"
                            title={tributo.arquivado ? 'Desarquivar' : 'Arquivar'}>
                            <Archive size={16} />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); setEditingTributo(tributo); }}
                            className="text-gray-400 hover:text-white p-1 transition" title="Editar">
                            <Settings size={16} />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteTributo(tributo.id); }}
                            className="text-red-500 hover:text-red-400 p-1 transition" title="Deletar">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Modal Mensagem WhatsApp */}
              {mensagemCobranca && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                  <div className="bg-stone-800 rounded-lg p-6 w-full max-w-lg border border-stone-700 flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <MessageSquare size={20} className="text-green-400" />
                        Mensagem de Cobrança — WhatsApp
                      </h3>
                      <button onClick={() => setMensagemCobranca(null)} className="text-gray-400 hover:text-white">
                        <X size={20} />
                      </button>
                    </div>
                    <textarea
                      readOnly
                      value={mensagemCobranca.texto}
                      rows={14}
                      className="bg-gray-900 border border-gray-600 rounded px-3 py-2 w-full text-white text-sm font-mono resize-none focus:outline-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(mensagemCobranca.texto);
                          const btn = document.getElementById('btn-copiar-msg');
                          if (btn) { btn.textContent = '✓ Copiado!'; setTimeout(() => { btn.textContent = 'Copiar mensagem'; }, 2000); }
                        }}
                        id="btn-copiar-msg"
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded transition"
                      >
                        Copiar mensagem
                      </button>
                      <button onClick={() => setMensagemCobranca(null)}
                        className="bg-gray-700 text-gray-300 px-4 py-2 rounded hover:bg-stone-600 transition">
                        Fechar
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Editar Tributo */}
              {editingTributo && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                  <div className="bg-stone-800 rounded-lg p-6 w-full max-w-md border border-stone-700">
                    <h3 className="text-lg font-bold text-white mb-4">Editar Tributo</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Valor Total do Imposto (R$)</label>
                        <input type="number" step="0.01" defaultValue={editingTributo.valor_total_imposto}
                          id="edit-tributo-valor"
                          className="bg-stone-700 border border-stone-600 rounded px-3 py-2 w-full text-white focus:border-itgeek-teal focus:outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Observações</label>
                        <textarea defaultValue={editingTributo.observacoes || ''} id="edit-tributo-obs"
                          className="bg-stone-700 border border-stone-600 rounded px-3 py-2 w-full text-white focus:border-itgeek-teal focus:outline-none" rows={2} />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button onClick={() => {
                        const valor = (document.getElementById('edit-tributo-valor') as HTMLInputElement).value;
                        const obs = (document.getElementById('edit-tributo-obs') as HTMLTextAreaElement).value;
                        handleUpdateTributo(editingTributo.id, {
                          valor_total_imposto: parseFloat(valor),
                          observacoes: obs || null,
                        });
                      }} className="flex-1 bg-itgeek-teal text-white px-4 py-2 rounded hover:bg-itgeek-teal-dark font-semibold transition">
                        Salvar
                      </button>
                      <button onClick={() => setEditingTributo(null)}
                        className="bg-gray-700 text-gray-300 px-4 py-2 rounded hover:bg-stone-600 transition">
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Detalhe do tributo selecionado */}
              {selectedTributo && (
                <div className="bg-stone-800 rounded-lg shadow-lg p-4 md:p-6 border border-stone-700 mt-2">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-2">
                    <h3 className="text-base md:text-lg font-bold text-white">
                      Vendas - Rastreio: <span className="text-itgeek-teal">{selectedTributo.rastreio_importacao}</span>
                    </h3>
                    <span className="text-xs md:text-sm text-gray-400">
                      Valor/Cota: <span className="text-itgeek-teal font-semibold">R$ {Number(selectedTributo.valor_por_cota).toFixed(2)}</span>
                    </span>
                  </div>
                  {vendasTributo.length === 0 ? (
                    <div className="text-center text-gray-500 py-6">
                      <p>Nenhuma venda vinculada a este rastreio.</p>
                      <p className="text-xs mt-1">Vincule lotes a este rastreio definindo o campo "Rastreio de Importação" no lote.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[700px]">
                        <thead className="bg-stone-900/50">
                          <tr>
                            <th className="px-3 py-2 text-left text-stone-400 uppercase text-xs font-bold tracking-wider">Cliente</th>
                            <th className="px-3 py-2 text-left text-stone-400 uppercase text-xs font-bold tracking-wider">Lote</th>
                            <th className="px-3 py-2 text-left text-gray-400 uppercase text-xs font-bold tracking-wider">Carrinhos</th>
                            <th className="px-3 py-2 text-left text-gray-400 uppercase text-xs font-bold tracking-wider">Cotas</th>
                            <th className="px-3 py-2 text-left text-gray-400 uppercase text-xs font-bold tracking-wider">Valor Tributo</th>
                            <th className="px-3 py-2 text-left text-gray-400 uppercase text-xs font-bold tracking-wider">Status</th>
                            <th className="px-3 py-2 text-left text-gray-400 uppercase text-xs font-bold tracking-wider">Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {vendasTributo.map((venda) => (
                            <tr key={venda.id} className="border-t border-gray-700 hover:bg-stone-700/50 transition">
                              <td className="px-4 py-2 font-medium text-white">{venda.cliente_nome}</td>
                              <td className="px-4 py-2 text-sm text-gray-300">{venda.lote_numero}</td>
                              <td className="px-4 py-2 text-sm text-gray-300 max-w-xs truncate">{venda.carrinhos_comprados}</td>
                              <td className="px-4 py-2 text-sm text-gray-300">{venda.cotas || 1}</td>
                              <td className="px-4 py-2 font-semibold text-itgeek-orange">
                                R$ {venda.valor_tributo !== null ? Number(venda.valor_tributo).toFixed(2) : '—'}
                              </td>
                              <td className="px-4 py-2">
                                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                  venda.tributo_pago ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                                }`}>
                                  {venda.tributo_pago ? 'Pago' : 'Pendente'}
                                </span>
                              </td>
                              <td className="px-4 py-2">
                                <button onClick={() => handleToggleTributoPago(venda)}
                                  className={`text-xs px-2 py-1 rounded transition ${
                                    venda.tributo_pago
                                      ? 'bg-orange-600/20 text-orange-400 hover:bg-orange-600/30 border border-orange-600/30'
                                      : 'bg-green-600/20 text-green-400 hover:bg-green-600/30 border border-green-600/30'
                                  }`}>
                                  {venda.tributo_pago ? 'Marcar Pendente' : 'Marcar Pago'}
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

          {activeTab === 'faturamento' && (
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-lg md:text-3xl font-extrabold text-white uppercase tracking-wide">Faturamento</h2>
                </div>
                <div className="flex gap-2">
                  <select
                    value={faturamentoPeriodo}
                    onChange={(e) => setFaturamentoPeriodo(e.target.value)}
                    className="bg-stone-700 border border-stone-600 rounded px-3 py-2 text-white text-sm focus:border-itgeek-teal focus:outline-none"
                  >
                    <option value="todos">Todos os períodos</option>
                    {(() => {
                      const meses: string[] = [];
                      const now = new Date();
                      for (let i = 0; i < 12; i++) {
                        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                        const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                        meses.push(val);
                      }
                      return meses.map(m => {
                        const [y, mo] = m.split('-');
                        const d = new Date(Number(y), Number(mo) - 1, 1);
                        return <option key={m} value={m}>{d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</option>;
                      });
                    })()}
                  </select>
                  <button onClick={loadFaturamento} className="flex items-center gap-1.5 bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 transition text-sm">
                    <RefreshCw size={16} />
                    <span className="hidden sm:inline">Atualizar</span>
                  </button>
                </div>
              </div>

              {loadingFaturamento ? (
                <div className="text-center text-gray-400 py-12">
                  <RefreshCw size={32} className="mx-auto mb-3 animate-spin text-itgeek-teal" />
                  <p>Carregando dados financeiros...</p>
                </div>
              ) : (() => {
                // Filtrar vendas por período
                const vendasFiltradas = faturamentoPeriodo === 'todos'
                  ? allVendas
                  : allVendas.filter(v => {
                      const dv = new Date(v.data_venda || v.lote_data);
                      return `${dv.getFullYear()}-${String(dv.getMonth() + 1).padStart(2, '0')}` === faturamentoPeriodo;
                    });

                const lotesFiltrados = faturamentoPeriodo === 'todos'
                  ? allLotesFaturamento
                  : allLotesFaturamento.filter(l => {
                      const dl = new Date(l.data_criacao);
                      return `${dl.getFullYear()}-${String(dl.getMonth() + 1).padStart(2, '0')}` === faturamentoPeriodo;
                    });

                const totalReceita = vendasFiltradas.reduce((s, v) => s + Number(v.preco || 0), 0);
                const totalRecebido = vendasFiltradas.filter(v => v.pago).reduce((s, v) => s + Number(v.preco || 0), 0);
                const totalPendente = totalReceita - totalRecebido;
                const totalCustoAquisicao = lotesFiltrados.reduce((s, l) => s + Number(l.custo || 0), 0);
                const totalCustoTributo = lotesFiltrados.reduce((s, l) => s + Number(l.custo_tributo || 0), 0);
                const totalCustoTotal = lotesFiltrados.reduce((s, l) => s + Number(l.custo_total || 0), 0);
                const lucroLiquido = totalReceita - totalCustoTotal;

                // Agrupar por cliente
                const porCliente: Record<string, { nome: string; vendas: number; total: number; pago: number; pendente: number; tributo_pago: number; tributo_pendente: number }> = {};
                vendasFiltradas.forEach(v => {
                  const nome = v.cliente_nome || 'Desconhecido';
                  if (!porCliente[nome]) porCliente[nome] = { nome, vendas: 0, total: 0, pago: 0, pendente: 0, tributo_pago: 0, tributo_pendente: 0 };
                  porCliente[nome].vendas++;
                  porCliente[nome].total += Number(v.preco || 0);
                  if (v.pago) porCliente[nome].pago += Number(v.preco || 0);
                  else porCliente[nome].pendente += Number(v.preco || 0);
                  if (v.tributo_pago) porCliente[nome].tributo_pago++;
                  else porCliente[nome].tributo_pendente++;
                });
                const clientesRanking = Object.values(porCliente).sort((a, b) => b.total - a.total);

                return (
                  <>
                    {/* Cards de resumo */}
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
                      <div className="bg-stone-800 rounded-lg p-4 border border-stone-700">
                        <div className="flex items-center gap-2 mb-2">
                          <DollarSign size={18} className="text-itgeek-teal" />
                          <span className="text-xs text-gray-400 uppercase font-bold">Receita Total</span>
                        </div>
                        <p className="text-xl md:text-2xl font-bold text-white">R$ {totalReceita.toFixed(2)}</p>
                        <p className="text-xs text-gray-500 mt-1">{vendasFiltradas.length} vendas</p>
                      </div>
                      <div className="bg-stone-800 rounded-lg p-4 border border-stone-700">
                        <div className="flex items-center gap-2 mb-2">
                          <Check size={18} className="text-green-400" />
                          <span className="text-xs text-gray-400 uppercase font-bold">Recebido</span>
                        </div>
                        <p className="text-xl md:text-2xl font-bold text-green-400">R$ {totalRecebido.toFixed(2)}</p>
                        <p className="text-xs text-gray-500 mt-1">{vendasFiltradas.filter(v => v.pago).length} pagas</p>
                      </div>
                      <div className="bg-stone-800 rounded-lg p-4 border border-stone-700">
                        <div className="flex items-center gap-2 mb-2">
                          <X size={18} className="text-red-400" />
                          <span className="text-xs text-gray-400 uppercase font-bold">Pendente</span>
                        </div>
                        <p className="text-xl md:text-2xl font-bold text-red-400">R$ {totalPendente.toFixed(2)}</p>
                        <p className="text-xs text-gray-500 mt-1">{vendasFiltradas.filter(v => !v.pago).length} pendentes</p>
                      </div>
                      <div className="bg-stone-800 rounded-lg p-4 border border-stone-700">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingDown size={18} className="text-orange-400" />
                          <span className="text-xs text-gray-400 uppercase font-bold">Custo Aquisição</span>
                        </div>
                        <p className="text-xl md:text-2xl font-bold text-orange-400">R$ {totalCustoAquisicao.toFixed(2)}</p>
                        <p className="text-xs text-gray-500 mt-1">{lotesFiltrados.length} lotes</p>
                      </div>
                      <div className="bg-stone-800 rounded-lg p-4 border border-stone-700">
                        <div className="flex items-center gap-2 mb-2">
                          <Receipt size={18} className="text-yellow-400" />
                          <span className="text-xs text-gray-400 uppercase font-bold">Tributos (rateio)</span>
                        </div>
                        <p className="text-xl md:text-2xl font-bold text-yellow-400">R$ {totalCustoTributo.toFixed(2)}</p>
                        <p className="text-xs text-gray-500 mt-1">Total: R$ {totalCustoTotal.toFixed(2)}</p>
                      </div>
                      <div className={`bg-stone-800 rounded-lg p-4 border ${lucroLiquido >= 0 ? 'border-green-600/40' : 'border-red-600/40'}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp size={18} className={lucroLiquido >= 0 ? 'text-green-400' : 'text-red-400'} />
                          <span className="text-xs text-gray-400 uppercase font-bold">Lucro Líquido</span>
                        </div>
                        <p className={`text-xl md:text-2xl font-bold ${lucroLiquido >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          R$ {lucroLiquido.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Receita - Custos - Tributos</p>
                      </div>
                    </div>

                    {/* Gráficos */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                      {/* Bar Chart - Receita vs Custo por Lote */}
                      <div className="bg-stone-800 rounded-lg p-4 md:p-6 border border-stone-700">
                        <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Receita vs Custo por Lote</h3>
                        <ResponsiveContainer width="100%" height={280}>
                          <BarChart data={lotesFiltrados.filter((l: any) => l.total_vendas > 0).map((l: any) => ({
                            nome: l.numero_lote,
                            Receita: Number(l.valor_total),
                            Aquisição: Number(l.custo || 0),
                            Tributo: Number(l.custo_tributo || 0),
                            Lucro: Number(l.lucro || 0),
                          }))}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#44403c" />
                            <XAxis dataKey="nome" tick={{ fill: '#a8a29e', fontSize: 11 }} />
                            <YAxis tick={{ fill: '#a8a29e', fontSize: 11 }} />
                            <Tooltip
                              contentStyle={{ backgroundColor: '#292524', border: '1px solid #44403c', borderRadius: 8, color: '#fff' }}
                              formatter={(value: any) => `R$ ${Number(value).toFixed(2)}`}
                            />
                            <Bar dataKey="Receita" fill="#2dd4bf" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Aquisição" fill="#fb923c" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Tributo" fill="#facc15" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Lucro" fill="#4ade80" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Pie Chart - Recebido vs Pendente */}
                      <div className="bg-stone-800 rounded-lg p-4 md:p-6 border border-stone-700">
                        <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Recebido vs Pendente</h3>
                        <ResponsiveContainer width="100%" height={280}>
                          <PieChart>
                            <Pie
                              data={[
                                { name: 'Recebido', value: totalRecebido },
                                { name: 'Pendente', value: totalPendente },
                              ].filter(d => d.value > 0)}
                              cx="50%" cy="50%"
                              innerRadius={60} outerRadius={100}
                              paddingAngle={3}
                              dataKey="value"
                              label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                            >
                              <Cell fill="#4ade80" />
                              <Cell fill="#f87171" />
                            </Pie>
                            <Tooltip
                              contentStyle={{ backgroundColor: '#292524', border: '1px solid #44403c', borderRadius: 8, color: '#fff' }}
                              formatter={(value: any) => `R$ ${Number(value).toFixed(2)}`}
                            />
                            <Legend
                              formatter={(value: string) => <span style={{ color: '#d6d3d1', fontSize: 12 }}>{value}</span>}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Lucro por Lote */}
                    <div className="bg-stone-800 rounded-lg p-4 md:p-6 border border-stone-700 mb-6">
                      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <ShoppingBag size={20} className="text-itgeek-teal" />
                        Lucro por Lote
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[600px]">
                          <thead className="bg-stone-900/50">
                            <tr>
                              <th className="px-3 py-2 text-left text-stone-400 uppercase text-xs font-bold tracking-wider">Lote</th>
                              <th className="px-3 py-2 text-left text-stone-400 uppercase text-xs font-bold tracking-wider">Vendas</th>
                              <th className="px-3 py-2 text-left text-stone-400 uppercase text-xs font-bold tracking-wider">Receita</th>
                              <th className="px-3 py-2 text-left text-stone-400 uppercase text-xs font-bold tracking-wider">Aquisição</th>
                              <th className="px-3 py-2 text-left text-stone-400 uppercase text-xs font-bold tracking-wider">Tributo</th>
                              <th className="px-3 py-2 text-left text-stone-400 uppercase text-xs font-bold tracking-wider">Custo Total</th>
                              <th className="px-3 py-2 text-left text-stone-400 uppercase text-xs font-bold tracking-wider">Lucro</th>
                              <th className="px-3 py-2 text-left text-stone-400 uppercase text-xs font-bold tracking-wider">Margem</th>
                            </tr>
                          </thead>
                          <tbody>
                            {lotesFiltrados.map((lote: any) => {
                              const margem = lote.valor_total > 0 ? ((lote.lucro / lote.valor_total) * 100) : 0;
                              return (
                                <tr key={lote.id} className="border-t border-gray-700 hover:bg-stone-700/50 transition">
                                  <td className="px-3 py-2 font-medium text-white">{lote.numero_lote}{lote.nome && lote.nome !== lote.numero_lote ? ` · ${lote.nome}` : ''}</td>
                                  <td className="px-3 py-2 text-sm text-gray-300">{lote.total_vendas}</td>
                                  <td className="px-3 py-2 text-sm font-semibold text-white">R$ {Number(lote.valor_total).toFixed(2)}</td>
                                  <td className="px-3 py-2 text-sm font-semibold text-orange-400">R$ {Number(lote.custo || 0).toFixed(2)}</td>
                                  <td className="px-3 py-2 text-sm font-semibold text-yellow-400">R$ {Number(lote.custo_tributo || 0).toFixed(2)}</td>
                                  <td className="px-3 py-2 text-sm font-bold text-orange-300">R$ {Number(lote.custo_total || 0).toFixed(2)}</td>
                                  <td className={`px-3 py-2 text-sm font-bold ${lote.lucro >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    R$ {Number(lote.lucro).toFixed(2)}
                                  </td>
                                  <td className={`px-3 py-2 text-sm font-semibold ${margem >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {margem.toFixed(1)}%
                                  </td>
                                </tr>
                              );
                            })}
                            {lotesFiltrados.length === 0 && (
                              <tr><td colSpan={8} className="px-3 py-6 text-center text-gray-500">Nenhum lote encontrado no período</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Ranking por Cliente */}
                    <div className="bg-stone-800 rounded-lg p-4 md:p-6 border border-stone-700">
                      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Users size={20} className="text-itgeek-teal" />
                        Faturamento por Cliente
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[600px]">
                          <thead className="bg-stone-900/50">
                            <tr>
                              <th className="px-3 py-2 text-left text-stone-400 uppercase text-xs font-bold tracking-wider">#</th>
                              <th className="px-3 py-2 text-left text-stone-400 uppercase text-xs font-bold tracking-wider">Cliente</th>
                              <th className="px-3 py-2 text-left text-stone-400 uppercase text-xs font-bold tracking-wider">Vendas</th>
                              <th className="px-3 py-2 text-left text-stone-400 uppercase text-xs font-bold tracking-wider">Total</th>
                              <th className="px-3 py-2 text-left text-stone-400 uppercase text-xs font-bold tracking-wider">Pago</th>
                              <th className="px-3 py-2 text-left text-stone-400 uppercase text-xs font-bold tracking-wider">Pendente</th>
                              <th className="px-3 py-2 text-left text-stone-400 uppercase text-xs font-bold tracking-wider">Tributos</th>
                            </tr>
                          </thead>
                          <tbody>
                            {clientesRanking.map((c, i) => (
                              <tr key={c.nome} className="border-t border-gray-700 hover:bg-stone-700/50 transition">
                                <td className="px-3 py-2 text-sm text-gray-500 font-mono">{i + 1}</td>
                                <td className="px-3 py-2 font-medium text-white">{c.nome}</td>
                                <td className="px-3 py-2 text-sm text-gray-300">{c.vendas}</td>
                                <td className="px-3 py-2 text-sm font-semibold text-white">R$ {c.total.toFixed(2)}</td>
                                <td className="px-3 py-2 text-sm font-semibold text-green-400">R$ {c.pago.toFixed(2)}</td>
                                <td className="px-3 py-2 text-sm font-semibold text-red-400">
                                  {c.pendente > 0 ? `R$ ${c.pendente.toFixed(2)}` : '-'}
                                </td>
                                <td className="px-3 py-2">
                                  <div className="flex items-center gap-2 text-xs">
                                    <span className="text-green-400">{c.tributo_pago} pago</span>
                                    {c.tributo_pendente > 0 && <span className="text-orange-400">{c.tributo_pendente} pend.</span>}
                                  </div>
                                </td>
                              </tr>
                            ))}
                            {clientesRanking.length === 0 && (
                              <tr><td colSpan={7} className="px-3 py-6 text-center text-gray-500">Nenhuma venda encontrada no período</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {activeTab === 'admins' && (
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl md:text-3xl font-extrabold text-white uppercase tracking-wide">Admins Pendentes</h2>
                  <span className="bg-itgeek-orange/20 text-itgeek-orange px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-semibold border border-itgeek-orange/30">
                    {adminsPendentes.length} aguardando aprovação
                  </span>
                </div>
                <button onClick={loadAdminsPendentes} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition">
                  <RefreshCw size={18} />
                  Atualizar
                </button>
              </div>

              {adminsPendentes.length === 0 ? (
                <div className="bg-stone-800 rounded-lg shadow p-8 text-center text-gray-500 border border-stone-700">
                  <Shield size={64} className="mx-auto mb-4 text-gray-600" />
                  <p className="text-lg">Nenhum admin pendente</p>
                  <p className="text-sm mt-2">Todos os admins estão aprovados e ativos</p>
                </div>
              ) : (
                <div className="bg-stone-800 rounded-lg shadow border border-stone-700 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-stone-900/50 border-b border-stone-700">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-stone-300 uppercase tracking-wider">Nome</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-stone-300 uppercase tracking-wider">Email</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Telefone</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Tipo</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Data Cadastro</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700">
                        {adminsPendentes.map((admin) => (
                          <tr key={admin.id} className="hover:bg-stone-700/50 transition">
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
                                  : 'bg-itgeek-orange/20 text-itgeek-orange border border-itgeek-orange/30'
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
