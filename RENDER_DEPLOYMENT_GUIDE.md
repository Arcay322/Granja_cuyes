# 🚀 Guía Completa de Despliegue en Render - SUMAQ UYWA

Esta guía te llevará paso a paso para desplegar tu aplicación SUMAQ UYWA en Render.com, incluyendo:
- Backend API (Node.js/Express)
- Frontend (React/Vite)
- Base de datos PostgreSQL

## 📋 Prerrequisitos

- [x] Cuenta en GitHub (ya configurada)
- [x] Repositorio en GitHub con el código actualizado
- [ ] Cuenta en Render.com (gratis para empezar)
- [ ] Archivos de configuración preparados (ya los tienes)

## 🎯 Paso 1: Crear cuenta en Render

1. Ve a [render.com](https://render.com)
2. Haz clic en "Get Started for Free"
3. Conecta con tu cuenta de GitHub
4. Autoriza el acceso a tus repositorios

## 🗄️ Paso 2: Configurar la Base de Datos

### Opción A: Usar tu Base de Datos Supabase Existente ✅ (Recomendado si ya la tienes)

Si ya tienes una base de datos en Supabase:

**Método 1 - Usar tu .env existente (MÁS FÁCIL):**
1. Abre tu archivo `.env` local
2. Copia el valor de `DATABASE_URL` que ya tienes
3. **¡ESO ES TODO!** Esa misma URL funciona en Render

**Método 2 - Obtener nueva URL desde Supabase:**
1. Ve a tu proyecto en [supabase.com](https://supabase.com)
2. Ve a **Settings > Database**
3. Copia la **Connection String** (URI format):
   ```
   postgresql://postgres:[password]@[host]:[port]/postgres
   ```

4. **¡IMPORTANTE!** Guarda esta URL, la necesitarás para el backend

**💡 Tip**: La URL que tienes en tu `.env` local es la misma que necesitas en Render. Supabase usa URLs públicas que funcionan desde cualquier lugar.

### Opción B: Crear Nueva Base de Datos en Render

Si prefieres usar Render para la base de datos:

1. En el dashboard de Render, haz clic en **"New +"**
2. Selecciona **"PostgreSQL"**
3. Configura:
   - **Name**: `sumaq-uywa-database`
   - **Database**: `sumaq_uywa`
   - **User**: `sumaq_uywa_user` (o deja el default)
   - **Region**: Elige la más cercana a ti
   - **Plan**: Selecciona "Free" para empezar
4. Haz clic en **"Create Database"**
5. **¡IMPORTANTE!** Guarda los siguientes datos que aparecerán:
   ```
   Host: [tu-host]
   Database: sumaq_uywa
   Username: [tu-username]
   Password: [tu-password]
   Port: 5432
   ```
6. Copia el **"Internal Database URL"** (la necesitarás para el backend)

## 🔧 Paso 3: Desplegar el Backend API

1. En el dashboard de Render, haz clic en **"New +"**
2. Selecciona **"Web Service"**
3. Conecta tu repositorio GitHub `Granja_cuyes`
4. Configura el servicio:

### Configuración Básica:
- **Name**: `sumaq-uywa-backend`
- **Environment**: `Node`
- **Region**: La misma que elegiste para la base de datos
- **Branch**: `main`
- **Root Directory**: `backend`

### Configuración de Build y Start:
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start` ⚠️ **¡MUY IMPORTANTE: escribir exactamente "npm start" - NO "npm star"!**

### Variables de Entorno:
Haz clic en "Advanced" y agrega estas variables de entorno:

**Si usas Supabase (tu caso):**
```bash
NODE_ENV=production
PORT=10000
DATABASE_URL=tu_url_de_supabase_del_archivo_.env
JWT_SECRET=tu_jwt_secret_muy_seguro_aqui_123456789
CORS_ORIGIN=https://sumaq-uywa-frontend.onrender.com
```

**Ejemplo real de Supabase:**
```bash
NODE_ENV=production
PORT=10000
DATABASE_URL=postgresql://postgres.xxxxxxxxxxxxx:tu_password@aws-0-us-east-1.pooler.supabase.com:5432/postgres
JWT_SECRET=tu_jwt_secret_muy_seguro_aqui_123456789
CORS_ORIGIN=https://sumaq-uywa-frontend.onrender.com
```

**Si usas Render PostgreSQL:**
```bash
NODE_ENV=production
PORT=10000
DATABASE_URL=[Internal Database URL de Render]
JWT_SECRET=tu_jwt_secret_muy_seguro_aqui_123456789
CORS_ORIGIN=https://sumaq-uywa-frontend.onrender.com
```

**⚠️ Importante**: 
- **Para Supabase**: Usa la misma `DATABASE_URL` que tienes en tu archivo `.env` local - ¡funciona perfectamente!
- **Para Render**: Reemplaza con la Internal Database URL de tu PostgreSQL en Render
- Cambia `JWT_SECRET` por algo más seguro (puedes usar el mismo del `.env` local)
- La `CORS_ORIGIN` la actualizarás después con la URL real del frontend

### Plan:
- Selecciona **"Free"** para empezar

4. Haz clic en **"Create Web Service"**
5. Render comenzará a hacer el build automáticamente

## 🎨 Paso 4: Desplegar el Frontend

1. En el dashboard de Render, haz clic en **"New +"**
2. Selecciona **"Static Site"**
3. Conecta el mismo repositorio GitHub `Granja_cuyes`
4. Configura:

### Configuración Básica:
- **Name**: `sumaq-uywa-frontend`
- **Branch**: `main`
- **Root Directory**: `/` (raíz del proyecto)

### Configuración de Build:
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `dist`

### Variables de Entorno:
```bash
VITE_API_URL=https://sumaq-uywa-backend.onrender.com/api
```

**⚠️ Importante**: Reemplaza con la URL real de tu backend una vez que esté desplegado.

4. Haz clic en **"Create Static Site"**

## 🔄 Paso 5: Configurar Variables de Entorno Finales

Una vez que ambos servicios estén desplegados:

### Actualizar Backend:
1. Ve a tu servicio backend en Render
2. Ve a "Environment"
3. Actualiza `CORS_ORIGIN` con la URL real de tu frontend:
   ```
   CORS_ORIGIN=https://tu-nombre-frontend.onrender.com
   ```

### Actualizar Frontend:
1. Ve a tu servicio frontend en Render
2. Ve a "Environment" 
3. Verifica que `VITE_API_URL` apunte a tu backend:
   ```
   VITE_API_URL=https://tu-nombre-backend.onrender.com/api
   ```

## 🗃️ Paso 6: Ejecutar Migraciones de Base de Datos

### Si usas Supabase (tu caso):
1. Ve a tu servicio backend en Render
2. Ve a la pestaña "Shell"
3. Ejecuta estos comandos:
   ```bash
   npm run deploy
   ```
   
   Esto ejecutará:
   - `npx prisma migrate deploy` (aplica las migraciones a Supabase)
   - `npm run seed` (inserta datos iniciales en Supabase)

**Nota**: Las migraciones se aplicarán directamente a tu base de datos Supabase usando la `DATABASE_URL` que configuraste.

### Si usas Render PostgreSQL:
1. Ve a tu servicio backend en Render
2. Ve a la pestaña "Shell"
3. Ejecuta los mismos comandos mencionados arriba

## ✅ Paso 7: Verificar el Despliegue

### Verificar Backend:
1. Ve a la URL de tu backend: `https://tu-backend.onrender.com`
2. Deberías ver: `{"message": "API está funcionando correctamente"}`
3. Prueba un endpoint: `https://tu-backend.onrender.com/api/auth/health`

### Verificar Frontend:
1. Ve a la URL de tu frontend: `https://tu-frontend.onrender.com`
2. Deberías ver la página de login de SUMAQ UYWA
3. Intenta registrarte y hacer login

### Verificar Base de Datos:
1. En Render, ve a tu base de datos PostgreSQL
2. Ve a "Info" y luego "Connect"
3. Puedes usar los datos para conectarte con un cliente como pgAdmin

## 🔧 Configuración Automática con render.yaml

Tu proyecto ya incluye un archivo `render.yaml` que automatiza todo el proceso. Para usarlo:

1. En lugar de crear los servicios manualmente, puedes:
2. Ir a "Infrastructure as Code" en Render
3. Conectar tu repositorio
4. Render detectará automáticamente el `render.yaml` y creará todos los servicios

## 🚨 Solución de Problemas Comunes

### Error de Conexión a Base de Datos:
- **Para Supabase**: Verifica que la `DATABASE_URL` tenga el formato correcto y la contraseña sea correcta
- **Para Render**: Verifica que la `DATABASE_URL` esté correcta y uses la "Internal Database URL"

### Error de CORS:
- Verifica que `CORS_ORIGIN` en el backend apunte a la URL correcta del frontend
- Asegúrate de incluir `https://` en la URL

### Error 404 en el Frontend:
- Verifica que `VITE_API_URL` apunte a la URL correcta del backend
- Asegúrate de incluir `/api` al final

### Build Fallido:
- Revisa los logs en la pestaña "Events"
- Verifica que todas las dependencias estén en `package.json`

### Error "npm star" o "npm help star":
- **Problema**: Render ejecuta `npm star` en lugar de `npm start`
- **Solución**: Ve a Settings > Build & Deploy y corrige el "Start Command" a `npm start`

### Problemas Específicos de Supabase:
- **Error de conexión**: Verifica que tu proyecto Supabase esté activo y no pausado
- **Error de autenticación**: Asegúrate de usar la contraseña correcta de la base de datos
- **Error de SSL**: Supabase requiere SSL, asegúrate de que tu `DATABASE_URL` incluya `?sslmode=require` al final si es necesario

## 🔄 Actualizaciones Futuras

Para actualizar tu aplicación:
1. Haz push a tu repositorio en GitHub
2. Render automáticamente detectará los cambios
3. Hará rebuild y deploy automáticamente

## 💡 Consejos de Optimización

1. **Upgrade Plans**: Los planes gratuitos tienen limitaciones. Considera upgrade para producción.
2. **Custom Domains**: Puedes conectar tu propio dominio en la configuración.
3. **Environment Variables**: Usa archivos `.env` locales que no se suban a GitHub.
4. **Monitoring**: Render incluye métricas básicas de performance.

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs en Render
2. Consulta la [documentación oficial](https://render.com/docs)
3. Revisa este archivo y los issues comunes

---

¡Tu aplicación SUMAQ UYWA estará lista para usarse en producción! 🎉
