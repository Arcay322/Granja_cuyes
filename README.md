# SUMAQ UYWA - Sistema de Gestión Integral de Granja de Cuyes 🐹

[![MIT License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E=16.x-brightgreen)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/postgresql-%3E=13.x-blue)](https://www.postgresql.org/)

Una aplicación web fullstack moderna para la administración completa de granjas de cuyes, con herramientas para gestión de inventario, alimentación, salud, ventas, gastos y reproducción.

---

🔗 **Documentación API Swagger:** [http://localhost:4000/api/docs](http://localhost:4000/api/docs)

---

## 🚀 Tecnologías

### Frontend
- **React 18** con TypeScript
- **Vite** para desarrollo y build
- **Material UI** para componentes de UI
- **React Router** para navegación
- **Axios** para comunicación con API

### Backend
- **Node.js** con Express y TypeScript
- **Prisma ORM** para base de datos
- **PostgreSQL** como base de datos principal
- **JWT** para autenticación
- **bcrypt** para hash de contraseñas
- **Swagger/OpenAPI** para documentación automática
- **Winston** para logging avanzado
- **Helmet, CORS, Rate Limiting, Compression** para seguridad y performance

## 📁 Estructura del Proyecto

```
sumaq-uywa/
├── src/                      # Frontend React
│   ├── components/           # Componentes reutilizables
│   ├── pages/               # Páginas principales
│   ├── layouts/             # Layouts de aplicación
│   ├── services/            # Servicios API
│   ├── theme/               # Configuración de temas
│   └── utils/               # Utilidades
├── backend/                 # API Backend
│   ├── src/
│   │   ├── controllers/     # Controladores de rutas
│   │   ├── routes/          # Definición de rutas
│   │   ├── services/        # Lógica de negocio
│   │   ├── middlewares/     # Middlewares personalizados
│   │   └── utils/           # Utilidades del backend
│   └── prisma/              # Esquemas y migraciones
└── public/                  # Archivos estáticos
```

## 🌐 Tabla de Endpoints Principales

| Método | Endpoint                | Descripción                        | Auth |
|--------|-------------------------|------------------------------------|------|
| POST   | /api/auth/login         | Iniciar sesión                     | ❌   |
| POST   | /api/auth/register      | Registrar usuario                  | ❌   |
| GET    | /api/cuyes              | Listar cuyes                       | ✅   |
| POST   | /api/cuyes              | Crear cuy                          | ✅   |
| PUT    | /api/cuyes/:id          | Actualizar cuy                     | ✅   |
| DELETE | /api/cuyes/:id          | Eliminar cuy                       | ✅   |
| GET    | /api/gastos             | Listar gastos                      | ✅   |
| POST   | /api/gastos             | Crear gasto                        | ✅   |
| PUT    | /api/gastos/:id         | Actualizar gasto                   | ✅   |
| DELETE | /api/gastos/:id         | Eliminar gasto                     | ✅   |
| GET    | /api/alimentos          | Listar alimentos                   | ✅   |
| POST   | /api/alimentos          | Crear alimento                     | ✅   |
| PUT    | /api/alimentos/:id      | Actualizar alimento                | ✅   |
| DELETE | /api/alimentos/:id      | Eliminar alimento                  | ✅   |
| GET    | /api/dashboard/metrics  | Métricas generales                 | ✅   |
| GET    | /api/health             | Health check                       | ❌   |

*Consulta la [documentación Swagger](http://localhost:4000/api/docs) para ver todos los endpoints y detalles.*

## 🧑‍💻 Ejemplo de uso de la API

```bash
# Login y obtención de token
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@demo.com","password":"123456"}'

# Usar el token para acceder a un endpoint protegido
curl -X GET http://localhost:4000/api/cuyes \
  -H "Authorization: Bearer <tu_token>"
```

## 🛠️ Instalación y Configuración

### Prerrequisitos
- Node.js (v16 o superior)
- PostgreSQL
- npm o yarn

### 1. Clonar el repositorio
```bash
git clone https://github.com/Arcay322/Granja_cuyes.git
cd sumaq-uywa
```

### 2. Configurar el Frontend
```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

### 3. Configurar el Backend
```bash
# Ir al directorio del backend
cd backend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de base de datos
```

### 4. Configurar Base de Datos
```bash
# Ejecutar migraciones
npx prisma migrate dev --name init

# Opcional: Poblar con datos de ejemplo
npx prisma db seed
```

### 5. Iniciar el Backend
```bash
npm run dev
```

## 🎯 Características Principales

### 📊 Dashboard Integral
- Vista general de la granja
- Estadísticas en tiempo real
- Alertas y notificaciones
- Gráficos y métricas

### 🐹 Gestión de Cuyes
- Registro individual de cuyes
- Seguimiento por galpones y jaulas
- Historial médico y reproductivo
- Estados y categorías personalizables

### 🌾 Control de Alimentación
- Registro de alimentos y raciones
- Programación de alimentación
- Control de inventario de alimentos
- Cálculo de costos por ración

### 🏥 Gestión de Salud
- Registro de tratamientos y vacunas
- Historial médico completo
- Diagnósticos y seguimientos
- Alertas de tratamientos pendientes

### 💰 Módulo de Ventas
- Registro de ventas y clientes
- Seguimiento de ingresos
- Reportes de rentabilidad
- Gestión de inventario disponible

### 📈 Control de Gastos
- Categorización de gastos
- Seguimiento de costos operativos
- Reportes financieros
- Análisis de rentabilidad

### 👶 Gestión de Reproducción
- Control de preñez y partos
- Registro de camadas
- Seguimiento genealógico
- Planificación reproductiva

## 🔧 Scripts Disponibles

### Frontend
```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build de producción
npm run preview      # Preview del build
npm run lint         # Linting
```

### Backend
```bash
npm run dev          # Servidor de desarrollo con nodemon
npm run build        # Compilar TypeScript
npm run start        # Ejecutar versión compilada
npm run test         # Ejecutar tests con Jest
npm run prisma:generate  # Generar cliente Prisma
npm run prisma:migrate   # Ejecutar migraciones
npm run prisma:reset     # Resetear base de datos (desarrollo)
```

## 🧪 Testing

```bash
# Ejecutar todos los tests del backend
cd backend
npm run test
```
- Los tests usan Jest y Supertest.
- Los resultados se muestran en consola.
- Configuración de base de datos de prueba separada.

## 🔧 Estabilización del Proyecto

### Cambios Recientes (Semana 1)
El proyecto ha pasado por un proceso de estabilización que incluye:

- ✅ **Corrección de errores TypeScript**: Eliminados 27+ errores de compilación
- ✅ **Estabilización de base de datos**: Implementado patrón singleton para PrismaClient
- ✅ **Servicios WebSocket**: Implementados métodos de broadcast faltantes
- ✅ **Suite de pruebas**: Corregidos mocks y configuración de Jest
- ✅ **Notificaciones**: Convertido servicio de toast a formato React apropiado

### Configuración de Base de Datos Mejorada
```bash
# Resetear base de datos en desarrollo
cd backend
npx prisma migrate reset

# Generar cliente Prisma actualizado
npx prisma generate

# Poblar con datos de prueba
npx prisma db seed
```

### Variables de Entorno Actualizadas
Asegúrate de tener estas variables en tu archivo `.env`:
```env
# Base de datos
DATABASE_URL="postgresql://usuario:password@localhost:5432/cuyesdb"

# Autenticación
JWT_SECRET="tu_clave_secreta_muy_segura"

# Configuración del servidor
PORT=4000
NODE_ENV=development

# Logging
LOG_LEVEL=info
```

## 🏗️ Migraciones y Seeders

```bash
# Crear una nueva migración
npx prisma migrate dev --name <nombre>

# Poblar la base de datos con datos de ejemplo
npx prisma db seed
```

## ❓ FAQ

- **¿Por qué recibo 'Token requerido' en Swagger?**
  - Debes hacer login y usar el botón Authorize para enviar tu JWT.
- **¿Cómo restauro el entorno completo?**
  - Sigue la sección "Restaurar entorno completo" al final de este README.
- **¿Dónde está la documentación de la API?**
  - En `/api/docs` (Swagger UI).
- **¿Cómo contribuyo?**
  - Lee la sección "Contribuir".

## 📝 Variables de Entorno

Crea un archivo `.env` en el directorio `backend/` basado en `.env.example`:

```env
PORT=4000
DATABASE_URL="postgresql://usuario:password@localhost:5432/cuyesdb"
JWT_SECRET="tu_clave_secreta_aqui"
NODE_ENV=development
```

## � Despliegue en Producción

### Render.com (Recomendado)

Este proyecto está configurado para despliegue automático en Render. Sigue estos pasos:

1. **Preparación**:
   ```bash
   # En Windows PowerShell
   .\prepare-for-render.ps1
   
   # O en bash/Linux/Mac
   ./prepare-for-render.sh
   ```

2. **Subir a GitHub** (si no lo has hecho):
   ```bash
   git add .
   git commit -m "Preparado para despliegue en Render"
   git push origin main
   ```

3. **Desplegar en Render**:
   - Lee la guía completa en [`RENDER_DEPLOYMENT_GUIDE.md`](RENDER_DEPLOYMENT_GUIDE.md)
   - El archivo `render.yaml` automatiza todo el proceso
   - Incluye backend, frontend y base de datos PostgreSQL

### Características del Despliegue:
- ✅ **Base de datos PostgreSQL** automática
- ✅ **Migraciones automáticas** de Prisma
- ✅ **Variables de entorno** preconfiguradas
- ✅ **CORS** configurado para producción
- ✅ **Health checks** incluidos
- ✅ **SSL/HTTPS** automático
- ✅ **Auto-deploy** desde GitHub

### Otros Servicios de Hosting:
- Vercel (Frontend) + Railway (Backend + DB)
- Netlify (Frontend) + Heroku (Backend + DB)
- AWS, Digital Ocean, etc.

📖 **Para instrucciones detalladas, consulta [`RENDER_DEPLOYMENT_GUIDE.md`](RENDER_DEPLOYMENT_GUIDE.md)**

## �🐛 Reportar Problemas

Si encuentras algún problema, por favor crea un issue en GitHub describiendo:
- Pasos para reproducir el problema
- Comportamiento esperado vs actual
- Screenshots si es aplicable
- Información del entorno (OS, navegador, versión de Node)

## 📄 Otros documentos útiles
- [CONTRIBUTING.md](CONTRIBUTING.md)
- [RENDER_DEPLOYMENT_GUIDE.md](RENDER_DEPLOYMENT_GUIDE.md)
- [LICENSE](LICENSE)

## 👨‍💻 Autor

**Arcay322** - [GitHub](https://github.com/Arcay322)

---

⭐ ¡Si te gusta este proyecto, dale una estrella!

## 🔄 Restaurar entorno completo (backend y frontend)

Si necesitas restaurar la versión estable del proyecto:

1. Clona el repositorio y cambia a la rama develop:
   ```bash
   git clone https://github.com/Arcay322/Granja_cuyes.git
   cd Granja_cuyes
   git checkout develop
   ```
2. Instala dependencias en la raíz y en backend:
   ```bash
   npm install
   cd backend
   npm install
   ```
3. Inicia backend y frontend normalmente según la documentación.

## 🙏 Créditos y agradecimientos
- Inspirado por la comunidad open source.
- Gracias a todos los testers y usuarios que reportan bugs y proponen mejoras.
