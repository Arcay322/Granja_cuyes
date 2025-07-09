import { toast } from 'react-hot-toast';

class ToastService {
  // Crear toast de éxito
  success(title: string, message?: string) {
    toast.success(message ? `${title}: ${message}` : title, {
      duration: 4000,
      position: 'top-right',
      style: {
        border: '2px solid #4caf50',
        padding: '16px',
        borderRadius: '12px',
        fontSize: '14px',
        fontWeight: '500',
      },
    });
  }

  // Crear toast de error
  error(title: string, message?: string) {
    toast.error(message ? `${title}: ${message}` : title, {
      duration: 6000,
      position: 'top-right',
      style: {
        border: '2px solid #f44336',
        padding: '16px',
        borderRadius: '12px',
        fontSize: '14px',
        fontWeight: '500',
      },
    });
  }

  // Crear toast de advertencia
  warning(title: string, message?: string) {
    toast(message ? `${title}: ${message}` : title, {
      duration: 5000,
      position: 'top-right',
      icon: '⚠️',
      style: {
        border: '2px solid #ff9800',
        padding: '16px',
        borderRadius: '12px',
        fontSize: '14px',
        fontWeight: '500',
      },
    });
  }

  // Crear toast informativo
  info(title: string, message?: string) {
    toast(message ? `${title}: ${message}` : title, {
      duration: 4000,
      position: 'top-right',
      icon: 'ℹ️',
      style: {
        border: '2px solid #2196f3',
        padding: '16px',
        borderRadius: '12px',
        fontSize: '14px',
        fontWeight: '500',
      },
    });
  }

  // Crear toast de carga
  loading(message: string) {
    return toast.loading(message, {
      position: 'top-right',
      style: {
        border: '2px solid #9e9e9e',
        padding: '16px',
        borderRadius: '12px',
        fontSize: '14px',
        fontWeight: '500',
      },
    });
  }

  // Dismisses todos los toasts
  dismiss() {
    toast.dismiss();
  }
}

export const toastService = new ToastService();
export default toastService;
