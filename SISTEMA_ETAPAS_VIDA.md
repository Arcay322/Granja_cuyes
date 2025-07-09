# Sistema de Etapas de Vida para Cuyes

## Concepto: Gestión Automática de Etapas

### Etapas de Vida Definidas

#### Por Edad y Sexo:
1. **Cría** (0-3 meses): Todos los cuyes recién nacidos
2. **Juvenil** (3-6 meses): Cuyes en crecimiento
3. **Adulto Joven** (6-8 meses): Cuyes que alcanzan madurez

#### Por Propósito y Estado:
4. **Engorde** (machos 6-8 meses): Destinados a venta por carne
5. **Reproductor** (machos 8+ meses): Seleccionados para reproducción
6. **Reproductora** (hembras 6+ meses): Destinadas a reproducción
7. **Gestante** (hembras preñadas): En periodo de gestación
8. **Lactante** (hembras con crías): Amamantando crías

#### Estados Especiales:
9. **Enfermo**: Cuyes con problemas de salud
10. **Vendido**: Cuyes que fueron vendidos
11. **Fallecido**: Cuyes que fallecieron
12. **Retirado**: Cuyes retirados de reproducción

### Reglas de Transición Automática

#### Basadas en Edad:
- **0-3 meses**: Cría
- **3-6 meses**: Juvenil
- **6+ meses**: Evaluación para adulto

#### Basadas en Sexo y Propósito:
- **Machos 6-8 meses**: 
  - Si es de buena genética → Candidato a Reproductor
  - Si es para venta → Engorde
- **Hembras 6+ meses**:
  - Si es de buena genética → Reproductora
  - Si es para venta → Engorde

#### Basadas en Estado Reproductivo:
- **Preñez confirmada**: Gestante
- **Parto reciente**: Lactante
- **Fin de lactancia**: Vuelta a Reproductora

### Sistema de Notificaciones

#### Alertas por Edad:
- Crías próximas a juvenil (2.5 meses)
- Juveniles próximos a adulto (5.5 meses)
- Adultos listos para engorde/reproducción

#### Alertas por Estado:
- Hembras listas para primer cruce
- Machos listos para reproducción
- Gestantes próximas al parto
- Lactantes próximas al destete

### Implementación Técnica

#### Backend:
1. **Nuevo campo**: `etapaVida` en el modelo Cuy
2. **Servicio**: `etapasService.ts` para gestionar transiciones
3. **Cron job**: Evaluación diaria de transiciones automáticas
4. **API endpoints**: Para transiciones manuales

#### Frontend:
1. **Colores específicos** para cada etapa
2. **Widget de gestión** de etapas
3. **Dashboard** con alertas de transiciones
4. **Filtros** por etapa en las tablas

### Casos de Uso:

#### Flujo Automático:
1. **Cría nace** → Estado "Cría"
2. **A los 3 meses** → Evaluación automática → "Juvenil"
3. **A los 6 meses** → Evaluación manual → "Engorde" o "Reproductor/a"

#### Flujo Manual:
1. **Selección de reproductor** → Cambio manual a "Reproductor"
2. **Confirmación de preñez** → Cambio a "Gestante"
3. **Parto registrado** → Cambio a "Lactante"
4. **Destete completado** → Vuelta a "Reproductora"

Esta implementación te permitirá tener un control completo del ciclo de vida de cada cuy y optimizar la productividad de tu granja.
