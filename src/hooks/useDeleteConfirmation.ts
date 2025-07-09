import { useState } from 'react';
import { useNotificationService } from '../services/notificationService';

interface UseDeleteConfirmationProps {
  onDelete: (id: number) => Promise<void>;
  itemName: string;
  successMessage?: string;
  errorMessage?: string;
}

export const useDeleteConfirmation = ({ 
  onDelete, 
  itemName, 
  successMessage,
  errorMessage 
}: UseDeleteConfirmationProps) => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const notificationService = useNotificationService();

  const handleDeleteClick = (id: number) => {
    setDeleteId(id);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;

    setLoading(true);
    try {
      await onDelete(deleteId);
      notificationService.success(
        'Eliminación Exitosa',
        successMessage || `${itemName} eliminado correctamente`
      );
      setConfirmOpen(false);
      setDeleteId(null);
    } catch (error) {
      console.error(`Error al eliminar ${itemName}:`, error);
      notificationService.error(
        'Error al Eliminar',
        errorMessage || `No se pudo eliminar el ${itemName.toLowerCase()}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancelDelete = () => {
    setConfirmOpen(false);
    setDeleteId(null);
  };

  return {
    confirmOpen,
    loading,
    handleDeleteClick,
    handleConfirmDelete,
    handleCancelDelete,
    deleteId
  };
};
