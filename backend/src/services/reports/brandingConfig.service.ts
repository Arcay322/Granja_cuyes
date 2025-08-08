import { 
  CorporateBranding, 
  TemplateConfiguration, 
  TemplateType,
  CORPORATE_COLOR_PALETTES,
  TEMPLATE_PRESETS 
} from '../../types/branding.types';
import logger from '../../utils/logger';

/**
 * Service for managing corporate branding and template configurations
 */
export class BrandingConfigService {
  private static instance: BrandingConfigService;
  private currentBranding: CorporateBranding;
  private availableTemplates: Map<string, TemplateConfiguration>;

  constructor() {
    this.currentBranding = this.getDefaultBranding();
    this.availableTemplates = new Map();
    this.initializeDefaultTemplates();
  }

  public static getInstance(): BrandingConfigService {
    if (!BrandingConfigService.instance) {
      BrandingConfigService.instance = new BrandingConfigService();
    }
    return BrandingConfigService.instance;
  }

  /**
   * Get default SumaqUywa branding configuration
   */
  private getDefaultBranding(): CorporateBranding {
    return {
      id: 'sumaquywa-default',
      name: 'SumaqUywa Default',
      isDefault: true,
      logo: {
        url: undefined, // Will be set when logo is uploaded
        width: 120,
        height: 40,
        position: 'left'
      },
      colors: CORPORATE_COLOR_PALETTES.sumaquywa,
      fonts: {
        primary: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
        secondary: 'Arial, Helvetica, sans-serif',
        monospace: 'Consolas, Monaco, "Courier New", monospace'
      },
      company: {
        name: 'SumaqUywa',
        tagline: 'Sistema de Gestión de Cuyes',
        address: undefined,
        phone: undefined,
        email: undefined,
        website: 'www.sumaquywa.com'
      },
      watermark: {
        text: 'SumaqUywa',
        opacity: 0.1,
        position: 'center'
      }
    };
  }

  /**
   * Initialize default template configurations
   */
  private initializeDefaultTemplates(): void {
    Object.entries(TEMPLATE_PRESETS).forEach(([type, preset]) => {
      const template: TemplateConfiguration = {
        id: `${type}-default`,
        type: type as TemplateType,
        ...preset
      } as TemplateConfiguration;
      
      this.availableTemplates.set(template.id, template);
    });

    logger.info('Initialized default templates', { 
      count: this.availableTemplates.size,
      templates: Array.from(this.availableTemplates.keys())
    });
  }

  /**
   * Get current branding configuration
   */
  getCurrentBranding(): CorporateBranding {
    return { ...this.currentBranding };
  }

  /**
   * Update branding configuration
   */
  updateBranding(branding: Partial<CorporateBranding>): CorporateBranding {
    this.currentBranding = {
      ...this.currentBranding,
      ...branding,
      colors: {
        ...this.currentBranding.colors,
        ...(branding.colors || {})
      },
      fonts: {
        ...this.currentBranding.fonts,
        ...(branding.fonts || {})
      },
      company: {
        ...this.currentBranding.company,
        ...(branding.company || {})
      },
      logo: {
        ...this.currentBranding.logo,
        ...(branding.logo || {})
      }
    };

    logger.info('Updated branding configuration', { 
      brandingId: this.currentBranding.id,
      changes: Object.keys(branding)
    });

    return this.getCurrentBranding();
  }

  /**
   * Get template configuration by ID
   */
  getTemplate(templateId: string): TemplateConfiguration | null {
    const template = this.availableTemplates.get(templateId);
    return template ? { ...template } : null;
  }

  /**
   * Get template by type (returns default template for that type)
   */
  getTemplateByType(type: TemplateType): TemplateConfiguration | null {
    const templateId = `${type}-default`;
    return this.getTemplate(templateId);
  }

  /**
   * Get all available templates
   */
  getAllTemplates(): TemplateConfiguration[] {
    return Array.from(this.availableTemplates.values()).map(template => ({ ...template }));
  }

  /**
   * Create custom template based on existing template
   */
  createCustomTemplate(
    baseTemplateId: string, 
    customizations: Partial<TemplateConfiguration>,
    customId: string
  ): TemplateConfiguration | null {
    const baseTemplate = this.getTemplate(baseTemplateId);
    if (!baseTemplate) {
      logger.error('Base template not found', { baseTemplateId });
      return null;
    }

    const customTemplate: TemplateConfiguration = {
      ...baseTemplate,
      ...customizations,
      id: customId,
      layout: {
        ...baseTemplate.layout,
        ...(customizations.layout || {})
      },
      components: {
        ...baseTemplate.components,
        ...(customizations.components || {}),
        header: {
          ...baseTemplate.components.header,
          ...(customizations.components?.header || {})
        },
        footer: {
          ...baseTemplate.components.footer,
          ...(customizations.components?.footer || {})
        },
        coverPage: {
          ...baseTemplate.components.coverPage,
          ...(customizations.components?.coverPage || {})
        },
        tableOfContents: {
          ...baseTemplate.components.tableOfContents,
          ...(customizations.components?.tableOfContents || {})
        }
      },
      styling: {
        ...baseTemplate.styling,
        ...(customizations.styling || {}),
        tables: {
          ...baseTemplate.styling.tables,
          ...(customizations.styling?.tables || {})
        },
        charts: {
          ...baseTemplate.styling.charts,
          ...(customizations.styling?.charts || {})
        },
        kpis: {
          ...baseTemplate.styling.kpis,
          ...(customizations.styling?.kpis || {})
        },
        text: {
          ...baseTemplate.styling.text,
          ...(customizations.styling?.text || {})
        }
      }
    };

    this.availableTemplates.set(customId, customTemplate);
    
    logger.info('Created custom template', { 
      customId, 
      baseTemplateId,
      customizations: Object.keys(customizations)
    });

    return { ...customTemplate };
  }

  /**
   * Apply branding to template configuration
   */
  applyBrandingToTemplate(template: TemplateConfiguration): TemplateConfiguration {
    const branding = this.getCurrentBranding();
    
    return {
      ...template,
      components: {
        ...template.components,
        header: {
          ...template.components.header,
          backgroundColor: template.components.header.backgroundColor || branding.colors.primary,
          textColor: template.components.header.textColor || branding.colors.background
        }
      }
    };
  }

  /**
   * Get color palette for charts based on current branding
   */
  getChartColorPalette(): string[] {
    const colors = this.currentBranding.colors;
    return [
      colors.primary,
      colors.secondary,
      colors.accent,
      colors.success,
      colors.warning,
      colors.danger,
      colors.neutral,
      // Additional colors for more data series
      this.lightenColor(colors.primary, 20),
      this.lightenColor(colors.secondary, 20),
      this.lightenColor(colors.accent, 20),
      this.darkenColor(colors.primary, 20),
      this.darkenColor(colors.secondary, 20)
    ];
  }

  /**
   * Get styled table configuration based on current branding
   */
  getStyledTableConfig(templateStyling: any): any {
    const colors = this.currentBranding.colors;
    const fonts = this.currentBranding.fonts;

    return {
      headerBackgroundColor: colors.primary,
      headerTextColor: colors.background,
      alternateRowColor: this.lightenColor(colors.neutral, 40),
      borderColor: colors.neutral,
      borderWidth: templateStyling.borderStyle === 'none' ? 0 : 
                   templateStyling.borderStyle === 'light' ? 1 :
                   templateStyling.borderStyle === 'medium' ? 2 : 3,
      cellPadding: templateStyling.cellPadding,
      fontSize: 11,
      fontFamily: fonts.primary,
      textAlign: 'left' as const,
      verticalAlign: 'middle' as const
    };
  }

  /**
   * Get KPI card styling based on current branding
   */
  getKPICardStyling(templateStyling: any): any {
    const colors = this.currentBranding.colors;
    
    return {
      backgroundColor: colors.background,
      borderColor: colors.neutral,
      textColor: colors.text,
      accentColor: colors.primary,
      successColor: colors.success,
      warningColor: colors.warning,
      dangerColor: colors.danger,
      cardStyle: templateStyling.cardStyle,
      showIcons: templateStyling.showIcons,
      showTrends: templateStyling.showTrends,
      size: templateStyling.size
    };
  }

  /**
   * Utility function to lighten a color
   */
  private lightenColor(color: string, percent: number): string {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  }

  /**
   * Utility function to darken a color
   */
  private darkenColor(color: string, percent: number): string {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) - amt;
    const G = (num >> 8 & 0x00FF) - amt;
    const B = (num & 0x0000FF) - amt;
    return '#' + (0x1000000 + (R > 255 ? 255 : R < 0 ? 0 : R) * 0x10000 +
      (G > 255 ? 255 : G < 0 ? 0 : G) * 0x100 +
      (B > 255 ? 255 : B < 0 ? 0 : B)).toString(16).slice(1);
  }

  /**
   * Validate branding configuration
   */
  validateBranding(branding: Partial<CorporateBranding>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate colors
    if (branding.colors) {
      Object.entries(branding.colors).forEach(([key, color]) => {
        if (typeof color === 'string' && !this.isValidHexColor(color)) {
          errors.push(`Invalid color format for ${key}: ${color}`);
        }
      });
    }

    // Validate logo dimensions
    if (branding.logo) {
      if (branding.logo.width && (branding.logo.width < 50 || branding.logo.width > 300)) {
        errors.push('Logo width must be between 50 and 300 pixels');
      }
      if (branding.logo.height && (branding.logo.height < 20 || branding.logo.height > 150)) {
        errors.push('Logo height must be between 20 and 150 pixels');
      }
    }

    // Validate company information
    if (branding.company?.email && !this.isValidEmail(branding.company.email)) {
      errors.push('Invalid email format');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate hex color format
   */
  private isValidHexColor(color: string): boolean {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}

// Export singleton instance
export const brandingConfigService = BrandingConfigService.getInstance();