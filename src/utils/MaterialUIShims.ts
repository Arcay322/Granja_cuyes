// MaterialUI Shims para resolver problemas de importación
// Este archivo proporciona tipos y definiciones que pueden faltar en la versión actual de Material UI

// Definición para SelectChangeEvent con una implementación concreta
export interface SelectChangeEvent<T = unknown> {
  target: {
    value: T;
    name?: string;
  };
}

// También exportamos una implementación/clase constructora por si Vite necesita un valor concreto
export const SelectChangeEventImpl = function<T = unknown>(value: T, name?: string): SelectChangeEvent<T> {
  return {
    target: {
      value,
      name
    }
  };
}
