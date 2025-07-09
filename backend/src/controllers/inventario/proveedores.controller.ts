import { Request, Response } from 'express';
import * as proveedoresService from '../../services/inventario/proveedores.service';

export const getAllProveedores = async (req: Request, res: Response) => {
  try {
    const proveedores = await proveedoresService.getAllProveedores();
    res.json(proveedores);
  } catch (error) {
    console.error('Error en getAllProveedores:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const getProveedorById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const proveedor = await proveedoresService.getProveedorById(id);
    
    if (!proveedor) {
      return res.status(404).json({ message: 'Proveedor no encontrado' });
    }
    
    res.json(proveedor);
  } catch (error) {
    console.error('Error en getProveedorById:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const createProveedor = async (req: Request, res: Response) => {
  try {
    const newProveedor = await proveedoresService.createProveedor(req.body);
    res.status(201).json(newProveedor);
  } catch (error) {
    console.error('Error en createProveedor:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const updateProveedor = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const updatedProveedor = await proveedoresService.updateProveedor(id, req.body);
    
    if (!updatedProveedor) {
      return res.status(404).json({ message: 'Proveedor no encontrado' });
    }
    
    res.json(updatedProveedor);
  } catch (error) {
    console.error('Error en updateProveedor:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const deleteProveedor = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const success = await proveedoresService.deleteProveedor(id);
    
    if (!success) {
      return res.status(404).json({ message: 'Proveedor no encontrado' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error en deleteProveedor:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};
