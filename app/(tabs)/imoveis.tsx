// app/imoveis.tsx
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Modal,
    Pressable,
    StyleSheet,
    Switch,
    TextInput,
    View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

import {
    deletarImovel,
    Imovel,
    listarImoveis,
    salvarImovel,
} from '@/service/imovel';

export default function ImoveisScreen() {
  const [data, setData] = useState<Imovel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const emptyForm: Imovel = useMemo(
    () => ({ id: undefined, titulo: '', descricao: '', disponivel: true }),
    []
  );
  const [form, setForm] = useState<Imovel>(emptyForm);
  const [openForm, setOpenForm] = useState(false);

  const [fotoLocalUri, setFotoLocalUri] = useState<string | undefined>();
  const [fotoBase64, setFotoBase64] = useState<string | undefined>();

  // helper para montar data URI
  function buildDataUri(base64?: string, mime = 'image/jpeg') {
    if (!base64) return undefined;
    if (base64.startsWith('data:')) return base64;
    return `data:${mime};base64,${base64}`;
  }

  async function load() {
    try {
      setLoading(true);
      const res = await listarImoveis();
      setData(res);
    } catch (e: any) {
      Alert.alert('Erro', e?.message ?? 'Falha ao carregar imóveis');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function onAdd() {
    setForm(emptyForm);
    setFotoLocalUri(undefined);
    setFotoBase64(undefined);
    setOpenForm(true);
  }

  function onEdit(item: Imovel) {
    // tenta obter base64 e/ou data URI vindos do backend/service
    const mime = (item as any).fotoContentType ?? 'image/jpeg';
    const fromBase64 = (item as any).foto ?? (item as any).fotoBase64 ?? (item as any).imagemBase64;
    const fromUrl = (item as any).fotoUrl as string | undefined;

    const preview = fromBase64 ? buildDataUri(fromBase64, mime) : fromUrl;
    const base64 =
      fromBase64 ??
      (fromUrl && fromUrl.includes(',') ? fromUrl.split(',')[1] : undefined);

    setForm({
      id: item.id,
      titulo: item.titulo ?? '',
      descricao: item.descricao ?? '',
      disponivel: !!item.disponivel,
    });

    // mantém a foto atual visível no modal e pronta para reenvio
    setFotoLocalUri(preview);
    setFotoBase64(base64);

    setOpenForm(true);
  }

  async function onDelete(id?: number) {
    if (!id) return;
    Alert.alert('Excluir imóvel', 'Tem certeza que deseja excluir?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await deletarImovel(id);
            await load();
          } catch (e: any) {
            Alert.alert('Erro', e?.message ?? 'Falha ao excluir');
          }
        },
      },
    ]);
  }

  async function pickImage() {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (perm.status !== 'granted') {
        Alert.alert('Permissão necessária', 'Ative o acesso à câmera.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        aspect: [4, 3],
        base64: true,
      });

      if (result.canceled) return;

      const asset = result.assets?.[0];
      if (!asset) {
        Alert.alert('Erro', 'Não foi possível obter a imagem.');
        return;
      }

      setFotoLocalUri(asset.uri);                 // prévia
      setFotoBase64(asset.base64 ?? undefined);   // payload
    } catch (e: any) {
      Alert.alert('Erro', e?.message ?? 'Falha ao abrir câmera');
    }
  }

  function removeImage() {
    setFotoLocalUri(undefined);
    setFotoBase64(undefined);
  }

  async function onSubmit() {
    if (!form.titulo || form.titulo.trim().length === 0) {
      Alert.alert('Validação', 'Informe um título.');
      return;
    }
    try {
      setSaving(true);
      await salvarImovel(form, {
        fotoBase64,
        fotoUri: fotoLocalUri, // só para prévia; backend usa base64
        mime: 'image/jpeg',
        nome: `imovel_${Date.now()}.jpg`,
      });
      setOpenForm(false);
      setForm(emptyForm);
      setFotoLocalUri(undefined);
      setFotoBase64(undefined);
      await load();
    } catch (e: any) {
      Alert.alert('Erro', e?.message ?? 'Falha ao salvar');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <ThemedView style={styles.center}>
        <ActivityIndicator />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Cabeçalho com ícone e título */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="business" size={22} color="#2563eb" style={{ marginRight: 8 }} />
          <ThemedText type="title">Imóveis</ThemedText>
        </View>
      </View>

      {/* Lista compacta */}
      <FlatList
        data={data}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => {
          const mime = (item as any).fotoContentType ?? 'image/jpeg';
          const uri =
            (item as any).fotoUrl ??
            (item as any).foto
              ? buildDataUri((item as any).foto as string, mime)
              : undefined;

          return (
            <Pressable style={styles.row} onPress={() => onEdit(item)}>
              <Thumb uri={uri} />

              <View style={styles.rowBody}>
                <ThemedText style={styles.rowTitle} numberOfLines={1}>
                  {item.titulo}
                </ThemedText>
                {!!item.descricao && (
                  <ThemedText style={styles.rowSub} numberOfLines={1}>
                    {item.descricao}
                  </ThemedText>
                )}
                <View style={styles.rowMeta}>
                  <StatusPill disponivel={!!item.disponivel} />
                </View>
              </View>

              <View style={styles.rowActions}>
                <Pressable
                  onPress={() => onEdit(item)}
                  hitSlop={8}
                  style={styles.iconCircle}
                >
                  <Ionicons name="create-outline" size={18} />
                </Pressable>
                <Pressable
                  onPress={() => onDelete(item.id)}
                  hitSlop={8}
                  style={[styles.iconCircle, { marginLeft: 6 }]}
                >
                  <Ionicons name="trash-outline" size={18} />
                </Pressable>
              </View>
            </Pressable>
          );
        }}
        ItemSeparatorComponent={() => <View style={styles.hairline} />}
        ListEmptyComponent={
          <View style={[styles.center, { paddingTop: 24 }]}>
            <ThemedText>Nenhum imóvel cadastrado.</ThemedText>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 80 }}
      />

      {/* FAB */}
      <Pressable onPress={onAdd} style={styles.fab}>
        <Ionicons name="add" size={26} color="#fff" />
      </Pressable>

      {/* Modal */}
      <Modal
        visible={openForm}
        animationType="slide"
        onRequestClose={() => setOpenForm(false)}
        transparent
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <ThemedText type="subtitle">
              {form.id ? 'Editar Imóvel' : 'Novo Imóvel'}
            </ThemedText>

            <ThemedText style={styles.label}>Título</ThemedText>
            <TextInput
              placeholder="Ex.: Casa 3 quartos"
              value={form.titulo ?? ''}
              onChangeText={(t) => setForm((s) => ({ ...s, titulo: t }))}
              style={styles.input}
            />

            <ThemedText style={styles.label}>Descrição</ThemedText>
            <TextInput
              placeholder="Descreva o imóvel"
              value={form.descricao ?? ''}
              onChangeText={(t) => setForm((s) => ({ ...s, descricao: t }))}
              style={[styles.input, { height: 80 }]}
              multiline
            />

            <View style={styles.switchRow}>
              <ThemedText>Disponível</ThemedText>
              <Switch
                value={!!form.disponivel}
                onValueChange={(v) => setForm((s) => ({ ...s, disponivel: v }))}
              />
            </View>

            <ThemedText style={styles.label}>Foto do imóvel</ThemedText>
            {fotoLocalUri ? (
              <View style={{ gap: 8 }}>
                <Image
                  source={{ uri: fotoLocalUri }}
                  style={{ width: '100%', height: 180, borderRadius: 10 }}
                  resizeMode="cover"
                />
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <Pressable onPress={pickImage} style={styles.secondaryBtn}>
                    <ThemedText style={styles.btnText}>Trocar foto</ThemedText>
                  </Pressable>
                  <Pressable onPress={removeImage} style={styles.dangerBtn}>
                    <ThemedText style={styles.btnText}>Remover</ThemedText>
                  </Pressable>
                </View>
              </View>
            ) : (
              <Pressable
                onPress={pickImage}
                style={[styles.primaryBtn, { alignSelf: 'flex-start' }]}
              >
                <ThemedText style={styles.btnText}>Selecionar foto</ThemedText>
              </Pressable>
            )}

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setOpenForm(false)}
                style={[styles.secondaryBtn, { flex: 1 }]}
                disabled={saving}
              >
                <ThemedText style={styles.btnText}>Cancelar</ThemedText>
              </Pressable>
              <Pressable
                onPress={onSubmit}
                style={[styles.primaryBtn, { flex: 1 }]}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator />
                ) : (
                  <ThemedText style={styles.btnText}>
                    {form.id ? 'Salvar' : 'Cadastrar'}
                  </ThemedText>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

/** Miniatura com fallback */
function Thumb({ uri }: { uri?: string }) {
  return uri ? (
    <Image source={{ uri }} style={styles.thumb} />
  ) : (
    <View style={[styles.thumb, styles.thumbPlaceholder]}>
      <Ionicons name="image-outline" size={16} color="#9ca3af" />
    </View>
  );
}

/** Pill de status */
function StatusPill({ disponivel }: { disponivel: boolean }) {
  const bg = disponivel ? '#DCFCE7' : '#FEE2E2';
  const fg = disponivel ? '#166534' : '#991B1B';
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <ThemedText style={[styles.pillText, { color: fg }]}>
        {disponivel ? 'Disponível' : 'Indisponível'}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },

  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#e5e7eb',
  },
  thumbPlaceholder: { alignItems: 'center', justifyContent: 'center' },

  rowBody: { flex: 1, minWidth: 0 },
  rowTitle: { fontWeight: '700' },
  rowSub: { opacity: 0.7, marginTop: 2, fontSize: 12 },
  rowMeta: { marginTop: 6 },

  rowActions: { flexDirection: 'row', alignItems: 'center', marginLeft: 8 },
  iconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e7eb',
  },
  hairline: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#e5e7eb',
    marginLeft: 60,
  },

  pill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  pillText: { fontSize: 11, fontWeight: '600' },

  primaryBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#2563eb',
  },
  secondaryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#6b7280',
  },
  dangerBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#dc2626',
  },
  btnText: { color: '#fff', fontWeight: '600' },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    borderRadius: 16,
    padding: 16,
    gap: 10,
    backgroundColor: 'white',
  },
  label: { marginTop: 4, marginBottom: 4 },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 8 },

  fab: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
});
