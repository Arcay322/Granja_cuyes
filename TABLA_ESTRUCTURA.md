# Estructura Correcta de las Tablas en el Proyecto

## Estructura Uniforme

Todas las tablas deben seguir la misma estructura básica para mantener la consistencia y evitar errores JSX:

```jsx
// Estructura base de un componente de tabla
const MiTabla = () => {
  // ... estados y lógica ...

  return (
    <Paper sx={{ /* estilos */ }}>
      {/* Header con título y acciones */}
      <Box sx={{ /* estilos */ }}>
        {/* Título y acciones */}
      </Box>

      {/* Contenido condicional */}
      {loading ? (
        <Box sx={{ /* estilos */ }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <TableContainer sx={{ /* estilos SIN restricciones de altura */ }}>
            <Table>
              <TableHead>
                {/* ... */}
              </TableHead>
              <TableBody>
                {/* ... */}
              </TableBody>
            </Table>
          </TableContainer>
          
          {/* Paginación */}
          <TablePagination 
            /* ... props ... */
          />
        </>
      )}

      {/* Diálogos y menús (FUERA del Paper principal) */}
      <Dialog /* ... */}>
        {/* ... */}
      </Dialog>

      <Menu /* ... */}>
        {/* ... */}
      </Menu>
    </Paper>
  );
};
```

## Reglas importantes

1. **Uso correcto de `<Paper>`**:
   - Cada tabla debe estar envuelta en UN SOLO componente `<Paper>` principal.
   - Los diálogos, menús y otros componentes deben estar FUERA de ese `<Paper>` pero DENTRO del return.

2. **Evitar scroll vertical innecesario**:
   - No uses restricciones de altura como `maxHeight` o `height` en el `<TableContainer>`.
   - No configures `overflow: 'auto'` o `overflowY: 'auto'` en `<TableContainer>`.

3. **Paginación uniforme**:
   - Usa `<TablePagination>` con configuración idéntica entre tablas.
   - Asegúrate de que la paginación está dentro del fragmento `<>...</>` junto con `<TableContainer>`.

4. **Uso correcto de fragmentos**:
   - Cada fragmento `<>` debe tener su correspondiente `</>`.
   - No uses fragmentos innecesarios.

## Errores comunes a evitar

1. **Múltiples `<Paper>`**:
   - ❌ No uses múltiples componentes `<Paper>` para envolver partes de la tabla.

2. **Fragmentos mal cerrados**:
   - ❌ Nunca dejes un fragmento `<>` sin cerrar.
   - ❌ No anides fragmentos innecesariamente.

3. **Diálogos dentro del `<Paper>` principal**:
   - ❌ No pongas el `<Dialog>` dentro del componente `<Paper>` principal.

4. **Restricciones de altura**:
   - ❌ Evita `maxHeight` en `<TableContainer>` para prevenir scroll vertical.

## Ejemplo de código correcto

```jsx
return (
  <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
    {/* Header con título y acciones */}
    <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between' }}>
      <Typography variant="h6">Título</Typography>
      <Button variant="contained">Acción</Button>
    </Box>

    {/* Contenido condicional */}
    {loading ? (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Box>
    ) : (
      <>
        <TableContainer>
          <Table>
            {/* ... contenido de tabla ... */}
          </Table>
        </TableContainer>
        
        <TablePagination 
          rowsPerPageOptions={[10, 25, 50]}
          component="div"
          count={items.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </>
    )}
  </Paper>
);
```

Al seguir esta estructura estándar, asegurarás que todas las tablas tengan un comportamiento coherente y evitarás errores JSX comunes.
