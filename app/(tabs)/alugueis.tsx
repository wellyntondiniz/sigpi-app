// app/alugueis.tsx
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    Pressable,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    View,
} from 'react-native';
//import { Aluguel, listarAlugueis, salvarAluguel, deletarAluguel,} from '@/service/aluguel';

function formatCurrency(v?: number) {
  if (v == null) return '';
  try {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  } catch {
    return `R$ ${Number(v).toFixed(2)}`;
  }
}

export default function AlugueisScreen() {
  const [data, setData] = useState<Aluguel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const emptyForm: Aluguel = useMemo(
    () => ({
      id: undefined,
      imovelId: undefined,
      imovelTitulo: '',
      locatario: '',
      valorMensal: undefined,
      inicio: '',
      fim: '',
      ativo: true,
    }),
    []
  );
  const [form, setForm] = useState<Aluguel>(emptyForm);
  const [openForm, setOpenForm] = useState(false);

  async function load() {
    try {
      setLoading(true);
      const res = await listarAlugueis();
      setData(res);
    } catch (e: any) {
      Alert.alert('Erro', e?.message ?? 'Falha ao carregar aluguéis');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function onAdd() {
    setForm(emptyForm);
    setOpenForm(true);
  }

  function onEdit(item: Aluguel) {
    setForm({
      id: item.id,
      imovelId: item.imovelId,
      imovelTitulo: item.imovelTitulo ?? '',
      locatario: item.locatario ?? '',
      valorMensal: item.valorMensal,
      inicio: item.inicio ? item.inicio.substring(0, 10) : '',
      fim: item.fim ? item.fim.substring(0, 10) : '',
      ativo: !!item.ativo,
    });
    setOpenForm(true);
  }

  async function onDelete(id?: number) {
    if (!id) return;
    Alert.alert('Excluir contrato', 'Tem certeza que deseja excluir?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await deletarAluguel(id);
            await load();
          } catch (e: any) {
            Alert.alert('Erro', e?.message ?? 'Falha ao excluir');
          }
        },
      },
    ]);
  }

  async function onSubmit() {
    if (!form.imovelId) {
      Alert.alert('Validação', 'Informe o ID do imóvel.');
      return;
    }
    if (!form.locatario?.trim()) {
      Alert.alert('Validação', 'Informe o locatário.');
      return;
    }
    if (!form.valorMensal || Number.isNaN(Number(form.valorMensal))) {
      Alert.alert('Validação', 'Informe um valor mensal válido.');
      return;
    }
    try {
      setSaving(true);
      await salvarAluguel({
        ...form,
        // garanta ISO se o backend espera ISO (YYYY-MM-DD)
        inicio: form.inicio ? new Date(form.inicio).toISOString() : '',
        fim: form.fim ? new Date(form.fim).toISOString() : '',
      });
      setOpenForm(false);
      setForm(emptyForm);
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
        <ThemedText type="title">Aluguéis</ThemedText>
        <Pressable onPress={onAdd} style={styles.primaryBtn}>
          <ThemedText style={styles.btnText}>+ Novo</ThemedText>
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
                {item.imovelTitulo ? `${item.imovelTitulo}` : `Imóvel #${item.imovelId}`}
              </ThemedText>
              <Text style={{ opacity: 0.8 }}>Locatário: {item.locatario}</Text>
              <Text style={{ marginTop: 4 }}>
                {formatCurrency(item.valorMensal)} / mês
              </Text>
              {(item.inicio || item.fim) && (
                <Text style={{ opacity: 0.7, marginTop: 2 }}>
                  {item.inicio?.substring(0, 10)} — {item.fim?.substring(0, 10) || 'indeterminado'}
                </Text>
              )}
              <Text style={{ marginTop: 4 }}>
                {item.ativo ? 'Ativo' : 'Inativo'}
              </Text>
            </View>

            <View style={styles.actions}>
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
            <ThemedText>Nenhum aluguel cadastrado.</ThemedText>
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
              {form.id ? 'Editar Aluguel' : 'Novo Aluguel'}
            </ThemedText>

            <ThemedText style={styles.label}>ID do Imóvel</ThemedText>
            <TextInput
              placeholder="Ex.: 12"
              keyboardType="numeric"
              value={form.imovelId ? String(form.imovelId) : ''}
              onChangeText={(t) => setForm((s) => ({ ...s, imovelId: Number(t) || undefined }))}
              style={styles.input}
            />

            <ThemedText style={styles.label}>Locatário</ThemedText>
            <TextInput
              placeholder="Nome do locatário"
              value={form.locatario}
              onChangeText={(t) => setForm((s) => ({ ...s, locatario: t }))}
              style={styles.input}
            />

            <ThemedText style={styles.label}>Valor mensal</ThemedText>
            <TextInput
              placeholder="Ex.: 1500"
              keyboardType="decimal-pad"
              value={form.valorMensal != null ? String(form.valorMensal) : ''}
              onChangeText={(t) => setForm((s) => ({ ...s, valorMensal: Number(t.replace(',', '.')) || undefined }))}
              style={styles.input}
            />

            <ThemedText style={styles.label}>Início (AAAA-MM-DD)</ThemedText>
            <TextInput
              placeholder="2025-01-01"
              value={form.inicio}
              onChangeText={(t) => setForm((s) => ({ ...s, inicio: t }))}
              style={styles.input}
            />

            <ThemedText style={styles.label}>Fim (opcional, AAAA-MM-DD)</ThemedText>
            <TextInput
              placeholder="2025-12-31"
              value={form.fim}
              onChangeText={(t) => setForm((s) => ({ ...s, fim: t }))}
              style={styles.input}
            />

            <View style={styles.switchRow}>
              <ThemedText>Ativo</ThemedText>
              <Switch
                value={!!form.ativo}
                onValueChange={(v) => setForm((s) => ({ ...s, ativo: v }))}
              />
            </View>

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
  btnText: { color: '#fff', fontWeight: '600' },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center', padding: 16 },
  modalCard: { width: '100%', borderRadius: 16, padding: 16, gap: 10, backgroundColor: 'white' },
  label: { marginTop: 4, marginBottom: 4 },
  input: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
});
