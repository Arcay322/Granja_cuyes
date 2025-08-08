import React from 'react';
import ErrorBoundary, { ReproductionErrorFallback } from './ErrorBoundary';
import { useReproductionErrorHandler } from '../../hooks/useReproductionErrorHandler';

interface ReproductionErrorWrapperProps {
  children: React.ReactNode;
  context?: string;
}

const ReproductionErrorWrapper: React.FC<ReproductionErrorWrapperProps> = ({ 
  children, 
  context = 'Módulo de Reproducción' 
}) => {
  const { handleComponentError } = useReproductionErrorHandler();

  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Log del error específico del contexto
    console.error(`Error en ${context}:`, error, errorInfo);
    
    // Usar el handler personalizado
    const errorResult = handleComponentError(error, errorInfo);
    
    // Log adicional para el contexto específico
    const contextualLog = {
      context,
      component: errorInfo.componentStack?.split('\n')[1]?.trim(),
      error: error.message,
      timestamp: new Date().toISOString()
    };
    
    console.error('Error contextual:', contextualLog);

    // Si el error sugiere recargar, hacerlo después de un delay
    if (errorResult.shouldReload) {
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    }
  };

  return (
    <ErrorBoundary
      fallback={ReproductionErrorFallback}
      onError={handleError}
    >
      {children}
    </ErrorBoundary>
  );
};

export default ReproductionErrorWrapper;