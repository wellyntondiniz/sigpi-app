import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Parcela, listarParcelasVencendo } from '@/service/parcela';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

function formatCurrency(v?: number) {
  if (v == null) return '';
  try {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  } catch {
    return `R$ ${Number(v).toFixed(2)}`;
  }
}

function formatDate(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('pt-BR');
}

export default function FinanceiroScreen() {
  const [data, setData] = useState<Parcela[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [openForm, setOpenForm] = useState(false);

  const empty: Parcela = {
    id: undefined,
    imovelId: undefined,
    imovelTitulo: '',
    locatario: '',
    valor: undefined,
    vencimento: '',
    status: 'ABERTA',
  };
  const [form, setForm] = useState<Parcela>(empty);

  async function load() {
    try {
      setLoading(true);
      const res = await listarParcelasVencendo();
      setData(res);
    } catch (e: any) {
      Alert.alert('Erro', e?.message ?? 'Falha ao carregar parcelas');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function onAdd() {
    setForm(empty);
    setOpenForm(true);
  }

  function onEdit(item: Parcela) {
    setForm({
      id: item.id,
      imovelId: item.imovelId,
      imovelTitulo: item.imovelTitulo ?? '',
      locatario: item.locatario ?? '',
      valor: item.valor,
      vencimento: item.vencimento?.substring(0, 10) ?? '',
      status: item.status ?? 'ABERTA',
    });
    setOpenForm(true);
  }

  async function onDelete(id?: number) {
    if (!id) return;
    Alert.alert('Excluir parcela', 'Tem certeza que deseja excluir?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await deletarParcela(id);
            await load();
          } catch (e: any) {
            Alert.alert('Erro', e?.message ?? 'Falha ao excluir');
          }
        },
      },
    ]);
  }

  async function onReceive(item: Parcela) {
    try {
      await receberParcela(item.id!);
      await load();
    } catch (e: any) {
      Alert.alert('Erro', e?.message ?? 'Falha ao registrar recebimento');
    }
  }

  async function onSubmit() {
    if (!form.imovelId) {
      Alert.alert('Validação', 'Informe o ID do imóvel.');
      return;
    }
    if (!form.valor || Number.isNaN(Number(form.valor))) {
      Alert.alert('Validação', 'Informe um valor válido.');
      return;
    }
    if (!form.vencimento) {
      Alert.alert('Validação', 'Informe o vencimento (AAAA-MM-DD).');
      return;
    }
    try {
      setSaving(true);
      await salvarParcela({
        ...form,
        vencimento: new Date(form.vencimento).toISOString(),
      });
      setOpenForm(false);
      setForm(empty);
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
      <View style={styles.header}>
        <ThemedText type="title">Financeiro</ThemedText>
        <Pressable onPress={onAdd} style={styles.primaryBtn}>
          <ThemedText style={styles.btnText}>+ Nova parcela</ThemedText>
        </Pressable>
      </View>

      <FlatList
        data={data}
        keyExtractor={(item) => String(item.id)}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={{ flex: 1 }}>
              <ThemedText type="defaultSemiBold">
                {`Imóvel #${item.aluguel_id}`}
              </ThemedText>
              <Text style={{ opacity: 0.8 }}>Locatário: {item.locatario || '—'}</Text>
              <Text style={{ marginTop: 4 }}>{formatCurrency(item.valor)}</Text>
              <Text style={{ opacity: 0.7, marginTop: 2 }}>
                Vence em {formatDate(item.dataVencimento)}
              </Text>
              <Text style={{ marginTop: 4 }}>
                {item.status === 'PAGA' ? 'Recebida' : 'Aberta'}
              </Text>
            </View>

            <View style={styles.actions}>
              {item.status !== 'PAGA' && (
                <Pressable onPress={() => onReceive(item)} style={styles.successBtn}>
                  <ThemedText style={styles.btnText}>Receber</ThemedText>
                </Pressable>
              )}
              <Pressable onPress={() => onEdit(item)} style={styles.secondaryBtn}>
                <ThemedText style={styles.btnText}>Editar</ThemedText>
              </Pressable>
              <Pressable onPress={() => onDelete(item.id)} style={styles.dangerBtn}>
                <ThemedText style={styles.btnText}>Excluir</ThemedText>
              </Pressable>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.center}>
            <ThemedText>Nenhuma parcela a receber.</ThemedText>
          </View>
        }
      />

      {/* Modal Form */}
      <Modal
        visible={openForm}
        animationType="slide"
        onRequestClose={() => setOpenForm(false)}
        transparent
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <ThemedText type="subtitle">
              {form.id ? 'Editar Parcela' : 'Nova Parcela'}
            </ThemedText>

            <ThemedText style={styles.label}>ID do Imóvel</ThemedText>
            <TextInput
              placeholder="Ex.: 12"
              keyboardType="numeric"
              value={form.imovelId ? String(form.imovelId) : ''}
              onChangeText={(t) => setForm((s) => ({ ...s, imovelId: Number(t) || undefined }))}
              style={styles.input}
            />

            <ThemedText style={styles.label}>Locatário (opcional)</ThemedText>
            <TextInput
              placeholder="Nome"
              value={form.locatario ?? ''}
              onChangeText={(t) => setForm((s) => ({ ...s, locatario: t }))}
              style={styles.input}
            />

            <ThemedText style={styles.label}>Valor</ThemedText>
            <TextInput
              placeholder="Ex.: 1200"
              keyboardType="decimal-pad"
              value={form.valor != null ? String(form.valor) : ''}
              onChangeText={(t) => setForm((s) => ({ ...s, valor: Number(t.replace(',', '.')) || undefined }))}
              style={styles.input}
            />

            <ThemedText style={styles.label}>Vencimento (AAAA-MM-DD)</ThemedText>
            <TextInput
              placeholder="2025-01-10"
              value={form.vencimento ?? ''}
              onChangeText={(t) => setForm((s) => ({ ...s, vencimento: t }))}
              style={styles.input}
            />

            <View style={styles.modalActions}>
              <Pressable onPress={() => setOpenForm(false)} style={[styles.secondaryBtn, { flex: 1 }]} disabled={saving}>
                <ThemedText style={styles.btnText}>Cancelar</ThemedText>
              </Pressable>
              <Pressable onPress={onSubmit} style={[styles.primaryBtn, { flex: 1 }]} disabled={saving}>
                {saving ? <ActivityIndicator /> : <ThemedText style={styles.btnText}>{form.id ? 'Salvar' : 'Cadastrar'}</ThemedText>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sep: { height: 10 },

  card: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  actions: { gap: 8 },

  primaryBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, backgroundColor: '#2563eb' },
  secondaryBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: '#6b7280' },
  dangerBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: '#dc2626' },
  successBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: '#16a34a' },
  btnText: { color: '#fff', fontWeight: '600' },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center', padding: 16 },
  modalCard: { width: '100%', borderRadius: 16, padding: 16, gap: 10, backgroundColor: 'white' },
  label: { marginTop: 4, marginBottom: 4 },
  input: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
});
