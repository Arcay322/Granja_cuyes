import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Verificando usuarios en la base de datos...');
    
    const usuarios = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        createdAt: true
      }
    });
    
    console.log(`Total de usuarios encontrados: ${usuarios.length}`);
    
    if (usuarios.length === 0) {
      console.log('No hay usuarios en la base de datos.');
      console.log('Esto explica por qué el frontend recibe error 403.');
    } else {
      console.log('Usuarios:');
      usuarios.forEach((usuario, index) => {
        console.log(`${index + 1}. ${usuario.email} - Creado: ${usuario.createdAt}`);
      });
    }
    
  } catch (error) {
    console.error('Error al consultar usuarios:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
