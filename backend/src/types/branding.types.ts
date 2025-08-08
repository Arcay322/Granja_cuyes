// Corporate branding and template types
export interface CorporateBranding {
  id: string;
  name: string;
  isDefault: boolean;
  
  // Logo configuration
  logo: {
    url?: string;
    width: number;
    height: number;
    position: 'left' | 'center' | 'right';
  };
  
  // Color palette
  colors: {
    primary: string;      // Main brand color
    secondary: string;    // Secondary brand color
    accent: string;       // Accent color for highlights
    success: string;      // Green for positive values
    warning: string;      // Yellow for warnings
    danger: string;       // Red for negative values
    neutral: string;      // Gray for neutral elements
    background: string;   // Background color
    text: string;         // Main text color
    textLight: string;    // Light text color
  };
  
  // Typography
  fonts: {
    primary: string;      // Main font family
    secondary: string;    // Secondary font family
    monospace: string;    // Monospace for numbers
  };
  
  // Company information
  company: {
    name: string;
    tagline?: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
  };
  
  // Watermark configuration
  watermark?: {
    text: string;
    opacity: number;
    position: 'center' | 'bottom-right' | 'bottom-left';
  };
}

export interface TemplateConfiguration {
  id: string;
  name: string;
  type: TemplateType;
  description: string;
  
  // Layout configuration
  layout: {
    pageSize: 'A4' | 'Letter' | 'Legal';
    orientation: 'portrait' | 'landscape';
    margins: {
      top: number;
      right: number;
      bottom: number;
      left: number;
    };
    columns: 1 | 2 | 3;
    spacing: {
      section: number;
      paragraph: number;
      line: number;
    };
  };
  
  // Component styling
  components: {
    header: {
      height: number;
      showLogo: boolean;
      showCompanyInfo: boolean;
      backgroundColor?: string;
      textColor?: string;
    };
    footer: {
      height: number;
      showPageNumbers: boolean;
      showGenerationDate: boolean;
      showCompanyInfo: boolean;
      customText?: string;
    };
    coverPage: {
      enabled: boolean;
      style: 'minimal' | 'corporate' | 'executive';
      showLogo: boolean;
      showDate: boolean;
      showSummary: boolean;
    };
    tableOfContents: {
      enabled: boolean;
      maxDepth: number;
      showPageNumbers: boolean;
    };
  };
  
  // Visual styling
  styling: {
    tables: {
      headerStyle: 'solid' | 'gradient' | 'minimal';
      alternateRows: boolean;
      borderStyle: 'none' | 'light' | 'medium' | 'heavy';
      cellPadding: number;
    };
    charts: {
      style: 'modern' | 'classic' | 'minimal';
      showGridLines: boolean;
      showDataLabels: boolean;
      colorScheme: 'corporate' | 'vibrant' | 'monochrome';
    };
    kpis: {
      cardStyle: 'flat' | 'elevated' | 'outlined';
      showIcons: boolean;
      showTrends: boolean;
      size: 'small' | 'medium' | 'large';
    };
    text: {
      headingStyle: 'bold' | 'colored' | 'underlined';
      paragraphSpacing: number;
      listStyle: 'bullets' | 'numbers' | 'custom';
    };
  };
}

export type TemplateType = 'executive' | 'technical' | 'presentation' | 'minimal';

export interface KPIVisualization {
  type: 'card' | 'gauge' | 'progress' | 'trend';
  size: 'small' | 'medium' | 'large';
  showIcon: boolean;
  showTrend: boolean;
  showComparison: boolean;
  colorScheme: 'auto' | 'positive' | 'negative' | 'neutral';
}

export interface ChartStyling {
  colorPalette: string[];
  backgroundColor: string;
  gridColor: string;
  textColor: string;
  fontSize: number;
  fontFamily: string;
  showLegend: boolean;
  legendPosition: 'top' | 'bottom' | 'left' | 'right';
  showDataLabels: boolean;
  showGridLines: boolean;
  borderRadius: number;
  shadow: boolean;
}

export interface TableStyling {
  headerBackgroundColor: string;
  headerTextColor: string;
  alternateRowColor: string;
  borderColor: string;
  borderWidth: number;
  cellPadding: number;
  fontSize: number;
  fontFamily: string;
  textAlign: 'left' | 'center' | 'right';
  verticalAlign: 'top' | 'middle' | 'bottom';
}

// Predefined corporate color palettes
export const CORPORATE_COLOR_PALETTES = {
  sumaquywa: {
    primary: '#2196F3',
    secondary: '#1976D2',
    accent: '#03DAC6',
    success: '#4CAF50',
    warning: '#FF9800',
    danger: '#F44336',
    neutral: '#9E9E9E',
    background: '#FFFFFF',
    text: '#212121',
    textLight: '#757575'
  },
  professional: {
    primary: '#1565C0',
    secondary: '#0D47A1',
    accent: '#00ACC1',
    success: '#388E3C',
    warning: '#F57C00',
    danger: '#D32F2F',
    neutral: '#616161',
    background: '#FAFAFA',
    text: '#263238',
    textLight: '#546E7A'
  },
  elegant: {
    primary: '#6A1B9A',
    secondary: '#4A148C',
    accent: '#E91E63',
    success: '#2E7D32',
    warning: '#EF6C00',
    danger: '#C62828',
    neutral: '#424242',
    background: '#F8F9FA',
    text: '#1A1A1A',
    textLight: '#666666'
  },
  modern: {
    primary: '#00BCD4',
    secondary: '#0097A7',
    accent: '#FF5722',
    success: '#66BB6A',
    warning: '#FFA726',
    danger: '#EF5350',
    neutral: '#78909C',
    background: '#FFFFFF',
    text: '#37474F',
    textLight: '#90A4AE'
  }
};

// Predefined template configurations
export const TEMPLATE_PRESETS: Record<TemplateType, Partial<TemplateConfiguration>> = {
  executive: {
    name: 'Ejecutivo',
    description: 'Template profesional para presentaciones ejecutivas',
    layout: {
      pageSize: 'A4',
      orientation: 'portrait',
      margins: { top: 25, right: 20, bottom: 25, left: 20 },
      columns: 1,
      spacing: { section: 20, paragraph: 12, line: 1.5 }
    },
    components: {
      coverPage: { enabled: true, style: 'executive', showLogo: true, showDate: true, showSummary: true },
      tableOfContents: { enabled: true, maxDepth: 3, showPageNumbers: true },
      header: { height: 60, showLogo: true, showCompanyInfo: true },
      footer: { height: 40, showPageNumbers: true, showGenerationDate: true, showCompanyInfo: false }
    },
    styling: {
      tables: { headerStyle: 'gradient', alternateRows: true, borderStyle: 'light', cellPadding: 8 },
      charts: { style: 'modern', showGridLines: true, showDataLabels: true, colorScheme: 'corporate' },
      kpis: { cardStyle: 'elevated', showIcons: true, showTrends: true, size: 'large' },
      text: { headingStyle: 'colored', paragraphSpacing: 12, listStyle: 'bullets' }
    }
  },
  technical: {
    name: 'Técnico',
    description: 'Template detallado para análisis técnicos',
    layout: {
      pageSize: 'A4',
      orientation: 'portrait',
      margins: { top: 20, right: 15, bottom: 20, left: 15 },
      columns: 1,
      spacing: { section: 15, paragraph: 10, line: 1.4 }
    },
    components: {
      coverPage: { enabled: true, style: 'minimal', showLogo: true, showDate: true, showSummary: false },
      tableOfContents: { enabled: true, maxDepth: 4, showPageNumbers: true },
      header: { height: 50, showLogo: false, showCompanyInfo: true },
      footer: { height: 35, showPageNumbers: true, showGenerationDate: true, showCompanyInfo: true }
    },
    styling: {
      tables: { headerStyle: 'solid', alternateRows: true, borderStyle: 'medium', cellPadding: 6 },
      charts: { style: 'classic', showGridLines: true, showDataLabels: false, colorScheme: 'monochrome' },
      kpis: { cardStyle: 'outlined', showIcons: false, showTrends: true, size: 'medium' },
      text: { headingStyle: 'bold', paragraphSpacing: 10, listStyle: 'numbers' }
    }
  },
  presentation: {
    name: 'Presentación',
    description: 'Template visual para presentaciones',
    layout: {
      pageSize: 'A4',
      orientation: 'landscape',
      margins: { top: 30, right: 25, bottom: 30, left: 25 },
      columns: 2,
      spacing: { section: 25, paragraph: 15, line: 1.6 }
    },
    components: {
      coverPage: { enabled: true, style: 'corporate', showLogo: true, showDate: true, showSummary: true },
      tableOfContents: { enabled: false, maxDepth: 2, showPageNumbers: false },
      header: { height: 70, showLogo: true, showCompanyInfo: false },
      footer: { height: 45, showPageNumbers: true, showGenerationDate: false, showCompanyInfo: true }
    },
    styling: {
      tables: { headerStyle: 'gradient', alternateRows: false, borderStyle: 'light', cellPadding: 10 },
      charts: { style: 'modern', showGridLines: false, showDataLabels: true, colorScheme: 'vibrant' },
      kpis: { cardStyle: 'elevated', showIcons: true, showTrends: true, size: 'large' },
      text: { headingStyle: 'colored', paragraphSpacing: 15, listStyle: 'custom' }
    }
  },
  minimal: {
    name: 'Minimalista',
    description: 'Template limpio y minimalista',
    layout: {
      pageSize: 'A4',
      orientation: 'portrait',
      margins: { top: 30, right: 25, bottom: 30, left: 25 },
      columns: 1,
      spacing: { section: 20, paragraph: 14, line: 1.5 }
    },
    components: {
      coverPage: { enabled: false, style: 'minimal', showLogo: false, showDate: false, showSummary: false },
      tableOfContents: { enabled: false, maxDepth: 2, showPageNumbers: false },
      header: { height: 40, showLogo: false, showCompanyInfo: false },
      footer: { height: 30, showPageNumbers: true, showGenerationDate: true, showCompanyInfo: false }
    },
    styling: {
      tables: { headerStyle: 'minimal', alternateRows: false, borderStyle: 'none', cellPadding: 8 },
      charts: { style: 'minimal', showGridLines: false, showDataLabels: false, colorScheme: 'monochrome' },
      kpis: { cardStyle: 'flat', showIcons: false, showTrends: false, size: 'small' },
      text: { headingStyle: 'bold', paragraphSpacing: 14, listStyle: 'bullets' }
    }
  }
};