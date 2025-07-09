import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
// Importar rutas de todos los módulos
import cuyesRoutes from './routes/inventario/cuyes.routes';
import proveedoresRoutes from './routes/inventario/proveedores.routes';
import alimentosRoutes from './routes/alimentacion/alimentos.routes';
import saludRoutes from './routes/salud/salud.routes';
import ventasRoutes from './routes/ventas/ventas.routes';
import clientesRoutes from './routes/clientes/clientes.routes';
import gastosRoutes from './routes/gastos/gastos.routes';
import dashboardRoutes from './routes/dashboard/dashboard.routes';
import camadasRoutes from './routes/reproduccion/camadas.routes';
import prenezRoutes from './routes/reproduccion/prenez.routes';
import galponesRoutes from './routes/galpones.routes';
import etapasRoutes from './routes/etapas.routes';
import debugRoutes from './routes/debug.routes';
import authRoutes from './routes/auth.routes';
// Importar middleware
import { logger } from './utils/logger';
import { errorHandler } from './middlewares/errorHandler';

dotenv.config();

const app = express();

// Configuración de CORS para desarrollo y producción
const getAllowedOrigins = () => {
  if (process.env.NODE_ENV === 'production') {
    // En producción, usar la variable de entorno CORS_ORIGIN
    const corsOrigin = process.env.CORS_ORIGIN;
    return corsOrigin ? [corsOrigin] : [
      'https://sumaq-uywa-frontend.onrender.com',
      'https://sumaq-uywa-fontend.onrender.com'  // URL real del frontend desplegado
    ];
  }
  // En desarrollo, permitir localhost
  return ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174'];
};

const corsOptions = {
  origin: getAllowedOrigins(),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(logger);

// Registrar rutas de cada módulo
app.use('/api/cuyes', cuyesRoutes);
app.use('/api/proveedores', proveedoresRoutes);
app.use('/api/alimentos', alimentosRoutes);
app.use('/api/salud', saludRoutes);
app.use('/api/ventas', ventasRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/gastos', gastosRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reproduccion/camadas', camadasRoutes);
app.use('/api/reproduccion/prenez', prenezRoutes);
app.use('/api/galpones', galponesRoutes);
app.use('/api/etapas', etapasRoutes);
app.use('/api/debug', debugRoutes);
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'API de Granja de Cuyes funcionando correctamente' });
});

// Health check endpoint para Render
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'API funcionando correctamente',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.use(errorHandler);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Servidor backend escuchando en puerto ${PORT}`);
});
