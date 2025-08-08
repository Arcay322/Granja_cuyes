const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function generateFinancialReportData(parameters) {
  try {
    console.log('📊 Generando datos del reporte financiero...');
    
    // Parse date range
    const now = new Date();
    const defaultFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const defaultTo = now;

    const dateRange = {
      from: parameters.dateRange?.from ? new Date(parameters.dateRange.from) : defaultFrom,
      to: parameters.dateRange?.to ? new Date(parameters.dateRange.to) : defaultTo
    };

    console.log(`📅 Rango de fechas: ${dateRange.from.toLocaleDateString()} - ${dateRange.to.toLocaleDateString()}`);

    // Query sales data
    const salesData = await prisma.venta.findMany({
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
    const expensesData = await prisma.gasto.findMany({
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

    console.log(`💰 Ventas encontradas: ${salesData.length}`);
    console.log(`💸 Gastos encontrados: ${expensesData.length}`);

    // Transform sales data
    const sales = salesData.map(venta => ({
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

    // Transform expenses data
    const expenses = expensesData.map(gasto => ({
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

    const reportData = {
      templateId: 'financial',
      generatedAt: new Date().toISOString(),
      parameters,
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
      expenses
    };

    console.log('✅ Datos del reporte generados exitosamente');
    console.log(`📈 Total Ingresos: S/ ${totalIncome.toFixed(2)}`);
    console.log(`📉 Total Gastos: S/ ${totalExpenses.toFixed(2)}`);
    console.log(`💰 Ganancia Neta: S/ ${netProfit.toFixed(2)}`);
    console.log(`📊 Margen: ${profitMargin.toFixed(1)}%`);

    return reportData;

  } catch (error) {
    console.error('❌ Error generando datos del reporte:', error);
    throw error;
  }
}

function generateCSVContent(reportData) {
  console.log('📄 Generando contenido CSV...');
  
  let csvContent = '';
  
  // Header
  csvContent += 'REPORTE FINANCIERO\\n';
  csvContent += `Generado: ${new Date(reportData.generatedAt).toLocaleString()}\\n`;
  csvContent += `Período: ${reportData.period.from.toLocaleDateString()} - ${reportData.period.to.toLocaleDateString()}\\n`;
  csvContent += '\\n';
  
  // Summary
  csvContent += 'RESUMEN FINANCIERO\\n';
  csvContent += 'Concepto,Valor\\n';
  csvContent += `Total Ingresos,S/ ${reportData.summary.totalIncome.toFixed(2)}\\n`;
  csvContent += `Total Gastos,S/ ${reportData.summary.totalExpenses.toFixed(2)}\\n`;
  csvContent += `Ganancia Neta,S/ ${reportData.summary.netProfit.toFixed(2)}\\n`;
  csvContent += `Margen de Ganancia,${reportData.summary.profitMargin.toFixed(1)}%\\n`;
  csvContent += `Número de Ventas,${reportData.summary.salesCount}\\n`;
  csvContent += `Número de Gastos,${reportData.summary.expensesCount}\\n`;
  csvContent += '\\n';
  
  // Sales details
  if (reportData.sales.length > 0) {
    csvContent += 'DETALLE DE VENTAS\\n';
    csvContent += 'ID,Fecha,Cliente,Cantidad,Precio Unitario,Total\\n';
    
    reportData.sales.forEach(sale => {
      csvContent += `${sale.id},${sale.fecha.toLocaleDateString()},${sale.cliente.nombre},${sale.cantidad},S/ ${sale.precioUnitario.toFixed(2)},S/ ${sale.total.toFixed(2)}\\n`;
    });
    csvContent += '\\n';
  }
  
  // Expenses details
  if (reportData.expenses.length > 0) {
    csvContent += 'DETALLE DE GASTOS\\n';
    csvContent += 'ID,Fecha,Concepto,Categoría,Monto\\n';
    
    reportData.expenses.forEach(expense => {
      csvContent += `${expense.id},${expense.fecha.toLocaleDateString()},${expense.concepto},${expense.categoria},S/ ${expense.monto.toFixed(2)}\\n`;
    });
  }
  
  return csvContent;
}

async function generateTestReport() {
  try {
    console.log('🚀 INICIANDO GENERACIÓN DE REPORTE DE PRUEBA');
    console.log('==============================================');
    
    const parameters = {
      dateRange: {
        from: '2025-01-01',
        to: '2025-12-31'
      }
    };
    
    // Generate report data
    const reportData = await generateFinancialReportData(parameters);
    
    // Generate CSV content
    const csvContent = generateCSVContent(reportData);
    
    // Write to file
    const fileName = `financial_report_test_${Date.now()}.csv`;
    const filePath = path.join(__dirname, fileName);
    
    fs.writeFileSync(filePath, csvContent);
    
    console.log('\\n📄 ARCHIVO CSV GENERADO EXITOSAMENTE');
    console.log('=====================================');
    console.log(`📁 Archivo: ${fileName}`);
    console.log(`📍 Ubicación: ${filePath}`);
    console.log(`📊 Tamaño: ${fs.statSync(filePath).size} bytes`);
    
    console.log('\\n📋 CONTENIDO DEL ARCHIVO:');
    console.log('==========================');
    const fileContent = fs.readFileSync(filePath, 'utf8');
    console.log(fileContent);
    
    console.log('\\n🎉 PRUEBA COMPLETADA EXITOSAMENTE');
    console.log('El archivo contiene datos reales de la base de datos');
    
  } catch (error) {
    console.error('❌ Error en la generación del reporte:', error);
  } finally {
    await prisma.$disconnect();
  }
}

generateTestReport();