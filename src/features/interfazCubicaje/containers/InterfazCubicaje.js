// src/features/interfazCubicaje/containers/InterfazCubicaje.js
import React, { useMemo, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet,
  Alert, SafeAreaView, StatusBar, Image, ScrollView
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";

const COLORS = {
  bg: "#0f172a",
  card: "#111827",
  surface: "#0b1220",
  primary: "#3b82f6",
  primarySoft: "#60a5fa",
  text: "#e5e7eb",
  textDim: "#94a3b8",
  border: "#1f2937",
};

const num = (v) => {
  const n = parseFloat(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};
const vol = (ancho, alto, largo) => num(ancho) * num(alto) * num(largo);

export default function InterfazCubicaje() {
  const [bodega, setBodega] = useState({ nombre: "", ancho: "", alto: "", largo: "" });
  const [items, setItems] = useState([]);
  const [nuevoItem, setNuevoItem] = useState({ nombre: "", ancho: "", alto: "", largo: "", unidades: "1", categoria: "normal" });

  const capacidad = useMemo(() => vol(bodega.ancho, bodega.alto, bodega.largo), [bodega]);
  const volumenItems = useMemo(() => items.reduce((acc, it) => acc + vol(it.ancho, it.alto, it.largo) * num(it.unidades), 0), [items]);
  const libre = Math.max(0, capacidad - volumenItems);
  const ocupadoPct = capacidad > 0 ? (volumenItems / capacidad) * 100 : 0;

  const categorias = [
    { key: "fragil", label: "Frágil", emoji: "🧪" },
    { key: "pesado", label: "Pesado", emoji: "🏋️" },
    { key: "liquido", label: "Líquido", emoji: "💧" },
    { key: "comestible", label: "Comestible", emoji: "🍞" },
    { key: "normal", label: "Normal", emoji: "📦" },
  ];

  const agregarItem = () => {
    if (!nuevoItem.nombre) return Alert.alert("Falta nombre del ítem");
    setItems((prev) => [...prev, { ...nuevoItem }]);
    setNuevoItem({ nombre: "", ancho: "", alto: "", largo: "", unidades: "1", categoria: "normal" });
  };
  const eliminarItem = (i) => setItems((prev) => prev.filter((_, idx) => idx !== i));

  const renderItem = ({ item, index }) => (
    <View style={styles.itemCard}>
      <View style={{ flex: 1 }}>
        <Text style={styles.itemTitle}>{item.nombre}</Text>
        <Text style={styles.itemMeta}>
          {item.categoria} · {item.ancho}×{item.alto}×{item.largo} · {item.unidades} u.
        </Text>
      </View>
      <TouchableOpacity onPress={() => eliminarItem(index)} style={styles.deleteBtn}>
        <Icon name="delete" size={20} color="#e5e7eb" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          {/* Usa una imagen que esté en src/assets/images/ */}
          <Image source={require("../../../assets/images/planning.png")} style={styles.logo} />
          <Text style={styles.title}>Cubicaje</Text>
          <Text style={styles.subtitle}>Planeamiento rápido de volumen</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Bodega</Text>
          <View style={styles.row}>
            <TextInput style={styles.input} placeholder="Nombre" placeholderTextColor={COLORS.textDim}
              value={bodega.nombre} onChangeText={(t) => setBodega({ ...bodega, nombre: t })} />
          </View>
          <View style={styles.row}>
            <TextInput style={styles.input} placeholder="Ancho (m)" keyboardType="decimal-pad" placeholderTextColor={COLORS.textDim}
              value={bodega.ancho} onChangeText={(t) => setBodega({ ...bodega, ancho: t })} />
            <TextInput style={styles.input} placeholder="Alto (m)" keyboardType="decimal-pad" placeholderTextColor={COLORS.textDim}
              value={bodega.alto} onChangeText={(t) => setBodega({ ...bodega, alto: t })} />
            <TextInput style={styles.input} placeholder="Largo (m)" keyboardType="decimal-pad" placeholderTextColor={COLORS.textDim}
              value={bodega.largo} onChangeText={(t) => setBodega({ ...bodega, largo: t })} />
          </View>
          <View style={styles.kpis}>
            <Text style={styles.kpi}>Capacidad: {capacidad.toFixed(2)} m³</Text>
            <Text style={styles.kpi}>Ocupado: {volumenItems.toFixed(2)} m³ ({ocupadoPct.toFixed(1)}%)</Text>
            <Text style={styles.kpi}>Libre: {libre.toFixed(2)} m³</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Agregar ítem</Text>
          <View style={styles.row}>
            <TextInput style={styles.input} placeholder="Nombre" placeholderTextColor={COLORS.textDim}
              value={nuevoItem.nombre} onChangeText={(t) => setNuevoItem({ ...nuevoItem, nombre: t })} />
          </View>
          <View style={styles.row}>
            <TextInput style={styles.input} placeholder="Ancho (m)" keyboardType="decimal-pad" placeholderTextColor={COLORS.textDim}
              value={nuevoItem.ancho} onChangeText={(t) => setNuevoItem({ ...nuevoItem, ancho: t })} />
            <TextInput style={styles.input} placeholder="Alto (m)" keyboardType="decimal-pad" placeholderTextColor={COLORS.textDim}
              value={nuevoItem.alto} onChangeText={(t) => setNuevoItem({ ...nuevoItem, alto: t })} />
            <TextInput style={styles.input} placeholder="Largo (m)" keyboardType="decimal-pad" placeholderTextColor={COLORS.textDim}
              value={nuevoItem.largo} onChangeText={(t) => setNuevoItem({ ...nuevoItem, largo: t })} />
          </View>
          <View style={[styles.row, { flexWrap: "wrap" }]}>
            {categorias.map((c) => (
              <TouchableOpacity key={c.key} onPress={() => setNuevoItem({ ...nuevoItem, categoria: c.key })}
                style={[styles.chip, nuevoItem.categoria === c.key && styles.chipActive]}>
                <Text style={styles.chipText}>{c.emoji} {c.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.btnPrimary} onPress={agregarItem}>
            <Text style={styles.btnText}>Agregar ítem</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Ítems</Text>
          <FlatList data={items} keyExtractor={(_, i) => String(i)} renderItem={renderItem} scrollEnabled={false} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: 16, gap: 16 },
  header: { alignItems: "center", gap: 8, paddingTop: 8, paddingBottom: 4 },
  logo: { width: 64, height: 64, borderRadius: 12, opacity: 0.9 },
  title: { fontSize: 24, fontWeight: "800", color: COLORS.text, marginTop: 6 },
  subtitle: { fontSize: 14, color: COLORS.textDim },

  card: { backgroundColor: COLORS.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: COLORS.border },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 10, color: COLORS.text },

  row: { flexDirection: "row", gap: 10, marginBottom: 10 },
  input: { flex: 1, backgroundColor: COLORS.surface, color: COLORS.text, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border },

  kpis: { flexDirection: "column", gap: 6, marginTop: 4 },
  kpi: { color: COLORS.textDim },

  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 100, backgroundColor: "#0b1325", borderWidth: 1, borderColor: COLORS.border, marginBottom: 8 },
  chipActive: { backgroundColor: "#12224a", borderColor: COLORS.primarySoft },
  chipText: { color: COLORS.text },

  btnPrimary: { backgroundColor: COLORS.primary, paddingVertical: 12, borderRadius: 12, alignItems: "center", marginTop: 6 },
  btnText: { color: "white", fontWeight: "700" },

  itemCard: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: COLORS.surface, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: COLORS.border, marginBottom: 8 },
  itemTitle: { color: COLORS.text, fontWeight: "700" },
  itemMeta: { color: COLORS.textDim },
  deleteBtn: { padding: 8, backgroundColor: "#141c2c", borderRadius: 8, borderWidth: 1, borderColor: COLORS.border },
});
