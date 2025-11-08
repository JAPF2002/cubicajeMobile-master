// src/screens/BodegasScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  FlatList,
  ScrollView,
  Vibration,
  StyleSheet,
} from "react-native";
import { useApp, vol, clampInt } from "../store";

export default function BodegasScreen({ navigation }) {
  const {
    currentUser,
    bodegas,
    itemsByBodega,
    metricsOf,
    saveBodega,
    deleteBodegaOrphanItems,
    setBodegaActive,
    createDeactivateRequest,
  } = useApp();

  const [tab, setTab] = useState("view");
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

  /* ---------- Guardar / actualizar bodega ---------- */

  const guardar = async () => {
    if (!form.nombre.trim() || !form.direccion.trim()) {
      return Alert.alert(
        "Campos incompletos",
        "Completa nombre y dirección."
      );
    }

    await saveBodega({
      ...form,
      nombre: form.nombre.trim(),
      direccion: form.direccion.trim(),
      active: form.active ?? true,
    });

    setForm({
      id: null,
      nombre: "",
      direccion: "",
      ciudad: "Iquique",
      ancho: "",
      alto: "",
      largo: "",
      active: true,
    });
    setTab("view");
  };

  /* ---------- Eliminar bodega ---------- */

  const confirmarEliminarBodega = (b) => {
    Alert.alert(
      "Eliminar bodega",
      "¿Seguro que deseas eliminar esta bodega?\nSi tiene ítems asociados, en el siguiente paso podrás decidir si los dejas 'sin asignar'.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await deleteBodegaOrphanItems(b.id, false);

              if (res?.status === 409 || res?.body?.hasItems) {
                const data = res.body || {};
                const msg =
                  data.message ||
                  `La bodega tiene ${
                    data.count ?? "varios"
                  } ítem(s) asociados.\nSi confirmas, se marcarán como "sin asignar".`;

                Alert.alert(
                  "Confirmar eliminación",
                  msg,
                  [
                    { text: "Cancelar", style: "cancel" },
                    {
                      text: "Eliminar igual",
                      style: "destructive",
                      onPress: async () => {
                        Vibration.vibrate(40);
                        await deleteBodegaOrphanItems(b.id, true);
                      },
                    },
                  ],
                  { cancelable: true }
                );
              }
            } catch (err) {
              console.log(
                "[confirmarEliminarBodega] ERROR:",
                err?.message
              );
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  /* ---------- Solicitar desactivación (usuarios no admin) ---------- */

  const solicitarDesactivacion = (b) => {
    Alert.alert(
      "Solicitar desactivación",
      "Al aprobarse, la bodega se desactivará y sus ítems quedarán sin asignar.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Enviar",
          onPress: () =>
            createDeactivateRequest({
              bodegaId: b.id,
              userId: currentUser?.id,
            }),
        },
      ]
    );
  };

  /* ---------- Toggle activo/inactivo (admin) ---------- */

  const adminToggle = (b) => {
    if (b.active) {
      Alert.alert(
        "Desactivar bodega",
        "Los ítems quedarán sin asignar. ¿Confirmas?",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Desactivar",
            style: "destructive",
            onPress: () => setBodegaActive(b.id, false),
          },
        ]
      );
    } else {
      setBodegaActive(b.id, true);
    }
  };

  /* ---------- Ir a vista 3D ---------- */

  const verBodega3D = (b) => {
    if (!b.ancho || !b.alto || !b.largo) {
      return Alert.alert(
        "Bodega 3D",
        "Esta bodega no tiene dimensiones definidas."
      );
    }

    navigation.navigate("Bodega3D", {
      bodegaId: b.id,
      nombre: b.nombre,
      ancho: b.ancho,
      alto: b.alto,
      largo: b.largo,
    });
  };

  /* ---------- Render tarjeta de bodega ---------- */

  const renderCard = ({ item: b }) => {
    const m = metricsOf(b);
    const its = itemsByBodega.get(b.id) || [];

    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          {b.nombre}{" "}
          <Text style={styles.badge}>{b.ciudad}</Text> ·{" "}
          {b.active ? "🟢 Activa" : "🔴 Inactiva"}
        </Text>

        <Text style={styles.cardLine}>📍 {b.direccion}</Text>
        <Text style={styles.cardLine}>
          📦 {b.ancho}×{b.alto}×{b.largo} m
        </Text>
        <Text style={styles.cardLine}>
          📊 Cap: {m.capacidad.toFixed(2)} m³ | Ocup:{" "}
          {m.ocupado.toFixed(2)} m³ | Libre: {m.libre.toFixed(2)} m³
        </Text>

        <Text
          style={[
            styles.cardLine,
            { marginTop: 8, fontWeight: "700" },
          ]}
        >
          🗂 Ítems
        </Text>

        {its.length === 0 ? (
          <Text style={styles.cardLine}>— Sin ítems —</Text>
        ) : (
          its.map((it) => {
            const vUnit = vol(it.ancho, it.alto, it.largo);
            const cant = clampInt(it.cantidad, 1);
            return (
              <Text key={it.id} style={styles.cardLine}>
                • {it.nombre} — {cant} u —{" "}
                {(vUnit * cant).toFixed(3)} m³
              </Text>
            );
          })
        )}

        {/* Botones de acción */}
        <View style={styles.actionsRow}>
          {/* Ver 3D */}
          <TouchableOpacity
            style={[styles.btn, styles.info]}
            onPress={() => verBodega3D(b)}
          >
            <Text style={[styles.btnT, { color: "#fff" }]}>
              👁️ Ver 3D
            </Text>
          </TouchableOpacity>

          {/* Editar */}
          <TouchableOpacity
            style={[styles.btn, styles.warn]}
            onPress={() => {
              setForm({
                id: b.id,
                nombre: b.nombre,
                direccion: b.direccion,
                ciudad: b.ciudad || "Iquique",
                ancho: String(b.ancho),
                alto: String(b.alto),
                largo: String(b.largo),
                active: b.active,
              });
              setTab("form");
            }}
          >
            <Text style={styles.btnT}>✏️ Editar</Text>
          </TouchableOpacity>

          {/* Acciones según rol */}
          {currentUser?.role === "admin" ? (
            <TouchableOpacity
              style={[
                styles.btn,
                b.active ? styles.danger : styles.primary,
              ]}
              onPress={() => adminToggle(b)}
            >
              <Text style={[styles.btnT, { color: "#fff" }]}>
                {b.active ? "⛔ Desactivar" : "✅ Activar"}
              </Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.btn, styles.primary]}
                onPress={() => solicitarDesactivacion(b)}
              >
                <Text style={[styles.btnT, { color: "#fff" }]}>
                  📨 Solicitar desactivación
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.btn, styles.danger]}
                onPress={() => confirmarEliminarBodega(b)}
              >
                <Text style={[styles.btnT, { color: "#fff" }]}>
                  🗑️ Eliminar
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  };

  /* ---------- UI principal ---------- */

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={styles.title}>Bodegas</Text>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[
            styles.tabBtn,
            tab === "form" && styles.activeTab,
          ]}
          onPress={() => setTab("form")}
        >
          <Text>Formulario</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabBtn,
            tab === "view" && styles.activeTab,
          ]}
          onPress={() => setTab("view")}
        >
          <Text>Visualizar Bodegas</Text>
        </TouchableOpacity>
      </View>

      {tab === "form" ? (
        <ScrollView>
          <Text style={styles.label}>Nombre</Text>
          <TextInput
            style={styles.input}
            value={form.nombre}
            onChangeText={(v) =>
              setForm({ ...form, nombre: v })
            }
          />

          <Text style={styles.label}>Ciudad</Text>
          <View style={styles.cityRow}>
            {["Iquique", "Alto Hospicio"].map((c) => (
              <TouchableOpacity
                key={c}
                style={[
                  styles.pill,
                  form.ciudad === c && styles.pillActive,
                ]}
                onPress={() =>
                  setForm({ ...form, ciudad: c })
                }
              >
                <Text style={styles.pillText}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Dirección</Text>
          <TextInput
            style={styles.input}
            value={form.direccion}
            onChangeText={(v) =>
              setForm({ ...form, direccion: v })
            }
          />

          <Text style={styles.label}>Dimensiones (m)</Text>
          <TextInput
            style={styles.input}
            placeholder="Ancho"
            keyboardType="numeric"
            value={form.ancho}
            onChangeText={(v) =>
              setForm({ ...form, ancho: v })
            }
          />
          <TextInput
            style={styles.input}
            placeholder="Altura"
            keyboardType="numeric"
            value={form.alto}
            onChangeText={(v) =>
              setForm({ ...form, alto: v })
            }
          />
          <TextInput
            style={styles.input}
            placeholder="Largo"
            keyboardType="numeric"
            value={form.largo}
            onChangeText={(v) =>
              setForm({ ...form, largo: v })
            }
          />

          <View style={styles.stateRow}>
            <TouchableOpacity
              style={[
                styles.pill,
                form.active && styles.pillActive,
              ]}
              onPress={() =>
                setForm((prev) => ({
                  ...prev,
                  active: !prev.active,
                }))
              }
            >
              <Text style={styles.pillText}>
                Estado: {form.active ? "Activa" : "Inactiva"}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.btn, styles.primary]}
            onPress={guardar}
          >
            <Text style={[styles.btnT, { color: "#fff" }]}>
              GUARDAR
            </Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <FlatList
          data={bodegas}
          keyExtractor={(b) => String(b.id)}
          renderItem={renderCard}
          ListEmptyComponent={
            <Text
              style={{
                textAlign: "center",
                color: "#64748b",
              }}
            >
              Aún no hay bodegas.
            </Text>
          }
        />
      )}
    </View>
  );
}

/* ---------- Estilos ---------- */

const styles = StyleSheet.create({
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 12,
  },
  tabs: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  tabBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 10,
    backgroundColor: "#f8fafc",
  },
  activeTab: {
    backgroundColor: "#e0e7ff",
    borderColor: "#6366f1",
  },
  label: {
    color: "#475569",
    marginTop: 8,
    marginBottom: 6,
    fontSize: 13,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 10,
    padding: 12,
    backgroundColor: "#fff",
    marginBottom: 8,
  },
  card: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
  },
  cardLine: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 4,
  },
  badge: {
    color: "#64748b",
    fontWeight: "600",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
    flexWrap: "wrap",
  },
  btn: {
    flex: 1,
    padding: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  btnT: {
    fontWeight: "700",
    color: "#1e293b",
  },
  primary: {
    backgroundColor: "#2563eb",
  },
  info: {
    backgroundColor: "#0ea5e9",
  },
  warn: {
    backgroundColor: "#f59e0b",
  },
  danger: {
    backgroundColor: "#dc2626",
  },
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 999,
    backgroundColor: "#fff",
  },
  pillActive: {
    backgroundColor: "#e0e7ff",
    borderColor: "#6366f1",
  },
  pillText: {
    fontWeight: "700",
    color: "#1e293b",
  },
  cityRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 4,
  },
  stateRow: {
    flexDirection: "row",
    gap: 8,
    marginVertical: 8,
  },
});
