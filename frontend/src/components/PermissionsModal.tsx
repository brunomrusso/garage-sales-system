import { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { permissionService } from '../services/api';

interface PermissionsModalProps {
  adminId: number;
  adminNome: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export const PermissionsModal = ({ adminId, adminNome, isOpen, onClose, onSave }: PermissionsModalProps) => {
  const [permissions, setPermissions] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadPermissions();
    }
  }, [isOpen, adminId]);

  const loadPermissions = async () => {
    setLoading(true);
    try {
      const response = await permissionService.obterPermissoes(adminId);
      setPermissions(response.data);
      setError('');
    } catch (err: any) {
      setError('Erro ao carregar permissões');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (field: string) => {
    setPermissions({
      ...permissions,
      [field]: !permissions[field]
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await permissionService.atualizarPermissoes(adminId, permissions);
      onSave();
      onClose();
    } catch (err: any) {
      setError('Erro ao salvar permissões');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-gray-700">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white">Permissões de {adminNome}</h2>
            <p className="text-gray-400 text-sm mt-1">Gerencie as permissões deste admin</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-400">Carregando permissões...</p>
            </div>
          ) : error ? (
            <div className="bg-red-600/20 border border-red-600/30 text-red-400 p-4 rounded mb-4">
              {error}
            </div>
          ) : permissions ? (
            <div className="space-y-6">
              {/* Cliente Permissions */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  👤 Permissões de Cliente
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { key: 'cliente_view', label: 'Visualizar clientes' },
                    { key: 'cliente_create', label: 'Criar clientes' },
                    { key: 'cliente_edit', label: 'Editar clientes' },
                    { key: 'cliente_delete', label: 'Deletar clientes' },
                    { key: 'cliente_reset_pwd', label: 'Resetar senha' },
                  ].map(perm => (
                    <label key={perm.key} className="flex items-center gap-3 p-3 bg-gray-700/30 rounded hover:bg-gray-700/50 cursor-pointer transition">
                      <input
                        type="checkbox"
                        checked={permissions[perm.key] || false}
                        onChange={() => handleToggle(perm.key)}
                        className="w-4 h-4 rounded"
                      />
                      <span className="text-gray-300">{perm.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Lote Permissions */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  📦 Permissões de Lote
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { key: 'lote_view', label: 'Visualizar lotes' },
                    { key: 'lote_create', label: 'Criar lotes' },
                    { key: 'lote_edit', label: 'Editar lotes' },
                    { key: 'lote_delete', label: 'Deletar lotes' },
                    { key: 'lote_archive', label: 'Arquivar lotes' },
                  ].map(perm => (
                    <label key={perm.key} className="flex items-center gap-3 p-3 bg-gray-700/30 rounded hover:bg-gray-700/50 cursor-pointer transition">
                      <input
                        type="checkbox"
                        checked={permissions[perm.key] || false}
                        onChange={() => handleToggle(perm.key)}
                        className="w-4 h-4 rounded"
                      />
                      <span className="text-gray-300">{perm.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Venda Permissions */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  💳 Permissões de Venda
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { key: 'venda_view', label: 'Visualizar vendas' },
                    { key: 'venda_create', label: 'Criar vendas' },
                    { key: 'venda_edit', label: 'Editar vendas' },
                    { key: 'venda_delete', label: 'Deletar vendas' },
                    { key: 'venda_change_status', label: 'Mudar status' },
                    { key: 'venda_mark_paid', label: 'Marcar como pago' },
                  ].map(perm => (
                    <label key={perm.key} className="flex items-center gap-3 p-3 bg-gray-700/30 rounded hover:bg-gray-700/50 cursor-pointer transition">
                      <input
                        type="checkbox"
                        checked={permissions[perm.key] || false}
                        onChange={() => handleToggle(perm.key)}
                        className="w-4 h-4 rounded"
                      />
                      <span className="text-gray-300">{perm.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Admin Permissions */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  🔐 Permissões de Admin
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { key: 'admin_manage_perms', label: 'Gerenciar permissões' },
                    { key: 'admin_view_audit', label: 'Ver auditoria' },
                  ].map(perm => (
                    <label key={perm.key} className="flex items-center gap-3 p-3 bg-gray-700/30 rounded hover:bg-gray-700/50 cursor-pointer transition">
                      <input
                        type="checkbox"
                        checked={permissions[perm.key] || false}
                        onChange={() => handleToggle(perm.key)}
                        className="w-4 h-4 rounded"
                      />
                      <span className="text-gray-300">{perm.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Limits */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  ⚙️ Limites
                </h3>
                <div className="p-3 bg-gray-700/30 rounded">
                  <label className="flex items-center gap-3">
                    <span className="text-gray-300">Máximo de deletions por dia:</span>
                    <input
                      type="number"
                      value={permissions.max_deletes_per_day || 0}
                      onChange={(e) => setPermissions({
                        ...permissions,
                        max_deletes_per_day: parseInt(e.target.value)
                      })}
                      className="bg-gray-600 text-white px-3 py-2 rounded w-20 border border-gray-500"
                      min="0"
                    />
                    <span className="text-gray-400 text-sm">(0 = sem limite)</span>
                  </label>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-900 border-t border-gray-700 p-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 text-gray-200 rounded hover:bg-gray-600 transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition disabled:opacity-50 flex items-center gap-2"
          >
            <Check size={18} />
            {saving ? 'Salvando...' : 'Salvar Permissões'}
          </button>
        </div>
      </div>
    </div>
  );
};
