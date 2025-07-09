import React from 'react';
import { 
  Snackbar, Alert, Slide, Fade, Grow, Box, IconButton,
  useTheme, alpha
} from '../utils/mui';
import { 
  CheckCircle, Warning, Error, Info, Close
} from '@mui/icons-material';
import { useNotifications } from '../contexts/NotificationContext';

const TransitionUp = (props: any) => {
  return <Slide {...props} direction="up" />;
};

const NotificationToast: React.FC = () => {
  const { notifications, removeNotification } = useNotifications();
  const theme = useTheme();

  // Mostrar solo notificaciones de acciones del usuario (prioridad 'low')
  const userNotifications = notifications.filter(n => 
    !n.read && 
    n.priority === 'low' // Solo notificaciones de acciones del usuario
  );

  // Mostrar la notificación más reciente
  const latestNotification = userNotifications[0];

  if (!latestNotification) return null;

  const getIcon = () => {
    switch (latestNotification.type) {
      case 'success':
        return <CheckCircle />;
      case 'warning':
        return <Warning />;
      case 'error':
        return <Error />;
      default:
        return <Info />;
    }
  };

  const getSeverity = () => {
    return latestNotification.type;
  };

  const handleClose = () => {
    removeNotification(latestNotification.id);
  };

  return (
    <Snackbar
      open={true}
      autoHideDuration={6000}
      onClose={handleClose}
      TransitionComponent={TransitionUp}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      sx={{
        mt: 8, // Margen superior para que no tape la barra superior
        '& .MuiSnackbarContent-root': {
          backgroundColor: 'transparent',
          boxShadow: 'none',
          p: 0,
        }
      }}
    >
      <Alert
        severity={getSeverity()}
        onClose={handleClose}
        icon={getIcon()}
        sx={{
          boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.3)}`,
          borderRadius: 3,
          minWidth: 380,
          maxWidth: 450,
          border: `2px solid ${
            latestNotification.type === 'success' ? theme.palette.success.main :
            latestNotification.type === 'error' ? theme.palette.error.main :
            latestNotification.type === 'warning' ? theme.palette.warning.main :
            theme.palette.info.main
          }`,
          backgroundColor: theme.palette.background.paper,
          '& .MuiAlert-message': {
            p: 0,
            width: '100%',
          },
          '& .MuiAlert-icon': {
            fontSize: '1.5rem',
          },
          '& .MuiAlert-action': {
            pt: 0,
          }
        }}
      >
        <Box>
          <Box sx={{ 
            fontWeight: 700, 
            mb: 0.5,
            fontSize: '1rem',
            color: theme.palette.text.primary
          }}>
            {latestNotification.title}
          </Box>
          <Box sx={{ 
            fontSize: '0.875rem', 
            color: theme.palette.text.secondary,
            lineHeight: 1.4
          }}>
            {latestNotification.message}
          </Box>
        </Box>
      </Alert>
    </Snackbar>
  );
};

export default NotificationToast;
