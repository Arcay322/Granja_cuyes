import {
    Category,
    Close,
    GridOn,
    Numbers,
    Save,
    Warehouse
} from '@mui/icons-material';
import React, { useEffect, useState } from 'react';
import api from '../services/api';
import toastService from '../services/toastService';
import {
    Alert,
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    FormControl,
    Grid,
    InputAdornment,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Typography
} from '../utils/mui';

interface JaulaFormProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    galpon: string;
    jaula?: {
        codigo: string;
        descripcion?: string;
        capacidadMaxima?: number;
        tipo?: string;
        estado?: string;
    } | null;
    mode: 'create' | 'edit';
}

const JaulaForm: React.FC<JaulaFormProps> = ({
    open,
    onClose,
    onSuccess,
    galpon,
    jaula,
    mode
}) => {
    const [formData, setFormData] = useState({
        codigo: '',
        descripcion: '',
        capacidadMaxima: 20,
        tipo: 'Standard',
        estado: 'Disponible'
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    // Cargar datos de la jaula si estamos editando
    useEffect(() => {
        if (open) {
            if (mode === 'edit' && jaula) {
                setFormData({
                    codigo: jaula.codigo || '',
                    descripcion: jaula.descripcion || '',
                    capacidadMaxima: jaula.capacidadMaxima || 20,
                    tipo: jaula.tipo || 'Standard',
                    estado: jaula.estado || 'Disponible'
                });
            } else {
                setFormData({
                    codigo: '',
                    descripcion: '',
                    capacidadMaxima: 20,
                    tipo: 'Standard',
                    estado: 'Disponible'
                });
            }
            setErrors({});
        }
    }, [open, mode, jaula]);

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Limpiar error del campo
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};

        if (!formData.codigo.trim()) {
            newErrors.codigo = 'El código de la jaula es obligatorio';
        } else if (formData.codigo.length < 1) {
            newErrors.codigo = 'El código debe tener al menos 1 carácter';
        }

        if (formData.capacidadMaxima <= 0) {
            newErrors.capacidadMaxima = 'La capacidad debe ser mayor a 0';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setLoading(true);
        try {
            const dataToSend = {
                ...formData,
                galpon
            };

            if (mode === 'create') {
                await api.post('/jaulas', dataToSend);
                toastService.success(
                    'Jaula Creada',
                    `La jaula "${formData.codigo}" ha sido creada en el galpón ${galpon}`
                );
            } else {
                await api.put(`/jaulas/${galpon}/${jaula?.codigo}`, dataToSend);
                toastService.success(
                    'Jaula Actualizada',
                    `La jaula "${formData.codigo}" ha sido actualizada`
                );
            }

            handleClose();
            onSuccess();
        } catch (err: any) {
            console.error('Error al guardar jaula:', err);
            toastService.error(
                'Error al Guardar',
                err.response?.data?.message || `No se pudo ${mode === 'create' ? 'crear' : 'actualizar'} la jaula`
            );
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFormData({
            codigo: '',
            descripcion: '',
            capacidadMaxima: 20,
            tipo: 'Standard',
            estado: 'Disponible'
        });
        setErrors({});
        onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: { borderRadius: 3 }
            }}
        >
            <DialogTitle sx={{ pb: 1 }}>
                <Typography variant="h5" component="div" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <GridOn color="primary" />
                    {mode === 'create' ? `Nueva Jaula en Galpón ${galpon}` : `Editar Jaula ${jaula?.codigo}`}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {mode === 'create'
                        ? 'Configura la información de la nueva jaula'
                        : 'Modifica la información de la jaula existente'
                    }
                </Typography>
            </DialogTitle>

            <Divider />

            <DialogContent sx={{ pt: 3 }}>
                <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="Galpón"
                            value={galpon}
                            fullWidth
                            disabled
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Warehouse fontSize="small" />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="Código de Jaula"
                            value={formData.codigo}
                            onChange={(e) => handleChange('codigo', e.target.value)}
                            fullWidth
                            required
                            error={!!errors.codigo}
                            helperText={errors.codigo || 'Ej: J-001, 15, A1'}
                            placeholder="Código único de la jaula"
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Numbers fontSize="small" />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Grid>

                    <Grid item xs={12}>
                        <TextField
                            label="Descripción"
                            value={formData.descripcion}
                            onChange={(e) => handleChange('descripcion', e.target.value)}
                            fullWidth
                            multiline
                            rows={2}
                            placeholder="Descripción opcional de la jaula"
                            helperText="Información adicional sobre la jaula"
                        />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="Capacidad Máxima"
                            type="number"
                            value={formData.capacidadMaxima}
                            onChange={(e) => handleChange('capacidadMaxima', parseInt(e.target.value) || 0)}
                            fullWidth
                            required
                            error={!!errors.capacidadMaxima}
                            helperText={errors.capacidadMaxima || 'Número máximo de cuyes'}
                            inputProps={{ min: 1, max: 100 }}
                            InputProps={{
                                endAdornment: <InputAdornment position="end">cuyes</InputAdornment>,
                            }}
                        />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                            <InputLabel>Tipo de Jaula</InputLabel>
                            <Select
                                value={formData.tipo}
                                label="Tipo de Jaula"
                                onChange={(e) => handleChange('tipo', e.target.value)}
                                startAdornment={
                                    <InputAdornment position="start">
                                        <Category fontSize="small" />
                                    </InputAdornment>
                                }
                            >
                                <MenuItem value="Standard">Standard - Jaula común</MenuItem>
                                <MenuItem value="Reproductora">Reproductora - Para madres</MenuItem>
                                <MenuItem value="Engorde">Engorde - Para crecimiento</MenuItem>
                                <MenuItem value="Cuarentena">Cuarentena - Aislamiento</MenuItem>
                                <MenuItem value="Maternidad">Maternidad - Partos</MenuItem>
                                <MenuItem value="Juveniles">Juveniles - Crías</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12}>
                        <FormControl fullWidth>
                            <InputLabel>Estado de la Jaula</InputLabel>
                            <Select
                                value={formData.estado}
                                label="Estado de la Jaula"
                                onChange={(e) => handleChange('estado', e.target.value)}
                            >
                                <MenuItem value="Disponible">
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main' }} />
                                        Disponible
                                    </Box>
                                </MenuItem>
                                <MenuItem value="Ocupada">
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'info.main' }} />
                                        Ocupada
                                    </Box>
                                </MenuItem>
                                <MenuItem value="Mantenimiento">
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'warning.main' }} />
                                        En Mantenimiento
                                    </Box>
                                </MenuItem>
                                <MenuItem value="Fuera de Servicio">
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'error.main' }} />
                                        Fuera de Servicio
                                    </Box>
                                </MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>

                {Object.keys(errors).length > 0 && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                        Por favor corrige los errores antes de continuar
                    </Alert>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button
                    onClick={handleClose}
                    variant="outlined"
                    startIcon={<Close />}
                >
                    Cancelar
                </Button>

                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    startIcon={<Save />}
                    disabled={loading}
                >
                    {loading
                        ? (mode === 'create' ? 'Creando...' : 'Actualizando...')
                        : (mode === 'create' ? 'Crear Jaula' : 'Actualizar')
                    }
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default JaulaForm;
