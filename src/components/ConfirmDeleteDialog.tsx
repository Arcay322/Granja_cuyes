import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  useTheme
} from '../utils/mui';
import { Delete, Close } from '@mui/icons-material';

interface ConfirmDeleteDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  itemName?: string;
  loading?: boolean;
}

const ConfirmDeleteDialog: React.FC<ConfirmDeleteDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  itemName = 'elemento',
  loading = false
}) => {
  const theme = useTheme();

  const defaultTitle = `Confirmar eliminación`;
  const defaultMessage = `¿Está seguro de que desea eliminar este ${itemName}? Esta acción no se puede deshacer.`;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{ 
        sx: {
          borderRadius: 3,
          padding: 1,
          maxWidth: '400px'
        } 
      }}
    >
      <DialogTitle sx={{ fontWeight: 600 }}>
        {title || defaultTitle}
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1">
          {message || defaultMessage}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button 
          onClick={onClose} 
          variant="outlined" 
          color="inherit"
          startIcon={<Close />}
          sx={{ borderRadius: 2 }}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button 
          onClick={onConfirm} 
          variant="contained" 
          color="error"
          startIcon={<Delete />}
          sx={{ borderRadius: 2 }}
          disabled={loading}
        >
          {loading ? 'Eliminando...' : 'Eliminar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDeleteDialog;
