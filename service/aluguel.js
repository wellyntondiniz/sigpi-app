
const BASE_URL = 'http://192.168.68.104:4200/aluguel'; 

export interface Aluguel {
	id?: number;
    proprietarioId?: number;
    inquilinoId?: number;
    imovelId?: number;
    dataInicio?: Date;
    diaCobranca?: number;
    mesesDuracao?: number;
}

export async function listarAlugueis(): Promise<Aluguel[]> {
  const res = await fetch(`${BASE_URL}`);
  if (!res.ok) throw new Error('Erro ao listar alugueis');
  return res.json();
}


