import React from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Typography,
  Grid,
  Chip,
  OutlinedInput,
  SelectChangeEvent
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';

interface ReportParameter {
  id: string;
  name: string;
  label: string;
  type: 'date' | 'dateRange' | 'select' | 'multiSelect' | 'number' | 'text' | 'boolean';
  required: boolean;
  defaultValue?: any;
  options?: Array<{ value: any; label: string }>;
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  sections: any[];
  parameters: ReportParameter[];
}

interface ReportCustomizerProps {
  template: ReportTemplate;
  parameters: Record<string, any>;
  onParameterChange: (paramName: string, value: any) => void;
}

export const ReportCustomizer: React.FC<ReportCustomizerProps> = ({
  template,
  parameters,
  onParameterChange
}) => {
  const handleSelectChange = (event: SelectChangeEvent<any>, paramName: string) => {
    onParameterChange(paramName, event.target.value);
  };

  const handleMultiSelectChange = (event: SelectChangeEvent<any>, paramName: string) => {
    const value = event.target.value;
    onParameterChange(paramName, typeof value === 'string' ? value.split(',') : value);
  };

  const renderParameter = (param: ReportParameter) => {
    const value = parameters[param.name] || param.defaultValue || '';

    switch (param.type) {
      case 'text':
        return (
          <TextField
            key={param.id}
            fullWidth
            label={param.label}
            value={value}
            onChange={(e) => onParameterChange(param.name, e.target.value)}
            required={param.required}
            variant="outlined"
            size="small"
          />
        );

      case 'number':
        return (
          <TextField
            key={param.id}
            fullWidth
            label={param.label}
            type="number"
            value={value}
            onChange={(e) => onParameterChange(param.name, Number(e.target.value))}
            required={param.required}
            variant="outlined"
            size="small"
          />
        );

      case 'date':
        return (
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
            <DatePicker
              key={param.id}
              label={param.label}
              value={value ? new Date(value) : null}
              onChange={(newValue) => onParameterChange(param.name, newValue?.toISOString().split('T')[0])}
              slotProps={{
                textField: {
                  fullWidth: true,
                  size: 'small',
                  required: param.required
                }
              }}
            />
          </LocalizationProvider>
        );

      case 'dateRange':
        return (
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
            <Box key={param.id}>
              <Typography variant="subtitle2" gutterBottom>
                {param.label}
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                  <DatePicker
                    label="Fecha Desde"
                    value={value?.from ? new Date(value.from) : null}
                    onChange={(newValue) => 
                      onParameterChange(param.name, {
                        ...value,
                        from: newValue?.toISOString().split('T')[0]
                      })
                    }
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: 'small'
                      }
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <DatePicker
                    label="Fecha Hasta"
                    value={value?.to ? new Date(value.to) : null}
                    onChange={(newValue) => 
                      onParameterChange(param.name, {
                        ...value,
                        to: newValue?.toISOString().split('T')[0]
                      })
                    }
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: 'small'
                      }
                    }}
                  />
                </Grid>
              </Grid>
            </Box>
          </LocalizationProvider>
        );

      case 'select':
        return (
          <FormControl key={param.id} fullWidth size="small">
            <InputLabel>{param.label}</InputLabel>
            <Select
              value={value}
              label={param.label}
              onChange={(e) => handleSelectChange(e, param.name)}
              required={param.required}
            >
              {!param.required && (
                <MenuItem value="">
                  <em>Todos</em>
                </MenuItem>
              )}
              {param.options?.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );

      case 'multiSelect':
        return (
          <FormControl key={param.id} fullWidth size="small">
            <InputLabel>{param.label}</InputLabel>
            <Select
              multiple
              value={Array.isArray(value) ? value : []}
              onChange={(e) => handleMultiSelectChange(e, param.name)}
              input={<OutlinedInput label={param.label} />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(selected as string[]).map((val) => {
                    const option = param.options?.find(opt => opt.value === val);
                    return (
                      <Chip
                        key={val}
                        label={option?.label || val}
                        size="small"
                      />
                    );
                  })}
                </Box>
              )}
            >
              {param.options?.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  <Checkbox 
                    checked={Array.isArray(value) && value.indexOf(option.value) > -1} 
                  />
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );

      case 'boolean':
        return (
          <FormGroup key={param.id}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={Boolean(value)}
                  onChange={(e) => onParameterChange(param.name, e.target.checked)}
                />
              }
              label={param.label}
            />
          </FormGroup>
        );

      default:
        return null;
    }
  };

  if (!template.parameters || template.parameters.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: 'center', bgcolor: 'grey.50', borderRadius: 1 }}>
        <Typography variant="body2" color="text.secondary">
          Esta plantilla no requiere parámetros adicionales
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Configuración del Reporte
      </Typography>
      
      <Grid container spacing={3}>
        {template.parameters.map((param) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={param.id}>
            {renderParameter(param)}
          </Grid>
        ))}
      </Grid>

      {/* Mostrar parámetros actuales para debug */}
      {process.env.NODE_ENV === 'development' && Object.keys(parameters).length > 0 && (
        <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            Parámetros actuales (desarrollo):
          </Typography>
          <pre style={{ fontSize: '12px', margin: 0 }}>
            {JSON.stringify(parameters, null, 2)}
          </pre>
        </Box>
      )}
    </Box>
  );
};