import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  RadioGroup,
  Radio,
  FormLabel,
  Box,
  Typography,
  Grid,
  Divider,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  Slider,
  Chip,
  Switch,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
  Description as CsvIcon,
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
  Restore as RestoreIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';

interface ExportOptionsProps {
  open: boolean;
  onClose: () => void;
  onExport: (format: string, options: ExportConfig) => void;
  loading?: boolean;
  templateId?: string;
  defaultOptions?: Partial<ExportConfig>;
}

interface ExportConfig {
  // Basic options
  format: 'PDF' | 'EXCEL' | 'CSV';
  templateId: string;
  
  // Date range
  dateRange: {
    from: Date;
    to: Date;
  };
  
  // Content options
  includeCharts: boolean;
  includeDetails: boolean;
  includeSummary: boolean;
  includeRawData: boolean;
  
  // PDF specific
  pageSize: 'A4' | 'A3' | 'Letter' | 'Legal';
  orientation: 'portrait' | 'landscape';
  compression: boolean;
  watermark: boolean;
  
  // Excel specific
  sheetName: string;
  includeFormulas: boolean;
  autoFilter: boolean;
  freezePanes: boolean;
  
  // CSV specific
  delimiter: ',' | ';' | '\t';
  encoding: 'UTF-8' | 'ISO-8859-1';
  includeHeaders: boolean;
  
  // Advanced options
  maxRows: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export const ExportOptions: React.FC<ExportOptionsProps> = ({
  open,
  onClose,
  onExport,
  loading = false,
  templateId = 'reproductive',
  defaultOptions = {}
}) => {
  const [config, setConfig] = useState<ExportConfig>({
    format: 'PDF',
    templateId,
    dateRange: {
      from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      to: new Date()
    },
    // Content options
    includeCharts: true,
    includeDetails: true,
    includeSummary: true,
    includeRawData: false,
    // PDF specific
    pageSize: 'A4',
    orientation: 'portrait',
    compression: true,
    watermark: false,
    // Excel specific
    sheetName: 'Reporte',
    includeFormulas: false,
    autoFilter: true,
    freezePanes: true,
    // CSV specific
    delimiter: ',',
    encoding: 'UTF-8',
    includeHeaders: true,
    // Advanced options
    maxRows: 10000,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    ...defaultOptions
  });

  const [expandedSections, setExpandedSections] = useState<string[]>(['basic']);
  const [errors, setErrors] = useState<string[]>([]);

  // Load default options when component opens
  useEffect(() => {
    if (open && defaultOptions) {
      setConfig(prev => ({ ...prev, ...defaultOptions }));
    }
  }, [open, defaultOptions]);

  // Validation
  const validateConfig = (): string[] => {
    const validationErrors: string[] = [];
    
    if (config.dateRange.from >= config.dateRange.to) {
      validationErrors.push('La fecha de inicio debe ser anterior a la fecha de fin');
    }
    
    if (config.maxRows < 1 || config.maxRows > 100000) {
      validationErrors.push('El número máximo de filas debe estar entre 1 y 100,000');
    }
    
    if (config.format === 'EXCEL' && !config.sheetName.trim()) {
      validationErrors.push('El nombre de la hoja de Excel es requerido');
    }
    
    return validationErrors;
  };

  const handleExport = () => {
    const validationErrors = validateConfig();
    setErrors(validationErrors);
    
    if (validationErrors.length === 0) {
      onExport(config.format, config);
    }
  };

  const handleConfigChange = (key: keyof ExportConfig, value: any) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const resetToDefaults = () => {
    setConfig({
      format: 'PDF',
      templateId,
      dateRange: {
        from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        to: new Date()
      },
      includeCharts: true,
      includeDetails: true,
      includeSummary: true,
      includeRawData: false,
      pageSize: 'A4',
      orientation: 'portrait',
      compression: true,
      watermark: false,
      sheetName: 'Reporte',
      includeFormulas: false,
      autoFilter: true,
      freezePanes: true,
      delimiter: ',',
      encoding: 'UTF-8',
      includeHeaders: true,
      maxRows: 10000,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      ...defaultOptions
    });
    setErrors([]);
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const formatOptions = [
    {
      value: 'pdf',
      label: 'PDF',
      icon: <PdfIcon />,
      description: 'Documento portable con formato completo',
      features: ['Gráficos', 'Imágenes', 'Formato profesional']
    },
    {
      value: 'excel',
      label: 'Excel',
      icon: <ExcelIcon />,
      description: 'Hoja de cálculo para análisis adicional',
      features: ['Datos editables', 'Fórmulas', 'Múltiples hojas']
    },
    {
      value: 'csv',
      label: 'CSV',
      icon: <CsvIcon />,
      description: 'Datos en formato de texto separado por comas',
      features: ['Ligero', 'Compatible', 'Solo datos']
    }
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '500px' }
      }}
    >
      <DialogTitle>
        Opciones de Exportación
      </DialogTitle>

      <DialogContent>
        {/* Error messages */}
        {errors.length > 0 && (
          <Alert severity="error" sx={{ mb: 3 }}>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </Alert>
        )}

        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
          {/* Header with reset button */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6">
              Configuración de Exportación
            </Typography>
            <Tooltip title="Restaurar valores por defecto">
              <IconButton onClick={resetToDefaults} size="small">
                <RestoreIcon />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Basic Options */}
          <Accordion 
            expanded={expandedSections.includes('basic')}
            onChange={() => toggleSection('basic')}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">Opciones Básicas</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                {/* Format Selection */}
                <Grid size={{ xs: 12 }}>
                  <FormControl fullWidth>
                    <InputLabel>Formato</InputLabel>
                    <Select
                      value={config.format}
                      label="Formato"
                      onChange={(e) => handleConfigChange('format', e.target.value)}
                    >
                      <MenuItem value="PDF">PDF</MenuItem>
                      <MenuItem value="EXCEL">Excel</MenuItem>
                      <MenuItem value="CSV">CSV</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* Date Range */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <DatePicker
                    label="Fecha desde"
                    value={config.dateRange.from}
                    onChange={(date) => date && handleConfigChange('dateRange', {
                      ...config.dateRange,
                      from: date
                    })}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <DatePicker
                    label="Fecha hasta"
                    value={config.dateRange.to}
                    onChange={(date) => date && handleConfigChange('dateRange', {
                      ...config.dateRange,
                      to: date
                    })}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Content Options */}
          <Accordion 
            expanded={expandedSections.includes('content')}
            onChange={() => toggleSection('content')}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">Contenido</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.includeCharts}
                        onChange={(e) => handleConfigChange('includeCharts', e.target.checked)}
                      />
                    }
                    label="Incluir gráficos"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.includeDetails}
                        onChange={(e) => handleConfigChange('includeDetails', e.target.checked)}
                      />
                    }
                    label="Incluir detalles"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.includeSummary}
                        onChange={(e) => handleConfigChange('includeSummary', e.target.checked)}
                      />
                    }
                    label="Incluir resumen"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.includeRawData}
                        onChange={(e) => handleConfigChange('includeRawData', e.target.checked)}
                      />
                    }
                    label="Incluir datos sin procesar"
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Format-specific Options */}
          {config.format === 'PDF' && (
            <Accordion 
              expanded={expandedSections.includes('pdf')}
              onChange={() => toggleSection('pdf')}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1">Opciones de PDF</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControl fullWidth>
                      <InputLabel>Tamaño de página</InputLabel>
                      <Select
                        value={config.pageSize}
                        label="Tamaño de página"
                        onChange={(e) => handleConfigChange('pageSize', e.target.value)}
                      >
                        <MenuItem value="A4">A4</MenuItem>
                        <MenuItem value="A3">A3</MenuItem>
                        <MenuItem value="Letter">Letter</MenuItem>
                        <MenuItem value="Legal">Legal</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControl fullWidth>
                      <InputLabel>Orientación</InputLabel>
                      <Select
                        value={config.orientation}
                        label="Orientación"
                        onChange={(e) => handleConfigChange('orientation', e.target.value)}
                      >
                        <MenuItem value="portrait">Vertical</MenuItem>
                        <MenuItem value="landscape">Horizontal</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={config.compression}
                          onChange={(e) => handleConfigChange('compression', e.target.checked)}
                        />
                      }
                      label="Comprimir archivo"
                    />
                  </Grid>
                  
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={config.watermark}
                          onChange={(e) => handleConfigChange('watermark', e.target.checked)}
                        />
                      }
                      label="Marca de agua"
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          )}

          {config.format === 'EXCEL' && (
            <Accordion 
              expanded={expandedSections.includes('excel')}
              onChange={() => toggleSection('excel')}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1">Opciones de Excel</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Nombre de la hoja"
                      value={config.sheetName}
                      onChange={(e) => handleConfigChange('sheetName', e.target.value)}
                      helperText="Nombre para la hoja principal"
                    />
                  </Grid>
                  
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={config.includeFormulas}
                          onChange={(e) => handleConfigChange('includeFormulas', e.target.checked)}
                        />
                      }
                      label="Incluir fórmulas"
                    />
                  </Grid>
                  
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={config.autoFilter}
                          onChange={(e) => handleConfigChange('autoFilter', e.target.checked)}
                        />
                      }
                      label="Auto filtro"
                    />
                  </Grid>
                  
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={config.freezePanes}
                          onChange={(e) => handleConfigChange('freezePanes', e.target.checked)}
                        />
                      }
                      label="Congelar paneles"
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          )}

          {config.format === 'CSV' && (
            <Accordion 
              expanded={expandedSections.includes('csv')}
              onChange={() => toggleSection('csv')}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1">Opciones de CSV</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControl fullWidth>
                      <InputLabel>Delimitador</InputLabel>
                      <Select
                        value={config.delimiter}
                        label="Delimitador"
                        onChange={(e) => handleConfigChange('delimiter', e.target.value)}
                      >
                        <MenuItem value=",">Coma (,)</MenuItem>
                        <MenuItem value=";">Punto y coma (;)</MenuItem>
                        <MenuItem value="\t">Tabulación</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControl fullWidth>
                      <InputLabel>Codificación</InputLabel>
                      <Select
                        value={config.encoding}
                        label="Codificación"
                        onChange={(e) => handleConfigChange('encoding', e.target.value)}
                      >
                        <MenuItem value="UTF-8">UTF-8</MenuItem>
                        <MenuItem value="ISO-8859-1">ISO-8859-1</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid size={{ xs: 12 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={config.includeHeaders}
                          onChange={(e) => handleConfigChange('includeHeaders', e.target.checked)}
                        />
                      }
                      label="Incluir encabezados"
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          )}

          {/* Advanced Options */}
          <Accordion 
            expanded={expandedSections.includes('advanced')}
            onChange={() => toggleSection('advanced')}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">Opciones Avanzadas</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography gutterBottom>
                    Máximo de filas: {config.maxRows.toLocaleString()}
                  </Typography>
                  <Slider
                    value={config.maxRows}
                    onChange={(_, value) => handleConfigChange('maxRows', value)}
                    min={100}
                    max={100000}
                    step={100}
                    marks={[
                      { value: 1000, label: '1K' },
                      { value: 10000, label: '10K' },
                      { value: 50000, label: '50K' },
                      { value: 100000, label: '100K' }
                    ]}
                  />
                </Grid>
                
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>Ordenar por</InputLabel>
                    <Select
                      value={config.sortBy}
                      label="Ordenar por"
                      onChange={(e) => handleConfigChange('sortBy', e.target.value)}
                    >
                      <MenuItem value="createdAt">Fecha de creación</MenuItem>
                      <MenuItem value="updatedAt">Fecha de actualización</MenuItem>
                      <MenuItem value="name">Nombre</MenuItem>
                      <MenuItem value="status">Estado</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>Orden</InputLabel>
                    <Select
                      value={config.sortOrder}
                      label="Orden"
                      onChange={(e) => handleConfigChange('sortOrder', e.target.value)}
                    >
                      <MenuItem value="asc">Ascendente</MenuItem>
                      <MenuItem value="desc">Descendente</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Information Box */}
          <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Información de Exportación
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • Los archivos exportados estarán disponibles por 24 horas
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • Recibirás una notificación cuando la exportación esté lista
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • Puedes descargar el archivo desde el historial de reportes
            </Typography>
          </Box>
        </LocalizationProvider>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleExport}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} /> : null}
        >
          {loading ? 'Exportando...' : `Exportar como ${config.format}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};