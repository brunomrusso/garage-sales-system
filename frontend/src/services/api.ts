import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Adicionar header X-Empresa-Slug se existir no localStorage
  // Mas NÃO sobrescrever se já foi definido na requisição
  const empresaSlug = localStorage.getItem('empresa_slug');
  if (empresaSlug && !config.headers['X-Empresa-Slug']) {
    config.headers['X-Empresa-Slug'] = empresaSlug;
  }
  
  return config;
});

export const authService = {
  loginAdmin: (email: string, senha: string, headers?: any) =>
    api.post('/auth/admin/login', { email, senha }, headers ? { headers } : undefined),
  loginCliente: (email: string, senha: string, headers?: any) =>
    api.post('/auth/cliente/login', { email, senha }, headers ? { headers } : undefined),
  trocarEmpresa: (empresaSlug: string) =>
    api.post('/auth/admin/trocar-empresa', null, { params: { empresa_slug: empresaSlug } }),
};

export const clienteService = {
  criar: (data: any, empresaSlug?: string) => {
    console.log('[CLIENTE-SERVICE] empresaSlug:', empresaSlug);
    console.log('[CLIENTE-SERVICE] headers:', empresaSlug ? { 'X-Empresa-Slug': empresaSlug } : {});
    return api.post('/clientes/', data, {
      headers: empresaSlug ? { 'X-Empresa-Slug': empresaSlug } : {}
    });
  },
  listar: () => api.get('/clientes/'),
  obter: (id: number) => api.get(`/clientes/${id}/`),
  atualizar: (id: number, data: any) => api.put(`/clientes/${id}`, data),
  deletar: (id: number) => api.delete(`/clientes/${id}`),
  listarAdminsPendentes: () => api.get('/clientes/admins-pendentes'),
  aprovarAdmin: (id: number) => api.post(`/clientes/${id}/aprovar-admin`),
  rejeitarAdmin: (id: number) => api.post(`/clientes/${id}/rejeitar-admin`),
  resetarSenha: (id: number, novaSenha: string) => api.post(`/clientes/${id}/resetar-senha`, { nova_senha: novaSenha }),
  alterarSenha: (id: number, senhaAtual: string, novaSenha: string) => api.post(`/clientes/${id}/alterar-senha`, { senha_atual: senhaAtual, nova_senha: novaSenha }),
};

export const compraService = {
  criar: (data: any) => api.post('/compras/', data),
  listarPorCliente: (clienteId: number) => api.get(`/compras/cliente/${clienteId}/`),
  obter: (id: number) => api.get(`/compras/${id}/`),
  atualizar: (id: number, data: any) => api.put(`/compras/${id}/`, data),
  deletar: (id: number) => api.delete(`/compras/${id}/`),
};

export const pagamentoService = {
  criar: (data: any) => api.post('/pagamentos/', data),
  listarPorCliente: (clienteId: number) => api.get(`/pagamentos/cliente/${clienteId}/`),
  obter: (id: number) => api.get(`/pagamentos/${id}/`),
  atualizar: (id: number, data: any) => api.put(`/pagamentos/${id}/`, data),
  deletar: (id: number) => api.delete(`/pagamentos/${id}/`),
};

export const solicitacaoService = {
  criar: (data: any) => api.post('/solicitacoes/', data),
  listar: () => api.get('/solicitacoes/'),
  listarPorCliente: (clienteId: number) => api.get(`/solicitacoes/cliente/${clienteId}/`),
  atualizar: (id: number, data: any) => api.put(`/solicitacoes/${id}/`, data),
};

export const loteService = {
  criar: (data: any) => api.post('/lotes/', data),
  listar: () => api.get('/lotes/'),
  obter: (id: number) => api.get(`/lotes/${id}/`),
  atualizar: (id: number, data: any) => api.put(`/lotes/${id}/`, data),
  deletar: (id: number) => api.delete(`/lotes/${id}/`),
  criarVenda: (data: any) => api.post('/lotes/vendas/', data),
  listarVendas: (loteId: number) => api.get(`/lotes/${loteId}/vendas/`),
  listarVendasCliente: (clienteId: number) => api.get(`/lotes/vendas/cliente/${clienteId}/`),
  atualizarVenda: (vendaId: number, data: any) => api.put(`/lotes/vendas/${vendaId}/`, data),
  deletarVenda: (vendaId: number) => api.delete(`/lotes/vendas/${vendaId}/`),
  listarArquivados: () => api.get('/lotes/arquivados/'),
  desarquivar: (loteId: number) => api.put(`/lotes/${loteId}/desarquivar/`),
  migrar: () => api.post('/lotes/migrar/'),
  buscarClientes: (termo: string) => api.get(`/lotes/buscar-clientes/${termo}/`),
  // Tributos
  criarTributo: (data: any) => api.post('/lotes/tributos/', data),
  listarTributos: (incluirArquivados = false) => api.get(`/lotes/tributos/?incluir_arquivados=${incluirArquivados}`),
  obterTributo: (tributoId: number) => api.get(`/lotes/tributos/${tributoId}/`),
  obterTributoPorRastreio: (rastreio: string) => api.get(`/lotes/tributos/rastreio/${rastreio}/`),
  obterVendasTributo: (rastreio: string) => api.get(`/lotes/tributos/rastreio/${rastreio}/vendas/`),
  atualizarTributo: (tributoId: number, data: any) => api.put(`/lotes/tributos/${tributoId}/`, data),
  arquivarTributo: (tributoId: number) => api.put(`/lotes/tributos/${tributoId}/arquivar/`),
  desarquivarTributo: (tributoId: number) => api.put(`/lotes/tributos/${tributoId}/desarquivar/`),
  deletarTributo: (tributoId: number) => api.delete(`/lotes/tributos/${tributoId}/`),
  obterTributosCliente: (clienteId: number) => api.get(`/lotes/vendas/cliente/${clienteId}/tributos/`),
  obterFaturamento: () => api.get('/lotes/faturamento/'),
};

export const garagemService = {
  adicionarFoto: (data: any) => api.post('/garagem/fotos/', data),
  listarFotos: (clienteId: number) => api.get(`/garagem/fotos/${clienteId}/`),
  deletarFoto: (fotoId: number) => api.delete(`/garagem/fotos/${fotoId}/`),
  criarSolicitacao: (data: any) => api.post('/garagem/solicitacoes/', data),
  listarSolicitacoesCliente: (clienteId: number) => api.get(`/garagem/solicitacoes/cliente/${clienteId}/`),
  listarTodasSolicitacoes: () => api.get('/garagem/solicitacoes/'),
  atualizarSolicitacao: (solId: number, data: any) => api.put(`/garagem/solicitacoes/${solId}/`, data),
  verificarFotosNaoSolicitadas: (clienteId: number) => api.get(`/garagem/fotos/${clienteId}/nao-solicitadas/`),
};

export const permissionService = {
  obterPermissoes: (adminId: number) => api.get(`/permissions/admin/${adminId}`),
  atualizarPermissoes: (adminId: number, data: any) => api.put(`/permissions/admin/${adminId}`, data),
  obterAuditoria: (params?: any) => api.get('/permissions/audit', { params }),
  obterResumoAtividades: (adminId: number, dias?: number) => 
    api.get(`/permissions/activity-summary/${adminId}`, { params: { dias } }),
  verificarAtividadeSuspeita: (adminId: number) => api.get(`/permissions/suspicious-activity/${adminId}`),
};

export const empresaService = {
  listarPublicas: () => api.get('/empresas/publicas/listar'),
  buscarEmpresasUsuario: (email: string) => api.get(`/empresas/usuario/buscar-por-email?email=${email}`),
  obterPorId: (id: number) => api.get(`/empresas/${id}`),
};

export const enderecoService = {
  criar: (data: any) => api.post('/enderecos/', data),
  listar: (clienteId: number) => api.get(`/enderecos/cliente/${clienteId}/`),
  atualizar: (enderecoId: number, data: any) => api.put(`/enderecos/${enderecoId}/`, data),
  deletar: (enderecoId: number) => api.delete(`/enderecos/${enderecoId}/`),
  definirPadrao: (enderecoId: number) => api.put(`/enderecos/${enderecoId}/padrao/`),
  validarCep: (cep: string) => api.get(`/enderecos/validar-cep/${cep}`),
};

export default api;
