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
  const baseOrigins = [
    'https://sumaq-uywa-frontend.onrender.com',
    'https://sumaq-uywa-fontend.onrender.com',  // URL real del frontend desplegado
    'http://localhost:3000', 
    'http://localhost:5173', 
    'http://localhost:5174'
  ];

  if (process.env.NODE_ENV === 'production') {
    // En producción, agregar también la variable de entorno si existe
    const corsOrigin = process.env.CORS_ORIGIN;
    if (corsOrigin && !baseOrigins.includes(corsOrigin)) {
      baseOrigins.push(corsOrigin);
    }
  }
  
  return baseOrigins;
};

const corsOptions = {
  origin: function (origin: string | undefined, callback: Function) {
    const allowedOrigins = getAllowedOrigins();
    
    console.log('🔍 CORS Request - Origin:', origin);
    console.log('🔍 CORS Request - Allowed:', allowedOrigins);
    
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) {
      console.log('✅ CORS: Allowing request with no origin');
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      console.log('✅ CORS: Origin allowed:', origin);
      callback(null, true);
    } else {
      console.log('❌ CORS: Origin blocked:', origin);
      console.log('❌ CORS: Expected one of:', allowedOrigins);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Cache-Control',
    'X-HTTP-Method-Override'
  ],
  preflightContinue: false,
  optionsSuccessStatus: 200
};

// Debug: Mostrar orígenes permitidos
console.log('🌐 CORS Origins permitidos:', getAllowedOrigins());
console.log('🌍 NODE_ENV:', process.env.NODE_ENV);
console.log('🎯 CORS_ORIGIN env var:', process.env.CORS_ORIGIN);

app.use(cors(corsOptions));
app.use(express.json());
app.use(logger);

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));

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
