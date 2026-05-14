/**
 * Service to fetch economic indicators from Chile (UF, Dollar, etc.)
 * Using mindicador.cl API
 */

export interface MindicadorResponse {
  version: string;
  autor: string;
  fecha: string;
  uf: {
    codigo: string;
    nombre: string;
    unidad_medida: string;
    fecha: string;
    valor: number;
  };
}

export const getUfValue = async (): Promise<number> => {
  try {
    const response = await fetch('https://mindicador.cl/api');
    const data = await response.json();
    return data.uf.valor;
  } catch (error) {
    console.error('Error fetching UF:', error);
    return 37000; // Fallback value
  }
};

export const convertUfToClp = (ufAmount: number, ufValue: number): number => {
  return Math.round(ufAmount * ufValue);
};
