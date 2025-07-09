# Sistema de Gestión de Crías y Etapas de Vida en CuyesGPT

## Resumen de Implementación

### Problema Original
Al registrar una camada en el sistema, solo se guardaba la información de la camada (número de vivos, muertos, etc.) pero no se creaban registros individuales para cada cría. Esto causaba que el conteo total de cuyes no se actualizara correctamente. Además, no existía un sistema para gestionar las diferentes etapas de vida de los cuyes.

### Solución Implementada

#### 1. Sistema de Crías (Automático)
1. **Creación Automática de Crías**: Cuando se registra una camada, el sistema automáticamente crea registros individuales para cada cría viva.
2. **Transacción Segura**: Se usa una transacción de Prisma para garantizar que tanto la camada como las crías se crean correctamente.
3. **Datos por Defecto para Crías**:
   - **Estado**: "Activo"
   - **Etapa de Vida**: "Cría"
   - **Sexo**: "Indefinido" (se puede actualizar después)
   - **Peso**: 0.08 kg (80g, peso promedio de cría)
   - **Raza**: Heredada de la madre o "Mixta" por defecto
   - **Ubicación**: Galpon y jaula de la madre o "General" por defecto
   - **Propósito**: "Indefinido" (se define cuando crezca)

#### 2. Sistema de Etapas de Vida (Nuevo)
1. **Gestión Automática**: Sistema que evalúa automáticamente las transiciones de etapa según edad, sexo y propósito.
2. **Transiciones Manuales**: Posibilidad de cambiar etapas manualmente según decisiones de manejo.
3. **Notificaciones**: Alertas sobre cuyes próximos a transición y sugerencias automáticas.

### Etapas de Vida Definidas

#### Por Edad y Desarrollo:
- **Cría** (0-3 meses): Cuyes recién nacidos
- **Juvenil** (3-6 meses): Cuyes en crecimiento
- **Adulto**: Cuyes que alcanzan madurez sexual

#### Por Propósito y Estado:
- **Engorde** (6+ meses): Destinados para venta por carne
- **Reproductor** (machos 8+ meses): Seleccionados para reproducción
- **Reproductora** (hembras 6+ meses): Destinadas a reproducción
- **Gestante** (hembras preñadas): En periodo de gestación
- **Lactante** (hembras con crías): Amamantando crías
- **Retirado**: Cuyes retirados de reproducción

### Reglas de Transición Automática

#### Basadas en Edad:
- **0-3 meses**: Cría → Juvenil (automático)
- **3-6 meses**: Juvenil → Evaluación para adulto
- **6+ meses**: Transición a Engorde/Reproductor según propósito

#### Basadas en Propósito:
- **Machos para reproducción**: Juvenil → Reproductor (8+ meses)
- **Machos para venta**: Juvenil → Engorde (6+ meses)
- **Hembras para reproducción**: Juvenil → Reproductora (6+ meses)
- **Hembras para venta**: Juvenil → Engorde (6+ meses)

#### Basadas en Estado Reproductivo:
- **Preñez confirmada**: Reproductora → Gestante
- **Parto reciente**: Gestante → Lactante
- **Fin de lactancia**: Lactante → Reproductora

#### Frontend (Actualización Visual)
1. **Actualización Automática**: Después de crear una camada, se actualizan tanto las camadas como los cuyes en el frontend.
2. **Visualización Mejorada**: Los cuyes con estado "Cría" se muestran con un chip de color naranja/amarillo.
3. **Soporte para Estados**: Se añadió soporte para todos los estados de cuyes:
   - **Activo**: Verde
   - **Cría**: Naranja/Amarillo
   - **Enfermo**: Rojo
   - **Vendido**: Azul
   - **Fallecido**: Rojo

### Archivos Modificados

#### Backend
- `backend/src/services/reproduccion/camadas.service.ts`: Lógica principal para crear camadas y crías
- `backend/src/controllers/reproduccion/camadas.controller.ts`: Controlador para manejo de camadas
- `backend/prisma/schema.prisma`: Documentación mejorada del campo `estado`

#### Frontend
- `src/components/CamadasTable.tsx`: Actualización automática de cuyes después de crear camadas
- `src/components/CuyesTable.tsx`: Soporte visual para crías

### Flujo de Creación de Camada

1. **Usuario registra camada** con:
   - Fecha de nacimiento
   - Número de vivos
   - Número de muertos
   - Padre (opcional)
   - Madre (requerida)

2. **Backend ejecuta transacción**:
   - Crea registro de camada
   - Para cada cría viva:
     - Crea registro individual de cuy
     - Asigna valores por defecto
     - Vincula con la camada

3. **Frontend actualiza**:
   - Recarga tabla de camadas
   - Recarga tabla de cuyes
   - Muestra notificación de éxito

## Consideraciones Futuras

### 1. Transición de Crías a Adultos
- **Opción A**: Automática después de 3 meses
- **Opción B**: Manual por el usuario
- **Opción C**: Recordatorio/notificación para actualizar

### 2. Gestión de Crías
- **Sección separada**: Mostrar crías en una sección dedicada
- **Filtros específicos**: Filtrar por edad, estado de desarrollo
- **Acciones especiales**: Determinar sexo, actualizar peso, etc.

### 3. Reportes y Estadísticas
- **Tasa de supervivencia**: Vivos vs muertos por camada
- **Productividad**: Promedio de crías por madre
- **Desarrollo**: Seguimiento de crecimiento de crías

### 4. Mejoras de UX
- **Wizard de registro**: Guía paso a paso para registrar camadas
- **Predicciones**: Estimación de fecha de parto basada en preñez
- **Alertas**: Notificaciones para seguimiento de crías

## Estados de Cuyes Soportados

| Estado | Descripción | Color | Uso |
|--------|-------------|-------|-----|
| Activo | Cuy adulto saludable | Verde | Cuyes listos para reproducción/venta |
| Cría | Cuy recién nacido | Naranja | Cuyes menores a 3 meses |
| Enfermo | Cuy con problemas de salud | Rojo | Cuyes que requieren atención veterinaria |
| Vendido | Cuy que fue vendido | Azul | Registro histórico de ventas |
| Fallecido | Cuy que falleció | Rojo | Registro para estadísticas |

## Logs y Depuración

El sistema incluye logging detallado para:
- Creación de camadas
- Creación automática de crías
- Conteo de cuyes antes/después
- Errores en el proceso

Revisar la consola del backend para ver estos logs durante el proceso de creación de camadas.
