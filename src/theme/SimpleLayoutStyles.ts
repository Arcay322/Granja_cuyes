// Estilos compartidos para el layout de las páginas sin dependencias externas

// Definición de tipos simplificada
type SxStyles = Record<string, any>;

// Estilos para hacer que los contenedores ocupen todo el espacio disponible
export const containerFullHeight: SxStyles = {
  minHeight: 'calc(100vh - 80px)',
  width: '100%', 
  maxWidth: '100%',
  py: 3,
  px: 0, // Quitamos el padding horizontal para ocupar todo el ancho
  display: 'flex',
  flexDirection: 'column'
};

// Estilos para tarjetas principales
export const mainCardStyles: SxStyles = {
  borderRadius: 3,
  boxShadow: 3,
  flex: 1,
  width: '100%',
  overflow: 'auto',
  p: { xs: 2, sm: 3 },
  backgroundImage: 'none'
};

// Estilos para diálogos y formularios
export const formDialogStyles = {
  paper: {
    borderRadius: 3,
    maxWidth: '800px',
    width: '100%'
  },
  title: { 
    pb: 1,
    '& .MuiTypography-root': {
      fontWeight: 600,
      display: 'flex',
      alignItems: 'center',
      gap: 1
    }
  },
  content: {
    pt: 3
  },
  actions: {
    px: 3,
    py: 2
  }
};

// Estilos para inputs de formulario
export const formControlStyles = {
  size: "medium" as const,
  variant: "outlined" as const,
  fullWidth: true,
  margin: "normal" as const
};

// Estilos para botones principales de acción
export const mainButtonStyles: SxStyles = {
  borderRadius: 2,
  textTransform: 'none',
  py: 1.25
};
