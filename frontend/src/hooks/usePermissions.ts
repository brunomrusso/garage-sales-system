import { useState, useEffect } from 'react';
import { permissionService } from '../services/api';

interface Permissions {
  cliente_view: boolean;
  cliente_create: boolean;
  cliente_edit: boolean;
  cliente_delete: boolean;
  cliente_reset_pwd: boolean;
  lote_view: boolean;
  lote_create: boolean;
  lote_edit: boolean;
  lote_delete: boolean;
  lote_archive: boolean;
  venda_view: boolean;
  venda_create: boolean;
  venda_edit: boolean;
  venda_delete: boolean;
  venda_change_status: boolean;
  venda_mark_paid: boolean;
  garagem_view: boolean;
  garagem_edit: boolean;
  garagem_foto_upload: boolean;
  admin_manage_perms: boolean;
  admin_approve_admins: boolean;
  admin_view_audit: boolean;
  max_deletes_per_day: number;
}

export const usePermissions = (adminId: number) => {
  const [permissions, setPermissions] = useState<Permissions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPermissions = async () => {
      try {
        const response = await permissionService.obterPermissoes(adminId);
        setPermissions(response.data);
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Erro ao carregar permissões');
        setPermissions(null);
      } finally {
        setLoading(false);
      }
    };

    loadPermissions();
  }, [adminId]);

  const hasPermission = (permission: keyof Permissions): boolean => {
    if (!permissions) return false;
    return permissions[permission] === true;
  };

  const canCreateLote = () => hasPermission('lote_create');
  const canEditLote = () => hasPermission('lote_edit');
  const canDeleteLote = () => hasPermission('lote_delete');
  const canArchiveLote = () => hasPermission('lote_archive');

  const canCreateVenda = () => hasPermission('venda_create');
  const canEditVenda = () => hasPermission('venda_edit');
  const canDeleteVenda = () => hasPermission('venda_delete');
  const canChangeVendaStatus = () => hasPermission('venda_change_status');
  const canMarkVendaPaid = () => hasPermission('venda_mark_paid');

  const canCreateCliente = () => hasPermission('cliente_create');
  const canEditCliente = () => hasPermission('cliente_edit');
  const canDeleteCliente = () => hasPermission('cliente_delete');
  const canResetClientePassword = () => hasPermission('cliente_reset_pwd');

  const canViewGaragem = () => hasPermission('garagem_view');
  const canEditGaragem = () => hasPermission('garagem_edit');
  const canUploadFotoGaragem = () => hasPermission('garagem_foto_upload');

  const canManagePermissions = () => hasPermission('admin_manage_perms');
  const canApproveAdmins = () => hasPermission('admin_approve_admins');
  const canViewAudit = () => hasPermission('admin_view_audit');

  return {
    permissions,
    loading,
    error,
    hasPermission,
    canCreateLote,
    canEditLote,
    canDeleteLote,
    canArchiveLote,
    canCreateCliente,
    canEditCliente,
    canDeleteCliente,
    canResetClientePassword,
    canCreateVenda,
    canEditVenda,
    canDeleteVenda,
    canChangeVendaStatus,
    canMarkVendaPaid,
    canViewGaragem,
    canEditGaragem,
    canUploadFotoGaragem,
    canManagePermissions,
    canApproveAdmins,
    canViewAudit,
  };
};
