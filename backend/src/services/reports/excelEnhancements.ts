// Enhanced Excel generation methods for better report formatting
import * as ExcelJS from 'exceljs';
import { brandingConfigService } from './brandingConfig.service';

export class ExcelEnhancements {
  /**
   * Create sales sheet with detailed formatting using corporate branding
   */
  static async createSalesSheet(worksheet: ExcelJS.Worksheet, sales: any[]): Promise<void> {
    const branding = brandingConfigService.getCurrentBranding();
    
    // Sheet title with corporate branding
    worksheet.getCell('A1').value = '💰 DETALLE DE VENTAS';
    worksheet.getCell('A1').font = { 
      bold: true, 
      size: 16, 
      color: { argb: branding.colors.background.replace('#', 'FF') } 
    };
    worksheet.getCell('A1').fill = { 
      type: 'pattern', 
      pattern: 'solid', 
      fgColor: { argb: branding.colors.success.replace('#', 'FF') } 
    };
    worksheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.mergeCells('A1:F1');
    worksheet.getRow(1).height = 35;

    // Headers with corporate styling
    const headers = ['📅 Fecha', '👤 Cliente', '📦 Cantidad', '💵 Precio Unitario', '💰 Total', '📝 Observaciones'];
    headers.forEach((header, index) => {
      const cell = worksheet.getCell(3, index + 1);
      cell.value = header;
      cell.font = { 
        bold: true, 
        color: { argb: branding.colors.background.replace('#', 'FF') },
        size: 12
      };
      cell.fill = { 
        type: 'pattern', 
        pattern: 'solid', 
        fgColor: { argb: branding.colors.primary.replace('#', 'FF') } 
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
    worksheet.getRow(3).height = 30;

    // Data rows
    sales.forEach((sale, index) => {
      const rowNum = index + 4;
      worksheet.getCell(rowNum, 1).value = new Date(sale.fecha);
      worksheet.getCell(rowNum, 1).numFmt = 'dd/mm/yyyy';
      worksheet.getCell(rowNum, 2).value = sale.cliente?.nombre || 'N/A';
      worksheet.getCell(rowNum, 3).value = sale.cantidad || 0;
      worksheet.getCell(rowNum, 4).value = sale.precioUnitario || 0;
      worksheet.getCell(rowNum, 4).numFmt = '"S/ "#,##0.00';
      worksheet.getCell(rowNum, 5).value = sale.total || 0;
      worksheet.getCell(rowNum, 5).numFmt = '"S/ "#,##0.00';
      worksheet.getCell(rowNum, 5).font = { 
        bold: true, 
        color: { argb: branding.colors.success.replace('#', 'FF') } 
      };
      worksheet.getCell(rowNum, 6).value = sale.observaciones || '';

      // Alternate row colors
      if (index % 2 === 0) {
        for (let col = 1; col <= 6; col++) {
          worksheet.getCell(rowNum, col).fill = { 
            type: 'pattern', 
            pattern: 'solid', 
            fgColor: { argb: 'FFF8F9FA' } 
          };
        }
      }

      // Add borders
      for (let col = 1; col <= 6; col++) {
        worksheet.getCell(rowNum, col).border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      }
    });

    // Add totals row
    const totalRow = sales.length + 5;
    worksheet.getCell(totalRow, 4).value = 'TOTAL:';
    worksheet.getCell(totalRow, 4).font = { bold: true };
    worksheet.getCell(totalRow, 4).alignment = { horizontal: 'right' };
    const totalAmount = sales.reduce((sum, sale) => sum + (sale.total || 0), 0);
    worksheet.getCell(totalRow, 5).value = totalAmount;
    worksheet.getCell(totalRow, 5).numFmt = '"S/ "#,##0.00';
    worksheet.getCell(totalRow, 5).font = { bold: true, color: { argb: 'FF27AE60' } };
    worksheet.getCell(totalRow, 5).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFECF0F1' } };

    // Auto-fit columns
    worksheet.columns.forEach(column => {
      column.width = 15;
    });
    worksheet.getColumn(2).width = 25; // Cliente column wider
    worksheet.getColumn(6).width = 30; // Observaciones column wider
  }

  /**
   * Create expenses sheet with detailed formatting using corporate branding
   */
  static async createExpensesSheet(worksheet: ExcelJS.Worksheet, expenses: any[]): Promise<void> {
    const branding = brandingConfigService.getCurrentBranding();
    
    // Sheet title with corporate branding
    worksheet.getCell('A1').value = '💸 DETALLE DE GASTOS';
    worksheet.getCell('A1').font = { 
      bold: true, 
      size: 16, 
      color: { argb: branding.colors.background.replace('#', 'FF') } 
    };
    worksheet.getCell('A1').fill = { 
      type: 'pattern', 
      pattern: 'solid', 
      fgColor: { argb: branding.colors.danger.replace('#', 'FF') } 
    };
    worksheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.mergeCells('A1:E1');
    worksheet.getRow(1).height = 35;

    // Headers with corporate styling
    const headers = ['📅 Fecha', '📋 Concepto', '🏷️ Categoría', '💰 Monto', '📝 Descripción'];
    headers.forEach((header, index) => {
      const cell = worksheet.getCell(3, index + 1);
      cell.value = header;
      cell.font = { 
        bold: true, 
        color: { argb: branding.colors.background.replace('#', 'FF') },
        size: 12
      };
      cell.fill = { 
        type: 'pattern', 
        pattern: 'solid', 
        fgColor: { argb: branding.colors.primary.replace('#', 'FF') } 
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
    worksheet.getRow(3).height = 30;

    // Data rows
    expenses.forEach((expense, index) => {
      const rowNum = index + 4;
      worksheet.getCell(rowNum, 1).value = new Date(expense.fecha);
      worksheet.getCell(rowNum, 1).numFmt = 'dd/mm/yyyy';
      worksheet.getCell(rowNum, 2).value = expense.concepto || 'N/A';
      worksheet.getCell(rowNum, 3).value = expense.categoria || 'N/A';
      worksheet.getCell(rowNum, 4).value = expense.monto || 0;
      worksheet.getCell(rowNum, 4).numFmt = '"S/ "#,##0.00';
      worksheet.getCell(rowNum, 4).font = { bold: true, color: { argb: 'FFE74C3C' } };
      worksheet.getCell(rowNum, 5).value = expense.descripcion || '';

      // Alternate row colors
      if (index % 2 === 0) {
        for (let col = 1; col <= 5; col++) {
          worksheet.getCell(rowNum, col).fill = { 
            type: 'pattern', 
            pattern: 'solid', 
            fgColor: { argb: 'FFF8F9FA' } 
          };
        }
      }

      // Add borders
      for (let col = 1; col <= 5; col++) {
        worksheet.getCell(rowNum, col).border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      }
    });

    // Add totals row
    const totalRow = expenses.length + 5;
    worksheet.getCell(totalRow, 3).value = 'TOTAL:';
    worksheet.getCell(totalRow, 3).font = { bold: true };
    worksheet.getCell(totalRow, 3).alignment = { horizontal: 'right' };
    const totalAmount = expenses.reduce((sum, expense) => sum + (expense.monto || 0), 0);
    worksheet.getCell(totalRow, 4).value = totalAmount;
    worksheet.getCell(totalRow, 4).numFmt = '"S/ "#,##0.00';
    worksheet.getCell(totalRow, 4).font = { bold: true, color: { argb: 'FFE74C3C' } };
    worksheet.getCell(totalRow, 4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFECF0F1' } };

    // Auto-fit columns
    worksheet.columns.forEach(column => {
      column.width = 15;
    });
    worksheet.getColumn(2).width = 25; // Concepto column wider
    worksheet.getColumn(5).width = 30; // Descripción column wider
  }

  /**
   * Create trends sheet with monthly analysis using corporate branding
   */
  static async createTrendsSheet(worksheet: ExcelJS.Worksheet, trends: any): Promise<void> {
    const branding = brandingConfigService.getCurrentBranding();
    
    // Sheet title with corporate branding
    worksheet.getCell('A1').value = '📈 ANÁLISIS DE TENDENCIAS';
    worksheet.getCell('A1').font = { 
      bold: true, 
      size: 16, 
      color: { argb: branding.colors.background.replace('#', 'FF') } 
    };
    worksheet.getCell('A1').fill = { 
      type: 'pattern', 
      pattern: 'solid', 
      fgColor: { argb: branding.colors.accent.replace('#', 'FF') } 
    };
    worksheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.mergeCells('A1:D1');
    worksheet.getRow(1).height = 35;

    let currentRow = 3;

    // Monthly Income section
    if (trends.monthlyIncome && trends.monthlyIncome.length > 0) {
      worksheet.getCell(`A${currentRow}`).value = 'INGRESOS MENSUALES';
      worksheet.getCell(`A${currentRow}`).font = { bold: true, color: { argb: 'FF27AE60' } };
      worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
      currentRow += 2;

      worksheet.getCell(`A${currentRow}`).value = 'Mes';
      worksheet.getCell(`B${currentRow}`).value = 'Ingresos';
      worksheet.getCell(`A${currentRow}`).font = { bold: true };
      worksheet.getCell(`B${currentRow}`).font = { bold: true };
      currentRow++;

      trends.monthlyIncome.forEach((item: any) => {
        if (item.amount > 0) {
          worksheet.getCell(`A${currentRow}`).value = item.month;
          worksheet.getCell(`B${currentRow}`).value = item.amount;
          worksheet.getCell(`B${currentRow}`).numFmt = '"S/ "#,##0.00';
          worksheet.getCell(`B${currentRow}`).font = { color: { argb: 'FF27AE60' } };
          currentRow++;
        }
      });
      currentRow += 2;
    }

    // Monthly Expenses section
    if (trends.monthlyExpenses && trends.monthlyExpenses.length > 0) {
      worksheet.getCell(`A${currentRow}`).value = 'GASTOS MENSUALES';
      worksheet.getCell(`A${currentRow}`).font = { bold: true, color: { argb: 'FFE74C3C' } };
      worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
      currentRow += 2;

      worksheet.getCell(`A${currentRow}`).value = 'Mes';
      worksheet.getCell(`B${currentRow}`).value = 'Gastos';
      worksheet.getCell(`A${currentRow}`).font = { bold: true };
      worksheet.getCell(`B${currentRow}`).font = { bold: true };
      currentRow++;

      trends.monthlyExpenses.forEach((item: any) => {
        if (item.amount > 0) {
          worksheet.getCell(`A${currentRow}`).value = item.month;
          worksheet.getCell(`B${currentRow}`).value = item.amount;
          worksheet.getCell(`B${currentRow}`).numFmt = '"S/ "#,##0.00';
          worksheet.getCell(`B${currentRow}`).font = { color: { argb: 'FFE74C3C' } };
          currentRow++;
        }
      });
      currentRow += 2;
    }

    // Profit Trend section
    if (trends.profitTrend && trends.profitTrend.length > 0) {
      worksheet.getCell(`A${currentRow}`).value = 'TENDENCIA DE GANANCIAS';
      worksheet.getCell(`A${currentRow}`).font = { bold: true, color: { argb: 'FF3498DB' } };
      worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
      currentRow += 2;

      worksheet.getCell(`A${currentRow}`).value = 'Mes';
      worksheet.getCell(`B${currentRow}`).value = 'Ganancia';
      worksheet.getCell(`A${currentRow}`).font = { bold: true };
      worksheet.getCell(`B${currentRow}`).font = { bold: true };
      currentRow++;

      trends.profitTrend.forEach((item: any) => {
        worksheet.getCell(`A${currentRow}`).value = item.month;
        worksheet.getCell(`B${currentRow}`).value = item.profit;
        worksheet.getCell(`B${currentRow}`).numFmt = '"S/ "#,##0.00';
        worksheet.getCell(`B${currentRow}`).font = { 
          color: { argb: item.profit >= 0 ? 'FF27AE60' : 'FFE74C3C' } 
        };
        currentRow++;
      });
    }

    // Auto-fit columns
    worksheet.columns.forEach(column => {
      column.width = 20;
    });
  }
}