import toast, { ToastOptions } from 'react-hot-toast';

type Id = string;
import React from 'react';

export type NotificationType = 'success' | 'error' | 'info' | 'warning' | 'loading';

export interface NotificationAction {
  label: string;
  action: () => void;
  style?: 'primary' | 'secondary';
}

export interface CustomNotificationOptions extends Partial<ToastOptions> {
  actions?: NotificationAction[];
  persistent?: boolean;
  showProgress?: boolean;
  progress?: number;
}

interface CustomToastProps {
  t: any;
  message: string;
  actions: NotificationAction[];
}

interface ProgressToastProps {
  message: string;
  progress: number;
}

const CustomToast: React.FC<CustomToastProps> = ({ t, message, actions }) => (
  <div style={{ 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '8px',
    minWidth: '300px'
  }}>
    <div>{message}</div>
    {actions.length > 0 && (
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        justifyContent: 'flex-end' 
      }}>
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={() => {
              action.action();
              toast.dismiss(t.id);
            }}
            style={{
              padding: '4px 12px',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              backgroundColor: action.style === 'primary' ? '#1976d2' : '#666',
              color: 'white'
            }}
          >
            {action.label}
          </button>
        ))}
      </div>
    )}
  </div>
);

const ProgressToast: React.FC<ProgressToastProps> = ({ message, progress }) => (
  <div style={{ minWidth: '250px' }}>
    <div style={{ marginBottom: '8px' }}>{message}</div>
    <div style={{ 
      width: '100%', 
      height: '4px', 
      backgroundColor: '#e0e0e0', 
      borderRadius: '2px',
      overflow: 'hidden'
    }}>
      <div style={{
        width: `${progress}%`,
        height: '100%',
        backgroundColor: '#1976d2',
        transition: 'width 0.3s ease'
      }} />
    </div>
    <div style={{ 
      fontSize: '12px', 
      color: '#666', 
      marginTop: '4px',
      textAlign: 'right'
    }}>
      {progress}%
    </div>
  </div>
);

export class ToastNotificationService {
  private static instance: ToastNotificationService;
  private activeToasts: Map<string, Id> = new Map();

  static getInstance(): ToastNotificationService {
    if (!ToastNotificationService.instance) {
      ToastNotificationService.instance = new ToastNotificationService();
    }
    return ToastNotificationService.instance;
  }

  /**
   * Show success notification
   */
  success(message: string, options?: CustomNotificationOptions): Id {
    const toastId = toast.success(message, {
      duration: options?.persistent ? Infinity : 4000,
      ...options
    });
    
    if (options?.persistent) {
      this.activeToasts.set(`success-${Date.now()}`, toastId);
    }
    
    return toastId;
  }

  /**
   * Show error notification
   */
  error(message: string, options?: CustomNotificationOptions): Id {
    const toastId = toast.error(message, {
      duration: options?.persistent ? Infinity : 6000,
      ...options
    });
    
    if (options?.persistent) {
      this.activeToasts.set(`error-${Date.now()}`, toastId);
    }
    
    return toastId;
  }

  /**
   * Show info notification
   */
  info(message: string, options?: CustomNotificationOptions): Id {
    const toastId = toast(message, {
      icon: 'ℹ️',
      duration: options?.persistent ? Infinity : 4000,
      style: {
        background: '#2196f3',
        color: 'white',
      },
      ...options
    });
    
    if (options?.persistent) {
      this.activeToasts.set(`info-${Date.now()}`, toastId);
    }
    
    return toastId;
  }

  /**
   * Show warning notification
   */
  warning(message: string, options?: CustomNotificationOptions): Id {
    const toastId = toast(message, {
      icon: '⚠️',
      duration: options?.persistent ? Infinity : 5000,
      style: {
        background: '#ff9800',
        color: 'white',
      },
      ...options
    });
    
    if (options?.persistent) {
      this.activeToasts.set(`warning-${Date.now()}`, toastId);
    }
    
    return toastId;
  }

  /**
   * Show loading notification
   */
  loading(message: string, options?: CustomNotificationOptions): Id {
    const toastId = toast.loading(message, {
      duration: Infinity,
      ...options
    });
    
    this.activeToasts.set(`loading-${Date.now()}`, toastId);
    return toastId;
  }

  /**
   * Update existing toast
   */
  update(toastId: Id, message: string, type: NotificationType = 'info'): void {
    switch (type) {
      case 'success':
        toast.success(message, { id: toastId });
        break;
      case 'error':
        toast.error(message, { id: toastId });
        break;
      case 'loading':
        toast.loading(message, { id: toastId });
        break;
      default:
        toast(message, { id: toastId });
    }
  }

  /**
   * Dismiss specific toast
   */
  dismiss(toastId: Id): void {
    toast.dismiss(toastId);
    // Remove from active toasts
    for (const [key, id] of this.activeToasts.entries()) {
      if (id === toastId) {
        this.activeToasts.delete(key);
        break;
      }
    }
  }

  /**
   * Dismiss all toasts
   */
  dismissAll(): void {
    toast.dismiss();
    this.activeToasts.clear();
  }

  /**
   * Show notification with custom actions
   */
  withActions(
    message: string, 
    type: NotificationType = 'info', 
    actions: NotificationAction[] = [],
    options?: CustomNotificationOptions
  ): Id {
    const toastId = toast.custom(
      (t) => <CustomToast t={t} message={message} actions={actions} />,
      {
        duration: options?.persistent ? Infinity : 6000,
        ...options
      }
    );

    if (options?.persistent) {
      this.activeToasts.set(`custom-${Date.now()}`, toastId);
    }

    return toastId;
  }

  /**
   * Show progress notification
   */
  progress(
    message: string, 
    progress: number, 
    options?: CustomNotificationOptions
  ): Id {
    return toast.custom(
      () => <ProgressToast message={message} progress={progress} />,
      {
        duration: Infinity,
        ...options
      }
    );
  }

  /**
   * Show notification for export job status
   */
  exportJobNotification(
    jobId: string,
    templateId: string,
    status: 'started' | 'progress' | 'completed' | 'failed',
    progress?: number,
    error?: string
  ): Id {
    const key = `export-${jobId}`;
    
    switch (status) {
      case 'started':
        const startToastId = this.loading(`Iniciando exportación de ${templateId}...`);
        this.activeToasts.set(key, startToastId);
        return startToastId;

      case 'progress':
        const existingToastId = this.activeToasts.get(key);
        if (existingToastId && progress !== undefined) {
          const progressToastId = this.progress(
            `Exportando ${templateId}...`,
            progress
          );
          this.dismiss(existingToastId);
          this.activeToasts.set(key, progressToastId);
          return progressToastId;
        }
        return this.info(`Exportando ${templateId}... ${progress}%`);

      case 'completed':
        const completedToastId = this.withActions(
          `Exportación de ${templateId} completada`,
          'success',
          [
            {
              label: 'Descargar',
              action: () => {
                // This will be handled by the component
                console.log('Download action for job:', jobId);
              },
              style: 'primary'
            }
          ],
          { persistent: true }
        );
        
        // Remove loading toast if exists
        const loadingToastId = this.activeToasts.get(key);
        if (loadingToastId) {
          this.dismiss(loadingToastId);
        }
        
        this.activeToasts.set(key, completedToastId);
        return completedToastId;

      case 'failed':
        const failedToastId = this.withActions(
          `Error en exportación de ${templateId}: ${error || 'Error desconocido'}`,
          'error',
          [
            {
              label: 'Reintentar',
              action: () => {
                // This will be handled by the component
                console.log('Retry action for job:', jobId);
              },
              style: 'primary'
            }
          ],
          { persistent: true }
        );
        
        // Remove loading toast if exists
        const failedLoadingToastId = this.activeToasts.get(key);
        if (failedLoadingToastId) {
          this.dismiss(failedLoadingToastId);
        }
        
        this.activeToasts.set(key, failedToastId);
        return failedToastId;

      default:
        return this.info(`Estado de exportación: ${status}`);
    }
  }

  /**
   * Get active toast count
   */
  getActiveCount(): number {
    return this.activeToasts.size;
  }

  /**
   * Check if specific toast is active
   */
  isActive(key: string): boolean {
    return this.activeToasts.has(key);
  }
}

// Export singleton instance
export const toastService = ToastNotificationService.getInstance();