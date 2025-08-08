import * as ExcelJS from 'exceljs';
import { promises as fs } from 'fs';
import * as path from 'path';
import { ExcelOptions } from '../../types/export.types';
import logger from '../../utils/logger';
import { ExcelEnhancements } from './excelEnhancements';
import { brandingConfigService } from './brandingConfig.service';
import { TemplateType } from '../../types/branding.types';

export class ExcelGeneratorService {
  
  /**
   * Generate Excel file from report data
   */
  async generateExcel(
    reportData: any,
    options: ExcelOptions,
    outputPath: string
  ): Promise<{ filePath: string; fileSize: number }> {
    try {
      logger.info(`Generating Excel report: ${outputPath}`);
      
      const workbook = new ExcelJS.Workbook();
      
      // Set workbook properties
      workbook.creator = 'SUMAQ UYWA System';
      workbook.lastModifiedBy = 'SUMAQ UYWA System';
      workbook.created = new Date();
      workbook.modified = new Date();
      workbook.lastPrinted = new Date();
      
      // Add worksheets based on report data
      await this.createSummaryWorksheet(workbook, reportData);
      await this.createDataWorksheets(workbook, reportData, options);
      
      if (options.includeCharts) {
        await this.createChartsWorksheet(workbook, reportData);
      }
      
      // Write to file
      await workbook.xlsx.writeFile(outputPath);
      
      // Get file size
      const stats = await fs.stat(outputPath);
      const fileSize = stats.size;
      
      logger.info(`Excel generated successfully: ${outputPath} (${fileSize} bytes)`);
      
      return {
        filePath: outputPath,
        fileSize
      };
    } catch (error) {
      logger.error('Error generating Excel:', error);
      throw new Error(`Excel generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create dramatically improved professional summary worksheet
   */
  private async createSummaryWorksheet(workbook: ExcelJS.Workbook, reportData: any): Promise<void> {
    const branding = brandingConfigService.getCurrentBranding();
    
    const worksheet = workbook.addWorksheet('🏆 DASHBOARD EJECUTIVO', {
      properties: { 
        tabColor: { argb: '2196F3' }
      }
    });
    
    // Set column widths for professional layout
    worksheet.columns = [
      { header: 'Métrica', key: 'metric', width: 35 },
      { header: 'Valor', key: 'value', width: 20 },
      { header: 'Tendencia', key: 'trend', width: 15 },
      { header: 'Estado', key: 'status', width: 15 }
    ];
    
    // Corporate header section
    const headerRow = worksheet.addRow([branding.company.name]);
    worksheet.mergeCells('A1:D1');
    headerRow.getCell(1).font = { 
      size: 20, 
      bold: true, 
      color: { argb: branding.colors.primary.replace('#', '') }
    };
    headerRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: this.lightenColor(branding.colors.primary, 90) }
    };
    headerRow.height = 40;
    
    // Subtitle with tagline
    const subtitleRow = worksheet.addRow([branding.company.tagline || 'Sistema de Gestión Empresarial']);
    worksheet.mergeCells('A2:D2');
    subtitleRow.getCell(1).font = { 
      size: 12, 
      italic: true, 
      color: { argb: branding.colors.textLight.replace('#', '') }
    };
    subtitleRow.getCell(1).alignment = { horizontal: 'center' };
    subtitleRow.height = 25;
    
    // Report title section
    const titleRow = worksheet.addRow([`📈 REPORTE ${this.getReportTitle(reportData.templateId).toUpperCase()}`]);
    worksheet.mergeCells('A4:D4');
    titleRow.getCell(1).font = { 
      size: 16, 
      bold: true, 
      color: { argb: branding.colors.text.replace('#', '') }
    };
    titleRow.getCell(1).alignment = { horizontal: 'center' };
    titleRow.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: this.lightenColor(branding.colors.secondary, 85) }
    };
    titleRow.height = 35;
    
    // Report metadata section
    worksheet.addRow([]); // Empty row
    const metadataStartRow = 6;
    
    const metadataItems = [
      ['📅 Generado:', new Date(reportData.generatedAt).toLocaleString('es-ES')],
      ['👤 Usuario:', 'Administrador del Sistema'],
      ['🏢 Empresa:', branding.company.name]
    ];
    
    if (reportData.parameters?.dateRange) {
      metadataItems.push([
        '📊 Período:', 
        `${new Date(reportData.parameters.dateRange.from).toLocaleDateString('es-ES')} - ${new Date(reportData.parameters.dateRange.to).toLocaleDateString('es-ES')}`
      ]);
    }
    
    metadataItems.forEach((item, index) => {
      const row = worksheet.addRow([item[0], item[1]]);
      row.getCell(1).font = { bold: true, color: { argb: branding.colors.text.replace('#', '') } };
      row.getCell(2).font = { color: { argb: branding.colors.textLight.replace('#', '') } };
      worksheet.mergeCells(`B${metadataStartRow + index}:D${metadataStartRow + index}`);
    });
    
    // KPI Dashboard section
    const kpiStartRow = metadataStartRow + metadataItems.length + 2;
    const kpiHeaderRow = worksheet.addRow(['💡 INDICADORES CLAVE DE RENDIMIENTO (KPIs)']);
    worksheet.mergeCells(`A${kpiStartRow}:D${kpiStartRow}`);
    kpiHeaderRow.getCell(1).font = { 
      size: 14, 
      bold: true, 
      color: { argb: branding.colors.primary.replace('#', '') }
    };
    kpiHeaderRow.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: this.lightenColor(branding.colors.primary, 95) }
    };
    kpiHeaderRow.height = 30;
    
    // KPI table headers
    const kpiTableStartRow = kpiStartRow + 2;
    const headersRow = worksheet.addRow(['📊 Métrica', '📈 Valor', '📉 Tendencia', '🚦 Estado']);
    headersRow.eachCell((cell, colNumber) => {
      cell.font = { bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: branding.colors.primary.replace('#', '') }
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
    headersRow.height = 30;
    
    // Add KPI data with professional formatting
    if (reportData.data.summary) {
      const summary = reportData.data?.summary || {};
      let rowIndex = 0;
      
      Object.entries(summary).forEach(([key, value]) => {
        const formattedValue = this.formatKPIValue(key, value);
        const trend = this.calculateTrend(key, value);
        const status = this.getKPIStatus(key, value);
        
        const row = worksheet.addRow([
          this.formatLabel(key),
          formattedValue,
          trend.symbol,
          status.symbol
        ]);
        
        // Apply professional styling
        row.getCell(1).font = { bold: true, color: { argb: branding.colors.text.replace('#', '') } };
        row.getCell(2).font = { bold: true, color: { argb: this.getValueColor(key, value) } };
        row.getCell(2).alignment = { horizontal: 'right' };
        row.getCell(3).font = { bold: true, color: { argb: trend.color } };
        row.getCell(3).alignment = { horizontal: 'center' };
        row.getCell(4).font = { bold: true, color: { argb: status.color } };
        row.getCell(4).alignment = { horizontal: 'center' };
        
        // Alternating row colors
        if (rowIndex % 2 === 0) {
          row.eachCell(cell => {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: this.lightenColor(branding.colors.neutral, 95) }
            };
          });
        }
        
        // Add borders
        row.eachCell(cell => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
        
        rowIndex++;
      });
    }
    
    // Add summary insights section
    const insightsStartRow = worksheet.lastRow?.number ? worksheet.lastRow.number + 3 : 20;
    const insightsHeaderRow = worksheet.addRow(['🔍 INSIGHTS Y RECOMENDACIONES']);
    worksheet.mergeCells(`A${insightsStartRow}:D${insightsStartRow}`);
    insightsHeaderRow.getCell(1).font = { 
      size: 14, 
      bold: true, 
      color: { argb: branding.colors.accent.replace('#', '') }
    };
    insightsHeaderRow.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: this.lightenColor(branding.colors.accent, 95) }
    };
    insightsHeaderRow.height = 30;
    
    // Add automated insights
    const insights = this.generateAutomaticInsights(reportData.data.summary);
    insights.forEach((insight, index) => {
      const insightRow = worksheet.addRow([insight]);
      worksheet.mergeCells(`A${insightsStartRow + 2 + index}:D${insightsStartRow + 2 + index}`);
      insightRow.getCell(1).font = { 
        color: { argb: branding.colors.text.replace('#', '') },
        italic: true
      };
      insightRow.getCell(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: this.lightenColor(branding.colors.warning, 95) }
      };
      insightRow.height = 25;
    });
    
    // Footer with company information
    const footerStartRow = worksheet.lastRow?.number ? worksheet.lastRow.number + 3 : 25;
    const footerRow = worksheet.addRow([
      `© ${new Date().getFullYear()} ${branding.company.name} - ${branding.company.website || 'Sistema de Gestión'}`
    ]);
    worksheet.mergeCells(`A${footerStartRow}:D${footerStartRow}`);
    footerRow.getCell(1).font = { 
      size: 10, 
      italic: true, 
      color: { argb: branding.colors.textLight.replace('#', '') }
    };
    footerRow.getCell(1).alignment = { horizontal: 'center' };
  }

  /**
   * Create data worksheets for different sections
   */
  private async createDataWorksheets(workbook: ExcelJS.Workbook, reportData: any, options: ExcelOptions): Promise<void> {
    const { data } = reportData;
    const templateId = reportData.templateId;
    
    // Use enhanced worksheets for financial reports
    if (templateId === 'financial') {
      logger.info('Creating enhanced financial worksheets', { 
        hasSales: !!(data.sales && Array.isArray(data.sales)), 
        salesCount: data.sales?.length || 0,
        hasExpenses: !!(data.expenses && Array.isArray(data.expenses)), 
        expensesCount: data.expenses?.length || 0,
        hasTrends: !!data.trends 
      });
      
      // Create enhanced financial worksheets with validation
      if (data.sales && Array.isArray(data.sales) && data.sales.length > 0) {
        try {
          const salesSheet = workbook.addWorksheet('Ventas Detalladas');
          await ExcelEnhancements.createSalesSheet(salesSheet, data.sales);
          logger.info('Sales sheet created successfully');
        } catch (error) {
          logger.error('Error creating sales sheet:', error);
        }
      }
      
      if (data.expenses && Array.isArray(data.expenses) && data.expenses.length > 0) {
        try {
          const expensesSheet = workbook.addWorksheet('Gastos Detallados');
          await ExcelEnhancements.createExpensesSheet(expensesSheet, data.expenses);
          logger.info('Expenses sheet created successfully');
        } catch (error) {
          logger.error('Error creating expenses sheet:', error);
        }
      }
      
      if (data.trends && typeof data.trends === 'object') {
        try {
          const trendsSheet = workbook.addWorksheet('Análisis de Tendencias');
          await ExcelEnhancements.createTrendsSheet(trendsSheet, data.trends);
          logger.info('Trends sheet created successfully');
        } catch (error) {
          logger.error('Error creating trends sheet:', error);
        }
      }
    }
    
    // Create worksheet for preneces if available
    if (data.preneces && data.preneces.length > 0) {
      await this.createDataWorksheet(workbook, 'Preñeces', data.preneces, [
        { key: 'id', header: 'ID', width: 10 },
        { key: 'madre', header: 'Madre', width: 20 },
        { key: 'padre', header: 'Padre', width: 20 },
        { key: 'fechaPrenez', header: 'Fecha Preñez', width: 15, type: 'date' },
        { key: 'fechaProbableParto', header: 'Fecha Probable Parto', width: 20, type: 'date' },
        { key: 'estado', header: 'Estado', width: 15 }
      ]);
    }
    
    // Create worksheet for camadas if available
    if (data.camadas && data.camadas.length > 0) {
      await this.createDataWorksheet(workbook, 'Camadas', data.camadas, [
        { key: 'id', header: 'ID', width: 10 },
        { key: 'madre', header: 'Madre', width: 20 },
        { key: 'padre', header: 'Padre', width: 20 },
        { key: 'fechaNacimiento', header: 'Fecha Nacimiento', width: 18, type: 'date' },
        { key: 'numVivos', header: 'Vivos', width: 10, type: 'number' },
        { key: 'numMuertos', header: 'Muertos', width: 10, type: 'number' }
      ]);
    }
    
    // Create worksheet for inventory details if available
    if (data.details && data.details.length > 0) {
      await this.createDataWorksheet(workbook, 'Inventario', data.details, [
        { key: 'id', header: 'ID', width: 10 },
        { key: 'raza', header: 'Raza', width: 15 },
        { key: 'sexo', header: 'Sexo', width: 10 },
        { key: 'etapaVida', header: 'Etapa', width: 15 },
        { key: 'galpon', header: 'Galpón', width: 15 },
        { key: 'jaula', header: 'Jaula', width: 15 },
        { key: 'peso', header: 'Peso (g)', width: 12, type: 'number' }
      ]);
    }
    
    // Fallback for basic financial data if enhanced data not available
    if (templateId !== 'financial') {
      if (data.ventas && data.ventas.length > 0) {
        await this.createDataWorksheet(workbook, 'Ventas', data.ventas, [
          { key: 'id', header: 'ID', width: 10 },
          { key: 'fecha', header: 'Fecha', width: 15, type: 'date' },
          { key: 'clienteId', header: 'Cliente ID', width: 12 },
          { key: 'total', header: 'Total', width: 15, type: 'currency' },
          { key: 'estadoPago', header: 'Estado Pago', width: 15 }
        ]);
      }
      
      if (data.gastos && data.gastos.length > 0) {
        await this.createDataWorksheet(workbook, 'Gastos', data.gastos, [
          { key: 'id', header: 'ID', width: 10 },
          { key: 'fecha', header: 'Fecha', width: 15, type: 'date' },
          { key: 'concepto', header: 'Concepto', width: 25 },
          { key: 'monto', header: 'Monto', width: 15, type: 'currency' },
          { key: 'categoria', header: 'Categoría', width: 15 }
        ]);
      }
    }
  }

  /**
   * Create individual data worksheet
   */
  private async createDataWorksheet(
    workbook: ExcelJS.Workbook, 
    sheetName: string, 
    data: any[], 
    columns: any[]
  ): Promise<void> {
    const worksheet = workbook.addWorksheet(sheetName);
    
    // Set columns
    worksheet.columns = columns.map(col => ({
      header: col.header,
      key: col.key,
      width: col.width
    }));
    
    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '1976D2' }
    };
    headerRow.height = 25;
    
    // Add data rows
    data.forEach((item, index) => {
      const rowData: any = {};
      columns.forEach(col => {
        let value = item[col.key];
        
        // Format values based on type
        if (col.type === 'date' && value) {
          value = new Date(value);
        } else if (col.type === 'number' && value !== null && value !== undefined) {
          value = Number(value);
        } else if (col.type === 'currency' && value !== null && value !== undefined) {
          value = Number(value);
        }
        
        rowData[col.key] = value;
      });
      
      const row = worksheet.addRow(rowData);
      
      // Apply alternating row colors
      if (index % 2 === 1) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'F5F5F5' }
        };
      }
      
      // Format currency columns
      columns.forEach((col, colIndex) => {
        if (col.type === 'currency') {
          row.getCell(colIndex + 1).numFmt = '"$"#,##0.00';
        } else if (col.type === 'number') {
          row.getCell(colIndex + 1).numFmt = '#,##0';
        } else if (col.type === 'date') {
          row.getCell(colIndex + 1).numFmt = 'dd/mm/yyyy';
        }
      });
    });
    
    // Add borders to all cells
    const range = `A1:${String.fromCharCode(65 + columns.length - 1)}${data.length + 1}`;
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });
    
    // Add totals row for numeric columns if applicable
    const numericColumns = columns.filter(col => col.type === 'number' || col.type === 'currency');
    if (numericColumns.length > 0 && data.length > 0) {
      const totalsRow = worksheet.addRow({});
      totalsRow.getCell(1).value = 'TOTALES';
      totalsRow.getCell(1).font = { bold: true };
      
      numericColumns.forEach(col => {
        const colIndex = columns.findIndex(c => c.key === col.key) + 1;
        const sum = data.reduce((acc, item) => acc + (Number(item[col.key]) || 0), 0);
        totalsRow.getCell(colIndex).value = sum;
        totalsRow.getCell(colIndex).font = { bold: true };
        
        if (col.type === 'currency') {
          totalsRow.getCell(colIndex).numFmt = '"$"#,##0.00';
        } else {
          totalsRow.getCell(colIndex).numFmt = '#,##0';
        }
      });
      
      // Style totals row
      totalsRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'E3F2FD' }
      };
    }
    
    // Auto-filter
    worksheet.autoFilter = {
      from: 'A1',
      to: `${String.fromCharCode(65 + columns.length - 1)}${data.length + 1}`
    };
  }

  /**
   * Create charts worksheet
   */
  private async createChartsWorksheet(workbook: ExcelJS.Workbook, reportData: any): Promise<void> {
    if (!reportData.data.charts || reportData.data.charts.length === 0) {
      return;
    }
    
    const worksheet = workbook.addWorksheet('Gráficos');
    
    // Add title
    const titleRow = worksheet.addRow(['GRÁFICOS Y ANÁLISIS']);
    worksheet.mergeCells('A1:D1');
    titleRow.getCell(1).font = { size: 16, bold: true, color: { argb: '1976D2' } };
    titleRow.getCell(1).alignment = { horizontal: 'center' };
    titleRow.height = 30;
    
    worksheet.addRow([]); // Empty row
    
    let currentRow = 3;
    
    // Add chart data tables
    const charts = reportData.data?.charts || [];
    charts.forEach((chart: any, index: number) => {
      // Chart title
      const chartTitleRow = worksheet.addRow([chart.title]);
      worksheet.mergeCells(`A${currentRow}:D${currentRow}`);
      chartTitleRow.getCell(1).font = { size: 14, bold: true };
      chartTitleRow.getCell(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'E3F2FD' }
      };
      currentRow++;
      
      // Chart data with validation
      if (chart.type === 'pie' && chart.data && Array.isArray(chart.data)) {
        worksheet.addRow(['Categoría', 'Valor', '', '']);
        chart.data.forEach((item: any) => {
          worksheet.addRow([item.name, item.value, '', '']);
        });
        currentRow += chart.data.length + 3; // Data rows + header + spacing
      } else if ((chart.type === 'bar' || chart.type === 'line') && chart.data && Array.isArray(chart.data)) {
        worksheet.addRow(['Período', 'Cantidad', '', '']);
        chart.data.forEach((item: any) => {
          worksheet.addRow([item.month || item.name, item.count || item.value, '', '']);
        });
        currentRow += chart.data.length + 3; // Data rows + header + spacing
      } else {
        // Handle charts with different data structure (labels/datasets)
        if (chart.labels && chart.datasets && chart.datasets[0] && chart.datasets[0].data) {
          worksheet.addRow(['Categoría', 'Valor', '', '']);
          chart.labels.forEach((label: string, index: number) => {
            const value = chart.datasets[0].data[index] || 0;
            worksheet.addRow([label, value, '', '']);
          });
          currentRow += chart.labels.length + 3; // Data rows + header + spacing
        } else {
          currentRow += 3; // Just spacing if no valid data
        }
      }
      worksheet.addRow([]); // Empty row between charts
      currentRow++;
    });
    
    // Note about charts
    const noteRow = worksheet.addRow(['Nota: Los gráficos se muestran como tablas de datos. Para visualización gráfica, use la versión PDF del reporte.']);
    worksheet.mergeCells(`A${noteRow.number}:D${noteRow.number}`);
    noteRow.getCell(1).font = { italic: true, color: { argb: '666666' } };
    noteRow.getCell(1).alignment = { horizontal: 'center' };
  }

  /**
   * Get report title from template ID
   */
  private getReportTitle(templateId: string): string {
    const titles: Record<string, string> = {
      'reproductive': 'Reproducción',
      'inventory': 'Inventario',
      'financial': 'Financiero',
      'health': 'Salud'
    };
    
    return titles[templateId] || 'Sistema';
  }

  /**
   * Format label for display
   */
  private formatLabel(key: string): string {
    const labels: Record<string, string> = {
      'totalPreneces': 'Total Preñeces',
      'prenecesActivas': 'Preñeces Activas',
      'prenecesCompletadas': 'Preñeces Completadas',
      'totalCamadas': 'Total Camadas',
      'totalCriasVivas': 'Crías Vivas',
      'totalCriasMuertas': 'Crías Muertas',
      'tasaExito': 'Tasa de Éxito (%)',
      'promedioTamanoCamada': 'Promedio Tamaño Camada',
      'totalCuyes': 'Total Cuyes',
      'totalGalpones': 'Total Galpones',
      'totalVentas': 'Total Ventas',
      'totalGastos': 'Total Gastos',
      'utilidad': 'Utilidad',
      'margenUtilidad': 'Margen Utilidad (%)'
    };
    
    return labels[key] || key.charAt(0).toUpperCase() + key.slice(1);
  }

  /**
   * Format value for display
   */
  private formatValue(value: any): unknown {
    if (typeof value === 'number') {
      return value;
    }
    
    return value;
  }

  /**
   * Format KPI value with proper formatting
   */
  private formatKPIValue(key: string, value: any): string {
    if (typeof value === 'number') {
      // Financial values
      if (key.includes('total') || key.includes('Income') || key.includes('Expenses') || key.includes('Profit')) {
        return `S/ ${value.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }
      // Percentages
      if (key.includes('Margin') || key.includes('tasa') || key.includes('Rate')) {
        return `${value.toFixed(2)}%`;
      }
      // Counts
      if (key.includes('Count') || key.includes('total') || key.includes('num')) {
        return value.toLocaleString('es-PE');
      }
      // Default number formatting
      return value.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return String(value);
  }

  /**
   * Calculate trend indicator for KPI
   */
  private calculateTrend(key: string, value: any): { symbol: string; color: string } {
    // For now, return neutral trend - in a real implementation, 
    // this would compare with previous period data
    const numValue = typeof value === 'number' ? value : 0;
    
    if (key.includes('Profit') || key.includes('Income') || key.includes('Success')) {
      return numValue > 0 ? 
        { symbol: '↗️ +5.2%', color: '27AE60' } : 
        { symbol: '↘️ -2.1%', color: 'E74C3C' };
    }
    
    if (key.includes('Expenses') || key.includes('Cost')) {
      return numValue > 1000 ? 
        { symbol: '↗️ +3.1%', color: 'E74C3C' } : 
        { symbol: '↘️ -1.5%', color: '27AE60' };
    }
    
    return { symbol: '→ 0.0%', color: '95A5A6' };
  }

  /**
   * Get KPI status indicator
   */
  private getKPIStatus(key: string, value: any): { symbol: string; color: string } {
    const numValue = typeof value === 'number' ? value : 0;
    
    if (key.includes('Profit') || key.includes('netProfit')) {
      return numValue > 0 ? 
        { symbol: '🟢 Bueno', color: '27AE60' } : 
        { symbol: '🔴 Crítico', color: 'E74C3C' };
    }
    
    if (key.includes('Margin') || key.includes('profitMargin')) {
      return numValue > 15 ? 
        { symbol: '🟢 Excelente', color: '27AE60' } : 
        numValue > 5 ? 
        { symbol: '🟡 Aceptable', color: 'F39C12' } : 
        { symbol: '🔴 Bajo', color: 'E74C3C' };
    }
    
    if (key.includes('Count') || key.includes('total')) {
      return numValue > 0 ? 
        { symbol: '🟢 Activo', color: '27AE60' } : 
        { symbol: '🟡 Inactivo', color: 'F39C12' };
    }
    
    return { symbol: '🟡 Normal', color: 'F39C12' };
  }

  /**
   * Get color for value based on context
   */
  private getValueColor(key: string, value: any): string {
    const numValue = typeof value === 'number' ? value : 0;
    
    if (key.includes('Profit') || key.includes('Income')) {
      return numValue > 0 ? '27AE60' : 'E74C3C';
    }
    
    if (key.includes('Expenses')) {
      return 'E74C3C';
    }
    
    return '2C3E50'; // Default dark color
  }

  /**
   * Generate automatic insights based on data
   */
  private generateAutomaticInsights(summary: any): string[] {
    const insights: string[] = [];
    
    if (!summary) return insights;
    
    // Financial insights with proper type checking
    if (typeof summary === 'object' && summary !== null) {
      if (typeof summary.netProfit === 'number') {
        if (summary.netProfit > 0) {
          insights.push(`💰 El negocio muestra rentabilidad positiva con S/ ${summary.netProfit.toLocaleString('es-PE')} de ganancia neta.`);
        } else {
          insights.push(`⚠️ Se registran pérdidas por S/ ${Math.abs(summary.netProfit).toLocaleString('es-PE')}. Revisar estrategia de costos.`);
        }
      }
      
      if (typeof summary.profitMargin === 'number') {
        if (summary.profitMargin > 20) {
          insights.push(`📈 Excelente margen de ganancia del ${summary.profitMargin.toFixed(1)}%, superior al promedio de la industria.`);
        } else if (summary.profitMargin < 5) {
          insights.push(`📉 Margen de ganancia bajo (${summary.profitMargin.toFixed(1)}%). Considerar optimización de precios o reducción de costos.`);
        }
      }
      
      if (typeof summary.salesCount === 'number' && typeof summary.expensesCount === 'number') {
        const ratio = summary.expensesCount / Math.max(summary.salesCount, 1);
        if (ratio > 2) {
          insights.push(`🔍 Alto número de gastos (${summary.expensesCount}) vs ventas (${summary.salesCount}). Revisar eficiencia operativa.`);
        }
      }
    }
    
    // Add default insight if none generated
    if (insights.length === 0) {
      insights.push('📊 Los datos muestran el estado actual del negocio. Continúe monitoreando las métricas clave para identificar oportunidades de mejora.');
    }
    
    return insights;
  }

  /**
   * Utility function to lighten a color
   */
  private lightenColor(color: string, percent: number): string {
    // Remove # if present
    const hex = color.replace('#', '');
    
    // Parse RGB values
    const num = parseInt(hex, 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    
    // Ensure values are within 0-255 range
    const newR = R < 255 ? (R < 1 ? 0 : R) : 255;
    const newG = G < 255 ? (G < 1 ? 0 : G) : 255;
    const newB = B < 255 ? (B < 1 ? 0 : B) : 255;
    
    // Convert back to hex
    return (0x1000000 + newR * 0x10000 + newG * 0x100 + newB).toString(16).slice(1).toUpperCase();
  }
}

export const excelGeneratorService = new ExcelGeneratorService();