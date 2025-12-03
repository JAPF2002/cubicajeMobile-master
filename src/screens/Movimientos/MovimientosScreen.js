/*C:\Users\japf2\Desktop\Tesis Cubicaje\Proyecto\proyectoPrincipal\cubicajeMobile-master\src\screens\Movimientos\MovimientosScreen.js*/
import React, { useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useApp } from "../../store";

const COLORS = {
  bg: "#f8fafc",
  card: "#ffffff",
  primary: "#2563eb",
  primarySoft: "#dbeafe",
  border: "#e5e7eb",
  text: "#0f172a",
  textSoft: "#6b7280",
  success: "#22c55e",
  danger: "#ef4444",
  info: "#0ea5e9",
};

// ✅ AJUSTA SOLO SI TUS RUTAS SE LLAMAN DISTINTO
const ROUTES = {
  TAB_MENU: "Menu",
  STACK_MOVIMIENTOS: "MovimientosList",
  STACK_INFORME: "Informe",
};

// ---- navegación robusta (busca el navigator correcto hacia arriba)
function findNavWithRoute(navigation, routeName) {
  let nav = navigation;
  while (nav) {
    const names = nav.getState?.()?.routeNames || [];
    if (names.includes(routeName)) return nav;
    nav = nav.getParent?.();
  }
  return null;
}
function safeNavigate(navigation, routeName, params) {
  const nav = findNavWithRoute(navigation, routeName);
  if (!nav) return false;
  nav.navigate(routeName, params);
  return true;
}

function formatDateParts(dateLike) {
  const d = dateLike ? new Date(dateLike) : null;
  if (!d || isNaN(d.getTime())) return { fecha: "Sin fecha", hora: "Sin hora" };

  try {
    const fecha = new Intl.DateTimeFormat("es-CL", { dateStyle: "medium" }).format(d);
    const hora = new Intl.DateTimeFormat("es-CL", { timeStyle: "short" }).format(d);
    return { fecha, hora };
  } catch {
    return { fecha: d.toLocaleDateString(), hora: d.toLocaleTimeString() };
  }
}

function normTipo(tipo) {
  const t = String(tipo || "").toLowerCase();

  // ✅ transferencias
  if (t === "traslado" || t === "transfer" || t === "move" || t === "transferencia") return "transfer";

  // ✅ ingresos
  if (t === "entrada" || t === "ingreso" || t === "in" || t === "add" || t === "ajuste_mas") return "in";

  // ✅ egresos
  if (t === "salida" || t === "egreso" || t === "out" || t === "remove" || t === "ajuste_menos") return "out";

  return t;
}




function TypeChip({ tipo }) {
  const t = normTipo(tipo);
  const label = t === "transfer" ? "Traslado" : t === "in" ? "Ingreso" : t === "out" ? "Salida" : "Movimiento";
  const bg = t === "transfer" ? COLORS.info : t === "in" ? COLORS.success : t === "out" ? COLORS.danger : COLORS.primary;

  return (
    <View style={[styles.typeChip, { backgroundColor: bg }]}>
      <Text style={styles.typeChipText}>{label}</Text>
    </View>
  );
}

function QtyChip({ tipo, cantidad }) {
  const t = normTipo(tipo);
  const qty = Math.max(0, Number(cantidad) || 0);

  const sign = t === "in" ? "+" : t === "out" ? "-" : "";
  const bg = t === "in" ? "#dcfce7" : t === "out" ? "#fee2e2" : "#e0f2fe";
  const fg = t === "in" ? "#166534" : t === "out" ? "#991b1b" : "#075985";

  return (
    <View style={[styles.qtyChip, { backgroundColor: bg }]}>
      <Text style={[styles.qtyChipText, { color: fg }]}>{sign}{qty}</Text>
    </View>
  );
}

function FilterRow({ value, onChange, disabled }) {
  const options = [
    { key: "all", label: "Todos" },
    { key: "in", label: "Entradas" },
    { key: "out", label: "Salidas" },
    { key: "transfer", label: "Traslados" },
  ];

  return (
    <View style={styles.filterRow}>
      {options.map((opt) => (
        <TouchableOpacity
          key={opt.key}
          style={[styles.filterPill, value === opt.key && styles.filterPillActive]}
          onPress={() => onChange(opt.key)}
          disabled={disabled}
        >
          <Text style={[styles.filterPillText, value === opt.key && styles.filterPillTextActive]}>
            {opt.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function MovementCard({ m, bodegasById, itemsById }) {
  const t = normTipo(m?.tipo);
  const { fecha, hora } = formatDateParts(m?.fecha || m?.createdAt);

  const itemObj = itemsById?.[m?.itemId];
  const itemNombre = m?.itemNombre || itemObj?.nombre || "Item (sin nombre)";
  const sku = m?.itemSku || itemObj?.sku;

  const qty = Number(m?.cantidad) || 0;
  const bodegaNombre = (id) => bodegasById?.[id]?.nombre || "—";

  return (
    <View style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <View style={{ flex: 1, paddingRight: 10 }}>
          <Text style={styles.cardTitle}>{itemNombre}</Text>
          {!!sku && <Text style={styles.cardSubtitle}>SKU: {sku}</Text>}
          <Text style={styles.cardLineSmall}>Fecha: {fecha}</Text>
          <Text style={styles.cardLineSmall}>Hora: {hora}</Text>
        </View>

        <View style={{ alignItems: "flex-end" }}>
          <TypeChip tipo={t} />
          <View style={{ height: 6 }} />
          <QtyChip tipo={t} cantidad={qty} />
        </View>
      </View>

      {t === "transfer" ? (
        <View style={{ marginTop: 8 }}>
          <Text style={styles.detailText}>
            <Text style={styles.labelStrong}>Bodega origen: </Text>
            <Text style={styles.bodegaStrong}>
              {m?.desdeBodega || bodegaNombre(m?.desdeBodegaId)}
            </Text>
          </Text>

          <Text style={styles.detailText}>
            <Text style={styles.labelStrong}>Bodega destino: </Text>
            <Text style={styles.bodegaStrong}>
              {m?.haciaBodega || bodegaNombre(m?.haciaBodegaId)}
            </Text>
          </Text>
        </View>
      ) : (
        <Text style={[styles.detailText, { marginTop: 8 }]}>
          <Text style={styles.bodegaStrong}>
            {m?.bodega || bodegaNombre(m?.bodegaId)}
          </Text>
        </Text>
      )}
    </View>
  );
}

export default function MovimientosScreen({ navigation }) {
  const { bodegas = [], items = [], movimientos = [], reloadMovimientos } = useApp();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const bodegasById = useMemo(() => {
    const map = {};
    bodegas.forEach((b) => (map[b.id] = b));
    return map;
  }, [bodegas]);

  const itemsById = useMemo(() => {
    const map = {};
    items.forEach((it) => (map[it.id] = it));
    return map;
  }, [items]);

  const load = useCallback(async () => {
    if (typeof reloadMovimientos !== "function") return;
    setMsg("");
    setLoading(true);
    try {
      await reloadMovimientos({ limit: 200 });
    } catch (e) {
      setMsg(e?.message || "No se pudieron cargar movimientos.");
    } finally {
      setLoading(false);
    }
  }, [reloadMovimientos]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  // ✅ BOTONES (SIN CONFUSIÓN)
const goToMenu = () => {
  // AppTab tiene id="AppTabs"
  const tabs = navigation.getParent?.("AppTabs");
  if (tabs?.navigate) return tabs.navigate("Menu");

  // fallback (por si esta screen no cuelga directo del Tab)
  return navigation.navigate("Main", { screen: "Menu" });
};


  const goToInforme = () => {
    const ok = safeNavigate(navigation, ROUTES.STACK_INFORME);
    if (!ok) setMsg(`No encontré la pantalla "${ROUTES.STACK_INFORME}" en HistorialStack.`);
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return (movimientos || [])
      .filter((m) => {
        const t = normTipo(m?.tipo);
        if (filter !== "all" && t !== filter) return false;

        if (term) {
          const itemObj = itemsById?.[m?.itemId];
          const hay = [
            m?.itemNombre,
            itemObj?.nombre,
            m?.itemSku,
            itemObj?.sku,
            m?.bodega,
            m?.desdeBodega,
            m?.haciaBodega,
            bodegasById?.[m?.bodegaId]?.nombre,
            bodegasById?.[m?.desdeBodegaId]?.nombre,
            bodegasById?.[m?.haciaBodegaId]?.nombre,
            t,
          ].filter(Boolean).join(" ").toLowerCase();

          if (!hay.includes(term)) return false;
        }
        return true;
      })
      .slice()
      .sort((a, b) => {
        const da = new Date(a?.fecha || a?.createdAt || 0).getTime();
        const db = new Date(b?.fecha || b?.createdAt || 0).getTime();
        return db - da;
      });
  }, [movimientos, search, filter, bodegasById, itemsById]);

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Historial</Text>
      <Text style={styles.subtitle}>Historial de entradas, salidas y traslados.</Text>

      {msg ? <Text style={styles.msgText}>{msg}</Text> : null}

      {loading ? (
        <View style={styles.loadingRow} pointerEvents="none">
          <ActivityIndicator />
        </View>
      ) : null}

      <TextInput
        placeholder="Buscar por item o bodega"
        placeholderTextColor={COLORS.textSoft}
        style={styles.searchInput}
        value={search}
        onChangeText={setSearch}
      />

      <FilterRow value={filter} onChange={setFilter} disabled={loading} />

      <FlatList
        data={filtered}
        keyExtractor={(m, idx) => String(m?.id ?? idx)}
        renderItem={({ item }) => (
          <MovementCard m={item} bodegasById={bodegasById} itemsById={itemsById} />
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {loading ? "Cargando..." : "No hay movimientos con esos filtros."}
          </Text>
        }
        contentContainerStyle={{ paddingBottom: 140 }}
      />

      {/* ✅ Barra inferior: SOLO acciones correctas */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.bottomBtn} onPress={goToMenu}>
          <Text style={styles.bottomBtnText}>Menú principal</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.bottomBtn, styles.bottomBtnActive]} disabled>
          <Text style={[styles.bottomBtnText, styles.bottomBtnTextActive]}>Movimientos</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.bottomBtn} onPress={goToInforme}>
          <Text style={styles.bottomBtnText}>Informe</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg, paddingHorizontal: 16, paddingTop: 20 },
  title: { fontSize: 22, fontWeight: "900", color: COLORS.text },
  subtitle: { fontSize: 13, color: COLORS.textSoft, marginBottom: 12, fontWeight: "700" },
  msgText: { marginTop: 4, fontSize: 11, color: COLORS.primary, fontWeight: "700" },
  loadingRow: { paddingVertical: 8, alignItems: "center" },

  searchInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#ffffff",
    fontSize: 13,
    marginBottom: 8,
  },

  filterRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 6 },
  filterPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, borderWidth: 1, borderColor: COLORS.border },
  filterPillActive: { backgroundColor: COLORS.primarySoft, borderColor: COLORS.primary },
  filterPillText: { fontSize: 10, color: COLORS.textSoft, fontWeight: "700" },
  filterPillTextActive: { color: COLORS.primary, fontWeight: "900" },

  card: { backgroundColor: COLORS.card, padding: 12, borderRadius: 16, marginBottom: 8, borderWidth: 1, borderColor: COLORS.border },
  cardHeaderRow: { flexDirection: "row", justifyContent: "space-between" },
  cardTitle: { fontSize: 15, fontWeight: "900", color: COLORS.text },
  cardSubtitle: { fontSize: 11, color: COLORS.textSoft, fontWeight: "700" },
  cardLineSmall: { fontSize: 13, color: COLORS.textSoft, fontWeight: "700", marginTop: 2 },

  typeChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999, minWidth: 92, alignItems: "center" },
  typeChipText: { fontSize: 13, color: "#ffffff", fontWeight: "900" },

  qtyChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, minWidth: 64, alignItems: "center" },
  qtyChipText: { fontSize: 14, fontWeight: "900" },

  detailText: { fontSize: 12, color: COLORS.text, fontWeight: "700" },
  labelStrong: { fontWeight: "900", color: COLORS.text },
  bodegaStrong: { fontWeight: "900", color: COLORS.primary },

  emptyText: { textAlign: "center", fontSize: 12, color: COLORS.textSoft, marginTop: 40 },

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
    borderColor: COLORS.border,
    gap: 6,
    elevation: 6,
  },
  bottomBtn: { flex: 1, paddingVertical: 7, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  bottomBtnActive: { backgroundColor: COLORS.primary },
  bottomBtnText: { fontSize: 10.5, color: COLORS.textSoft, fontWeight: "700" },
  bottomBtnTextActive: { color: "#ffffff", fontWeight: "900" },
});
