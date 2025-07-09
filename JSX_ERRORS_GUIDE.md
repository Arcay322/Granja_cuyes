# Guía para prevenir errores JSX en React/TypeScript

## Errores comunes y cómo evitarlos

### 1. Etiquetas JSX no cerradas

Uno de los errores más comunes es olvidar cerrar una etiqueta JSX. Cada etiqueta que abres debe tener su correspondiente etiqueta de cierre.

```jsx
// ❌ Incorrecto
<Paper>
  <Typography>Texto</Typography>
  // Falta </Paper>

// ✅ Correcto
<Paper>
  <Typography>Texto</Typography>
</Paper>
```

### 2. Uso de fragmentos React

Los fragmentos (`<>...</>`) deben estar correctamente balanceados:

```jsx
// ❌ Incorrecto
<>
  <div>Contenido</div>
  // Falta </>

// ✅ Correcto
<>
  <div>Contenido</div>
</>
```

### 3. Anidamiento incorrecto

Las etiquetas deben cerrarse en el orden inverso al que se abrieron:

```jsx
// ❌ Incorrecto
<div><span>Texto</div></span>

// ✅ Correcto
<div><span>Texto</span></div>
```

### 4. Elementos autocierre

Los elementos sin hijos (self-closing) deben incluir una barra al final:

```jsx
// ❌ Incorrecto
<img src="imagen.jpg">

// ✅ Correcto
<img src="imagen.jpg" />
```

## Buenas prácticas para evitar errores JSX

1. **Usa un editor con resaltado de sintaxis**: VS Code con extensiones como ESLint, Prettier y TypeScript React (TSX) resaltan automáticamente errores de sintaxis.

2. **Identación adecuada**: Mantén una indentación consistente para visualizar fácilmente la estructura del código.

3. **Formateo automático**: Configura Prettier para formatear automáticamente tu código al guardar archivos.

4. **Linting en tiempo real**: Configura ESLint para detectar errores mientras escribes.

5. **Ejecuta los scripts de validación**: Antes de hacer commit, ejecuta:
   ```
   npm run validate-jsx
   ```

6. **Componentes pequeños**: Divide tus componentes grandes en componentes más pequeños y manejables.

## Herramientas en este proyecto

Este proyecto incluye varias herramientas para ayudarte a prevenir errores JSX:

1. **Scripts de detección**: 
   - `src/scripts/detect-jsx-errors.js`: Analiza archivos JSX/TSX para encontrar etiquetas mal balanceadas.
   - `src/scripts/validate-jsx.js`: Utiliza ESLint para validar la sintaxis JSX.
   - `src/scripts/fix-common-errors.js`: Intenta corregir automáticamente problemas comunes.

2. **Hooks Git pre-commit**: Se ejecutan automáticamente antes de cada commit para validar el código.

3. **Extensiones recomendadas para VS Code**:
   - ESLint
   - Prettier
   - Error Lens
   - Auto Close Tag
   - Auto Rename Tag

## Solución de problemas frecuentes

Si encuentras errores JSX persistentes:

1. **Revisa las etiquetas `<Paper>`**: Frecuentemente causan problemas si están mal cerradas.
2. **Examina los fragmentos JSX**: Asegúrate de que cada `<>` tenga su correspondiente `</>`.
3. **Verifica condiciones ternarias**: En expresiones como `{condition ? <Component /> : null}`.
4. **Ejecuta la validación manual**: `node src/scripts/detect-jsx-errors.js src/components/TuComponente.tsx`
5. **Usa el formateo de código**: Ctrl+Shift+F en VS Code para reformatear el archivo.

Al seguir estas prácticas, minimizarás los errores JSX y mantendrás un código limpio y funcional.
