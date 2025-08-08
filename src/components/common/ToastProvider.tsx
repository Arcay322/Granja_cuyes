import React from 'react';
import { Toaster } from 'react-hot-toast';
import { useTheme } from '@mui/material/styles';

interface ToastProviderProps {
  children: React.ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const theme = useTheme();

  return (
    <>
      {children}
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={8}
        containerClassName=""
        containerStyle={{
          top: 80, // Account for app bar
          right: 20,
        }}
        toastOptions={{
          // Default options for all toasts
          duration: 4000,
          style: {
            background: theme.palette.background.paper,
            color: theme.palette.text.primary,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: theme.shape.borderRadius,
            boxShadow: theme.shadows[4],
            fontSize: '14px',
            maxWidth: '400px',
            padding: '12px 16px',
          },
          // Success toast styling
          success: {
            duration: 4000,
            style: {
              background: theme.palette.success.main,
              color: theme.palette.success.contrastText,
              border: `1px solid ${theme.palette.success.dark}`,
            },
            iconTheme: {
              primary: theme.palette.success.contrastText,
              secondary: theme.palette.success.main,
            },
          },
          // Error toast styling
          error: {
            duration: 6000,
            style: {
              background: theme.palette.error.main,
              color: theme.palette.error.contrastText,
              border: `1px solid ${theme.palette.error.dark}`,
            },
            iconTheme: {
              primary: theme.palette.error.contrastText,
              secondary: theme.palette.error.main,
            },
          },
          // Loading toast styling
          loading: {
            style: {
              background: theme.palette.info.main,
              color: theme.palette.info.contrastText,
              border: `1px solid ${theme.palette.info.dark}`,
            },
            iconTheme: {
              primary: theme.palette.info.contrastText,
              secondary: theme.palette.info.main,
            },
          },
        }}
      />
    </>
  );
};

export default ToastProvider;