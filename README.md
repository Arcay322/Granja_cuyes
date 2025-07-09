# CuyesGPT - Sistema de Gestión Integral de Granja de Cuyes 🐹

Una aplicación web fullstack moderna para la administración completa de granjas de cuyes, con herramientas para gestión de inventario, alimentación, salud, ventas, gastos y reproducción.

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

## 📁 Estructura del Proyecto

```
cuyesgpt/
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

## 🛠️ Instalación y Configuración

### Prerrequisitos
- Node.js (v16 o superior)
- PostgreSQL
- npm o yarn

### 1. Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/cuyesgpt.git
cd cuyesgpt
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
npm run prisma:generate  # Generar cliente Prisma
npm run prisma:migrate   # Ejecutar migraciones
```

## 🌐 API Endpoints

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registrar usuario

### Cuyes
- `GET /api/cuyes` - Listar cuyes
- `POST /api/cuyes` - Crear cuy
- `PUT /api/cuyes/:id` - Actualizar cuy
- `DELETE /api/cuyes/:id` - Eliminar cuy

### Gastos
- `GET /api/gastos` - Listar gastos
- `POST /api/gastos` - Crear gasto
- `PUT /api/gastos/:id` - Actualizar gasto
- `DELETE /api/gastos/:id` - Eliminar gasto

*Para más endpoints, consultar la documentación de API*

## 📱 Características Responsivas

La aplicación está optimizada para dispositivos móviles con:
- Diseño adaptativo en todas las pantallas
- Sidebar colapsable en móvil
- Tablas con scroll horizontal
- Formularios optimizados para móvil
- Navegación táctil mejorada

## 🔒 Seguridad

- Autenticación JWT
- Contraseñas hasheadas con bcrypt
- Validación de datos en frontend y backend
- Middlewares de seguridad
- Variables de entorno para datos sensibles

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Variables de Entorno

Crea un archivo `.env` en el directorio `backend/` basado en `.env.example`:

```env
PORT=4000
DATABASE_URL="postgresql://usuario:password@localhost:5432/cuyesdb"
JWT_SECRET="tu_clave_secreta_aqui"
NODE_ENV=development
```

## 🐛 Reportar Problemas

Si encuentras algún problema, por favor crea un issue en GitHub describiendo:
- Pasos para reproducir el problema
- Comportamiento esperado vs actual
- Screenshots si es aplicable
- Información del entorno (OS, navegador, versión de Node)

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 👨‍💻 Autor

**Tu Nombre** - [GitHub](https://github.com/tu-usuario)

---

⭐ ¡Si te gusta este proyecto, dale una estrella!
