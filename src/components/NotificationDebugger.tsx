import React, { useState } from 'react';
import { Box, Button, Typography, Paper, Collapse, IconButton, Chip } from '../utils/mui';
import { useNotifications } from '../contexts/NotificationContext';
import { BugReport, ExpandMore, ExpandLess, Delete, Refresh } from '@mui/icons-material';

const NotificationDebugger: React.FC = () => {
  const { notifications, clearAll } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  const handleCheckNotifications = () => {
    if ((window as any).checkNotifications) {
      (window as any).checkNotifications();
      console.log('Manual notification check triggered');
    } else {
      console.log('checkNotifications function not available');
    }
  };

  const handleClearAll = () => {
    clearAll();
    console.log('All notifications cleared via debugger');
  };

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <Paper 
      sx={{ 
        position: 'fixed', 
        bottom: 20, 
        right: 20, 
        minWidth: 300,
        zIndex: 9999,
        backgroundColor: 'rgba(0,0,0,0.9)',
        color: 'white',
        borderRadius: 2,
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 1,
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          cursor: 'pointer',
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BugReport fontSize="small" />
          <Typography variant="body2" fontWeight="bold">
            Notification Debugger
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            label={notifications.length}
            size="small"
            sx={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', color: 'white' }}
          />
          <IconButton size="small" sx={{ color: 'white' }}>
            {isOpen ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Box>
      </Box>

      {/* Content */}
      <Collapse in={isOpen}>
        <Box sx={{ p: 2 }}>
          <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>
            Total: {notifications.length} notificaciones
          </Typography>

          {/* Actions */}
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<Refresh />}
              onClick={handleCheckNotifications}
              sx={{ color: 'white', borderColor: 'white' }}
            >
              Verificar ahora
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<Delete />}
              onClick={handleClearAll}
              sx={{ color: 'white', borderColor: 'white' }}
            >
              Limpiar todo
            </Button>
          </Box>

          {/* Notifications List */}
          {notifications.slice(0, 5).map((notification) => {
            const ageInHours = (Date.now() - notification.timestamp.getTime()) / (1000 * 60 * 60);
            const ageText = ageInHours < 24 
              ? `${Math.floor(ageInHours)}h` 
              : `${Math.floor(ageInHours / 24)}d`;
            
            return (
              <Box
                key={notification.id}
                sx={{
                  mb: 1,
                  p: 1,
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: 1,
                  fontSize: '0.75rem',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" fontWeight="bold">
                    {notification.title}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.6 }}>
                    {ageText}
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ display: 'block', opacity: 0.8 }}>
                  {notification.category} - {notification.type}
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', opacity: 0.6, fontSize: '0.7rem' }}>
                  {notification.message}
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', opacity: 0.5, fontSize: '0.65rem' }}>
                  ID: {notification.id.slice(-8)}
                </Typography>
              </Box>
            );
          })}

          {notifications.length > 5 && (
            <Typography variant="caption" sx={{ opacity: 0.6 }}>
              +{notifications.length - 5} más...
            </Typography>
          )}

          {notifications.length === 0 && (
            <Typography variant="caption" sx={{ opacity: 0.6 }}>
              No hay notificaciones
            </Typography>
          )}
        </Box>
      </Collapse>
    </Paper>
  );
};

export default NotificationDebugger;
