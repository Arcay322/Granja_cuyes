/**
 * Este archivo centraliza todas las importaciones de Material UI para evitar inconsistencias.
 * En lugar de importar componentes directamente de @mui/material,
 * importa desde este archivo para mantener la consistencia.
 */

// Componentes base
export { default as Box } from '@mui/material/Box';
export { default as Container } from '@mui/material/Container';
export { default as Grid } from '@mui/material/Grid2';
export { default as Paper } from '@mui/material/Paper';
export { default as Card } from '@mui/material/Card';
export { default as CardContent } from '@mui/material/CardContent';
export { default as CardActions } from '@mui/material/CardActions';
export { default as CardHeader } from '@mui/material/CardHeader';
export { default as CardMedia } from '@mui/material/CardMedia';
export { default as Divider } from '@mui/material/Divider';

// Componentes de formulario
export { default as Button } from '@mui/material/Button';
export { default as TextField } from '@mui/material/TextField';
export { default as Select } from '@mui/material/Select';
export { default as MenuItem } from '@mui/material/MenuItem';
export { default as FormControl } from '@mui/material/FormControl';
export { default as FormControlLabel } from '@mui/material/FormControlLabel';
export { default as InputLabel } from '@mui/material/InputLabel';
export { default as InputBase } from '@mui/material/InputBase';
export { default as InputAdornment } from '@mui/material/InputAdornment';
export { default as Switch } from '@mui/material/Switch';
export { default as Checkbox } from '@mui/material/Checkbox';
export { default as Radio } from '@mui/material/Radio';
export { default as RadioGroup } from '@mui/material/RadioGroup';

// Componentes de tabla
export { default as Table } from '@mui/material/Table';
export { default as TableBody } from '@mui/material/TableBody';
export { default as TableCell } from '@mui/material/TableCell';
export { default as TableContainer } from '@mui/material/TableContainer';
export { default as TableHead } from '@mui/material/TableHead';
export { default as TableRow } from '@mui/material/TableRow';
export { default as TablePagination } from '@mui/material/TablePagination';
export { default as TableSortLabel } from '@mui/material/TableSortLabel';

// Componentes de diálogo y feedback
export { default as Dialog } from '@mui/material/Dialog';
export { default as DialogActions } from '@mui/material/DialogActions';
export { default as DialogContent } from '@mui/material/DialogContent';
export { default as DialogContentText } from '@mui/material/DialogContentText';
export { default as DialogTitle } from '@mui/material/DialogTitle';
export { default as Snackbar } from '@mui/material/Snackbar';
export { default as Alert } from '@mui/material/Alert';
export { default as CircularProgress } from '@mui/material/CircularProgress';
export { default as LinearProgress } from '@mui/material/LinearProgress';
export { default as Backdrop } from '@mui/material/Backdrop';

// Componentes de navegación
export { default as Menu } from '@mui/material/Menu';
export { default as Toolbar } from '@mui/material/Toolbar';
export { default as Breadcrumbs } from '@mui/material/Breadcrumbs';
export { default as Link } from '@mui/material/Link';
export { default as Tabs } from '@mui/material/Tabs';
export { default as Tab } from '@mui/material/Tab';

// Componentes de visualización
export { default as Typography } from '@mui/material/Typography';
export { default as Avatar } from '@mui/material/Avatar';
export { default as Chip } from '@mui/material/Chip';
export { default as Tooltip } from '@mui/material/Tooltip';
export { default as IconButton } from '@mui/material/IconButton';
export { default as Badge } from '@mui/material/Badge';
export { default as List } from '@mui/material/List';
export { default as ListItem } from '@mui/material/ListItem';
export { default as ListItemText } from '@mui/material/ListItemText';
export { default as ListItemIcon } from '@mui/material/ListItemIcon';
export { default as ListItemAvatar } from '@mui/material/ListItemAvatar';
export { default as Collapse } from '@mui/material/Collapse';

// Componentes de transición y flotantes
export { default as Slide } from '@mui/material/Slide';
export { default as Fab } from '@mui/material/Fab';

// Utilidades
export { styled } from '@mui/material/styles';
export { alpha } from '@mui/material/styles';
export { useTheme } from '@mui/material/styles';

// Re-exportación de todo el módulo para compatibilidad con código existente
export * from '@mui/material';
