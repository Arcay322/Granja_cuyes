import { Request, Response, NextFunction } from 'express';
import * as clientesService from '../../services/clientes/clientes.service';
// Recomendación: usar validateRequest en las rutas para validar req.body

export const getAllClientes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const clientes = await clientesService.getAllClientes();
    res.json(clientes);
  } catch (error) {
    next(error);
  }
};

export const getClienteById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id);
    const cliente = await clientesService.getClienteById(id);
    if (!cliente) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }
    res.json(cliente);
  } catch (error) {
    next(error);
  }
};

export const createCliente = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const newCliente = await clientesService.createCliente(req.body);
    res.status(201).json(newCliente);
  } catch (error) {
    next(error);
  }
};

export const updateCliente = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id);
    const updatedCliente = await clientesService.updateCliente(id, req.body);
    if (!updatedCliente) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }
    res.json(updatedCliente);
  } catch (error) {
    next(error);
  }
};

export const deleteCliente = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id);
    const success = await clientesService.deleteCliente(id);
    if (!success) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }
    res.json({ message: 'Cliente eliminado' });
  } catch (error) {
    next(error);
  }
};
