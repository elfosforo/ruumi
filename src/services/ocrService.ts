export interface OcrResult {
  amount: number;
  date: string;
  bank: string;
  rut: string;
}

export const simulateOcr = async (imageUri: string): Promise<OcrResult> => {
  // Simulate a delay for the "AI" to work
  await new Promise(resolve => setTimeout(resolve, 2500));

  // Mock result based on a typical Chilean transfer screenshot
  return {
    amount: 145000,
    date: '13/05/2026',
    bank: 'BancoEstado',
    rut: '12.345.678-9',
  };
};
