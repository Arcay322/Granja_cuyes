# SUMAQ UYWA - Contribución

¡Gracias por tu interés en contribuir a SUMAQ UYWA! 🎉

## 🤝 Cómo Contribuir

### Reportar Problemas
- Usa la sección de [Issues](https://github.com/Arcay322/Granja_cuyes/issues)
- Describe claramente el problema
- Incluye pasos para reproducirlo
- Adjunta screenshots si es necesario

### Sugerir Mejoras
- Abre un issue con la etiqueta "enhancement"
- Explica detalladamente la mejora propuesta
- Justifica por qué sería útil

### Enviar Cambios
1. **Fork** del repositorio
2. **Crea una rama** para tu feature:
   ```bash
   git checkout -b feature/nueva-funcionalidad
   ```
3. **Realiza tus cambios** siguiendo las convenciones
4. **Commit** con mensajes descriptivos:
   ```bash
   git commit -m "feat: agregar gestión de galpones"
   ```
5. **Push** a tu rama:
   ```bash
   git push origin feature/nueva-funcionalidad
   ```
6. **Abre un Pull Request**

## 📝 Convenciones de Código

### TypeScript/JavaScript
- Usar TypeScript para nuevos archivos
- Nombres de componentes en PascalCase
- Nombres de funciones y variables en camelCase
- Usar interfaces para tipos de datos

### Commits
Seguir la convención [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` nuevas funcionalidades
- `fix:` corrección de bugs
- `docs:` documentación
- `style:` formato de código
- `refactor:` refactorización
- `test:` pruebas
- `chore:` tareas de mantenimiento

### Estructura de Componentes
```typescript
// Imports
import React from 'react';
import { ComponentProps } from './types';

// Interface
interface Props {
  // props definition
}

// Component
export const Component: React.FC<Props> = ({ prop1, prop2 }) => {
  // hooks
  // handlers
  // render
  return (
    // JSX
  );
};
```

## 🧪 Testing

- Agregar tests para nuevas funcionalidades
- Asegurar que todos los tests pasen
- Mantener cobertura de código

## 📚 Documentación

- Actualizar README.md si es necesario
- Comentar código complejo
- Documentar APIs nuevas

## 🚀 Proceso de Review

Todos los PRs serán revisados para:
1. Funcionalidad correcta
2. Calidad del código
3. Cumplimiento de convenciones
4. Documentación adecuada
5. Tests incluidos

## ❓ Preguntas

Si tienes preguntas, puedes:
- Abrir un issue con la etiqueta "question"
- Contactar a los mantenedores

¡Gracias por contribuir! 🙏
