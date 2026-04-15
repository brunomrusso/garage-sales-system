import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTenant } from '../contexts/TenantContext';
import { loteService, garagemService } from '../services/api';
import { LogOut, ShoppingBag, Check, X, Eye, Image as ImageIcon, RefreshCw, Warehouse, Send, Package } from 'lucide-react';
import { Garage95Logo } from '../components/Garage95Logo';

export const ClienteGaragem = () => {
  const { user, logout } = useAuth();
  const { empresa } = useTenant();
  const [vendas, setVendas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'compras' | 'garagem'>('compras');
  const [fotosGaragem, setFotosGaragem] = useState<any[]>([]);
  const [solicitacoes, setSolicitacoes] = useState<any[]>([]);
  const [selectedFoto, setSelectedFoto] = useState<any>(null);
  const [comprasTab, setComprasTab] = useState<'andamento' | 'entregues'>('andamento');
  const [fotosNaoSolicitadas, setFotosNaoSolicitadas] = useState<number>(0);
  const [podeSolicitar, setPodeSolicitar] = useState<boolean>(false);
  const [motivoSolicitacao, setMotivoSolicitacao] = useState<string>("");
  const [temSolicitacaoPendente, setTemSolicitacaoPendente] = useState<boolean>(false);
  const [itensStatus, setItensStatus] = useState<Record<number, any>>({});

  useEffect(() => {
    if (user) {
      loadVendas();
      loadFotos();
      loadSolicitacoes();
      loadFotosNaoSolicitadas();
    }
  }, [user]);

  const loadVendas = async () => {
    setLoading(true);
    try {
      const response = await loteService.listarVendasCliente(user!.id);
      setVendas(response.data);
    } catch (error) {
      console.error('Erro ao carregar vendas:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFotos = async () => {
    try {
      const response = await garagemService.listarFotos(user!.id);
      setFotosGaragem(response.data);
    } catch (error) {
      console.error('Erro ao carregar fotos:', error);
    }
  };

  const loadSolicitacoes = async () => {
    try {
      const response = await garagemService.listarSolicitacoesCliente(user!.id);
      setSolicitacoes(response.data);
    } catch (error) {
      console.error('Erro ao carregar solicitações:', error);
    }
  };

  const loadFotosNaoSolicitadas = async () => {
    try {
      const response = await garagemService.verificarFotosNaoSolicitadas(user!.id);
      const data = response.data;
      setFotosNaoSolicitadas(data.fotos_nao_solicitadas);
      setPodeSolicitar(data.pode_solicitar);
      setMotivoSolicitacao(data.motivo);
      setTemSolicitacaoPendente(data.tem_solicitacao_pendente);
      setItensStatus(data.itens_status || {});
    } catch (error) {
      console.error('Erro ao verificar fotos não solicitadas:', error);
    }
  };

  const handleSolicitarEnvio = async () => {
    const mensagem = temSolicitacaoPendente 
      ? 'Deseja atualizar sua solicitação de envio com os novos itens da garagem? A solicitação anterior será substituída.'
      : 'Deseja solicitar o envio da sua garagem?';
    
    if (window.confirm(mensagem)) {
      try {
        const response = await garagemService.criarSolicitacao({ cliente_id: user!.id });
        loadSolicitacoes();
        loadFotosNaoSolicitadas(); // Recarregar o status das fotos
        
        const acao = response.data.acao;
        if (acao === 'substituida') {
          alert('Solicitação de envio atualizada com sucesso! Todos os itens foram incluídos.');
        } else {
          alert('Solicitação de envio criada com sucesso!');
        }
      } catch (error) {
        console.error('Erro ao solicitar envio:', error);
      }
    }
  };

  const totalGasto = vendas.reduce((acc, v) => acc + Number(v.preco), 0);
  const totalPago = vendas.filter(v => v.pago).reduce((acc, v) => acc + Number(v.preco), 0);
  const totalPendente = totalGasto - totalPago;
  const itensRecebidos = vendas.filter(v => v.status_entrega === 'centro_distribuicao');
  const todosGaragemPagos = itensRecebidos.every(v => v.pago);
  const podeEnviar = itensRecebidos.length > 0 && todosGaragemPagos && podeSolicitar;

  // Filtrar compras por status
  const comprasEmAndamento = vendas.filter(venda => venda.status_entrega !== 'entregue');
  const comprasEntregues = vendas.filter(venda => venda.status_entrega === 'entregue');

  const statusLabels: Record<string, { label: string; color: string }> = {
    aguardando_pagamento: { label: 'Aguardando Pagamento', color: 'bg-gray-700 text-gray-300' },
    pago: { label: 'Pago', color: 'bg-yellow-600/20 text-yellow-400 border border-yellow-600/30' },
    chegou_eua: { label: 'Chegou nos EUA', color: 'bg-blue-600/20 text-blue-400 border border-blue-600/30' },
    importado_brasil: { label: 'Importado p/ Brasil', color: 'bg-indigo-600/20 text-indigo-400 border border-indigo-600/30' },
    alfandega: { label: 'Alfândega/Tributação', color: 'bg-orange-600/20 text-orange-400 border border-orange-600/30' },
    centro_distribuicao: { label: 'No Centro de Distribuição', color: 'bg-green-600/20 text-green-400 border border-green-600/30' },
    entregue: { label: 'Entregue', color: 'bg-emerald-600/20 text-emerald-400 border border-emerald-600/30' },
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <nav className="bg-gradient-to-r from-red-700 via-red-600 to-orange-500 text-white p-3 md:p-4 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-2 md:gap-3">
          <Garage95Logo size="md" showText={false} />
          <div className="flex flex-col">
            {empresa && (
              <span className="text-lg md:text-2xl font-extrabold tracking-wider uppercase leading-none">
                {empresa.nome}
              </span>
            )}
            <span className="text-xs md:text-sm font-medium text-white/70 leading-tight">
              Garage95
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <div className="text-right hidden sm:block">
            <span className="text-sm opacity-90 block">{user?.email}</span>
            {user?.telefone && (
              <span className="text-xs opacity-75">{user.telefone}</span>
            )}
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-1 md:gap-2 bg-black/30 hover:bg-black/50 px-3 py-2 rounded transition text-sm"
          >
            <LogOut size={18} />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
          <div className="bg-gray-800 rounded-lg shadow-lg p-4 md:p-6 text-center border border-gray-700">
            <p className="text-xs md:text-sm text-gray-400 mb-1">Total de Compras</p>
            <p className="text-2xl md:text-3xl font-extrabold text-white">{vendas.length}</p>
          </div>
          <div className="bg-gray-800 rounded-lg shadow-lg p-4 md:p-6 text-center border border-gray-700">
            <p className="text-xs md:text-sm text-gray-400 mb-1">Total Pago</p>
            <p className="text-xl md:text-3xl font-extrabold text-green-400">R$ {totalPago.toFixed(2)}</p>
          </div>
          <div className="bg-gray-800 rounded-lg shadow-lg p-4 md:p-6 text-center border border-gray-700">
            <p className="text-xs md:text-sm text-gray-400 mb-1">Pendente</p>
            <p className="text-xl md:text-3xl font-extrabold text-red-400">R$ {totalPendente.toFixed(2)}</p>
          </div>
          <div className="bg-gray-800 rounded-lg shadow-lg p-4 md:p-6 text-center border border-gray-700">
            <p className="text-xs md:text-sm text-gray-400 mb-1">Na Garagem</p>
            <p className="text-2xl md:text-3xl font-extrabold text-orange-400">{itensRecebidos.length}</p>
          </div>
        </div>

        <div className="flex gap-2 md:gap-4 mb-6">
          <button onClick={() => setActiveTab('compras')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-3 rounded-lg font-bold transition uppercase tracking-wide text-sm md:text-base ${
              activeTab === 'compras' ? 'bg-red-600 text-white shadow-lg shadow-red-600/30' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white border border-gray-700'
            }`}>
            <ShoppingBag size={18} /> Compras
          </button>
          <button onClick={() => { setActiveTab('garagem'); loadFotos(); loadSolicitacoes(); loadFotosNaoSolicitadas(); }}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-3 rounded-lg font-bold transition uppercase tracking-wide text-sm md:text-base ${
              activeTab === 'garagem' ? 'bg-red-600 text-white shadow-lg shadow-red-600/30' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white border border-gray-700'
            }`}>
            <Warehouse size={18} /> Garagem
          </button>
        </div>

        {activeTab === 'compras' && (
          <div className="bg-gray-800 rounded-lg shadow-lg p-4 md:p-6 border border-gray-700">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
              <h2 className="text-xl md:text-2xl font-extrabold text-white uppercase tracking-wide">Minhas Compras</h2>
              <button onClick={loadVendas} disabled={loading}
                className="flex items-center gap-2 bg-gray-700 text-gray-200 px-4 py-2 rounded hover:bg-gray-600 disabled:opacity-50 transition">
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                Atualizar
              </button>
            </div>

            {/* Tabs internas para separar compras */}
            <div className="flex gap-2 mb-6 border-b border-gray-700">
              <button
                onClick={() => setComprasTab('andamento')}
                className={`flex items-center gap-2 px-4 py-2 font-semibold transition border-b-2 -mb-px ${
                  comprasTab === 'andamento'
                    ? 'text-red-400 border-red-400'
                    : 'text-gray-400 border-transparent hover:text-gray-300'
                }`}
              >
                <ShoppingBag size={16} />
                Em Andamento
                {comprasEmAndamento.length > 0 && (
                  <span className="bg-red-600/20 text-red-400 px-2 py-0.5 rounded-full text-xs font-semibold">
                    {comprasEmAndamento.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setComprasTab('entregues')}
                className={`flex items-center gap-2 px-4 py-2 font-semibold transition border-b-2 -mb-px ${
                  comprasTab === 'entregues'
                    ? 'text-green-400 border-green-400'
                    : 'text-gray-400 border-transparent hover:text-gray-300'
                }`}
              >
                <Check size={16} />
                Entregues
                {comprasEntregues.length > 0 && (
                  <span className="bg-green-600/20 text-green-400 px-2 py-0.5 rounded-full text-xs font-semibold">
                    {comprasEntregues.length}
                  </span>
                )}
              </button>
            </div>

            {loading && vendas.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <RefreshCw size={32} className="animate-spin mx-auto mb-4 text-red-500" />
                Carregando suas compras...
              </div>
            ) : vendas.length === 0 ? (
              <div className="text-center text-gray-500 py-12">
                <ShoppingBag size={64} className="mx-auto mb-4 text-gray-600" />
                <p className="text-lg">Você ainda não tem compras registradas</p>
                <p className="text-sm mt-2 text-gray-600">Quando o administrador vincular uma compra a você, ela aparecerá aqui</p>
              </div>
            ) : (
              <>
                {comprasTab === 'andamento' && comprasEmAndamento.length === 0 && (
                  <div className="text-center text-gray-500 py-12">
                    <ShoppingBag size={64} className="mx-auto mb-4 text-gray-600" />
                    <p className="text-lg">Nenhuma compra em andamento</p>
                    <p className="text-sm mt-2 text-gray-600">Todas as suas compras já foram entregues ou você ainda não tem compras</p>
                  </div>
                )}
                
                {comprasTab === 'entregues' && comprasEntregues.length === 0 && (
                  <div className="text-center text-gray-500 py-12">
                    <Check size={64} className="mx-auto mb-4 text-gray-600" />
                    <p className="text-lg">Nenhuma compra entregue ainda</p>
                    <p className="text-sm mt-2 text-gray-600">Suas compras em andamento aparecerão aqui quando forem entregues</p>
                  </div>
                )}

                {(comprasTab === 'andamento' ? comprasEmAndamento : comprasEntregues).length > 0 && (
                  <div className="space-y-4">
                    {(comprasTab === 'andamento' ? comprasEmAndamento : comprasEntregues).map((venda) => (
                  <div key={venda.id} className="border border-gray-700 rounded-lg overflow-hidden hover:shadow-xl hover:border-gray-600 transition bg-gray-900/50">
                    <div className="flex flex-col sm:flex-row">
                      {venda.lote_foto && (
                        <div className="w-full sm:w-48 flex-shrink-0">
                          <img src={`data:image/jpeg;base64,${venda.lote_foto}`} alt={venda.lote_nome}
                            className="w-full h-40 sm:h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1 p-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                              <span className="bg-red-600/20 text-red-400 px-2 py-1 rounded text-xs font-semibold border border-red-600/30">
                                {venda.lote_nome}
                              </span>
                              <span className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${
                                venda.pago ? 'bg-green-600/20 text-green-400 border border-green-600/30' : 'bg-red-600/20 text-red-400 border border-red-600/30'
                              }`}>
                                {venda.pago ? <><Check size={12} /> Pago</> : <><X size={12} /> Pendente</>}
                              </span>
                              {venda.status_entrega && (
                                <span className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${
                                  statusLabels[venda.status_entrega]?.color || 'bg-gray-100 text-gray-700'
                                }`}>
                                  {statusLabels[venda.status_entrega]?.label || venda.status_entrega}
                                </span>
                              )}
                            </div>
                            <h3 className="font-semibold text-lg mb-1 text-white">Carrinhos Comprados</h3>
                            <p className="text-gray-300 mb-2">{venda.carrinhos_comprados}</p>
                            <div className="flex flex-col sm:flex-row gap-1 sm:gap-6 text-sm text-gray-500">
                              <span>Comprado em: <strong className="text-gray-400">{new Date(venda.data_venda).toLocaleString('pt-BR')}</strong></span>
                              {venda.data_pagamento && (
                                <span>Pago em: <strong className="text-gray-400">{new Date(venda.data_pagamento).toLocaleString('pt-BR')}</strong></span>
                              )}
                            </div>
                            {venda.observacoes && (
                              <p className="text-sm text-gray-500 mt-2 italic">Obs: {venda.observacoes}</p>
                            )}
                          </div>
                          <div className="text-left sm:text-right sm:ml-4">
                            <p className="text-xl md:text-2xl font-extrabold text-green-400">R$ {Number(venda.preco).toFixed(2)}</p>
                            {venda.comprovante_pagamento && (
                              <button onClick={() => {
                                const w = window.open('');
                                w?.document.write(`<img src="data:image/jpeg;base64,${venda.comprovante_pagamento}" style="max-width:100%" />`);
                              }} className="text-orange-400 hover:text-orange-300 flex items-center gap-1 text-sm mt-2 ml-auto transition">
                                <Eye size={14} /> Ver Comprovante
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'garagem' && (
          <div>
            <div className="bg-gray-800 rounded-lg shadow-lg p-4 md:p-6 mb-6 border border-gray-700">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                <h2 className="text-xl md:text-2xl font-extrabold text-white uppercase tracking-wide">Minha Garagem</h2>
                <div className="flex items-center gap-3 flex-wrap">
                  {itensRecebidos.length > 0 && !todosGaragemPagos && (
                    <span className="text-xs text-red-400">Itens na garagem com pagamento pendente</span>
                  )}
                  {itensRecebidos.length > 0 && todosGaragemPagos && !podeSolicitar && motivoSolicitacao && (
                    <span className="text-xs text-yellow-400">{motivoSolicitacao}</span>
                  )}
                  <button onClick={handleSolicitarEnvio}
                    disabled={!podeEnviar}
                    className={`flex items-center gap-2 px-4 py-2 rounded font-semibold transition ${
                      !podeEnviar
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        : 'bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-600/30'
                    }`}>
                    <Send size={18} /> Solicitar Envio
                  </button>
                </div>
              </div>
              <p className="text-gray-500 mb-4">
                Estes são os carrinhos que já chegaram no centro de distribuição. Você pode solicitar o envio a qualquer momento.
              </p>

              {itensRecebidos.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <Warehouse size={64} className="mx-auto mb-4 text-gray-600" />
                  <p className="text-lg">Nenhum item na garagem ainda</p>
                  <p className="text-sm mt-2 text-gray-600">Quando seus carrinhos chegarem ao centro de distribuição, aparecerão aqui</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {itensRecebidos.map((venda) => {
                    const itemStatus = itensStatus[venda.id];
                    const jaEnviado = itemStatus?.ja_enviado || false;
                    
                    // Debug: mostrar o que está chegando do backend
                    console.log(`Item ${venda.id}: itemStatus=`, itemStatus, `jaEnviado=`, jaEnviado);
                    
                    return (
                      <div key={venda.id} className={`flex items-center gap-4 border rounded-lg p-3 relative ${
                        venda.pago ? 'bg-green-600/10 border-green-600/30' : 'bg-red-600/10 border-red-600/30'
                      } ${jaEnviado ? 'opacity-75' : ''}`}>
                        {!jaEnviado && (
                          <div className="absolute top-2 right-2">
                            <span className="flex items-center gap-1 text-xs bg-green-600/20 text-green-400 px-2 py-1 rounded-full border border-green-600/30">
                              <Package size={10} /> Novo
                            </span>
                          </div>
                        )}
                        {venda.lote_foto && (
                          <img src={`data:image/jpeg;base64,${venda.lote_foto}`} alt={venda.lote_nome}
                            className="w-16 h-16 object-cover rounded" />
                        )}
                        <div className="flex-1">
                          <p className="font-semibold text-white">{venda.carrinhos_comprados}</p>
                          <p className="text-sm text-gray-400">Lote: {venda.lote_nome}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-400">R$ {Number(venda.preco).toFixed(2)}</p>
                          <span className={`flex items-center gap-1 text-xs font-semibold ${
                            venda.pago ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {venda.pago ? <><Check size={12} /> Pago</> : <><X size={12} /> Não pago</>}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {fotosGaragem.length > 0 && (
              <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-6 border border-gray-700">
                <h3 className="text-xl font-bold mb-4 text-white">Fotos da Garagem</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {fotosGaragem.map((foto) => (
                    <div key={foto.id} className={`rounded-lg border overflow-hidden cursor-pointer hover:shadow-xl transition relative ${
                      foto.solicitado 
                        ? 'border-gray-600 opacity-75' 
                        : 'border-gray-700 hover:border-gray-500'
                    }`}
                      onClick={() => setSelectedFoto(foto)}>
                      {foto.solicitado && (
                        <div className="absolute top-2 right-2 bg-yellow-600 text-white px-2 py-1 rounded text-xs font-semibold z-10">
                          Solicitado
                        </div>
                      )}
                      <img src={`data:image/jpeg;base64,${foto.foto}`} alt={foto.descricao || 'Foto garagem'}
                        className="w-full h-40 object-cover" />
                      {foto.descricao && (
                        <div className="p-2 bg-gray-900/50">
                          <p className="text-sm text-gray-300">{foto.descricao}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {solicitacoes.length > 0 && (
              <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
                <h3 className="text-xl font-bold mb-4 text-white">Minhas Solicitações de Envio</h3>
                <div className="space-y-4">
                  {solicitacoes.map((sol) => (
                    <div key={sol.id} className="border border-gray-700 rounded-lg p-4 bg-gray-900/50">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-gray-400">
                          Solicitado em: <strong className="text-gray-300">{new Date(sol.data_solicitacao).toLocaleString('pt-BR')}</strong>
                        </span>
                        <span className={`px-3 py-1 rounded text-xs font-semibold ${
                          sol.status === 'pendente' ? 'bg-yellow-600/20 text-yellow-400 border border-yellow-600/30' :
                          sol.status === 'enviado' ? 'bg-green-600/20 text-green-400 border border-green-600/30' :
                          sol.status === 'entregue' ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-600/30' :
                          'bg-gray-700 text-gray-400'
                        }`}>
                          {sol.status === 'pendente' ? '⏳ Aguardando' :
                           sol.status === 'enviado' ? '📦 Enviado' :
                           sol.status === 'entregue' ? '✅ Entregue' : sol.status}
                        </span>
                      </div>
                      {sol.codigo_rastreio && (
                        <div className="mb-3 bg-gray-800 rounded p-3 flex items-center gap-2 border border-gray-700">
                          <Package size={16} className="text-orange-400" />
                          <span className="text-sm text-gray-400">Código de rastreio:</span>
                          <span className="font-mono font-semibold text-orange-400">{sol.codigo_rastreio}</span>
                        </div>
                      )}
                      {sol.itens && sol.itens.length > 0 && (
                        <div className="mt-3 border-t border-gray-700 pt-3">
                          <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-2">Itens neste envio</p>
                          <div className="space-y-2">
                            {sol.itens.map((item: any) => (
                              <div key={item.id} className="flex items-center gap-3 bg-gray-800 rounded p-2 border border-gray-700">
                                {item.lote_foto && (
                                  <img src={`data:image/jpeg;base64,${item.lote_foto}`} alt={item.lote_nome}
                                    className="w-10 h-10 object-cover rounded" />
                                )}
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-white">{item.carrinhos_comprados}</p>
                                  <p className="text-xs text-gray-500">{item.lote_nome}</p>
                                </div>
                                <span className="text-sm font-bold text-green-400">R$ {item.preco.toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {selectedFoto && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedFoto(null)}>
          <div className="max-w-3xl w-full bg-gray-800 rounded-lg shadow-2xl overflow-hidden border border-gray-700" onClick={(e) => e.stopPropagation()}>
            <img src={`data:image/jpeg;base64,${selectedFoto.foto}`} alt={selectedFoto.descricao || 'Foto'}
              className="w-full max-h-[70vh] object-contain" />
            <div className="p-4 flex justify-between items-center">
              <div>
                {selectedFoto.descricao && <p className="text-gray-200">{selectedFoto.descricao}</p>}
                <p className="text-sm text-gray-500">{new Date(selectedFoto.data_upload).toLocaleString('pt-BR')}</p>
              </div>
              <button onClick={() => setSelectedFoto(null)}
                className="bg-gray-700 text-gray-200 px-4 py-2 rounded hover:bg-gray-600 transition">
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
