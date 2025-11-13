// src/screens/Bodega/BodegaFormScreen.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useApp, vol } from "../../store"; // <- ruta relativa al store

// Vista demo (solo visual – placeholder para 3D)
function Tablero({ alto, ancho, largo }) {
  return (
    <View style={st.tableroBox}>
      <Text style={st.tableroTitle}>Vista 3D (demo)</Text>
      <Text style={st.tableroText}>
        Alto: {alto || 0} m · Ancho: {ancho || 0} m · Largo: {largo || 0} m
      </Text>
      <Text style={st.tableroHint}>
        Aquí podrías renderizar un modelo 3D real en el futuro.
      </Text>
    </View>
  );
}

export default function BodegaFormScreen(props) {
  const { goToMenu, goToBodegasList, bodega, navigation } = props;
  const { saveBodega } = useApp();

  const [form, setForm] = useState({
    id: null,
    nombre: "",
    direccion: "",
    ciudad: "Iquique",
    ancho: "",
    alto: "",
    largo: "",
    active: true,
  });

  useEffect(() => {
    if (bodega) {
      setForm({
        id: bodega.id ?? null,
        nombre: bodega.nombre || "",
        direccion: bodega.direccion || "",
        ciudad: bodega.ciudad || "Iquique",
        ancho: String(bodega.ancho ?? ""),
        alto: String(bodega.alto ?? ""),
        largo: String(bodega.largo ?? ""),
        active: bodega.active ?? true,
      });
    } else {
      setForm((f) => ({
        ...f,
        id: null,
        nombre: "",
        direccion: "",
        ciudad: "Iquique",
        ancho: "",
        alto: "",
        largo: "",
        active: true,
      }));
    }
  }, [bodega]);

  const set = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const parseNum = (v) => {
    const n = parseFloat(String(v || "").replace(",", "."));
    return Number.isFinite(n) ? n : NaN;
  };

  const navegarALista = () => {
    if (typeof goToBodegasList === "function") return goToBodegasList();
    if (navigation?.goBack) return navigation.goBack();
  };

  const guardar = async () => {
    if (!form.nombre.trim() || !form.direccion.trim()) {
      return Alert.alert("Campos incompletos", "Completa nombre y dirección.");
    }

    const anchoN = parseNum(form.ancho);
    const altoN = parseNum(form.alto);
    const largoN = parseNum(form.largo);

    if (![anchoN, altoN, largoN].every((n) => Number.isFinite(n) && n > 0)) {
      return Alert.alert(
        "Dimensiones inválidas",
        "Ingresa ancho, alto y largo (números > 0)."
      );
    }

    try {
      await saveBodega({
        id: form.id,
        nombre: form.nombre.trim(),
        direccion: form.direccion.trim(),
        ciudad: form.ciudad.trim(),
        ancho: anchoN,
        alto: altoN,
        largo: largoN,
        active: !!form.active,
      });

      Alert.alert(
        "Bodega guardada",
        "La bodega se guardó correctamente.",
        [{ text: "OK", onPress: navegarALista }]
      );
    } catch {
      // saveBodega ya muestra Alert en caso de error
    }
  };

  const capacidad = vol(form.ancho, form.alto, form.largo);

  return (
    <View style={st.screen}>
      {/* Header */}
      <View style={st.headerRow}>
        <View>
          <Text style={st.title}>
            {form.id ? "Editar bodega" : "Nueva bodega"}
          </Text>
          <Text style={st.subtitle}>Define ubicación, dimensiones y estado.</Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Nombre */}
        <Text style={st.label}>Nombre</Text>
        <TextInput
          style={st.input}
          value={form.nombre}
          onChangeText={(v) => set("nombre", v)}
          placeholder="Nombre de bodega"
        />

        {/* Ciudad */}
        <Text style={st.label}>Ciudad</Text>
        <View style={st.row}>
          {["Iquique", "Alto Hospicio"].map((c) => (
            <TouchableOpacity
              key={c}
              style={[st.pill, form.ciudad === c && st.pillActive]}
              onPress={() => set("ciudad", c)}
            >
              <Text
                style={[st.pillText, form.ciudad === c && st.pillTextActive]}
              >
                {c}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Dirección */}
        <Text style={st.label}>Dirección</Text>
        <TextInput
          style={st.input}
          value={form.direccion}
          onChangeText={(v) => set("direccion", v)}
          placeholder="Dirección"
        />

        {/* Dimensiones */}
        <Text style={st.label}>Dimensiones (m)</Text>
        <View style={st.row}>
          <View style={st.col}>
            <Text style={st.subLabel}>Ancho</Text>
            <TextInput
              style={st.input}
              placeholder="0.0"
              keyboardType="numeric"
              value={String(form.ancho)}
              onChangeText={(v) => set("ancho", v)}
            />
          </View>
          <View style={st.col}>
            <Text style={st.subLabel}>Altura</Text>
            <TextInput
              style={st.input}
              placeholder="0.0"
              keyboardType="numeric"
              value={String(form.alto)}
              onChangeText={(v) => set("alto", v)}
            />
          </View>
          <View style={st.col}>
            <Text style={st.subLabel}>Largo</Text>
            <TextInput
              style={st.input}
              placeholder="0.0"
              keyboardType="numeric"
              value={String(form.largo)}
              onChangeText={(v) => set("largo", v)}
            />
          </View>
        </View>

        {/* Capacidad calculada */}
        <View style={st.calcBox}>
          <Text style={st.calcTxt}>
            Capacidad: {Number.isFinite(capacidad) ? capacidad.toFixed(3) : "0.000"} m³
          </Text>
        </View>

        {/* Estado */}
        <Text style={st.label}>Estado</Text>
        <View style={st.row}>
          <TouchableOpacity
            style={[st.pill, form.active && st.stateActive]}
            onPress={() => set("active", true)}
          >
            <Text style={[st.pillText, form.active && st.stateTextOn]}>
              Activa
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[st.pill, !form.active && st.stateInactive]}
            onPress={() => set("active", false)}
          >
            <Text style={[st.pillText, !form.active && st.stateTextOn]}>
              Inactiva
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tablero demo */}
        <Tablero
          alto={parseNum(form.alto)}
          ancho={parseNum(form.ancho)}
          largo={parseNum(form.largo)}
        />
      </ScrollView>

      {/* Bottom bar */}
      <View style={st.bottomBar}>
        <TouchableOpacity style={st.bottomBtn} onPress={goToMenu}>
          <Text style={st.bottomBtnText}>Menú principal</Text>
        </TouchableOpacity>

        <TouchableOpacity style={st.bottomBtn} onPress={navegarALista}>
          <Text style={st.bottomBtnText}>Bodegas</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[st.bottomBtn, st.bottomBtnActive]} onPress={guardar}>
          <Text style={[st.bottomBtnText, st.bottomBtnTextActive]}>
            {form.id ? "Guardar cambios" : "Crear bodega"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 140,
  },
  headerRow: { marginBottom: 8 },
  title: { fontSize: 20, fontWeight: "700", color: "#111827" },
  subtitle: { fontSize: 12, color: "#6b7280" },
  label: {
    color: "#475569",
    marginTop: 10,
    marginBottom: 4,
    fontSize: 12,
    fontWeight: "600",
  },
  subLabel: { color: "#6b7280", fontSize: 11, marginBottom: 2 },
  input: {
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#fff",
    fontSize: 12,
  },
  row: { flexDirection: "row", gap: 8, marginTop: 4, flexWrap: "wrap" },
  col: { flex: 1 },
  pill: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 999,
    backgroundColor: "#fff",
  },
  pillActive: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
  pillText: { fontSize: 11, fontWeight: "600", color: "#111827" },
  pillTextActive: { color: "#ffffff" },
  stateActive: { backgroundColor: "#22c55e", borderColor: "#22c55e" },
  stateInactive: { backgroundColor: "#ef4444", borderColor: "#ef4444" },
  stateTextOn: { color: "#ffffff" },
  calcBox: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginVertical: 10,
  },
  calcTxt: { fontWeight: "700", color: "#0f172a" },
  tableroBox: {
    marginTop: 14,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
  },
  tableroTitle: { fontSize: 12, fontWeight: "700", color: "#111827" },
  tableroText: { fontSize: 11, color: "#4b5563", marginTop: 2 },
  tableroHint: { fontSize: 9, color: "#9ca3af", marginTop: 2 },
  bottomBar: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 40,
    padding: 6,
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    gap: 6,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  bottomBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomBtnActive: { backgroundColor: "#2563eb" },
  bottomBtnText: { fontSize: 10.5, color: "#6b7280", fontWeight: "500" },
  bottomBtnTextActive: { color: "#ffffff", fontWeight: "600" },
});
