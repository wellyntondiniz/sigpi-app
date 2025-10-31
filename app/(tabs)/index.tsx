import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
//import { getImoveis, getProximasParcelas, Imovel, Parcela } from '@/services/api';

import {
  Imovel,
  listarImoveis,
} from '@/service/imovel';

import {
  listarParcelasVencendo,
  Parcela,
} from '@/service/parcela';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const [imoveis, setImoveis] = useState<Imovel[]>([]);
  const [parcelas, setParcelas] = useState<Parcela[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setError(null);
    try {
      const [imv, parc] = await Promise.all([
        listarImoveis(),
        listarParcelasVencendo(), 
      ]);
      setImoveis(imv);
      setParcelas(parc);
    } catch (e: any) {
      setError(e?.message ?? 'Erro ao carregar dados');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    carregar();
  }, [carregar]);

  const { total, alugados, disponiveis } = useMemo(() => {
    const t = imoveis.length;
    const a = imoveis.filter(i => i.status === 'ALUGADO').length;
    const d = t - a;
    return { total: t, alugados: a, disponiveis: d };
  }, [imoveis]);

  if (loading) {
    return (
      <ThemedView style={styles.center}>
        <ActivityIndicator />
        <ThemedText style={{ marginTop: 8 }}>Carregando...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>Início</ThemedText>

      {error && (
        <View style={[styles.card, styles.errorCard]}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Resumo de imóveis */}
      <View style={styles.grid}>
        <StatCard label="Imóveis" value={total} />
        <StatCard label="Alugados" value={alugados} />
        <StatCard label="Disponíveis" value={disponiveis} />
      </View>

      {/* Próximas parcelas */}
      <View style={styles.card}>
        <ThemedText type="subtitle" style={{ marginBottom: 8 }}>
          Próximas parcelas a receber
        </ThemedText>

        {parcelas.length === 0 ? (
          <ThemedText>Nenhuma parcela a receber.</ThemedText>
        ) : (
          <FlatList
            data={parcelas}
            keyExtractor={(item) => String(item.id)}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            renderItem={({ item }) => <ParcelaItem item={item} />}
          />
        )}
      </View>
    </ThemedView>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ParcelaItem({ item }: { item: Parcela }) {
  return (
    <View style={styles.parcelaRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.parcelaTitulo}>
          {item.numeroParcela ?? `Imovel: #${item.numeroParcela}`}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={styles.parcelaValor}>
          {formatCurrency(item.valor)}
        </Text>
        <Text style={styles.parcelaData}>
          {formatDate(item.dataVencimento)}
        </Text>
      </View>
    </View>
  );
}

function formatDate(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('pt-BR');
}

function formatCurrency(v: number) {
  try {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  } catch {
    return `R$ ${v?.toFixed?.(2) ?? v}`;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { marginBottom: 8 },
  grid: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  statCard: {
    flexBasis: '32%',
    flexGrow: 1,
    backgroundColor: '#ffffff10',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 90,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#00000015',
  },
  statValue: { fontSize: 22, fontWeight: '700' },
  statLabel: { fontSize: 12, opacity: 0.8, marginTop: 4 },
  card: {
    backgroundColor: '#ffffff10',
    borderRadius: 16,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#00000015',
  },
  errorCard: { backgroundColor: '#ffdddd' },
  errorText: { color: '#7a0000' },
  parcelaRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  parcelaTitulo: { fontWeight: '600' },
  parcelaSub: { opacity: 0.7, fontSize: 12, marginTop: 2 },
  parcelaValor: { fontWeight: '700' },
  parcelaData: { opacity: 0.7, fontSize: 12, marginTop: 2 },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: '#00000020', marginVertical: 6 },
});
