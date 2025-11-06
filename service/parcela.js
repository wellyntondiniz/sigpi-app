
const BASE_URL = 'http://192.168.68.104:4200/parcelas'; 

export interface Parcela {
  id?: number;
  numeroParcela?: number;
  dataVencimento?: Date;
  aluguel_id?: numeber;
  situacao?: string;
}


export async function listarParcelasVencendo(): Promise<Parcela[]> {
  const res = await fetch(`${BASE_URL}/vencimento`);
  if (!res.ok) throw new Error('Erro ao listar parcelas');
  return res.json();
}