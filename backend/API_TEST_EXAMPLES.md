# Ejemplos de Endpoints para Probar la API

Puedes usar Postman, Insomnia o cURL para probar los siguientes endpoints. Todos los endpoints devuelven y aceptan JSON.

---

## Inventario de Cuyes

- **Listar cuyes:**
  - `GET http://localhost:4000/api/cuyes`
- **Obtener cuy por ID:**
  - `GET http://localhost:4000/api/cuyes/1`
- **Crear cuy:**
  - `POST http://localhost:4000/api/cuyes`
  - Body ejemplo:
    ```json
    {
      "raza": "Peruano",
      "fechaNacimiento": "2025-07-01T00:00:00.000Z",
      "sexo": "M",
      "peso": 0.8,
      "galpon": "A",
      "jaula": "1",
      "estado": "vivo"
    }
    ```
- **Actualizar cuy:**
  - `PUT http://localhost:4000/api/cuyes/1`
  - Body igual al de creación
- **Eliminar cuy:**
  - `DELETE http://localhost:4000/api/cuyes/1`

---

## Alimentación (Alimentos)
- `GET http://localhost:4000/api/alimentos`
- `POST http://localhost:4000/api/alimentos` (body: nombre, descripcion, unidad, proveedorId, stock, costoUnitario)

## Salud (Historial)
- `GET http://localhost:4000/api/salud`
- `POST http://localhost:4000/api/salud` (body: cuyId, tipo, fecha, descripcion, veterinario)

## Ventas
- `GET http://localhost:4000/api/ventas`
- `POST http://localhost:4000/api/ventas` (body: fecha, clienteId, total, estadoPago)

## Gastos
- `GET http://localhost:4000/api/gastos`
- `POST http://localhost:4000/api/gastos` (body: concepto, fecha, monto, categoria)

## Dashboard
- `GET http://localhost:4000/api/dashboard/metrics`
- `GET http://localhost:4000/api/dashboard/population`
- `GET http://localhost:4000/api/dashboard/ventas`
- `GET http://localhost:4000/api/dashboard/gastos`
- `GET http://localhost:4000/api/dashboard/productividad`

---

> Modifica los IDs y los cuerpos según los datos que tengas en tu base. Si necesitas ejemplos de body para otros módulos, avísame.
