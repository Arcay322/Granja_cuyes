import { Request, Response } from 'express';
import * as clientesService from '../../services/clientes/clientes.service';

export const getAllClientes = async (req: Request, res: Response) => {
  try {
    const clientes = await clientesService.getAllClientes();
    res.json(clientes);
  } catch (error) {
    console.error('Error en getAllClientes:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const getClienteById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const cliente = await clientesService.getClienteById(id);
    
    if (!cliente) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }
    
    res.json(cliente);
  } catch (error) {
    console.error('Error en getClienteById:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const createCliente = async (req: Request, res: Response) => {
  try {
    const newCliente = await clientesService.createCliente(req.body);
    res.status(201).json(newCliente);
  } catch (error) {
    console.error('Error en createCliente:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const updateCliente = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const updatedCliente = await clientesService.updateCliente(id, req.body);
    
    if (!updatedCliente) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }
    
    res.json(updatedCliente);
  } catch (error) {
    console.error('Error en updateCliente:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const deleteCliente = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const success = await clientesService.deleteCliente(id);
    
    if (!success) {
      return res.status(404).json({ message: 'Cliente no encontrado o no se pudo eliminar' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error en deleteCliente:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};
