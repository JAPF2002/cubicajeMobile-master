// cubicajeMobile-master/src/screens/Bodega/BodegasListScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useApp } from "../../store";

export default function BodegasListScreen(props) {
  const { goToMenu, goToBodegaFormNew, goToBodegaFormEdit, navigation } = props;

  const {
    bodegas,
    setBodegaActive,
    metricsOf,
    currentUser,
    syncBodegasFromApi,
  } = useApp();

  const isAdmin = currentUser?.role === "admin";

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all | active | inactive
  const [cityFilter, setCityFilter] = useState("all"); // all | Iquique | Alto Hospicio
  const [loading, setLoading] = useState(false);

  // Cargar bodegas desde la API al entrar a la pantalla
  useEffect(() => {
    const cargar = async () => {
      try {
        setLoading(true);
        await syncBodegasFromApi();
      } catch (err) {
        console.log("[BodegasListScreen] error sync:", err);
        Alert.alert(
          "Error",
          err?.message ||
            "No se pudieron cargar las bodegas desde el servidor."
        );
      } finally {
        setLoading(false);
      }
    };

    cargar();
  }, []);

  const irMenu = () => {
    if (typeof goToMenu === "function") return goToMenu();
    if (navigation?.navigate) return navigation.navigate("Menu");
  };

  const irNuevaBodega = () => {
    if (typeof goToBodegaFormNew === "function") return goToBodegaFormNew();
    if (navigation?.navigate)
      return navigation.navigate("BodegaForm", { mode: "new" });
  };

  const irEditarBodega = (b) => {
    if (typeof goToBodegaFormEdit === "function") return goToBodegaFormEdit(b);
    if (navigation?.navigate)
      return navigation.navigate("BodegaForm", { bodega: b });
  };

  const adminToggle = (b) => {
    const doToggle = async (nuevoEstado) => {
      try {
        await setBodegaActive(b.id, nuevoEstado);
      } catch (err) {
        console.log("[BodegasListScreen] error toggle:", err);
        Alert.alert(
          "Error",
          err?.message || "No se pudo actualizar el estado de la bodega."
        );
      }
    };

    if (b.active) {
      Alert.alert(
        "Desactivar bodega",
        "Los ítems quedarán sin asignar. ¿Confirmas?",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Desactivar",
            style: "destructive",
            onPress: () => doToggle(false),
          },
        ]
      );
    } else {
      doToggle(true);
    }
  };

  // 👇 AQUÍ conectamos con la pantalla 3D
  const ver3D = (b) => {
    if (!b.ancho || !b.alto || !b.largo) {
      return Alert.alert(
        "Vista 3D",
        "Esta bodega no tiene dimensiones definidas."
      );
    }

    if (navigation?.navigate) {
      return navigation.navigate("Bodega3D", {
        bodegaId: b.id,
        nombre: b.nombre,
        ancho: b.ancho,
        alto: b.alto,
        largo: b.largo,
      });
    }

    // fallback por si no hay navigation (por si acaso)
    Alert.alert(
      "Vista 3D",
      `Abrir vista 3D de "${b.nombre}" (${b.ancho}x${b.alto}x${b.largo} m).`
    );
  };

  const filteredBodegas = bodegas.filter((b) => {
    const term = search.trim().toLowerCase();
    if (term && !b.nombre.toLowerCase().includes(term)) return false;
    if (statusFilter === "active" && !b.active) return false;
    if (statusFilter === "inactive" && b.active) return false;
    if (cityFilter !== "all" && b.ciudad !== cityFilter) return false;
    return true;
  });

  const renderCard = ({ item: b }) => {
    const m = metricsOf(b);

    return (
      <View style={st.card}>
        <Text style={st.cardTitle} numberOfLines={1} ellipsizeMode="tail">
          {b.nombre} <Text style={st.badge}>{b.ciudad}</Text>{"  "}
          <Text style={{ fontSize: 12 }}>
            {b.active ? "🟢 Activa" : "🔴 Inactiva"}
          </Text>
        </Text>

        <Text style={st.cardLine}>Dirección: {b.direccion}</Text>

        <View style={st.section}>
          <Text style={st.sectionLabel}>Dimensiones (m)</Text>
          <Text style={st.cardLine}>Ancho: {b.ancho}</Text>
          <Text style={st.cardLine}>Largo: {b.largo}</Text>
          <Text style={st.cardLine}>Altura: {b.alto}</Text>
        </View>

        <View style={st.section}>
          <Text style={st.sectionLabel}>Capacidad</Text>
          <Text style={st.cardLine}>Total: {m.capacidad.toFixed(2)} m³</Text>
          <Text style={st.cardLine}>Ocupado: {m.ocupado.toFixed(2)} m³</Text>
          <Text style={st.cardLine}>Libre: {m.libre.toFixed(2)} m³</Text>
        </View>

        <View style={st.actionsRow}>
          {/* Editar solo admin */}
          {isAdmin && (
            <TouchableOpacity
              style={[st.btn, st.btnOutlinePrimary]}
              onPress={() => irEditarBodega(b)}
            >
              <Text style={st.btnOutlinePrimaryTxt}>Editar</Text>
            </TouchableOpacity>
          )}

          {/* Botón 3D para todos */}
          <TouchableOpacity
            style={[st.btn, st.btnPrimary]}
            onPress={() => ver3D(b)}
          >
            <Text style={st.btnTxt}>3D</Text>
          </TouchableOpacity>

          {/* Activar/Desactivar solo admin */}
          {isAdmin && (
            <TouchableOpacity
              style={[st.btn, b.active ? st.btnDanger : st.btnPrimary]}
              onPress={() => adminToggle(b)}
            >
              <Text style={st.btnTxt}>
                {b.active ? "Desactivar" : "Activar"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (loading && (!bodegas || bodegas.length === 0)) {
    return (
      <View
        style={[st.screen, { alignItems: "center", justifyContent: "center" }]}
      >
        <ActivityIndicator />
        <Text style={{ marginTop: 8, color: "#64748b" }}>
          Cargando bodegas...
        </Text>
      </View>
    );
  }

  return (
    <View style={st.screen}>
      {/* Header */}
      <View style={st.headerRow}>
        <View>
          <Text style={st.title}>Bodegas</Text>
          <Text style={st.subtitle}>
            Lista, filtros y detalles de bodegas.
          </Text>
        </View>
      </View>

      {/* Buscar */}
      <TextInput
        placeholder="Buscar por nombre de bodega"
        placeholderTextColor="#9ca3af"
        style={st.searchInput}
        value={search}
        onChangeText={setSearch}
      />

      {/* Filtro estado */}
      <View style={st.filterRow}>
        {[
          { key: "all", label: "Todas" },
          { key: "active", label: "Activas" },
          { key: "inactive", label: "Inactivas" },
        ].map((opt) => (
          <TouchableOpacity
            key={opt.key}
            style={[
              st.filterPill,
              statusFilter === opt.key && st.filterPillActive,
            ]}
            onPress={() => setStatusFilter(opt.key)}
          >
            <Text
              style={[
                st.filterPillText,
                statusFilter === opt.key && st.filterPillTextActive,
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Filtro ciudad */}
      <View style={st.filterRow}>
        {[
          { key: "all", label: "Todas las ciudades" },
          { key: "Iquique", label: "Iquique" },
          { key: "Alto Hospicio", label: "Alto Hospicio" },
        ].map((opt) => (
          <TouchableOpacity
            key={opt.key}
            style={[
              st.filterPill,
              cityFilter === opt.key && st.filterPillActive,
            ]}
            onPress={() => setCityFilter(opt.key)}
          >
            <Text
              style={[
                st.filterPillText,
                cityFilter === opt.key && st.filterPillTextActive,
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Lista */}
      <FlatList
        style={{ flex: 1 }}
        data={filteredBodegas}
        keyExtractor={(b) => String(b.id)}
        renderItem={renderCard}
        ListEmptyComponent={
          <Text
            style={{
              textAlign: "center",
              color: "#64748b",
              marginTop: 20,
            }}
          >
            No se encontraron bodegas con esos filtros.
          </Text>
        }
        contentContainerStyle={{ paddingBottom: 140 }}
      />

      {/* Bottom bar */}
      <View style={st.bottomBar}>
        <TouchableOpacity style={st.bottomBtn} onPress={irMenu}>
          <Text style={st.bottomBtnText}>Menú principal</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[st.bottomBtn, st.bottomBtnActive]} disabled>
          <Text style={[st.bottomBtnText, st.bottomBtnTextActive]}>
            Bodegas
          </Text>
        </TouchableOpacity>

        {isAdmin && (
          <TouchableOpacity style={st.bottomBtn} onPress={irNuevaBodega}>
            <Text style={st.bottomBtnText}>Crear bodega</Text>
          </TouchableOpacity>
        )}
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
  searchInput: {
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#f9fafb",
    marginBottom: 8,
    fontSize: 13,
  },
  card: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#1e293b" },
  cardLine: { fontSize: 13, color: "#64748b", marginTop: 4 },
  badge: { color: "#64748b", fontWeight: "600", fontSize: 12 },
  section: { marginTop: 6 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
    marginBottom: 2,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
    flexWrap: "wrap",
  },
  btn: {
    flex: 1,
    padding: 9,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  btnPrimary: { backgroundColor: "#2563eb" },
  btnDanger: { backgroundColor: "#dc2626" },
  btnTxt: { color: "#fff", fontWeight: "700", fontSize: 11 },
  btnOutlinePrimary: {
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#2563eb",
  },
  btnOutlinePrimaryTxt: {
    color: "#2563eb",
    fontWeight: "700",
    fontSize: 11,
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 6,
  },
  filterPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
  },
  filterPillActive: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
  },
  filterPillText: {
    fontSize: 11,
    color: "#4b5563",
    fontWeight: "500",
  },
  filterPillTextActive: {
    color: "#ffffff",
    fontWeight: "600",
  },
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
  bottomBtnText: {
    fontSize: 10.5,
    color: "#6b7280",
    fontWeight: "500",
  },
  bottomBtnTextActive: {
    color: "#ffffff",
    fontWeight: "600",
  },
});
