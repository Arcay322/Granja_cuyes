import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    // Verificar si ya existe al menos un cliente
    const clientesCount = await prisma.cliente.count();
    
    if (clientesCount === 0) {
      // Crear un cliente predeterminado
      await prisma.cliente.create({
        data: {
          nombre: 'Cliente General',
          contacto: '999-999-999',
          direccion: 'Av. Principal 123'
        }
      });
      console.log('Cliente predeterminado creado con éxito');
    } else {
      console.log('Ya existe al menos un cliente en la base de datos');
    }
    
    // Mostrar todos los clientes
    const clientes = await prisma.cliente.findMany();
    console.log('Clientes disponibles:');
    console.table(clientes);
    
  } catch (error) {
    console.error('Error al crear cliente predeterminado:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
