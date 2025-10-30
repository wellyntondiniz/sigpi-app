import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';

type ImovelRequestJSON = Imovel & {
  fotoBase64?: string;        
  fotoContentType?: string;   
  fotoNome?: string;          
};

export interface Imovel {
  id?: number;
  titulo?: string;
  descricao?: string;
  disponivel?: boolean;
  imagemUrl?: string;
  foto?: string;
}

const BASE_URL = 'http://192.168.0.23:4200/imovel'; 

async function toBase64(uri: string): Promise<string> {
  const manip = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1280 } }], 
    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
  );
  return FileSystem.readAsStringAsync(manip.uri, { encoding: FileSystem.EncodingType.Base64 });
}

async function readUriAsBase64(uri: string) {
  return FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
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

export async function salvarImovel(
  form: Imovel,
  params?: { fotoBase64?: string; fotoUri?: string; mime?: string; nome?: string }
): Promise<Imovel> {
  const payload: ImovelRequestJSON = { ...form };

  if (params?.fotoBase64 || params?.fotoUri) {
    payload.fotoBase64 =
      params.fotoBase64 ??
      (params.fotoUri ? await readUriAsBase64(params.fotoUri) : undefined);

    payload.fotoContentType = params?.mime ?? 'image/jpeg';
    payload.fotoNome = params?.nome ?? `imovel_${Date.now()}.jpg`;
  }

  const resp = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    const err = await resp.text().catch(() => '');
    throw new Error(`Erro ao salvar imóvel: ${resp.status} ${err}`);
  }
  return resp.json();
}

export async function deletarImovel(id: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Erro ao deletar imóvel');
}
