import { PrismaClient } from '@prisma/client';
import logger from '../../utils/logger';

// Report Data Interfaces
export interface ReportParameters {
  dateRange?: {
    from: string;
    to: string;
  };
  galpon?: string;
  etapaVida?: string;
  estado?: string;
  categoria?: string;
  filters?: Record<string, any>;
}

export interface DateRange {
  from: Date;
  to: Date;
}

export interface ChartData {
  type: 'bar' | 'line' | 'pie' | 'doughnut';
  title: string;
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string[];
    borderColor?: string[];
  }[];
}

// Financial Report Data Interfaces
export interface SaleRecord {
  id: string;
  fecha: Date;
  cantidad: number;
  precioUnitario: number;
  total: number;
  cliente: {
    nombre: string;
    telefono?: string;
  };
  observaciones?: string;
}

export interface ExpenseRecord {
  id: string;
  fecha: Date;
  concepto: string;
  monto: number;
  categoria: string;
  descripcion?: string;
}

export interface FinancialReportData {
  templateId: string;
  generatedAt: string;
  parameters: ReportParameters;
  period: DateRange;
  summary: {
    totalIncome: number;
    totalExpenses: number;
    netProfit: number;
    profitMargin: number;
    salesCount: number;
    expensesCount: number;
  };
  sales: SaleRecord[];
  expenses: ExpenseRecord[];
  charts: ChartData[];
  trends: {
    monthlyIncome: { month: string; amount: number }[];
    monthlyExpenses: { month: string; amount: number }[];
    profitTrend: { month: string; profit: number }[];
  };
}

// Inventory Report Data Interfaces
export interface CuyRecord {
  id: string;
  codigo: string;
  sexo: string;
  fechaNacimiento: Date;
  peso?: number;
  estado: string;
  galpon: {
    nombre: string;
    id: string;
  };
  jaula: {
    numero: number;
    id: string;
  };
  etapaVida: {
    nombre: string;
    id: string;
  };
}

export interface GalponRecord {
  id: string;
  nombre: string;
  capacidad: number;
  ocupacion: number;
  ocupacionPorcentaje: number;
  jaulasTotal: number;
  jaulasOcupadas: number;
}

export interface DistributionData {
  etapaVida: string;
  cantidad: number;
  porcentaje: number;
}

export interface AlertRecord {
  type: 'warning' | 'error' | 'info';
  message: string;
  details: string;
  galponId?: string;
  jaulaId?: string;
}

export interface InventoryReportData {
  templateId: string;
  generatedAt: string;
  parameters: ReportParameters;
  summary: {
    totalCuyes: number;
    totalGalpones: number;
    totalJaulas: number;
    occupancyRate: number;
    averageWeight: number;
  };
  cuyes: CuyRecord[];
  galpones: GalponRecord[];
  distribution: DistributionData[];
  alerts: AlertRecord[];
  charts: ChartData[];
}

// Reproductive Report Data Interfaces
export interface PregnancyRecord {
  id: string;
  fechaServicio: Date;
  fechaEsperadaParto: Date;
  estado: string;
  madre: {
    id: string;
    codigo: string;
  };
  padre: {
    id: string;
    codigo: string;
  };
  diasGestacion: number;
}

export interface LitterRecord {
  id: string;
  fechaNacimiento: Date;
  totalCrias: number;
  criasVivas: number;
  criasMuertas: number;
  madre: {
    id: string;
    codigo: string;
  };
  padre: {
    id: string;
    codigo: string;
  };
}

export interface ProjectionData {
  month: string;
  expectedBirths: number;
  expectedCrias: number;
}

export interface ReproductiveStats {
  metric: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
}

export interface ReproductiveReportData {
  templateId: string;
  generatedAt: string;
  parameters: ReportParameters;
  period: DateRange;
  summary: {
    activePregnancies: number;
    expectedBirths: number;
    fertilityRate: number;
    averageLitterSize: number;
    totalLitters: number;
    totalCriasProduced: number;
  };
  pregnancies: PregnancyRecord[];
  litters: LitterRecord[];
  projections: ProjectionData[];
  statistics: ReproductiveStats[];
  charts: ChartData[];
}

// Health Report Data Interfaces
export interface HealthRecord {
  id: string;
  fecha: Date;
  tipo: string;
  descripcion: string;
  tratamiento?: string;
  costo?: number;
  cuy: {
    id: string;
    codigo: string;
  };
  veterinario?: string;
}

export interface HealthReportData {
  templateId: string;
  generatedAt: string;
  parameters: ReportParameters;
  period: DateRange;
  summary: {
    totalTreatments: number;
    totalCost: number;
    mortalityRate: number;
    commonIssues: string[];
  };
  treatments: HealthRecord[];
  charts: ChartData[];
}

/**
 * Service responsible for fetching and processing real data for reports
 */
export class ReportDataService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Get financial report data with real database queries
   */
  async getFinancialReportData(parameters: ReportParameters): Promise<any> {
    try {
      logger.info('Generating financial report data', { parameters });

      // Validate parameters first
      this.validateParameters(parameters);

      const dateRange = this.parseDateRange(parameters.dateRange);
      
      // Query sales data with customer information
      const salesData = await this.prisma.venta.findMany({
        where: {
          fecha: {
            gte: dateRange.from,
            lte: dateRange.to
          }
        },
        include: {
          cliente: {
            select: {
              nombre: true,
              telefono: true
            }
          },
          detalles: {
            include: {
              cuy: {
                select: {
                  id: true,
                  peso: true
                }
              }
            }
          }
        },
        orderBy: {
          fecha: 'desc'
        }
      });

      // Query expenses data
      const expensesData = await this.prisma.gasto.findMany({
        where: {
          fecha: {
            gte: dateRange.from,
            lte: dateRange.to
          }
        },
        orderBy: {
          fecha: 'desc'
        }
      });

      // Transform sales data with validation
      const sales: SaleRecord[] = (salesData || []).map(venta => ({
        id: venta.id.toString(),
        fecha: venta.fecha,
        cantidad: (venta.detalles || []).length,
        precioUnitario: (venta.detalles || []).length > 0 ? 
          (venta.detalles || []).reduce((sum, det) => sum + det.precioUnitario, 0) / (venta.detalles || []).length : 0,
        total: venta.total,
        cliente: {
          nombre: venta.cliente?.nombre || 'Cliente desconocido',
          telefono: venta.cliente?.telefono || undefined
        },
        observaciones: `${(venta.detalles || []).length} cuyes vendidos`
      }));

      // Transform expenses data with validation
      const expenses: ExpenseRecord[] = (expensesData || []).map(gasto => ({
        id: gasto.id.toString(),
        fecha: gasto.fecha,
        concepto: gasto.concepto,
        monto: gasto.monto,
        categoria: gasto.categoria,
        descripcion: `Gasto en ${gasto.categoria.toLowerCase()}`
      }));

      // Calculate summary
      const totalIncome = sales.reduce((sum, sale) => sum + sale.total, 0);
      const totalExpenses = expenses.reduce((sum, expense) => sum + expense.monto, 0);
      const netProfit = totalIncome - totalExpenses;
      const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

      // Generate monthly trends
      const monthlyTrends = this.generateMonthlyTrends(sales, expenses, dateRange);

      // Generate charts
      const charts = this.generateFinancialCharts(sales, expenses, monthlyTrends);

      const reportData = {
        templateId: 'financial',
        generatedAt: new Date().toISOString(),
        parameters,
        data: {
          period: dateRange,
          summary: {
            totalIncome,
            totalExpenses,
            netProfit,
            profitMargin: Math.round(profitMargin * 100) / 100,
            salesCount: sales.length,
            expensesCount: expenses.length
          },
          sales,
          expenses,
          charts,
          trends: monthlyTrends
        }
      };

      logger.info('Financial report data generated successfully', {
        salesCount: sales.length,
        expensesCount: expenses.length,
        totalIncome,
        totalExpenses,
        netProfit
      });
      
      return reportData;
    } catch (error) {
      logger.error('Error generating financial report data:', error);
      throw new Error(`Failed to generate financial report data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get inventory report data with real database queries
   */
  async getInventoryReportData(parameters: ReportParameters): Promise<any> {
    try {
      logger.info('Generating inventory report data', { parameters });

      // This will be implemented in a later task
      const reportData = {
        templateId: 'inventory',
        generatedAt: new Date().toISOString(),
        parameters,
        data: {
          summary: {
            totalCuyes: 0,
            totalGalpones: 0,
            totalJaulas: 0,
            occupancyRate: 0,
            averageWeight: 0
          },
          cuyes: [],
          galpones: [],
          distribution: [],
          alerts: [],
          charts: []
        }
      };

      logger.info('Inventory report data generated successfully');
      return reportData;
    } catch (error) {
      logger.error('Error generating inventory report data:', error);
      throw new Error(`Failed to generate inventory report data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get reproductive report data with real database queries
   */
  async getReproductiveReportData(parameters: ReportParameters): Promise<any> {
    try {
      logger.info('Generating reproductive report data', { parameters });

      const dateRange = this.parseDateRange(parameters.dateRange);

      // This will be implemented in a later task
      const reportData = {
        templateId: 'reproductive',
        generatedAt: new Date().toISOString(),
        parameters,
        data: {
          period: dateRange,
          summary: {
            activePregnancies: 0,
            expectedBirths: 0,
            fertilityRate: 0,
            averageLitterSize: 0,
            totalLitters: 0,
            totalCriasProduced: 0
          },
          pregnancies: [],
          litters: [],
          projections: [],
          statistics: [],
          charts: []
        }
      };

      logger.info('Reproductive report data generated successfully');
      return reportData;
    } catch (error) {
      logger.error('Error generating reproductive report data:', error);
      throw new Error(`Failed to generate reproductive report data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get health report data with real database queries
   */
  async getHealthReportData(parameters: ReportParameters): Promise<any> {
    try {
      logger.info('Generating health report data', { parameters });

      const dateRange = this.parseDateRange(parameters.dateRange);

      // This will be implemented in a later task
      const reportData = {
        templateId: 'health',
        generatedAt: new Date().toISOString(),
        parameters,
        data: {
          period: dateRange,
          summary: {
            totalTreatments: 0,
            totalCost: 0,
            mortalityRate: 0,
            commonIssues: []
          },
          treatments: [],
          charts: []
        }
      };

      logger.info('Health report data generated successfully');
      return reportData;
    } catch (error) {
      logger.error('Error generating health report data:', error);
      throw new Error(`Failed to generate health report data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse date range from parameters or use defaults
   */
  private parseDateRange(dateRange?: { from: string; to: string }): DateRange {
    const now = new Date();
    const defaultFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const defaultTo = now;

    if (!dateRange) {
      return {
        from: defaultFrom,
        to: defaultTo
      };
    }

    return {
      from: dateRange.from ? new Date(dateRange.from) : defaultFrom,
      to: dateRange.to ? new Date(dateRange.to) : defaultTo
    };
  }

  /**
   * Validate report parameters
   */
  private validateParameters(parameters: ReportParameters): void {
    if (parameters.dateRange) {
      const { from, to } = parameters.dateRange;
      
      if (from && to) {
        const fromDate = new Date(from);
        const toDate = new Date(to);
        
        if (fromDate > toDate) {
          throw new Error('Start date cannot be after end date');
        }
        
        if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
          throw new Error('Invalid date format');
        }
      }
    }
  }

  /**
   * Generate chart data for visualization
   */
  protected generateChartData(
    type: ChartData['type'],
    title: string,
    labels: string[],
    data: number[],
    label: string = 'Data'
  ): ChartData {
    return {
      type,
      title,
      labels,
      datasets: [{
        label,
        data,
        backgroundColor: this.getChartColors(data.length),
        borderColor: this.getChartColors(data.length, 0.8)
      }]
    };
  }

  /**
   * Generate monthly trends for financial data
   */
  private generateMonthlyTrends(
    sales: SaleRecord[], 
    expenses: ExpenseRecord[], 
    dateRange: DateRange
  ): {
    monthlyIncome: { month: string; amount: number }[];
    monthlyExpenses: { month: string; amount: number }[];
    profitTrend: { month: string; profit: number }[];
  } {
    // If no data, return empty trends
    if (sales.length === 0 && expenses.length === 0) {
      return {
        monthlyIncome: [],
        monthlyExpenses: [],
        profitTrend: []
      };
    }

    // Create monthly buckets
    const monthlyData = new Map<string, { income: number; expenses: number }>();
    
    // Only initialize months that have actual data or are within a reasonable range
    const maxMonthsToShow = 12; // Limit to 12 months max
    const current = new Date(dateRange.from);
    let monthsAdded = 0;
    
    while (current <= dateRange.to && monthsAdded < maxMonthsToShow) {
      const monthKey = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
      monthlyData.set(monthKey, { income: 0, expenses: 0 });
      current.setMonth(current.getMonth() + 1);
      monthsAdded++;
    }

    // Aggregate sales by month
    sales.forEach(sale => {
      const monthKey = `${sale.fecha.getFullYear()}-${String(sale.fecha.getMonth() + 1).padStart(2, '0')}`;
      const existing = monthlyData.get(monthKey) || { income: 0, expenses: 0 };
      existing.income += sale.total;
      monthlyData.set(monthKey, existing);
    });

    // Aggregate expenses by month
    expenses.forEach(expense => {
      const monthKey = `${expense.fecha.getFullYear()}-${String(expense.fecha.getMonth() + 1).padStart(2, '0')}`;
      const existing = monthlyData.get(monthKey) || { income: 0, expenses: 0 };
      existing.expenses += expense.monto;
      monthlyData.set(monthKey, existing);
    });

    // Convert to arrays
    const sortedMonths = Array.from(monthlyData.keys()).sort();
    
    const monthlyIncome = sortedMonths.map(month => ({
      month: this.formatMonthLabel(month),
      amount: Math.round(monthlyData.get(month)!.income * 100) / 100
    }));

    const monthlyExpenses = sortedMonths.map(month => ({
      month: this.formatMonthLabel(month),
      amount: Math.round(monthlyData.get(month)!.expenses * 100) / 100
    }));

    const profitTrend = sortedMonths.map(month => {
      const data = monthlyData.get(month)!;
      return {
        month: this.formatMonthLabel(month),
        profit: Math.round((data.income - data.expenses) * 100) / 100
      };
    });

    return {
      monthlyIncome,
      monthlyExpenses,
      profitTrend
    };
  }

  /**
   * Generate charts for financial report
   */
  private generateFinancialCharts(
    sales: SaleRecord[], 
    expenses: ExpenseRecord[], 
    trends: {
      monthlyIncome: { month: string; amount: number }[];
      monthlyExpenses: { month: string; amount: number }[];
      profitTrend: { month: string; profit: number }[];
    }
  ): ChartData[] {
    const charts: ChartData[] = [];

    // Only generate charts if there's actual data
    const hasData = sales.length > 0 || expenses.length > 0;
    if (!hasData) {
      return charts;
    }

    // Income vs Expenses comparison chart
    if (trends.monthlyIncome.length > 0 && hasData) {
      charts.push({
        type: 'bar',
        title: 'Ingresos vs Gastos Mensuales',
        labels: trends.monthlyIncome.map(item => item.month),
        datasets: [
          {
            label: 'Ingresos',
            data: trends.monthlyIncome.map(item => item.amount),
            backgroundColor: this.getChartColors(1, 0.6),
            borderColor: this.getChartColors(1, 0.8)
          },
          {
            label: 'Gastos',
            data: trends.monthlyExpenses.map(item => item.amount),
            backgroundColor: this.getChartColors(1, 0.6).map(color => color.replace('54, 162, 235', '255, 99, 132')),
            borderColor: this.getChartColors(1, 0.8).map(color => color.replace('54, 162, 235', '255, 99, 132'))
          }
        ]
      });
    }

    // Profit trend line chart
    if (trends.profitTrend.length > 0) {
      charts.push({
        type: 'line',
        title: 'Tendencia de Ganancias',
        labels: trends.profitTrend.map(item => item.month),
        datasets: [{
          label: 'Ganancia Neta',
          data: trends.profitTrend.map(item => item.profit),
          backgroundColor: this.getChartColors(1, 0.2),
          borderColor: this.getChartColors(1, 1)
        }]
      });
    }

    // Expenses by category pie chart
    if (expenses.length > 0) {
      const expensesByCategory = expenses.reduce((acc, expense) => {
        acc[expense.categoria] = (acc[expense.categoria] || 0) + expense.monto;
        return acc;
      }, {} as Record<string, number>);

      const categories = Object.keys(expensesByCategory);
      if (categories.length > 0) {
        charts.push({
          type: 'pie',
          title: 'Gastos por Categoría',
          labels: categories,
          datasets: [{
            label: 'Monto',
            data: categories.map(cat => expensesByCategory[cat]),
            backgroundColor: this.getChartColors(categories.length, 0.8),
            borderColor: this.getChartColors(categories.length, 1)
          }]
        });
      }
    }

    // Sales distribution by customer (top 5)
    if (sales.length > 0) {
      const salesByCustomer = sales.reduce((acc, sale) => {
        const customerName = sale.cliente.nombre;
        acc[customerName] = (acc[customerName] || 0) + sale.total;
        return acc;
      }, {} as Record<string, number>);

      const topCustomers = Object.entries(salesByCustomer)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);

      if (topCustomers.length > 0) {
        charts.push({
          type: 'doughnut',
          title: 'Top 5 Clientes por Ventas',
          labels: topCustomers.map(([name]) => name),
          datasets: [{
            label: 'Ventas',
            data: topCustomers.map(([, amount]) => amount),
            backgroundColor: this.getChartColors(topCustomers.length, 0.7),
            borderColor: this.getChartColors(topCustomers.length, 1)
          }]
        });
      }
    }

    return charts;
  }

  /**
   * Format month label for display
   */
  private formatMonthLabel(monthKey: string): string {
    const [year, month] = monthKey.split('-');
    const monthNames = [
      'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
      'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
    ];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  }

  /**
   * Generate color palette for charts
   */
  private getChartColors(count: number, alpha: number = 0.6): string[] {
    const colors = [
      `rgba(54, 162, 235, ${alpha})`,   // Blue
      `rgba(255, 99, 132, ${alpha})`,   // Red
      `rgba(255, 205, 86, ${alpha})`,   // Yellow
      `rgba(75, 192, 192, ${alpha})`,   // Green
      `rgba(153, 102, 255, ${alpha})`,  // Purple
      `rgba(255, 159, 64, ${alpha})`,   // Orange
      `rgba(199, 199, 199, ${alpha})`,  // Grey
      `rgba(83, 102, 255, ${alpha})`    // Indigo
    ];

    return Array.from({ length: count }, (_, i) => colors[i % colors.length]);
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    try {
      await this.prisma.$disconnect();
      logger.info('ReportDataService cleanup completed');
    } catch (error) {
      logger.error('Error during ReportDataService cleanup:', error);
    }
  }
}

// Export singleton instance
export const reportDataService = new ReportDataService();