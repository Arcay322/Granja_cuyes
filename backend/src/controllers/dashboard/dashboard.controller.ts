import { Request, Response } from 'express';
import * as dashboardService from '../../services/dashboard/dashboard.service';

export const getMetrics = async (req: Request, res: Response) => {
  const metrics = await dashboardService.getMetrics();
  res.json(metrics);
};

export const getPopulationGrowth = async (req: Request, res: Response) => {
  const data = await dashboardService.getPopulationGrowth();
  res.json(data);
};

export const getVentasStats = async (req: Request, res: Response) => {
  const data = await dashboardService.getVentasStats();
  res.json(data);
};

export const getGastosStats = async (req: Request, res: Response) => {
  const data = await dashboardService.getGastosStats();
  res.json(data);
};

export const getProductivityStats = async (req: Request, res: Response) => {
  const data = await dashboardService.getProductivityStats();
  res.json(data);
};
