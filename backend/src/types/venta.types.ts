export interface VentaDetalleInput {
  cuyId: number;
  peso: number;
  precioUnitario: number;
}

export interface VentaInput {
  clienteId: number;
  fecha: Date | string;
  total: number;
  estadoPago?: string;
  detalles?: VentaDetalleInput[];
}
