import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';

// Obtener todos los galpones con resumen
export const getGalpones = async (req: Request, res: Response) => {
  try {
    const cuyes = await prisma.cuy.findMany({
      select: {
        galpon: true,
        jaula: true,
        raza: true,
        sexo: true,
        id: true
      }
    });

    // Agrupar por galpón
    const galponesMap = new Map();
    
    cuyes.forEach(cuy => {
      if (!galponesMap.has(cuy.galpon)) {
        galponesMap.set(cuy.galpon, {
          galpon: cuy.galpon,
          totalJaulas: new Set(),
          totalCuyes: 0,
          jaulas: []
        });
      }
      
      const galponData = galponesMap.get(cuy.galpon);
      galponData.totalCuyes++;
      galponData.totalJaulas.add(cuy.jaula);
    });

    // Convertir a array y procesar jaulas
    const galpones = Array.from(galponesMap.values()).map(galpon => ({
      ...galpon,
      totalJaulas: galpon.totalJaulas.size,
      jaulas: []
    }));

    res.json(galpones);
  } catch (error) {
    console.error('Error al obtener galpones:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Obtener un galpón específico
export const getGalpon = async (req: Request, res: Response) => {
  try {
    const { galpon } = req.params;
    
    const cuyes = await prisma.cuy.findMany({
      where: { galpon },
      select: {
        galpon: true,
        jaula: true,
        raza: true,
        sexo: true,
        id: true
      }
    });

    if (cuyes.length === 0) {
      return res.status(404).json({ message: 'Galpón no encontrado' });
    }

    const jaulasSet = new Set();
    cuyes.forEach(cuy => jaulasSet.add(cuy.jaula));

    const galponData = {
      galpon,
      totalJaulas: jaulasSet.size,
      totalCuyes: cuyes.length,
      jaulas: Array.from(jaulasSet)
    };

    res.json(galponData);
  } catch (error) {
    console.error('Error al obtener galpón:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Crear nuevo galpón (solo valida que no exista)
export const createGalpon = async (req: Request, res: Response) => {
  try {
    const { nombre, descripcion, ubicacion, capacidadMaxima, estado } = req.body;

    if (!nombre) {
      return res.status(400).json({ message: 'El nombre del galpón es obligatorio' });
    }

    // Verificar que no exista un galpón con el mismo nombre
    const existingCuyes = await prisma.cuy.findFirst({
      where: { galpon: nombre }
    });

    if (existingCuyes) {
      return res.status(400).json({ message: 'Ya existe un galpón con ese nombre' });
    }

    // Simular creación (no hay tabla específica para galpones)
    const galponData = {
      galpon: nombre,
      descripcion,
      ubicacion,
      capacidadMaxima: capacidadMaxima || 50,
      estado: estado || 'Activo',
      totalJaulas: 0,
      totalCuyes: 0,
      jaulas: []
    };

    res.status(201).json(galponData);
  } catch (error) {
    console.error('Error al crear galpón:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Actualizar galpón (actualiza todos los cuyes del galpón si se cambia el nombre)
export const updateGalpon = async (req: Request, res: Response) => {
  try {
    const { galpon: currentName } = req.params;
    const { nombre, descripcion, ubicacion, capacidadMaxima, estado } = req.body;

    if (!nombre) {
      return res.status(400).json({ message: 'El nombre del galpón es obligatorio' });
    }

    // Si se cambió el nombre, actualizar todos los cuyes
    if (nombre !== currentName) {
      // Verificar que el nuevo nombre no exista
      const existingCuyes = await prisma.cuy.findFirst({
        where: { galpon: nombre }
      });

      if (existingCuyes) {
        return res.status(400).json({ message: 'Ya existe un galpón con ese nombre' });
      }

      // Actualizar nombre en todos los cuyes
      await prisma.cuy.updateMany({
        where: { galpon: currentName },
        data: { galpon: nombre }
      });
    }

    const updatedGalpon = {
      galpon: nombre,
      descripcion,
      ubicacion,
      capacidadMaxima: capacidadMaxima || 50,
      estado: estado || 'Activo'
    };

    res.json(updatedGalpon);
  } catch (error) {
    console.error('Error al actualizar galpón:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Eliminar galpón (elimina todos los cuyes del galpón)
export const deleteGalpon = async (req: Request, res: Response) => {
  try {
    const { galpon } = req.params;

    // Verificar que el galpón existe
    const cuyesCount = await prisma.cuy.count({
      where: { galpon }
    });

    if (cuyesCount === 0) {
      return res.status(404).json({ message: 'Galpón no encontrado' });
    }

    // Eliminar todos los cuyes del galpón
    await prisma.cuy.deleteMany({
      where: { galpon }
    });

    res.json({ message: `Galpón ${galpon} eliminado exitosamente junto con ${cuyesCount} cuyes` });
  } catch (error) {
    console.error('Error al eliminar galpón:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Obtener jaulas de un galpón específico
export const getJaulasByGalpon = async (req: Request, res: Response) => {
  try {
    const { galpon } = req.params;
    
    const cuyes = await prisma.cuy.findMany({
      where: { galpon },
      select: {
        jaula: true,
        raza: true,
        sexo: true,
        fechaNacimiento: true,
        id: true
      }
    });

    if (cuyes.length === 0) {
      return res.json([]);
    }

    // Agrupar por jaula
    const jaulasMap = new Map();
    
    cuyes.forEach(cuy => {
      if (!jaulasMap.has(cuy.jaula)) {
        jaulasMap.set(cuy.jaula, {
          jaula: cuy.jaula,
          galpon,
          totalCuyes: 0,
          cuyesPorSexo: { machos: 0, hembras: 0 },
          razas: new Set(),
          edadPromedio: 0
        });
      }
      
      const jaulaData = jaulasMap.get(cuy.jaula);
      jaulaData.totalCuyes++;
      
      if (cuy.sexo === 'M') jaulaData.cuyesPorSexo.machos++;
      if (cuy.sexo === 'H') jaulaData.cuyesPorSexo.hembras++;
      
      jaulaData.razas.add(cuy.raza);
    });

    // Convertir a array
    const jaulas = Array.from(jaulasMap.values()).map(jaula => ({
      ...jaula,
      razas: Array.from(jaula.razas)
    }));

    res.json(jaulas);
  } catch (error) {
    console.error('Error al obtener jaulas:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Crear jaula vacía (simulada - no almacena físicamente la jaula)
export const createJaulaVacia = async (req: Request, res: Response) => {
  try {
    const { galpon, jaula } = req.body;

    if (!galpon || !jaula) {
      return res.status(400).json({ message: 'El galpón y jaula son obligatorios' });
    }

    // Verificar que no exista una jaula con el mismo nombre en el mismo galpón
    const existingCuyes = await prisma.cuy.findFirst({
      where: { 
        galpon,
        jaula 
      }
    });

    if (existingCuyes) {
      return res.status(400).json({ message: 'Ya existe una jaula con ese nombre en el galpón' });
    }

    // Simular creación de jaula vacía (en realidad no creamos nada físicamente)
    // La jaula se considera "creada" cuando tenga cuyes
    const jaulaData = {
      jaula,
      galpon,
      totalCuyes: 0,
      cuyesPorSexo: { machos: 0, hembras: 0 },
      razas: [],
      edadPromedio: 0,
      estado: 'Disponible'
    };

    res.status(201).json(jaulaData);
  } catch (error) {
    console.error('Error al crear jaula vacía:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};
