# Requirements Document - Corrección de Funcionalidades de Reportes

## Introduction

La sección de reportes del módulo de reproducción tiene una estructura sólida y una interfaz completa, pero presenta problemas críticos en la implementación de funcionalidades core como la generación real de archivos, el sistema de jobs asíncronos, y el almacenamiento/descarga de archivos. Este spec aborda la corrección de estos problemas críticos para hacer que el sistema de reportes sea completamente funcional.

## Requirements

### Requirement 1: Generación Real de Archivos PDF/Excel/CSV

**User Story:** Como usuario del sistema, quiero poder exportar reportes en formatos PDF, Excel y CSV para poder compartir, imprimir y analizar los datos fuera del sistema.

#### Acceptance Criteria

1. WHEN el usuario selecciona "Exportar como PDF" THEN el sistema SHALL generar un archivo PDF real con los datos del reporte
2. WHEN el usuario selecciona "Exportar como Excel" THEN el sistema SHALL generar un archivo Excel (.xlsx) con múltiples hojas para diferentes secciones
3. WHEN el usuario selecciona "Exportar como CSV" THEN el sistema SHALL generar archivos CSV separados para cada tabla de datos
4. WHEN se genera un archivo PDF THEN el sistema SHALL incluir gráficos, tablas formateadas y metadatos del reporte
5. WHEN se genera un archivo Excel THEN el sistema SHALL incluir fórmulas, formato condicional y gráficos como imágenes
6. WHEN se genera un archivo CSV THEN el sistema SHALL usar codificación UTF-8 y separadores de coma estándar
7. WHEN la generación falla THEN el sistema SHALL registrar el error detallado y notificar al usuario con mensaje específico

### Requirement 2: Sistema de Jobs Asíncronos Funcional

**User Story:** Como usuario del sistema, quiero que las exportaciones de reportes se procesen en segundo plano para no bloquear la interfaz y poder realizar otras tareas mientras se genera el archivo.

#### Acceptance Criteria

1. WHEN el usuario inicia una exportación THEN el sistema SHALL crear un job asíncrono y retornar un ID de seguimiento
2. WHEN se crea un job THEN el sistema SHALL almacenar el estado inicial como "pending" en la base de datos
3. WHEN un job está procesándose THEN el sistema SHALL actualizar el estado a "processing" con timestamp
4. WHEN un job se completa exitosamente THEN el sistema SHALL actualizar el estado a "completed" con información del archivo
5. WHEN un job falla THEN el sistema SHALL actualizar el estado a "failed" con detalles del error
6. WHEN el usuario consulta el estado THEN el sistema SHALL retornar información actualizada del progreso
7. WHEN hay múltiples jobs THEN el sistema SHALL procesarlos en cola respetando el orden de llegada
8. WHEN un job lleva más de 10 minutos THEN el sistema SHALL marcarlo como "timeout" y limpiar recursos

### Requirement 3: Almacenamiento y Descarga de Archivos

**User Story:** Como usuario del sistema, quiero poder descargar los archivos exportados de forma segura y que estos estén disponibles por un tiempo limitado para optimizar el almacenamiento.

#### Acceptance Criteria

1. WHEN se completa la generación de un archivo THEN el sistema SHALL almacenarlo en un directorio seguro del servidor
2. WHEN se almacena un archivo THEN el sistema SHALL generar un nombre único y registrar metadatos (tamaño, tipo, fecha)
3. WHEN el usuario solicita descargar un archivo THEN el sistema SHALL verificar que existe y no ha expirado
4. WHEN se descarga un archivo THEN el sistema SHALL incrementar el contador de descargas y registrar la actividad
5. WHEN un archivo tiene más de 24 horas THEN el sistema SHALL marcarlo como expirado pero mantener el registro
6. WHEN se ejecuta limpieza automática THEN el sistema SHALL eliminar archivos físicos expirados pero conservar metadatos
7. WHEN se descarga un archivo THEN el sistema SHALL establecer headers correctos (Content-Type, Content-Disposition)
8. WHEN un archivo no existe o expiró THEN el sistema SHALL retornar error 404 con mensaje explicativo

### Requirement 4: Historial de Exportaciones Funcional

**User Story:** Como usuario del sistema, quiero ver un historial completo de mis exportaciones anteriores con su estado actual para poder redescargar archivos o identificar problemas.

#### Acceptance Criteria

1. WHEN el usuario accede al historial THEN el sistema SHALL mostrar todas las exportaciones ordenadas por fecha descendente
2. WHEN se muestra una exportación THEN el sistema SHALL incluir: fecha, tipo, formato, estado, tamaño, descargas
3. WHEN una exportación está completada y no expirada THEN el sistema SHALL mostrar botón de descarga activo
4. WHEN una exportación está en progreso THEN el sistema SHALL mostrar indicador de progreso y estado actual
5. WHEN una exportación falló THEN el sistema SHALL mostrar el error y opción de reintentar
6. WHEN una exportación expiró THEN el sistema SHALL mostrar indicador visual y deshabilitar descarga
7. WHEN el usuario hace clic en detalles THEN el sistema SHALL mostrar información completa del job
8. WHEN hay muchas exportaciones THEN el sistema SHALL implementar paginación con límite de 50 por página

### Requirement 5: Estadísticas de Reportes Reales

**User Story:** Como administrador del sistema, quiero ver estadísticas reales sobre el uso de reportes para monitorear la actividad y optimizar el sistema.

#### Acceptance Criteria

1. WHEN se accede a estadísticas THEN el sistema SHALL mostrar contadores reales de jobs por estado
2. WHEN se muestran estadísticas THEN el sistema SHALL incluir: total jobs, completados, fallidos, pendientes
3. WHEN se calculan estadísticas THEN el sistema SHALL mostrar distribución por formato (PDF, Excel, CSV)
4. WHEN se muestran estadísticas THEN el sistema SHALL incluir total de descargas realizadas
5. WHEN se actualizan estadísticas THEN el sistema SHALL calcular datos en tiempo real desde la base de datos
6. WHEN hay actividad reciente THEN el sistema SHALL mostrar tendencias de uso por período
7. WHEN se detectan errores frecuentes THEN el sistema SHALL destacar problemas en las estadísticas

### Requirement 6: Mejora de Feedback al Usuario

**User Story:** Como usuario del sistema, quiero recibir notificaciones claras y útiles sobre el estado de mis exportaciones para entender qué está pasando y qué acciones puedo tomar.

#### Acceptance Criteria

1. WHEN se inicia una exportación THEN el sistema SHALL mostrar notificación toast de confirmación con ID de job
2. WHEN una exportación se completa THEN el sistema SHALL mostrar notificación de éxito con opción de descarga
3. WHEN una exportación falla THEN el sistema SHALL mostrar notificación de error con detalles específicos
4. WHEN hay un error de red THEN el sistema SHALL mostrar mensaje específico y opción de reintentar
5. WHEN se está generando un archivo THEN el sistema SHALL mostrar overlay con progreso y opción de cancelar
6. WHEN se descarga un archivo THEN el sistema SHALL mostrar confirmación y actualizar contador
7. WHEN un archivo expira THEN el sistema SHALL notificar proactivamente al usuario
8. WHEN hay problemas del servidor THEN el sistema SHALL mostrar mensaje de mantenimiento con tiempo estimado

### Requirement 7: Validación y Manejo de Errores Robusto

**User Story:** Como usuario del sistema, quiero que el sistema maneje errores de forma elegante y me proporcione información útil para resolver problemas.

#### Acceptance Criteria

1. WHEN se validan parámetros de exportación THEN el sistema SHALL verificar formato, fechas y opciones
2. WHEN hay parámetros inválidos THEN el sistema SHALL retornar errores específicos por campo
3. WHEN falla la conexión a BD THEN el sistema SHALL reintentar automáticamente hasta 3 veces
4. WHEN se agota el espacio en disco THEN el sistema SHALL pausar nuevos jobs y notificar administradores
5. WHEN hay error en generación de PDF THEN el sistema SHALL logear detalles técnicos y mostrar mensaje amigable
6. WHEN se excede tiempo límite THEN el sistema SHALL cancelar el job y limpiar recursos parciales
7. WHEN hay errores concurrentes THEN el sistema SHALL manejar locks de base de datos apropiadamente
8. WHEN se detecta corrupción de archivo THEN el sistema SHALL regenerar automáticamente si es posible