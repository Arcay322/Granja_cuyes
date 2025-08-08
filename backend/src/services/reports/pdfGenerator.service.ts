import puppeteer, { Browser, Page, PDFOptions as PuppeteerPDFOptions, PaperFormat } from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';
import { PDFOptions } from '../../types/export.types';
import logger from '../../utils/logger';

export class PDFGeneratorService {
  private browser: Browser | null = null;

  /**
   * Initialize browser instance
   */
  private async initBrowser(): Promise<Browser> {
    if (!this.browser) {
      logger.info('Initializing Puppeteer browser for PDF generation');
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ]
      });
    }
    return this.browser;
  }

  /**
   * Generate PDF from report data
   */
  async generatePDF(
    reportData: any,
    options: PDFOptions,
    outputPath: string
  ): Promise<{ filePath: string; fileSize: number }> {
    try {
      logger.info(`Generating PDF report: ${outputPath}`);
      
      const browser = await this.initBrowser();
      const page = await browser.newPage();

      // Set viewport for consistent rendering
      await page.setViewport({
        width: options.pageSize === 'A4' ? 794 : 816,
        height: options.pageSize === 'A4' ? 1123 : 1056,
        deviceScaleFactor: 1
      });

      // Generate HTML content
      const htmlContent = this.generateHTMLContent(reportData, options);
      
      // Set content and wait for rendering
      await page.setContent(htmlContent, { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      });

      // Configure PDF options
      const pdfOptions: PuppeteerPDFOptions = {
        path: outputPath,
        format: this.getPDFFormat(options.pageSize),
        landscape: options.orientation === 'landscape',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        },
        displayHeaderFooter: true,
        headerTemplate: this.generateHeaderTemplate(reportData),
        footerTemplate: this.generateFooterTemplate(),
        preferCSSPageSize: false
      };

      // Generate PDF
      await page.pdf(pdfOptions);
      await page.close();

      // Get file size
      const stats = await fs.stat(outputPath);
      const fileSize = stats.size;

      logger.info(`PDF generated successfully: ${outputPath} (${fileSize} bytes)`);
      
      return {
        filePath: outputPath,
        fileSize
      };
    } catch (error) {
      logger.error('Error generating PDF:', error);
      throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate HTML content for the report
   */
  private generateHTMLContent(reportData: any, options: PDFOptions): string {
    const { templateId, data, generatedAt } = reportData;
    
    return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${this.getReportTitle(templateId)}</title>
        <style>
            ${this.getBaseStyles()}
            ${this.getReportStyles(options)}
            ${this.getEnhancedStyles()}
        </style>
        ${options.includeCharts ? '<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>' : ''}
    </head>
    <body>
        <div class="report-container">
            ${this.generateEnhancedHeader(reportData)}
            ${this.generateExecutiveSummary(data)}
            ${this.generateDetailedContent(data, templateId, options)}
            ${options.includeCharts ? this.generateEnhancedChartsSection(data.charts) : ''}
            ${this.generateDataTables(data, templateId)}
            ${this.generateInsightsSection(data, templateId)}
            ${this.generateEnhancedFooter(generatedAt)}
        </div>
        
        ${options.includeCharts ? this.generateEnhancedChartScripts(data.charts) : ''}
    </body>
    </html>
    `;
  }

  /**
   * Get base CSS styles for PDF
   */
  private getBaseStyles(): string {
    return `
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        font-size: 12px;
        line-height: 1.4;
        color: #333;
        background: white;
      }
      
      .report-container {
        max-width: 100%;
        margin: 0 auto;
        padding: 20px;
      }
      
      .report-header {
        text-align: center;
        margin-bottom: 30px;
        border-bottom: 2px solid #2196F3;
        padding-bottom: 20px;
      }
      
      .report-title {
        font-size: 24px;
        font-weight: bold;
        color: #1976D2;
        margin-bottom: 10px;
      }
      
      .report-subtitle {
        font-size: 14px;
        color: #666;
        margin-bottom: 5px;
      }
      
      .summary-section {
        background: #f5f5f5;
        padding: 20px;
        border-radius: 8px;
        margin-bottom: 30px;
      }
      
      .summary-title {
        font-size: 18px;
        font-weight: bold;
        margin-bottom: 15px;
        color: #1976D2;
      }
      
      .summary-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 15px;
      }
      
      .summary-item {
        background: white;
        padding: 15px;
        border-radius: 6px;
        border-left: 4px solid #2196F3;
      }
      
      .summary-label {
        font-size: 11px;
        color: #666;
        text-transform: uppercase;
        margin-bottom: 5px;
      }
      
      .summary-value {
        font-size: 20px;
        font-weight: bold;
        color: #333;
      }
      
      .content-section {
        margin-bottom: 30px;
      }
      
      .section-title {
        font-size: 16px;
        font-weight: bold;
        margin-bottom: 15px;
        color: #1976D2;
        border-bottom: 1px solid #ddd;
        padding-bottom: 5px;
      }
      
      .data-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 20px;
      }
      
      .data-table th,
      .data-table td {
        padding: 8px 12px;
        text-align: left;
        border-bottom: 1px solid #ddd;
      }
      
      .data-table th {
        background: #f8f9fa;
        font-weight: bold;
        color: #333;
      }
      
      .data-table tr:nth-child(even) {
        background: #f9f9f9;
      }
      
      .charts-section {
        margin-top: 30px;
      }
      
      .chart-container {
        margin-bottom: 30px;
        text-align: center;
      }
      
      .chart-title {
        font-size: 14px;
        font-weight: bold;
        margin-bottom: 10px;
        color: #333;
      }
      
      .chart-canvas {
        max-width: 100%;
        height: 300px;
      }
      
      .report-footer {
        margin-top: 40px;
        padding-top: 20px;
        border-top: 1px solid #ddd;
        text-align: center;
        font-size: 10px;
        color: #666;
      }
      
      @media print {
        .report-container {
          padding: 0;
        }
        
        .page-break {
          page-break-before: always;
        }
      }
    `;
  }

  /**
   * Get report-specific styles based on options
   */
  private getReportStyles(options: PDFOptions): string {
    let styles = '';
    
    if (options.orientation === 'landscape') {
      styles += `
        .summary-grid {
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        }
        
        .data-table {
          font-size: 11px;
        }
      `;
    }
    
    if (!options.includeImages) {
      styles += `
        img {
          display: none;
        }
      `;
    }
    
    return styles;
  }

  /**
   * Generate report header HTML
   */
  private generateReportHeader(reportData: any): string {
    const { templateId, parameters } = reportData;
    const dateRange = parameters?.dateRange;
    
    return `
      <div class="report-header">
        <div class="report-title">
          ${this.getReportTitle(templateId)}
        </div>
        <div class="report-subtitle">
          Sistema de Gestión de Granja de Cuyes - SUMAQ UYWA
        </div>
        ${dateRange ? `
          <div class="report-subtitle">
            Período: ${new Date(dateRange.from).toLocaleDateString()} - ${new Date(dateRange.to).toLocaleDateString()}
          </div>
        ` : ''}
        <div class="report-subtitle">
          Generado: ${new Date().toLocaleString()}
        </div>
      </div>
    `;
  }

  /**
   * Generate summary section HTML
   */
  private generateReportSummary(summary: any): string {
    if (!summary) return '';
    
    const summaryItems = Object.entries(summary).map(([key, value]) => `
      <div class="summary-item">
        <div class="summary-label">${this.formatLabel(key)}</div>
        <div class="summary-value">${this.formatValue(value)}</div>
      </div>
    `).join('');
    
    return `
      <div class="summary-section">
        <div class="summary-title">Resumen Ejecutivo</div>
        <div class="summary-grid">
          ${summaryItems}
        </div>
      </div>
    `;
  }

  /**
   * Generate main report content
   */
  private generateReportContent(data: any, options: PDFOptions): string {
    let content = '';
    
    // Generate tables for different data sections
    if (data.preneces && data.preneces.length > 0) {
      content += this.generateDataTable('Preñeces', data.preneces, [
        { key: 'madre', label: 'Madre' },
        { key: 'padre', label: 'Padre' },
        { key: 'fechaPrenez', label: 'Fecha Preñez', type: 'date' },
        { key: 'fechaProbableParto', label: 'Fecha Probable Parto', type: 'date' },
        { key: 'estado', label: 'Estado' }
      ]);
    }
    
    if (data.camadas && data.camadas.length > 0) {
      content += this.generateDataTable('Camadas', data.camadas, [
        { key: 'madre', label: 'Madre' },
        { key: 'padre', label: 'Padre' },
        { key: 'fechaNacimiento', label: 'Fecha Nacimiento', type: 'date' },
        { key: 'numVivos', label: 'Vivos' },
        { key: 'numMuertos', label: 'Muertos' }
      ]);
    }
    
    if (data.details && data.details.length > 0) {
      content += this.generateDataTable('Detalles', data.details.slice(0, 50), [
        { key: 'raza', label: 'Raza' },
        { key: 'sexo', label: 'Sexo' },
        { key: 'etapaVida', label: 'Etapa' },
        { key: 'galpon', label: 'Galpón' },
        { key: 'jaula', label: 'Jaula' }
      ]);
    }
    
    return content;
  }

  /**
   * Generate data table HTML
   */
  private generateDataTable(title: string, data: any[], columns: any[]): string {
    const headers = columns.map(col => `<th>${col.label}</th>`).join('');
    const rows = data.map(item => {
      const cells = columns.map(col => {
        let value = item[col.key];
        if (col.type === 'date' && value) {
          value = new Date(value).toLocaleDateString();
        }
        return `<td>${value || 'N/A'}</td>`;
      }).join('');
      return `<tr>${cells}</tr>`;
    }).join('');
    
    return `
      <div class="content-section">
        <div class="section-title">${title}</div>
        <table class="data-table">
          <thead>
            <tr>${headers}</tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;
  }

  /**
   * Generate charts section HTML
   */
  private generateChartsSection(charts: any[]): string {
    if (!charts || charts.length === 0) return '';
    
    const chartElements = charts.map((chart, index) => `
      <div class="chart-container">
        <div class="chart-title">${chart.title}</div>
        <canvas id="chart-${index}" class="chart-canvas"></canvas>
      </div>
    `).join('');
    
    return `
      <div class="charts-section page-break">
        <div class="section-title">Gráficos y Análisis</div>
        ${chartElements}
      </div>
    `;
  }

  /**
   * Generate chart scripts
   */
  private generateChartScripts(charts: any[]): string {
    const scripts = charts.map((chart, index) => {
      return `
        const ctx${index} = document.getElementById('chart-${index}').getContext('2d');
        new Chart(ctx${index}, {
          type: '${chart.type}',
          data: ${JSON.stringify(this.formatChartData(chart))},
          options: {
            responsive: true,
            plugins: {
              legend: {
                position: 'bottom'
              }
            },
            scales: ${chart.type !== 'pie' ? `{
              y: {
                beginAtZero: true
              }
            }` : '{}'}
          }
        });
      `;
    }).join('\n');
    
    return `
      <script>
        window.addEventListener('load', function() {
          ${scripts}
        });
      </script>
    `;
  }

  /**
   * Format chart data for Chart.js
   */
  private formatChartData(chart: any): any {
    // Handle charts with different data structures
    if (chart.labels && chart.datasets && chart.datasets[0] && chart.datasets[0].data) {
      return {
        labels: chart.labels,
        datasets: chart.datasets
      };
    }
    
    // Handle charts with data array
    if (chart.data && Array.isArray(chart.data)) {
      if (chart.type === 'pie') {
        return {
          labels: chart.data.map((item: any) => item.name),
          datasets: [{
            data: chart.data.map((item: any) => item.value),
            backgroundColor: [
              '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'
            ]
          }]
        };
      } else if (chart.type === 'bar' || chart.type === 'line') {
        return {
          labels: chart.data.map((item: any) => item.month || item.name),
          datasets: [{
            label: chart.title,
            data: chart.data.map((item: any) => item.count || item.value),
            backgroundColor: chart.type === 'bar' ? '#36A2EB' : undefined,
            borderColor: chart.type === 'line' ? '#36A2EB' : undefined,
            fill: chart.type === 'line' ? false : undefined
          }]
        };
      }
    }
    
    // Fallback for empty or invalid data
    return {
      labels: [],
      datasets: [{
        data: [],
        backgroundColor: ['#FF6384']
      }]
    };
  }

  /**
   * Generate header template
   */
  private generateHeaderTemplate(reportData: any): string {
    return `
      <div style="font-size: 10px; color: #666; text-align: center; width: 100%; margin: 0 15mm;">
        <span>SUMAQ UYWA - ${this.getReportTitle(reportData.templateId)}</span>
      </div>
    `;
  }

  /**
   * Generate footer template
   */
  private generateFooterTemplate(): string {
    return `
      <div style="font-size: 10px; color: #666; text-align: center; width: 100%; margin: 0 15mm;">
        <span>Página <span class="pageNumber"></span> de <span class="totalPages"></span></span>
        <span style="float: right;">Generado: ${new Date().toLocaleString()}</span>
      </div>
    `;
  }

  /**
   * Generate report footer
   */
  private generateReportFooter(generatedAt: string): string {
    return `
      <div class="report-footer">
        <p>Este reporte fue generado automáticamente por el Sistema SUMAQ UYWA</p>
        <p>Fecha de generación: ${new Date(generatedAt).toLocaleString()}</p>
        <p>Para más información, contacte al administrador del sistema</p>
      </div>
    `;
  }

  /**
   * Get PDF format from page size
   */
  private getPDFFormat(pageSize: string): PaperFormat {
    switch (pageSize) {
      case 'Letter': return 'letter';
      case 'Legal': return 'legal';
      case 'A4':
      default: return 'a4';
    }
  }

  /**
   * Get report title from template ID
   */
  private getReportTitle(templateId: string): string {
    const titles: Record<string, string> = {
      'reproductive': 'Reporte de Reproducción',
      'inventory': 'Reporte de Inventario',
      'financial': 'Reporte Financiero',
      'health': 'Reporte de Salud'
    };
    
    return titles[templateId] || 'Reporte del Sistema';
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
  private formatValue(value: unknown): string {
    if (typeof value === 'number') {
      if (value % 1 === 0) {
        return value.toLocaleString();
      } else {
        return value.toFixed(2);
      }
    }
    
    return String(value);
  }

  /**
   * Get enhanced styles for professional appearance
   */
  private getEnhancedStyles(): string {
    return `
      .enhanced-header {
        background: linear-gradient(135deg, #1976D2 0%, #2196F3 100%);
        color: white;
        padding: 30px;
        margin: -20px -20px 30px -20px;
        text-align: center;
      }
      
      .company-logo {
        font-size: 28px;
        font-weight: bold;
        margin-bottom: 10px;
      }
      
      .executive-summary {
        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        padding: 25px;
        border-radius: 10px;
        margin-bottom: 30px;
        border-left: 5px solid #28a745;
      }
      
      .metric-card {
        background: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        border-left: 4px solid #2196F3;
        transition: transform 0.2s;
      }
      
      .metric-card:hover {
        transform: translateY(-2px);
      }
      
      .metric-value {
        font-size: 24px;
        font-weight: bold;
        color: #1976D2;
        margin-bottom: 5px;
      }
      
      .metric-label {
        font-size: 12px;
        color: #666;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .insights-section {
        background: #fff3cd;
        border: 1px solid #ffeaa7;
        border-radius: 8px;
        padding: 20px;
        margin: 20px 0;
      }
      
      .insight-item {
        margin-bottom: 15px;
        padding: 10px;
        background: white;
        border-radius: 5px;
        border-left: 3px solid #ffc107;
      }
      
      .data-table-enhanced {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 20px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        border-radius: 8px;
        overflow: hidden;
      }
      
      .data-table-enhanced th {
        background: linear-gradient(135deg, #1976D2 0%, #2196F3 100%);
        color: white;
        padding: 15px 12px;
        font-weight: bold;
        text-align: left;
      }
      
      .data-table-enhanced td {
        padding: 12px;
        border-bottom: 1px solid #eee;
      }
      
      .data-table-enhanced tr:nth-child(even) {
        background: #f8f9fa;
      }
      
      .data-table-enhanced tr:hover {
        background: #e3f2fd;
      }
      
      .chart-container-enhanced {
        background: white;
        padding: 20px;
        border-radius: 10px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        margin-bottom: 30px;
      }
      
      .status-badge {
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 10px;
        font-weight: bold;
        text-transform: uppercase;
      }
      
      .status-active { background: #d4edda; color: #155724; }
      .status-completed { background: #cce5ff; color: #004085; }
      .status-pending { background: #fff3cd; color: #856404; }
      .status-failed { background: #f8d7da; color: #721c24; }
    `;
  }

  /**
   * Generate enhanced header with company branding
   */
  private generateEnhancedHeader(reportData: any): string {
    const { templateId, parameters } = reportData;
    const dateRange = parameters?.dateRange;
    
    return `
      <div class="enhanced-header">
        <div class="company-logo">🐹 SUMAQ UYWA</div>
        <div style="font-size: 18px; margin-bottom: 5px;">
          ${this.getReportTitle(templateId)}
        </div>
        <div style="font-size: 14px; opacity: 0.9;">
          Sistema Integral de Gestión de Granja de Cuyes
        </div>
        ${dateRange ? `
          <div style="font-size: 12px; margin-top: 10px; opacity: 0.8;">
            📅 Período: ${new Date(dateRange.from).toLocaleDateString()} - ${new Date(dateRange.to).toLocaleDateString()}
          </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * Generate executive summary with key insights
   */
  private generateExecutiveSummary(data: any): string {
    if (!data?.summary) return '';
    
    const summaryItems = Object.entries(data.summary).map(([key, value]) => `
      <div class="metric-card">
        <div class="metric-value">${this.formatValue(value)}</div>
        <div class="metric-label">${this.formatLabel(key)}</div>
      </div>
    `).join('');
    
    return `
      <div class="executive-summary">
        <h2 style="color: #28a745; margin-bottom: 20px; font-size: 20px;">
          📊 Resumen Ejecutivo
        </h2>
        <div class="summary-grid">
          ${summaryItems}
        </div>
      </div>
    `;
  }

  /**
   * Generate detailed content based on template type
   */
  private generateDetailedContent(data: any, templateId: string, options: PDFOptions): string {
    switch (templateId) {
      case 'financial':
        return this.generateFinancialContent(data);
      case 'inventory':
        return this.generateInventoryContent(data);
      case 'reproductive':
        return this.generateReproductiveContent(data);
      case 'health':
        return this.generateHealthContent(data);
      default:
        return this.generateGenericContent(data);
    }
  }

  /**
   * Generate financial report content
   */
  private generateFinancialContent(data: any): string {
    let content = '';
    
    // Sales section
    if (data.sales && data.sales.length > 0) {
      content += `
        <div class="content-section">
          <h3 class="section-title">💰 Ventas Registradas</h3>
          <table class="data-table-enhanced">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Cantidad</th>
                <th>Precio Unit.</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${data.sales.slice(0, 20).map((sale: any) => `
                <tr>
                  <td>${new Date(sale.fecha).toLocaleDateString()}</td>
                  <td>${sale.cliente.nombre}</td>
                  <td>${sale.cantidad}</td>
                  <td>$${sale.precioUnitario.toFixed(2)}</td>
                  <td><strong>$${sale.total.toFixed(2)}</strong></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    }
    
    // Expenses section
    if (data.expenses && data.expenses.length > 0) {
      content += `
        <div class="content-section">
          <h3 class="section-title">💸 Gastos Registrados</h3>
          <table class="data-table-enhanced">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Concepto</th>
                <th>Categoría</th>
                <th>Monto</th>
              </tr>
            </thead>
            <tbody>
              ${data.expenses.slice(0, 20).map((expense: any) => `
                <tr>
                  <td>${new Date(expense.fecha).toLocaleDateString()}</td>
                  <td>${expense.concepto}</td>
                  <td><span class="status-badge status-active">${expense.categoria}</span></td>
                  <td><strong>$${expense.monto.toFixed(2)}</strong></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    }
    
    return content;
  }

  /**
   * Generate enhanced charts section
   */
  private generateEnhancedChartsSection(charts: any[]): string {
    if (!charts || charts.length === 0) return '';
    
    const chartElements = charts.map((chart, index) => `
      <div class="chart-container-enhanced">
        <h3 style="color: #1976D2; margin-bottom: 15px;">${chart.title}</h3>
        <canvas id="chart-${index}" class="chart-canvas"></canvas>
      </div>
    `).join('');
    
    return `
      <div class="charts-section page-break">
        <h2 class="section-title">📈 Análisis Gráfico</h2>
        ${chartElements}
      </div>
    `;
  }

  /**
   * Generate data tables section
   */
  private generateDataTables(data: any, templateId: string): string {
    // This method will show detailed data tables
    return '';
  }

  /**
   * Generate insights section with analysis
   */
  private generateInsightsSection(data: any, templateId: string): string {
    const insights = this.generateInsights(data, templateId);
    if (insights.length === 0) return '';
    
    const insightItems = insights.map(insight => `
      <div class="insight-item">
        <strong>${insight.title}</strong><br>
        ${insight.description}
      </div>
    `).join('');
    
    return `
      <div class="insights-section">
        <h2 style="color: #856404; margin-bottom: 15px;">💡 Insights y Recomendaciones</h2>
        ${insightItems}
      </div>
    `;
  }

  /**
   * Generate insights based on data analysis
   */
  private generateInsights(data: any, templateId: string): Array<{title: string, description: string}> {
    const insights = [];
    
    if (templateId === 'financial' && data.summary) {
      const { totalIncome, totalExpenses, netProfit, profitMargin } = data.summary;
      
      if (netProfit > 0) {
        insights.push({
          title: 'Rentabilidad Positiva',
          description: `El negocio muestra una ganancia neta de $${netProfit.toFixed(2)} con un margen de ${profitMargin.toFixed(1)}%.`
        });
      } else {
        insights.push({
          title: 'Atención: Pérdidas',
          description: `Se registran pérdidas por $${Math.abs(netProfit).toFixed(2)}. Revisar estrategias de costos.`
        });
      }
      
      if (profitMargin > 20) {
        insights.push({
          title: 'Excelente Margen',
          description: 'El margen de ganancia supera el 20%, indicando una operación muy eficiente.'
        });
      }
    }
    
    return insights;
  }

  /**
   * Generate enhanced chart scripts with better styling
   */
  private generateEnhancedChartScripts(charts: any[]): string {
    if (!charts || charts.length === 0) return '';
    
    const scripts = charts.map((chart, index) => {
      return `
        const ctx${index} = document.getElementById('chart-${index}').getContext('2d');
        new Chart(ctx${index}, {
          type: '${chart.type}',
          data: ${JSON.stringify(this.formatChartData(chart))},
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom',
                labels: {
                  padding: 20,
                  usePointStyle: true
                }
              },
              tooltip: {
                backgroundColor: 'rgba(0,0,0,0.8)',
                titleColor: 'white',
                bodyColor: 'white',
                borderColor: '#2196F3',
                borderWidth: 1
              }
            },
            scales: ${chart.type !== 'pie' && chart.type !== 'doughnut' ? `{
              y: {
                beginAtZero: true,
                grid: {
                  color: 'rgba(0,0,0,0.1)'
                }
              },
              x: {
                grid: {
                  color: 'rgba(0,0,0,0.1)'
                }
              }
            }` : '{}'}
          }
        });
      `;
    }).join('\n');
    
    return `
      <script>
        window.addEventListener('load', function() {
          ${scripts}
        });
      </script>
    `;
  }

  /**
   * Generate enhanced footer with additional information
   */
  private generateEnhancedFooter(generatedAt: string): string {
    return `
      <div class="report-footer" style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-top: 40px;">
        <div style="text-align: center; margin-bottom: 15px;">
          <strong>🐹 SUMAQ UYWA - Sistema de Gestión de Granja de Cuyes</strong>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 10px; color: #666;">
          <div>
            📅 Generado: ${new Date(generatedAt).toLocaleString()}<br>
            🔒 Documento confidencial - Solo para uso interno
          </div>
          <div style="text-align: right;">
            📧 Soporte: admin@sumaquywa.com<br>
            🌐 www.sumaquywa.com
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Generate generic content for unknown templates
   */
  private generateGenericContent(data: any): string {
    return '<div class="content-section"><p>Contenido del reporte en desarrollo.</p></div>';
  }

  /**
   * Generate inventory content
   */
  private generateInventoryContent(data: any): string {
    return '<div class="content-section"><p>Contenido de inventario en desarrollo.</p></div>';
  }

  /**
   * Generate reproductive content
   */
  private generateReproductiveContent(data: any): string {
    return '<div class="content-section"><p>Contenido reproductivo en desarrollo.</p></div>';
  }

  /**
   * Generate health content
   */
  private generateHealthContent(data: any): string {
    return '<div class="content-section"><p>Contenido de salud en desarrollo.</p></div>';
  }

  /**
   * Close browser instance
   */
  async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      logger.info('PDF generator browser closed');
    }
  }
}

export const pdfGeneratorService = new PDFGeneratorService();