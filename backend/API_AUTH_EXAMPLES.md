# Ejemplos de Autenticación (Registro y Login)

Puedes probar estos endpoints con Postman, Insomnia o cURL.

---

## Registro de usuario
- **POST http://localhost:4000/api/auth/register**
- Body (JSON):
```json
{
  "email": "usuario@ejemplo.com",
  "password": "tu_contraseña_segura"
}
```
- Respuesta esperada:
```json
{
  "id": 1,
  "email": "usuario@ejemplo.com"
}
```

---

## Login de usuario
- **POST http://localhost:4000/api/auth/login**
- Body (JSON):
```json
{
  "email": "usuario@ejemplo.com",
  "password": "tu_contraseña_segura"
}
```
- Respuesta esperada:
```json
{
  "token": "...jwt..."
}
```

---

## Proteger rutas con JWT
Para acceder a rutas protegidas, agrega el header:
```
Authorization: Bearer TU_TOKEN_JWT
```

Puedes usar el middleware `authenticateToken` en cualquier ruta para requerir autenticación.

¿Necesitas ejemplos para proteger rutas o para otros módulos?
