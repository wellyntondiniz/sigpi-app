const BASE_URL = 'http://localhost:8080/imovel'; 

export interface Imovel {
  id?: number;
  titulo?: string;
  descricao?: string;
  disponivel?: boolean;
}

export async function listarImoveis(): Promise<Imovel[]> {
  const res = await fetch(`${BASE_URL}`);
  if (!res.ok) throw new Error('Erro ao listar imóveis');
  return res.json();
}

export async function listarImoveisDisponiveis(): Promise<Imovel[]> {
  const res = await fetch(`${BASE_URL}/disponiveis`);
  if (!res.ok) throw new Error('Erro ao listar imóveis disponíveis');
  return res.json();
}

export async function buscarImovelPorId(id: number): Promise<Imovel> {
  const res = await fetch(`${BASE_URL}/${id}`);
  if (!res.ok) throw new Error('Erro ao buscar imóvel por ID');
  return res.json();
}

export async function salvarImovel(imovel: Imovel): Promise<Imovel> {
  const res = await fetch(`${BASE_URL}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(imovel),
  });
  if (!res.ok) throw new Error('Erro ao salvar imóvel');
  return res.json();
}

export async function deletarImovel(id: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Erro ao deletar imóvel');
}
