import React, { useState, useEffect } from 'react';
import toastService from '../services/toastService';
import { useDeleteConfirmation } from '../hooks/useDeleteConfirmation';
import ConfirmDeleteDialog from './ConfirmDeleteDialog';
import { 
  Box, Typography, Paper, Button, TextField, Modal, 
  IconButton, FormControl, InputLabel, 
  Select, MenuItem, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, TablePagination, Breadcrumbs, Link, 
  Grid, Checkbox, Toolbar, Slide, Fab, Tooltip, CircularProgress,
  alpha, useTheme
} from '../utils/mui';
import { 
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Pets as PetsIcon,
  Link as LinkIcon,
  Search as SearchIcon,
  Refresh, DeleteSweep, SelectAll, CheckBox, CheckBoxOutlineBlank, Close
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import api from '../services/api';
import { es } from 'date-fns/locale/es';

// Ajuste de estilo para los labels de Material UI
const LABEL_STYLE = {
  fontSize: '16px',
  fontWeight: 'normal',
  width: 'auto',
  overflow: 'visible',
  whiteSpace: 'nowrap', 
  textOverflow: 'clip',
  maxWidth: 'none',
  // Evita que se abrevie el texto
  '&.MuiInputLabel-root': {
    textOverflow: 'initial'
  }
};

const CamadasTable = () => {
  const [camadas, setCamadas] = useState<any[]>([]);
  const [cuyes, setCuyes] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [currentCamada, setCurrentCamada] = useState<any>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fechaNacimiento: new Date(),
    numVivos: 0,
    numMuertos: 0,
    padreId: '',
    madreId: '',
  });
  const [errors, setErrors] = useState({
    fechaNacimiento: '',
    numVivos: '',
    numMuertos: '',
    madreId: '',
  });
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Hook para confirmación de eliminación
  const deleteConfirmation = useDeleteConfirmation({
    onDelete: async (id: number) => {
      await api.delete(`/reproduccion/camadas/${id}`);
      fetchCamadas();
    },
    itemName: 'Camada',
    successMessage: 'Camada eliminada exitosamente'
  });

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchCamadas();
    fetchCuyes();
  }, []);

  // Obtener camadas desde la API
  const fetchCamadas = async () => {
    setLoading(true);
    try {
      const response = await api.get('/reproduccion/camadas');
      setCamadas((response.data as any) || []);
      setLoading(false);
    } catch (error) {
      console.error('Error al cargar camadas:', error);
      toastService.error(
        'Error al Cargar',
        'No se pudieron cargar las camadas'
      );
      setLoading(false);
    }
  };    // Obtener cuyes desde la API
  const fetchCuyes = async () => {
    try {
      console.log("🔄 Obteniendo cuyes desde la API...");
      const response = await api.get('/cuyes');
      
      console.log(`📊 Recibidos ${(response.data as any)?.length || 0} cuyes del servidor`);
      
      if (response.data && (response.data as any).length > 0) {
        console.log('🔍 DIAGNÓSTICO DE CUYES RECIBIDOS:');
        
        // Verificar datos de todos los cuyes
        const cuyesProcesados = (response.data as any).map((cuy: any) => {
          // Asegurarse de que tenemos una fecha válida
          const fechaNacimiento = cuy.fechaNacimiento;
          console.log(`Cuy ID ${cuy.id}: Fecha original=${fechaNacimiento}, Sexo=${cuy.sexo}, Estado=${cuy.estado}`);
          
          // Intentar calcular la edad
          const edad = calcularEdadEnMeses(fechaNacimiento);
          console.log(`   → Edad calculada: ${edad.toFixed(1)} meses (¿Es adulto? ${edad >= 3 ? 'Sí ✅' : 'No ❌'})`);
          
          // Devolver el cuy sin modificar
          return cuy;
        });
        
        // Actualizar el estado con los cuyes recibidos sin modificar
        setCuyes((response.data as any) || []);
        
        console.log('✅ Cuyes actualizados en el estado');
      } else {
        console.warn('⚠️ No se recibieron cuyes de la API');
        setCuyes([]);
      }
    } catch (error) {
      console.error('❌ Error al cargar cuyes:', error);
      toastService.error(
        'Error al Cargar',
        'No se pudieron cargar los cuyes disponibles'
      );
    }
  };

  // Función para calcular la edad en meses de un cuy
  const calcularEdadEnMeses = (fechaNacimiento: string | Date): number => {
    try {
      console.log(`🔢 Calculando edad para fecha: ${fechaNacimiento}`);
      
      // Verificar si tenemos un string vacío o null
      if (!fechaNacimiento) {
        console.error('❌ Fecha vacía o nula');
        return 0;
      }
      
      // Convertir a objeto Date
      let fecha: Date;
      
      // Manejar diferentes formatos de fecha
      if (typeof fechaNacimiento === 'string') {
        // La fecha viene como string
        console.log(`Parseando fecha de string: ${fechaNacimiento}`);
        
        // Si es formato ISO con T (formato completo de BD)
        if (fechaNacimiento.includes('T')) {
          // Extraer solo la parte de la fecha (YYYY-MM-DD)
          const fechaLimpia = fechaNacimiento.split('T')[0];
          fecha = new Date(fechaLimpia);
          console.log(`  Extraída fecha de ISO: ${fechaLimpia}`);
        } 
        // Si tiene guiones (YYYY-MM-DD)
        else if (fechaNacimiento.includes('-')) {
          fecha = new Date(fechaNacimiento);
          console.log(`  Fecha en formato YYYY-MM-DD`);
        }
        // Si tiene barras (posiblemente MM/DD/YYYY o DD/MM/YYYY)
        else if (fechaNacimiento.includes('/')) {
          // Primero probar formato estándar MM/DD/YYYY
          fecha = new Date(fechaNacimiento);
          
          if (isNaN(fecha.getTime())) {
            // Si no es válido, intentar DD/MM/YYYY
            const partes = fechaNacimiento.split('/');
            if (partes.length === 3) {
              fecha = new Date(`${partes[2]}-${partes[1]}-${partes[0]}`);
              console.log(`  Convertido DD/MM/YYYY a YYYY-MM-DD: ${partes[0]}/${partes[1]}/${partes[2]} → ${partes[2]}-${partes[1]}-${partes[0]}`);
            }
          }
        } 
        else {
          // Cualquier otro formato
          fecha = new Date(fechaNacimiento);
        }
      } else {
        // Ya es un objeto Date
        fecha = fechaNacimiento;
      }
      
      // Verificar si la fecha es válida
      if (isNaN(fecha.getTime())) {
        console.error(`❌ Fecha inválida: ${fechaNacimiento}`);
        return 0;
      }
      
      // Registrar la fecha para depuración
      console.log(`Fecha nacimiento original: ${fechaNacimiento}`);
      console.log(`Fecha parseada como: ${fecha.toLocaleDateString()} (${fecha.toISOString()})`);
      
      // Usamos la fecha del contexto: 5 de julio de 2025
      const fechaContexto = new Date(2025, 6, 5); // Mes es 0-indexed, julio = 6
      console.log(`Fecha del contexto: ${fechaContexto.toLocaleDateString()} (${fechaContexto.toISOString()})`);
      
      // También calculamos con la fecha actual del sistema para comparación
      const ahora = new Date(); 
      console.log(`Fecha actual del sistema: ${ahora.toLocaleDateString()} (${ahora.toISOString()})`);
      
      // Verificar que la fecha de nacimiento no sea en el futuro (respecto al contexto)
      if (fecha > fechaContexto) {
        console.error(`❌ Fecha de nacimiento en el futuro respecto a contexto (${fechaContexto.toLocaleDateString()}): ${fecha.toLocaleDateString()}`);
        return 0;
      }
      
      // Cálculo usando la fecha de contexto (5 de julio 2025)
      const aniosDif = fechaContexto.getFullYear() - fecha.getFullYear();
      const mesesDif = fechaContexto.getMonth() - fecha.getMonth();
      const ajusteDias = fechaContexto.getDate() < fecha.getDate() ? -1 : 0;
      
      // Edad total en meses (usando fecha del contexto)
      const edadEnMeses = aniosDif * 12 + mesesDif + ajusteDias;
      
      console.log(`✅ Edad calculada: ${edadEnMeses} meses`);
      console.log(`   Detalles: ${aniosDif} años + ${mesesDif} meses (ajuste por días: ${ajusteDias})`);
      
      return edadEnMeses;
    } catch (error) {
      console.error(`❌ Error al calcular edad: ${error}`, error);
      return 0;
    }
  };
  
  // Filtrar cuyes por sexo y que sean adultos
  const getCuyesBySexo = (sexo: string) => {
    // Cuyes son adultos después de 3 meses
    const EDAD_MINIMA_ADULTO_MESES = 3; 
    
    // La fecha actual según el contexto es 5 de julio de 2025
    const fechaActual = new Date(2025, 6, 5); // Mes es 0-indexed, julio = 6
    
    console.log(`\n===== Buscando cuyes ${sexo === 'M' ? 'machos' : 'hembras'} adultos... =====`);
    console.log(`Fecha actual fija (del contexto): ${fechaActual.toISOString()}`);
    console.log(`Fecha actual del sistema: ${new Date().toISOString()}`);
    console.log(`Total de cuyes en el sistema: ${cuyes.length}`);
    
    // Mostrar información detallada de todos los cuyes
    console.log("\nDETALLES DE TODOS LOS CUYES EN EL SISTEMA:");
    cuyes.forEach((cuy, index) => {
      const edad = calcularEdadEnMeses(cuy.fechaNacimiento);
      const esAdulto = edad >= EDAD_MINIMA_ADULTO_MESES ? "✅ ADULTO" : "❌ JOVEN";
      
      // Checar estado activo - puede estar como 'activo', 'Activo', o simplemente 'A'/'a'
      const estadoNorm = cuy.estado?.toLowerCase() || '';
      const estadoActivo = (estadoNorm === 'activo' || estadoNorm === 'a') ? "✅" : "❌";
      
      const sexoCorrecto = cuy.sexo === sexo ? "✅" : "❌";
      
      console.log(
        `${index+1}. ID: ${cuy.id.toString().padEnd(3)} | ` +
        `Sexo: ${cuy.sexo.padEnd(1)} (${sexoCorrecto}) | ` +
        `Estado: ${cuy.estado.padEnd(10)} (${estadoActivo}) | ` + 
        `Fecha: ${cuy.fechaNacimiento} | ` +
        `Edad: ${edad.toFixed(1)} meses (${esAdulto})`
      );
    });
    
    // Filtrar por sexo, estado activo y edad adulta
    const adultos = cuyes.filter(cuy => {
      const edad = calcularEdadEnMeses(cuy.fechaNacimiento);
      
      // Considerar 'activo', 'Activo', 'A', 'a' como estados activos válidos
      const estadoNorm = cuy.estado?.toLowerCase() || '';
      const estadoEsActivo = estadoNorm === 'activo' || estadoNorm === 'a';
      
      // Criterios que debe cumplir un cuy para ser seleccionable
      const cumpleCriterios = 
        cuy.sexo === sexo && 
        estadoEsActivo && 
        edad >= EDAD_MINIMA_ADULTO_MESES;
      
      // Mostrar detalles de la evaluación
      if (cuy.sexo === sexo) {
        if (!estadoEsActivo) {
          console.log(`⚠️ CUY ID ${cuy.id}: Estado '${cuy.estado}' no es activo`);
        } else if (edad < EDAD_MINIMA_ADULTO_MESES) {
          console.log(`⚠️ CUY ID ${cuy.id}: Edad ${edad.toFixed(1)} meses (menor a ${EDAD_MINIMA_ADULTO_MESES} meses)`);
        } else if (cumpleCriterios) {
          console.log(`✅ CUY APTO - ID ${cuy.id}: ${cuy.raza}, ${edad.toFixed(1)} meses, ${cuy.estado}`);
        }
      }
      
      return cumpleCriterios;
    });
    
    console.log(`\n===== RESULTADO: ${adultos.length} cuyes ${sexo === 'M' ? 'machos' : 'hembras'} adultos encontrados =====`);
    if (adultos.length > 0) {
      console.log("IDs:", adultos.map(c => c.id).join(", "));
    } else {
      console.log("❌ No se encontraron cuyes adultos que cumplan los criterios");
      
      // Contar cuántos cuyes del sexo correcto hay pero no son adultos o activos
      const cuyesSexoCorrecto = cuyes.filter(c => c.sexo === sexo);
      if (cuyesSexoCorrecto.length > 0) {
        console.log(`ℹ️ Hay ${cuyesSexoCorrecto.length} cuyes de sexo ${sexo}, pero no cumplen con los requisitos de edad o estado`);
      } else {
        console.log(`ℹ️ No hay ningún cuy de sexo ${sexo} en el sistema`);
      }
    }
    
    return adultos;
  };

  // Manejar cambios en los campos del formulario
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    if (name) {
      // Para campos numéricos, permitir valor vacío temporalmente
      let processedValue = value;
      if (name === 'numVivos' || name === 'numMuertos') {
        // Si el valor está vacío, mantenerlo como string vacío
        // Si tiene valor, convertir a número
        processedValue = value === '' ? '' : Number(value);
      }
      
      setFormData({ ...formData, [name]: processedValue });
      
      // Validación básica
      let errorMsg = '';
      if (name === 'numVivos' && processedValue !== '' && (Number(processedValue) < 0)) {
        errorMsg = 'No puede ser negativo';
      } else if (name === 'numMuertos' && processedValue !== '' && (Number(processedValue) < 0)) {
        errorMsg = 'No puede ser negativo';
      } else if (name === 'madreId' && !value) {
        errorMsg = 'Debe seleccionar una madre';
      }
      
      setErrors({ ...errors, [name]: errorMsg });
    }
  };

  // Manejar cambio de fecha
  const handleDateChange = (date: Date | null) => {
    if (date) {
      setFormData({ ...formData, fechaNacimiento: date });
      
      // Validar fecha
      const now = new Date();
      if (date > now) {
        setErrors({ ...errors, fechaNacimiento: 'La fecha no puede ser futura' });
      } else {
        setErrors({ ...errors, fechaNacimiento: '' });
      }
    }
  };

  // Validar formulario completo
  const validateForm = () => {
    const newErrors = {
      fechaNacimiento: '',
      numVivos: '',
      numMuertos: '',
      madreId: '',
    };
    
    let isValid = true;
    
    // Validar fecha
    if (!formData.fechaNacimiento) {
      newErrors.fechaNacimiento = 'La fecha de nacimiento es obligatoria';
      isValid = false;
    } else {
      const now = new Date();
      if (formData.fechaNacimiento > now) {
        newErrors.fechaNacimiento = 'La fecha no puede ser futura';
        isValid = false;
      }
    }
    
    // Validar número de vivos
    if ((formData.numVivos as any) === '' || formData.numVivos < 0) {
      newErrors.numVivos = 'Debe ingresar un número válido (mayor o igual a 0)';
      isValid = false;
    }
    
    // Validar número de muertos
    if ((formData.numMuertos as any) === '' || formData.numMuertos < 0) {
      newErrors.numMuertos = 'Debe ingresar un número válido (mayor o igual a 0)';
      isValid = false;
    }
    
    // Validar madre
    if (!formData.madreId) {
      newErrors.madreId = 'Debe seleccionar una madre';
      isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
  };

  // Abrir modal para crear
  const handleOpenCreateModal = () => {
    setModalMode('create');
    setFormData({
      fechaNacimiento: new Date(),
      numVivos: 0,
      numMuertos: 0,
      padreId: '',
      madreId: '',
    });
    setErrors({
      fechaNacimiento: '',
      numVivos: '',
      numMuertos: '',
      madreId: '',
    });
    setOpen(true);
  };

  // Abrir modal para editar
  const handleOpenEditModal = (camada: any) => {
    setModalMode('edit');
    setCurrentCamada(camada);
    setFormData({
      fechaNacimiento: new Date(camada.fechaNacimiento),
      numVivos: camada.numVivos,
      numMuertos: camada.numMuertos,
      padreId: camada.padreId?.toString() || '',
      madreId: camada.madreId?.toString() || '',
    });
    setErrors({
      fechaNacimiento: '',
      numVivos: '',
      numMuertos: '',
      madreId: '',
    });
    setOpen(true);
  };

  // Cerrar modal
  const handleClose = () => {
    setOpen(false);
  };

  // Guardar camada (crear o editar)
  const handleSave = async () => {
    if (!validateForm()) {
      toastService.error(
        'Formulario Incompleto',
        'Por favor, corrige los errores antes de continuar'
      );
      return;
    }
    
    setLoading(true);
    
    try {
      // Asegurarse de que la fecha esté en formato ISO
      let fechaISO = formData.fechaNacimiento;
      if (!(formData.fechaNacimiento instanceof Date && !isNaN(formData.fechaNacimiento.getTime()))) {
        fechaISO = new Date(formData.fechaNacimiento);
      }
      
      console.log('Fecha a guardar:', fechaISO.toISOString());
      
      const payload = {
        ...formData,
        fechaNacimiento: fechaISO.toISOString(),
        numVivos: Number(formData.numVivos),
        numMuertos: Number(formData.numMuertos),
        padreId: formData.padreId ? Number(formData.padreId) : null,
        madreId: formData.madreId ? Number(formData.madreId) : null,
      };
      
      if (modalMode === 'create') {
        await api.post('/reproduccion/camadas', payload);
        toastService.success(
          'Camada Registrada',
          'Camada registrada correctamente'
        );
        // Actualizar tanto las camadas como los cuyes después de crear una camada
        // para reflejar las nuevas crías creadas automáticamente
        fetchCamadas();
        fetchCuyes();
      } else {
        await api.put(`/reproduccion/camadas/${currentCamada.id}`, payload);
        toastService.success(
          'Camada Actualizada',
          'Camada actualizada correctamente'
        );
        fetchCamadas();
      }
      
      handleClose();
    } catch (error) {
      console.error('Error al guardar la camada:', error);
      toastService.error(
        'Error al Guardar',
        'No se pudo guardar la camada'
      );
    } finally {
      setLoading(false);
    }
  };

  // Confirmar eliminación
  const handleDelete = (id: number) => {
    deleteConfirmation.handleDeleteClick(id);
  };

  // Manejar cambio de página
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  // Manejar cambio de filas por página
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Buscar nombre del cuy por ID
  const getCuyNameById = (id: number) => {
    const cuy = cuyes.find(c => c.id === id);
    return cuy ? `${cuy.raza} #${cuy.id} (G: ${cuy.galpon}, J: ${cuy.jaula})` : 'N/A';
  };

  // Funciones para selección múltiple
  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelected = camadas.map((n) => n.id!);
      setSelectedIds(newSelected);
      setShowBulkActions(newSelected.length > 0);
    } else {
      setSelectedIds([]);
      setShowBulkActions(false);
    }
  };

  const handleClick = (event: React.MouseEvent<unknown>, id: number) => {
    const selectedIndex = selectedIds.indexOf(id);
    let newSelected: number[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selectedIds, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selectedIds.slice(1));
    } else if (selectedIndex === selectedIds.length - 1) {
      newSelected = newSelected.concat(selectedIds.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selectedIds.slice(0, selectedIndex),
        selectedIds.slice(selectedIndex + 1),
      );
    }

    setSelectedIds(newSelected);
    setShowBulkActions(newSelected.length > 0);
  };

  const isSelected = (id: number) => selectedIds.indexOf(id) !== -1;

  // Funciones para acciones en lote
  const handleBulkDelete = async () => {
    setBulkActionLoading(true);
    try {
      await Promise.all(selectedIds.map(id => api.delete(`/reproduccion/camadas/${id}`)));
      toastService.success(
        'Eliminación Exitosa',
        `${selectedIds.length} camadas eliminadas exitosamente`
      );
      setSelectedIds([]);
      setShowBulkActions(false);
      fetchCamadas();
    } catch (err: any) {
      console.error('Error al eliminar camadas:', err);
      toastService.error(
        'Error al Eliminar',
        'No se pudieron eliminar algunas camadas'
      );
    } finally {
      setBulkActionLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h6" component="h2">
          <PetsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Registro de Camadas
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button 
            variant="contained"
            color="success"
            onClick={() => {
              // Verificar si hay cuyes adultos disponibles
              console.log("=== DIAGNÓSTICO DE CUYES ADULTOS ===");
              console.log("Fecha actual:", new Date().toISOString());
              
              // Diagnóstico detallado
              console.log("\n== Todos los cuyes en el sistema ==");
              cuyes.forEach((cuy, index) => {
                const fechaObj = new Date(cuy.fechaNacimiento);
                console.log(`Cuy ID ${cuy.id}:`);
                console.log(`- Fecha almacenada: "${cuy.fechaNacimiento}" (tipo: ${typeof cuy.fechaNacimiento})`);
                console.log(`- Fecha parseada: ${fechaObj.toISOString()}`);
                console.log(`- Sexo: ${cuy.sexo}, Estado: ${cuy.estado}`);
                
                try {
                  const edad = calcularEdadEnMeses(cuy.fechaNacimiento);
                  console.log(`- Edad calculada: ${edad.toFixed(1)} meses (${edad >= 3 ? 'ADULTO' : 'JOVEN'})`);
                } catch (error) {
                  console.error(`- Error al calcular edad: ${error}`);
                }
                console.log("---");
              });
              
              const hembrasList = getCuyesBySexo('H');
              const machosList = getCuyesBySexo('M');
              
              let message = '';
              let severity: 'success' | 'error' | 'info' | 'warning' = 'info';
              
              if (hembrasList.length > 0 || machosList.length > 0) {
                message = `Disponibles: ${hembrasList.length} hembras adultas y ${machosList.length} machos adultos`;
                severity = 'success';
              } else {
                message = 'No hay cuyes adultos disponibles. Abriendo diagnóstico en consola.';
                severity = 'warning';
              }
              
              if (severity === 'warning') {
                toastService.warning('Advertencia', message);
              } else {
                toastService.success('Cuyes Disponibles', message);
              }
            }}
            disabled={loading}
            title="Verificar cuyes adultos"
            startIcon={<PetsIcon />}
            sx={{
              fontWeight: 'bold',
              boxShadow: 2,
              '&:hover': { 
                boxShadow: 4
              }
            }}
          >
            Verificar Disponibles
          </Button>
          <Button 
            variant="contained"
            color="primary"
            onClick={() => {
              console.log("🔍 DIAGNÓSTICO AVANZADO DEL SISTEMA");
              console.log("===================================");
              
              console.log("📅 Fecha actual del sistema:", new Date().toISOString());
              
              console.log("\n📊 ESTADÍSTICAS DE CUYES:");
              if (cuyes.length === 0) {
                console.log("⚠️ No hay cuyes cargados en memoria. Verificar la API.");
              } else {
                console.log(`Total de cuyes en memoria: ${cuyes.length}`);
                
                // Verificar por sexo
                const machos = cuyes.filter(c => c.sexo === 'M').length;
                const hembras = cuyes.filter(c => c.sexo === 'H').length;
                console.log(`- Machos: ${machos}, Hembras: ${hembras}, Sin sexo/Otro: ${cuyes.length - machos - hembras}`);
                
                // Verificar estado
                const activosLower = cuyes.filter(c => c.estado?.toLowerCase() === 'activo').length;
                const activosUpper = cuyes.filter(c => c.estado === 'Activo').length;
                const activosA = cuyes.filter(c => c.estado?.toLowerCase() === 'a').length;
                console.log(`- Estados encontrados:`);
                console.log(`  * 'activo': ${activosLower}`);
                console.log(`  * 'Activo': ${activosUpper}`);
                console.log(`  * 'a'/'A': ${activosA}`);
                console.log(`  * Otros estados: ${cuyes.length - activosLower - activosUpper - activosA}`);
                
                // Mostrar todos los estados únicos
                const estados = [...new Set(cuyes.map(c => c.estado))];
                console.log(`- Lista de estados únicos: ${estados.join(', ')}`);
                
                // Verificar edad
                const jovenesCount = cuyes.filter(c => {
                  const edad = calcularEdadEnMeses(c.fechaNacimiento);
                  return edad < 3;
                }).length;
                
                const adultosCount = cuyes.filter(c => {
                  const edad = calcularEdadEnMeses(c.fechaNacimiento);
                  return edad >= 3;
                }).length;
                
                console.log(`- Por edad: Adultos (>=3 meses): ${adultosCount}, Jóvenes: ${jovenesCount}`);
                
                // Análisis detallado de fechas
                console.log("\n📅 ANÁLISIS DE FECHAS:");
                const fechasFormatos: {[key: string]: number} = {};
                
                cuyes.forEach(cuy => {
                  const fecha = cuy.fechaNacimiento;
                  let formato = "desconocido";
                  
                  if (typeof fecha === 'string') {
                    if (fecha.includes('T')) formato = "ISO con T";
                    else if (fecha.includes('-')) formato = "YYYY-MM-DD";
                    else if (fecha.includes('/')) formato = "con /";
                    else formato = "otro string";
                  } else if (fecha instanceof Date) {
                    formato = "objeto Date";
                  }
                  
                  fechasFormatos[formato] = (fechasFormatos[formato] || 0) + 1;
                });
                
                console.log("Formatos de fecha encontrados:");
                Object.entries(fechasFormatos).forEach(([formato, cantidad]) => {
                  console.log(`- ${formato}: ${cantidad} cuyes`);
                });
              }
              
              toastService.info(
                'Diagnóstico Completo',
                'Diagnóstico avanzado completado. Revisa la consola (F12)'
              );
            }}
            disabled={loading}
            title="Diagnóstico avanzado en la consola"
            startIcon={<SearchIcon />}
            sx={{
              bgcolor: '#1976d2',
              fontWeight: 'bold',
              boxShadow: 2,
              '&:hover': { 
                bgcolor: '#1565c0',
                boxShadow: 4
              }
            }}
          >
            Diagnóstico Avanzado
          </Button>
          <Button 
            variant="contained"
            color="warning"
            onClick={() => {
              console.log("Forzando actualización completa desde la base de datos...");
              // Limpiar cache
              setCuyes([]);
              setCamadas([]);
              
              // Forzar recarga desde el servidor
              fetchCuyes();
              fetchCamadas();
              
              // Hacer una petición directa para ver los datos sin procesar
              api.get('/cuyes').then(response => {
                console.log("📡 DATOS CRUDOS DE LA API (PARA DEPURACIÓN):");
                console.log(response.data);
                
                if (response.data && (response.data as any).length > 0) {
                  // Mostrar el formato de fecha que viene directamente del servidor
                  const primerCuy = (response.data as any)[0];
                  console.log(`\n📝 MUESTRA DE DATOS RECIBIDOS:`);
                  console.log(`- Primer cuy ID: ${primerCuy.id}`);
                  console.log(`- Fecha de nacimiento (sin procesar): ${primerCuy.fechaNacimiento}`);
                  console.log(`- Tipo de dato: ${typeof primerCuy.fechaNacimiento}`);
                  console.log(`- Estado: "${primerCuy.estado}"`);
                  console.log(`- Sexo: "${primerCuy.sexo}"`);
                }
              }).catch(err => {
                console.error("❌ Error al obtener datos crudos:", err);
              });
              
              toastService.warning(
                'Actualizando Datos',
                '⚠️ Forzando actualización desde la base de datos'
              );
            }}
            disabled={loading}
            title="Forzar actualización desde BD"
            sx={{ fontWeight: 'bold' }}
          >
            Forzar Actualización
          </Button>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={handleOpenCreateModal}
            disabled={loading}
          >
            Nueva Camada
          </Button>
        </Box>
      </Box>

      {/* Barra de herramientas para acciones en lote */}
      <Slide direction="down" in={showBulkActions} mountOnEnter unmountOnExit>
        <Toolbar
          sx={{
            pl: { sm: 2 },
            pr: { xs: 1, sm: 1 },
            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
            borderRadius: 1,
            mb: 2,
            border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
          }}
        >
          <Typography
            sx={{ flex: '1 1 100%' }}
            color="primary"
            variant="subtitle1"
            component="div"
          >
            {selectedIds.length} camada{selectedIds.length !== 1 ? 's' : ''} seleccionada{selectedIds.length !== 1 ? 's' : ''}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Eliminar seleccionadas">
              <IconButton
                size="small"
                onClick={handleBulkDelete}
                disabled={bulkActionLoading}
                color="error"
              >
                {bulkActionLoading ? <CircularProgress size={20} /> : <DeleteSweep />}
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </Slide>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  color="primary"
                  indeterminate={selectedIds.length > 0 && selectedIds.length < camadas.length}
                  checked={camadas.length > 0 && selectedIds.length === camadas.length}
                  onChange={handleSelectAllClick}
                  disabled={loading}
                  title="Seleccionar todas las camadas"
                />
              </TableCell>
              <TableCell>ID</TableCell>
              <TableCell>Fecha de Nacimiento</TableCell>
              <TableCell>Crías Vivas</TableCell>
              <TableCell>Crías Muertas</TableCell>
              <TableCell>Madre</TableCell>
              <TableCell>Padre</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {camadas
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((camada) => (
                <TableRow key={camada.id} selected={isSelected(camada.id)}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      color="primary"
                      checked={isSelected(camada.id)}
                      onClick={(event) => handleClick(event, camada.id)}
                      disabled={loading}
                      title={isSelected(camada.id) ? 'Deseleccionar' : 'Seleccionar'}
                    />
                  </TableCell>
                  <TableCell>{camada.id}</TableCell>
                  <TableCell>{new Date(camada.fechaNacimiento).toLocaleDateString('es-ES')}</TableCell>
                  <TableCell>{camada.numVivos}</TableCell>
                  <TableCell>{camada.numMuertos}</TableCell>
                  <TableCell>{camada.madreId ? getCuyNameById(camada.madreId) : 'N/A'}</TableCell>
                  <TableCell>{camada.padreId ? getCuyNameById(camada.padreId) : 'N/A'}</TableCell>
                  <TableCell align="center">
                    <IconButton 
                      size="small" 
                      color="primary" 
                      onClick={() => handleOpenEditModal(camada)}
                      disabled={loading}
                      title="Editar camada"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      color="error" 
                      onClick={() => handleDelete(camada.id)}
                      disabled={loading}
                      title="Eliminar camada"
                    >
                      <DeleteIcon />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      color="info" 
                      component={RouterLink} 
                      to={`/cuyes?camadaId=${camada.id}`}
                      title="Ver cuyes de esta camada"
                    >
                      <LinkIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
            ))}
            {camadas.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  No hay camadas registradas
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={camadas.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="Filas por página:"
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
      />

      {/* Modal para crear/editar camada */}
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-title"
      >
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: {xs: '95%', sm: '90%', md: 800, lg: 900},
          maxWidth: '95vw',
          maxHeight: '95vh',
          overflow: 'auto',
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 4,
          borderRadius: 2,
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography id="modal-title" variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>
              {modalMode === 'create' ? 'Registrar Nueva Camada' : 'Editar Camada'}
            </Typography>
            
            <Button 
              variant="contained" 
              color="primary"
              size="medium"
              onClick={() => {
                fetchCuyes();
                toastService.info(
                  'Lista Actualizada',
                  'Lista de cuyes actualizada'
                );
              }}
              startIcon={<Refresh />}
            >
              Actualizar Cuyes
            </Button>
          </Box>
          
          <Box sx={{ 
            p: 2, 
            mb: 3, 
            bgcolor: 'info.light', 
            borderRadius: 1,
            color: 'info.contrastText' 
          }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
              Información importante:
            </Typography>
            <Typography variant="body2">
              • Solo se muestran cuyes <strong>activos</strong> con al menos <strong>3 meses de edad</strong>.
            </Typography>
            <Typography variant="body2">
              • La fecha actual es <strong>{new Date().toLocaleDateString('es-ES')}</strong>.
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold', color: 'warning.main' }}>
              • IMPORTANTE: Las fechas de nacimiento deben estar en formato ISO (YYYY-MM-DD) o MM/DD/YYYY
            </Typography>
            <Typography variant="body2" sx={{ color: 'warning.main' }}>
              • Ejemplo de fecha correcta: 2024-05-10 o 05/10/2024 (10 de mayo de 2024)
            </Typography>
            <Typography variant="body2">
              • Si no ve cuyes disponibles, asegúrese de tener registrados cuyes adultos con el sexo correcto.
            </Typography>
            <Typography variant="body2">
              • Para que un cuy aparezca como disponible debe cumplir tres condiciones:
            </Typography>
            <Typography variant="body2" sx={{ pl: 2 }}>
              1. Sexo correcto (M para machos, H para hembras)
            </Typography>
            <Typography variant="body2" sx={{ pl: 2 }}>
              2. Estado "activo"
            </Typography>
            <Typography variant="body2" sx={{ pl: 2 }}>
              3. Edad igual o superior a 3 meses (calculada desde su fecha de nacimiento hasta hoy)
            </Typography>
          </Box>

          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
            <Grid container spacing={4} sx={{ position: 'relative' }}>
              <Grid xs={12}>
                <DatePicker
                  label="Fecha de Nacimiento"
                  value={formData.fechaNacimiento}
                  onChange={handleDateChange}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!errors.fechaNacimiento,
                      helperText: errors.fechaNacimiento
                    }
                  }}
                />
              </Grid>

              <Grid xs={6}>
                <TextField
                  name="numVivos"
                  label="Crías Vivas"
                  type="number"
                  fullWidth
                  value={formData.numVivos === 0 ? '' : formData.numVivos}
                  onChange={handleChange}
                  error={!!errors.numVivos}
                  helperText={errors.numVivos}
                  InputProps={{ inputProps: { min: 0 } }}
                />
              </Grid>

              <Grid xs={6}>
                <TextField
                  name="numMuertos"
                  label="Crías Muertas"
                  type="number"
                  fullWidth
                  value={formData.numMuertos === 0 ? '' : formData.numMuertos}
                  onChange={handleChange}
                  error={!!errors.numMuertos}
                  helperText={errors.numMuertos}
                  InputProps={{ inputProps: { min: 0 } }}
                />
              </Grid>

              <Grid xs={6}>
                <FormControl fullWidth error={!!errors.madreId} sx={{
                  width: '100%',
                  minWidth: '240px',
                  '& .MuiFormLabel-filled + .MuiInputBase-formControl .MuiInputBase-input': {
                    paddingTop: '8px' // Ajustar padding cuando hay una etiqueta
                  },
                  '& .MuiInputLabel-shrink': {
                    backgroundColor: 'white',
                    padding: '0 8px',
                    transform: 'translate(14px, -6px) scale(0.75)',
                    width: 'auto',
                    textOverflow: 'visible',
                    whiteSpace: 'nowrap'
                  },
                  '& .MuiInputLabel-outlined': {
                    width: 'auto',
                    maxWidth: 'none',
                    textOverflow: 'visible',
                    whiteSpace: 'nowrap',
                    overflow: 'visible'
                  }
                }}>
                  <InputLabel id="madre-label" sx={LABEL_STYLE}>
                    Madre
                  </InputLabel>
                  <Select
                    labelId="madre-label"
                    name="madreId"
                    value={formData.madreId}
                    onChange={(e: any) => handleChange(e)}
                    label="Madre"
                    displayEmpty
                    notched
                    renderValue={(selected) => {
                      if (!selected) return ""; // Campo vacío para evitar superposición
                      const cuy = cuyes.find(c => c.id.toString() === selected);
                      if (!cuy) return "Seleccionada";
                      return `${cuy.raza} - #${cuy.id} (${calcularEdadEnMeses(cuy.fechaNacimiento).toFixed(1)} meses)`;
                    }}
                    sx={{ 
                      height: '56px',
                      width: '100%',
                      minWidth: '240px',
                      '.MuiSelect-select': {
                        display: 'flex',
                        alignItems: 'center',
                        whiteSpace: 'normal',
                        paddingRight: '32px' // Ensure text doesn't overlap with dropdown icon
                      },
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(0, 0, 0, 0.23)', // Default MUI border color
                        borderWidth: '1px'
                      },
                      '& .MuiInputLabel-root': {
                        width: 'auto',
                        textOverflow: 'visible',
                        whiteSpace: 'nowrap',
                        maxWidth: 'none'
                      },
                      '&.Mui-focused': {
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#1976d2',
                          borderWidth: '2px'
                        }
                      }
                    }}
                    MenuProps={{
                      PaperProps: {
                        style: {
                          maxHeight: 300,
                          width: '500px'
                        },
                      },
                    }}
                  >
                    <MenuItem value="" sx={{ minHeight: '36px' }}>
                      <em>-- Seleccionar madre --</em>
                    </MenuItem>
                    {getCuyesBySexo('H').length > 0 ? (
                      getCuyesBySexo('H').map((cuy) => (
                        <MenuItem key={cuy.id} value={cuy.id.toString()}>
                          <Box sx={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            width: '100%',
                            py: 0.5
                          }}>
                            <Box sx={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center', 
                              width: '100%' 
                            }}>
                              <Typography variant="body1" fontWeight={500}>
                                {cuy.raza} - #{cuy.id}
                              </Typography>
                              <Typography variant="body2" sx={{ 
                                bgcolor: 'success.light', 
                                color: 'success.contrastText', 
                                px: 1, 
                                borderRadius: 1,
                                fontSize: '0.75rem',
                                fontWeight: 'bold' 
                              }}>
                                {calcularEdadEnMeses(cuy.fechaNacimiento).toFixed(1)} meses
                              </Typography>
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                              Galpón: {cuy.galpon}, Jaula: {cuy.jaula}, Nac: {
                                typeof cuy.fechaNacimiento === 'string' 
                                  ? new Date(cuy.fechaNacimiento).toLocaleDateString() 
                                  : cuy.fechaNacimiento.toLocaleDateString()
                              }
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem disabled>
                        No hay hembras adultas disponibles
                      </MenuItem>
                    )}
                  </Select>
                  {errors.madreId && (
                    <Typography variant="caption" color="error">
                      {errors.madreId}
                    </Typography>
                  )}
                </FormControl>
              </Grid>

              <Grid xs={6}>
                <FormControl fullWidth sx={{
                  width: '100%',
                  minWidth: '240px',
                  '& .MuiFormLabel-filled + .MuiInputBase-formControl .MuiInputBase-input': {
                    paddingTop: '8px' // Ajustar padding cuando hay una etiqueta
                  },
                  '& .MuiInputLabel-shrink': {
                    backgroundColor: 'white',
                    padding: '0 8px',
                    transform: 'translate(14px, -6px) scale(0.75)',
                    width: 'auto',
                    textOverflow: 'visible',
                    whiteSpace: 'nowrap'
                  },
                  '& .MuiInputLabel-outlined': {
                    width: 'auto',
                    maxWidth: 'none',
                    textOverflow: 'visible',
                    whiteSpace: 'nowrap',
                    overflow: 'visible'
                  }
                }}>
                  <InputLabel id="padre-label" sx={LABEL_STYLE}>
                    Padre (opcional)
                  </InputLabel>
                  <Select
                    labelId="padre-label"
                    name="padreId"
                    value={formData.padreId}
                    onChange={(e: any) => handleChange(e)}
                    label="Padre (opcional)"
                    displayEmpty
                    notched
                    renderValue={(selected) => {
                      if (!selected) return ""; // Campo vacío para evitar superposición
                      const cuy = cuyes.find(c => c.id.toString() === selected);
                      if (!cuy) return "Seleccionado";
                      return `${cuy.raza} - #${cuy.id} (${calcularEdadEnMeses(cuy.fechaNacimiento).toFixed(1)} meses)`;
                    }}
                    sx={{ 
                      height: '56px',
                      width: '100%',
                      minWidth: '240px',
                      '.MuiSelect-select': {
                        display: 'flex',
                        alignItems: 'center',
                        whiteSpace: 'normal',
                        paddingRight: '32px' // Ensure text doesn't overlap with dropdown icon
                      },
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(0, 0, 0, 0.23)', // Default MUI border color
                        borderWidth: '1px'
                      },
                      '& .MuiInputLabel-root': {
                        width: 'auto',
                        textOverflow: 'visible',
                        whiteSpace: 'nowrap',
                        maxWidth: 'none'
                      },
                      '&.Mui-focused': {
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#1976d2',
                          borderWidth: '2px'
                        }
                      }
                    }}
                    MenuProps={{
                      PaperProps: {
                        style: {
                          maxHeight: 300,
                          width: '500px'
                        },
                      },
                    }}
                  >
                    <MenuItem value="" sx={{ minHeight: '36px' }}>
                      <em>-- Seleccionar padre --</em>
                    </MenuItem>
                    {getCuyesBySexo('M').length > 0 ? (
                      getCuyesBySexo('M').map((cuy) => (
                        <MenuItem key={cuy.id} value={cuy.id.toString()}>
                          <Box sx={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            width: '100%',
                            py: 0.5 
                          }}>
                            <Box sx={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center', 
                              width: '100%' 
                            }}>
                              <Typography variant="body1" fontWeight={500}>
                                {cuy.raza} - #{cuy.id}
                              </Typography>
                              <Typography variant="body2" sx={{ 
                                bgcolor: 'info.light', 
                                color: 'info.contrastText', 
                                px: 1, 
                                borderRadius: 1,
                                fontSize: '0.75rem',
                                fontWeight: 'bold' 
                              }}>
                                {calcularEdadEnMeses(cuy.fechaNacimiento).toFixed(1)} meses
                              </Typography>
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                              Galpón: {cuy.galpon}, Jaula: {cuy.jaula}, Nac: {
                                typeof cuy.fechaNacimiento === 'string' 
                                  ? new Date(cuy.fechaNacimiento).toLocaleDateString() 
                                  : cuy.fechaNacimiento.toLocaleDateString()
                              }
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem disabled>
                        No hay machos adultos disponibles
                      </MenuItem>
                    )}
                  </Select>
                </FormControl>
                
              </Grid>

              {/* Mensajes de información sobre cuyes disponibles */}
              <Grid xs={12} sx={{ mt: 2 }}>
                {getCuyesBySexo('H').length === 0 && (
                  <Box sx={{ p: 2, mb: 2, bgcolor: 'error.light', borderRadius: 1 }}>
                    <Typography variant="body2" color="error.contrastText" sx={{ fontWeight: 'bold' }}>
                      No hay hembras adultas disponibles.
                    </Typography>
                    <Typography variant="body2" color="error.contrastText">
                      Para registrar una camada, necesita al menos una hembra con más de 3 meses de edad y estado "activo".
                    </Typography>
                  </Box>
                )}

                {getCuyesBySexo('M').length === 0 && (
                  <Box sx={{ p: 2, mb: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                    <Typography variant="body2" color="info.contrastText" sx={{ fontWeight: 'bold' }}>
                      No hay machos adultos disponibles.
                    </Typography>
                    <Typography variant="body2" color="info.contrastText">
                      El padre es opcional, pero se recomienda registrarlo para un mejor control genealógico.
                    </Typography>
                  </Box>
                )}
              </Grid>

              <Grid xs={12} sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button onClick={handleClose} disabled={loading} variant="outlined">
                  Cancelar
                </Button>
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={handleSave}
                  disabled={loading || Object.values(errors).some(error => !!error)}
                  sx={{ minWidth: '150px' }}
                >
                  {modalMode === 'create' ? 'Registrar' : 'Guardar Cambios'}
                </Button>
              </Grid>
            </Grid>
          </LocalizationProvider>
        </Box>
      </Modal>

      {/* Diálogo de confirmación para eliminar */}
      <ConfirmDeleteDialog
        open={deleteConfirmation.confirmOpen}
        onClose={deleteConfirmation.handleCancelDelete}
        onConfirm={deleteConfirmation.handleConfirmDelete}
        itemName="camada"
        loading={deleteConfirmation.loading}
      />

      {/* Botón flotante para limpiar selección */}
      {selectedIds.length > 0 && (
        <Fab
          color="secondary"
          aria-label="limpiar selección"
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: 1000,
          }}
          onClick={() => {
            setSelectedIds([]);
            setShowBulkActions(false);
          }}
        >
          <Close />
        </Fab>
      )}
    </Paper>
  );
};

export default CamadasTable;
