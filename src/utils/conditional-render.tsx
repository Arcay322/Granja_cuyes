import React from 'react';

/**
 * Componente para renderizar contenido de forma condicional sin necesidad de usar operadores ternarios
 * que puedan causar problemas con los fragmentos JSX.
 * 
 * @param condition - La condición que determina si el contenido se renderiza
 * @param children - El contenido a renderizar si la condición es verdadera
 * @returns El contenido si la condición es verdadera, o null si es falsa
 */
export const ConditionalRender: React.FC<{
  condition: boolean;
  children: React.ReactNode;
}> = ({ condition, children }) => {
  return condition ? <>{children}</> : null;
};

/**
 * Componente para manejar múltiples condiciones de renderizado, similar a un switch/case.
 * Recibe un conjunto de casos y renderiza el primero que coincida.
 * 
 * @example
 * <RenderSwitch>
 *   <RenderCase condition={loading}>
 *     <LoadingSpinner />
 *   </RenderCase>
 *   <RenderCase condition={error}>
 *     <ErrorMessage error={error} />
 *   </RenderCase>
 *   <RenderCase condition={data.length === 0}>
 *     <EmptyState />
 *   </RenderCase>
 *   <RenderDefault>
 *     <DataTable data={data} />
 *   </RenderDefault>
 * </RenderSwitch>
 */
export const RenderSwitch: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  // Busca el primer hijo (RenderCase) cuya condición sea true
  const childrenArray = React.Children.toArray(children);
  
  for (const child of childrenArray) {
    if (React.isValidElement(child)) {
      // Si es un RenderCase y su condición es true, renderizarlo
      if (child.type === RenderCase && child.props.condition) {
        return child;
      }
      // Si es un RenderDefault, guardarlo para el final
      if (child.type === RenderDefault) {
        continue;
      }
    }
  }
  
  // Si ningún RenderCase coincide, buscar un RenderDefault
  const defaultCase = childrenArray.find(
    child => React.isValidElement(child) && child.type === RenderDefault
  );
  
  return defaultCase ? (React.isValidElement(defaultCase) ? defaultCase : null) : null;
};

/**
 * Componente para definir un caso en el RenderSwitch.
 */
export const RenderCase: React.FC<{
  condition: boolean;
  children: React.ReactNode;
}> = ({ children }) => {
  return <>{children}</>;
};

/**
 * Componente para definir el caso por defecto en el RenderSwitch.
 */
export const RenderDefault: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  return <>{children}</>;
};

/**
 * Componente para manejar renderizado con estados de carga, error y datos.
 * Simplifica el patrón común de mostrar un spinner durante la carga,
 * un mensaje de error si hay un error, y el contenido real si todo está bien.
 * 
 * @example
 * <DataStateRenderer
 *   loading={loading}
 *   error={error}
 *   isEmpty={data.length === 0}
 *   loadingComponent={<CircularProgress />}
 *   errorComponent={<Alert severity="error">{error}</Alert>}
 *   emptyComponent={<Typography>No hay datos disponibles</Typography>}
 * >
 *   <DataTable data={data} />
 * </DataStateRenderer>
 */
export const DataStateRenderer: React.FC<{
  loading: boolean;
  error: string | null;
  isEmpty?: boolean;
  loadingComponent: React.ReactNode;
  errorComponent: React.ReactNode;
  emptyComponent?: React.ReactNode;
  children: React.ReactNode;
}> = ({ 
  loading, 
  error, 
  isEmpty = false, 
  loadingComponent, 
  errorComponent, 
  emptyComponent, 
  children 
}) => {
  return (
    <RenderSwitch>
      <RenderCase condition={loading}>
        {loadingComponent}
      </RenderCase>
      <RenderCase condition={!!error}>
        {errorComponent}
      </RenderCase>
      <RenderCase condition={!loading && !error && isEmpty && !!emptyComponent}>
        {emptyComponent}
      </RenderCase>
      <RenderDefault>
        {children}
      </RenderDefault>
    </RenderSwitch>
  );
};
