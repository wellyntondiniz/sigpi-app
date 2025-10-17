import { Link } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
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

  // Estado do formulário
  const emptyForm: Imovel = useMemo(
    () => ({ id: undefined, titulo: '', descricao: '', disponivel: true }),
    []
  );
  const [form, setForm] = useState<Imovel>(emptyForm);
  const [openForm, setOpenForm] = useState(false);

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
    setOpenForm(true);
  }

  function onEdit(item: Imovel) {
    setForm({
      id: item.id,
      titulo: item.titulo ?? '',
      descricao: item.descricao ?? '',
      disponivel: !!item.disponivel,
    });
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

  async function onSubmit() {
    if (!form.titulo || form.titulo.trim().length === 0) {
      Alert.alert('Validação', 'Informe um título.');
      return;
    }
    try {
      setSaving(true);
      await salvarImovel(form); // POST cria/atualiza
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
        <ThemedText type="title">Imóveis</ThemedText>
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
              <ThemedText type="defaultSemiBold">{item.titulo}</ThemedText>
              {!!item.descricao && (
                <ThemedText numberOfLines={2} style={{ opacity: 0.8 }}>
                  {item.descricao}
                </ThemedText>
              )}
              <ThemedText style={{ marginTop: 4 }}>
                {item.disponivel ? 'Disponível' : 'Indisponível'}
              </ThemedText>
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
            <ThemedText>Nenhum imóvel cadastrado.</ThemedText>
          </View>
        }
      />

      <Link href="/" dismissTo style={styles.link}>
        <ThemedText type="link">Voltar para Home</ThemedText>
      </Link>

      {/* Modal de Formulário */}
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

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  card: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  actions: { gap: 8 },
  sep: { height: 10 },
  link: { marginTop: 15, paddingVertical: 15, alignSelf: 'center' },

  // Botões
  primaryBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#2563eb', // azul padrão; pode trocar para seu tema
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

  // Form
  modalBackdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center', justifyContent: 'center', padding: 16,
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
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
});
