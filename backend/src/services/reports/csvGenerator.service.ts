import * as csvWriter from 'csv-writer';
import fs from 'fs/promises';
import path from 'path';
import { CSVOptions } from '../../types/export.types';
import logger from '../../utils/logger';

export class CSVGeneratorService {
  
  /**
   * Generate CSV files from report data
   */
  async generateCSV(
    reportData: any,
    options: CSVOptions,
    outputPath: string
  ): Promise<{ filePath: string; fileSize: number }> {
    try {
      logger.info(`Generating CSV report: ${outputPath}`);
      
      const { data } = reportData;
      const generatedFiles: string[] = [];
      
      // Create base directory if it doesn't exist
      const baseDir = path.dirname(outputPath);
      const baseName = path.basename(outputPath, '.csv');
      
      // Generate CSV files for different data sections
      if (data.summary && Object.keys(data.summary).length > 0) {
        const summaryFile = path.join(baseDir, `${baseName}_resumen.csv`);
        await this.createSummaryCSV(summaryFile, reportData, options);
        generatedFiles.push(summaryFile);
      }
      
      if (data.preneces && data.preneces.length > 0) {
        const prenecesFile = path.join(baseDir, `${baseName}_preneces.csv`);
        await this.createDataCSV(prenecesFile, data.preneces, [
          { id: 'id', title: 'ID' },
          { id: 'madre', title: 'Madre' },
          { id: 'padre', title: 'Padre' },
          { id: 'fechaPrenez', title: 'Fecha Preñez' },
          { id: 'fechaProbableParto', title: 'Fecha Probable Parto' },
          { id: 'estado', title: 'Estado' }
        ], options);
        generatedFiles.push(prenecesFile);
      }
      
      if (data.camadas && data.camadas.length > 0) {
        const camadasFile = path.join(baseDir, `${baseName}_camadas.csv`);
        await this.createDataCSV(camadasFile, data.camadas, [
          { id: 'id', title: 'ID' },
          { id: 'madre', title: 'Madre' },
          { id: 'padre', title: 'Padre' },
          { id: 'fechaNacimiento', title: 'Fecha Nacimiento' },
          { id: 'numVivos', title: 'Vivos' },
          { id: 'numMuertos', title: 'Muertos' }
        ], options);
        generatedFiles.push(camadasFile);
      }
      
      if (data.details && data.details.length > 0) {
        const inventarioFile = path.join(baseDir, `${baseName}_inventario.csv`);
        await this.createDataCSV(inventarioFile, data.details, [
          { id: 'id', title: 'ID' },
          { id: 'raza', title: 'Raza' },
          { id: 'sexo', title: 'Sexo' },
          { id: 'etapaVida', title: 'Etapa' },
          { id: 'galpon', title: 'Galpón' },
          { id: 'jaula', title: 'Jaula' },
          { id: 'peso', title: 'Peso (g)' }
        ], options);
        generatedFiles.push(inventarioFile);
      }
      
      if (data.ventas && data.ventas.length > 0) {
        const ventasFile = path.join(baseDir, `${baseName}_ventas.csv`);
        await this.createDataCSV(ventasFile, data.ventas, [
          { id: 'id', title: 'ID' },
          { id: 'fecha', title: 'Fecha' },
          { id: 'clienteId', title: 'Cliente ID' },
          { id: 'total', title: 'Total' },
          { id: 'estadoPago', title: 'Estado Pago' }
        ], options);
        generatedFiles.push(ventasFile);
      }
      
      if (data.gastos && data.gastos.length > 0) {
        const gastosFile = path.join(baseDir, `${baseName}_gastos.csv`);
        await this.createDataCSV(gastosFile, data.gastos, [
          { id: 'id', title: 'ID' },
          { id: 'fecha', title: 'Fecha' },
          { id: 'concepto', title: 'Concepto' },
          { id: 'monto', title: 'Monto' },
          { id: 'categoria', title: 'Categoría' }
        ], options);
        generatedFiles.push(gastosFile);
      }
      
      // Create charts data CSV if available
      if (data.charts && data.charts.length > 0) {
        const chartsFile = path.join(baseDir, `${baseName}_graficos.csv`);
        await this.createChartsCSV(chartsFile, data.charts, options);
        generatedFiles.push(chartsFile);
      }
      
      // If only one file was generated, rename it to the original output path
      if (generatedFiles.length === 1) {
        await fs.rename(generatedFiles[0], outputPath);
        generatedFiles[0] = outputPath;
      } else if (generatedFiles.length > 1) {
        // Create a main CSV file with information about all generated files
        await this.createIndexCSV(outputPath, generatedFiles, reportData, options);
      } else {
        // No data to export, create empty file with headers
        await this.createEmptyCSV(outputPath, reportData, options);
      }
      
      // Calculate total file size
      let totalSize = 0;
      for (const file of generatedFiles) {
        try {
          const stats = await fs.stat(file);
          totalSize += stats.size;
        } catch (error) {
          // File might not exist, skip
        }
      }
      
      // Add index file size if it exists
      try {
        const indexStats = await fs.stat(outputPath);
        totalSize += indexStats.size;
      } catch (error) {
        // Index file might not exist, skip
      }
      
      logger.info(`CSV generated successfully: ${outputPath} (${totalSize} bytes total)`);
      
      return {
        filePath: outputPath,
        fileSize: totalSize
      };
    } catch (error) {
      logger.error('Error generating CSV:', error);
      throw new Error(`CSV generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create summary CSV file
   */
  private async createSummaryCSV(
    filePath: string,
    reportData: any,
    options: CSVOptions
  ): Promise<void> {
    const writer = csvWriter.createObjectCsvWriter({
      path: filePath,
      header: [
        { id: 'metrica', title: 'Métrica' },
        { id: 'valor', title: 'Valor' }
      ],
      encoding: options.encoding || 'utf8',
      fieldDelimiter: options.separator || ','
    });
    
    // Prepare summary data
    const summaryData = [
      { metrica: 'Reporte', valor: this.getReportTitle(reportData.templateId) },
      { metrica: 'Generado', valor: new Date(reportData.generatedAt).toLocaleString() }
    ];
    
    if (reportData.parameters?.dateRange) {
      summaryData.push({
        metrica: 'Período',
        valor: `${new Date(reportData.parameters.dateRange.from).toLocaleDateString()} - ${new Date(reportData.parameters.dateRange.to).toLocaleDateString()}`
      });
    }
    
    summaryData.push({ metrica: '', valor: '' }); // Empty row
    summaryData.push({ metrica: 'RESUMEN EJECUTIVO', valor: '' });
    
    // Add summary metrics
    Object.entries(reportData.data.summary).forEach(([key, value]) => {
      summaryData.push({
        metrica: this.formatLabel(key),
        valor: this.formatValue(value)
      });
    });
    
    await writer.writeRecords(summaryData);
  }

  /**
   * Create data CSV file
   */
  private async createDataCSV(
    filePath: string,
    data: any[],
    headers: Array<{ id: string; title: string }>,
    options: CSVOptions
  ): Promise<void> {
    const writer = csvWriter.createObjectCsvWriter({
      path: filePath,
      header: headers,
      encoding: options.encoding || 'utf8',
      fieldDelimiter: options.separator || ','
    });
    
    // Process data to ensure proper formatting
    const processedData = data.map(item => {
      const processedItem: any = {};
      headers.forEach(header => {
        let value = item[header.id];
        
        // Format dates
        if (value && (header.id.includes('fecha') || header.id.includes('Fecha'))) {
          try {
            value = new Date(value).toLocaleDateString();
          } catch (error) {
            // Keep original value if date parsing fails
          }
        }
        
        // Handle null/undefined values
        if (value === null || value === undefined) {
          value = '';
        }
        
        // Convert to string and escape if necessary
        processedItem[header.id] = String(value);
      });
      return processedItem;
    });
    
    await writer.writeRecords(processedData);
  }

  /**
   * Create charts data CSV file
   */
  private async createChartsCSV(
    filePath: string,
    charts: any[],
    options: CSVOptions
  ): Promise<void> {
    const allChartData: any[] = [];
    
    charts.forEach((chart, index) => {
      // Add chart header
      allChartData.push({
        grafico: chart.title,
        tipo: chart.type,
        categoria: '',
        valor: ''
      });
      
      // Add chart data
      if (chart.datasets && chart.datasets.length > 0) {
        chart.datasets.forEach((dataset: any) => {
          if (dataset.data && Array.isArray(dataset.data)) {
            dataset.data.forEach((value: any, dataIndex: number) => {
              const label = chart.labels && chart.labels[dataIndex] ? chart.labels[dataIndex] : `Item ${dataIndex + 1}`;
              allChartData.push({
                grafico: '',
                tipo: dataset.label || '',
                categoria: label,
                valor: value || 0
              });
            });
          }
        });
      }
      
      // Add empty row between charts
      allChartData.push({
        grafico: '',
        tipo: '',
        categoria: '',
        valor: ''
      });
    });
    
    const writer = csvWriter.createObjectCsvWriter({
      path: filePath,
      header: [
        { id: 'grafico', title: 'Gráfico' },
        { id: 'tipo', title: 'Tipo' },
        { id: 'categoria', title: 'Categoría' },
        { id: 'valor', title: 'Valor' }
      ],
      encoding: options.encoding || 'utf8',
      fieldDelimiter: options.separator || ','
    });
    
    await writer.writeRecords(allChartData);
  }

  /**
   * Create index CSV file with information about all generated files
   */
  private async createIndexCSV(
    filePath: string,
    generatedFiles: string[],
    reportData: any,
    options: CSVOptions
  ): Promise<void> {
    const indexData = [
      { archivo: 'ÍNDICE DE ARCHIVOS GENERADOS', descripcion: '', tamaño: '' },
      { archivo: '', descripcion: '', tamaño: '' },
      { archivo: 'Reporte:', descripcion: this.getReportTitle(reportData.templateId), tamaño: '' },
      { archivo: 'Generado:', descripcion: new Date(reportData.generatedAt).toLocaleString(), tamaño: '' },
      { archivo: '', descripcion: '', tamaño: '' },
      { archivo: 'ARCHIVOS GENERADOS:', descripcion: '', tamaño: '' }
    ];
    
    for (const file of generatedFiles) {
      try {
        const stats = await fs.stat(file);
        const fileName = path.basename(file);
        const description = this.getFileDescription(fileName);
        
        indexData.push({
          archivo: fileName,
          descripcion: description,
          tamaño: `${stats.size} bytes`
        });
      } catch (error) {
        indexData.push({
          archivo: path.basename(file),
          descripcion: 'Error al leer archivo',
          tamaño: 'N/A'
        });
      }
    }
    
    const writer = csvWriter.createObjectCsvWriter({
      path: filePath,
      header: [
        { id: 'archivo', title: 'Archivo' },
        { id: 'descripcion', title: 'Descripción' },
        { id: 'tamaño', title: 'Tamaño' }
      ],
      encoding: options.encoding || 'utf8',
      fieldDelimiter: options.separator || ','
    });
    
    await writer.writeRecords(indexData);
  }

  /**
   * Create empty CSV file when no data is available
   */
  private async createEmptyCSV(
    filePath: string,
    reportData: any,
    options: CSVOptions
  ): Promise<void> {
    const emptyData = [
      { campo: 'Reporte', valor: this.getReportTitle(reportData.templateId) },
      { campo: 'Generado', valor: new Date(reportData.generatedAt).toLocaleString() },
      { campo: 'Estado', valor: 'Sin datos disponibles para exportar' }
    ];
    
    const writer = csvWriter.createObjectCsvWriter({
      path: filePath,
      header: [
        { id: 'campo', title: 'Campo' },
        { id: 'valor', title: 'Valor' }
      ],
      encoding: options.encoding || 'utf8',
      fieldDelimiter: options.separator || ','
    });
    
    await writer.writeRecords(emptyData);
  }

  /**
   * Get file description based on filename
   */
  private getFileDescription(fileName: string): string {
    if (fileName.includes('resumen')) return 'Resumen ejecutivo del reporte';
    if (fileName.includes('preneces')) return 'Datos de preñeces';
    if (fileName.includes('camadas')) return 'Datos de camadas';
    if (fileName.includes('inventario')) return 'Inventario de cuyes';
    if (fileName.includes('ventas')) return 'Datos de ventas';
    if (fileName.includes('gastos')) return 'Datos de gastos';
    if (fileName.includes('graficos')) return 'Datos de gráficos';
    return 'Datos del reporte';
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
  private formatValue(value: any): string {
    if (typeof value === 'number') {
      if (value % 1 === 0) {
        return value.toLocaleString();
      } else {
        return value.toFixed(2);
      }
    }
    
    return String(value);
  }
}

export const csvGeneratorService = new CSVGeneratorService();