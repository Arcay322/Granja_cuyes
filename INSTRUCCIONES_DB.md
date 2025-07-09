# Instrucciones para inicializar la base de datos

Para solucionar los problemas con las relaciones de la base de datos, sigue estos pasos:

1. Asegúrate de que tu servidor backend esté funcionando con `npm run dev`

2. Ejecuta el script para crear el proveedor por defecto:

```bash
cd backend
npx ts-node src/scripts/createDefaultProveedor.ts
```

Esto creará un proveedor predeterminado con ID 1 que será utilizado por los alimentos.

## Problemas Solucionados

1. **Fecha de nacimiento en Cuyes**: Se corrigió el formato de fechas para asegurar que sean válidas.
2. **Relación de Proveedor en Alimentos**: Se agregó la relación con el proveedor predeterminado.

Ahora deberías poder crear y modificar cuyes y alimentos sin problemas.
