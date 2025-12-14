// C:\Users\japf2\Desktop\Tesis Cubicaje\Proyecto\proyectoPrincipal\cubicajeMobile-master\src\screens\Movimientos\InformeScreen.js

import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
  Platform,
} from "react-native";
import { useApp } from "../../store";

function normTipo(tipo) {
  const t = String(tipo || "").toLowerCase();

  // transferencias
  if (t === "traslado" || t === "transfer" || t === "move" || t === "transferencia")
    return "transfer";

  // ingresos
  if (t === "ingreso" || t === "entrada" || t === "in" || t === "add" || t === "ajuste_mas")
    return "in";

  // egresos
  if (t === "egreso" || t === "salida" || t === "out" || t === "remove" || t === "ajuste_menos")
    return "out";

  return t;
}

function getDate(m) {
  const raw = m?.fecha || m?.createdAt;
  const d = raw ? new Date(raw) : null;
  return d && !isNaN(d.getTime()) ? d : null;
}
function getActor(m) {
  return (
    m?.usuarioNombre ||
    m?.userNombre ||
    m?.creadoPorNombre ||
    m?.createdByName ||
    m?.creadoPor ||
    m?.createdBy ||
    ""
  );
}
function fmtFechaMed(d) {
  try {
    return new Intl.DateTimeFormat("es-CL", { dateStyle: "medium" }).format(d);
  } catch {
    return d.toLocaleDateString();
  }
}
function fmtFechaFull(d) {
  try {
    return new Intl.DateTimeFormat("es-CL", { dateStyle: "full" }).format(d);
  } catch {
    return d.toLocaleDateString();
  }
}
function fmtHora(d) {
  try {
    return new Intl.DateTimeFormat("es-CL", { timeStyle: "short" }).format(d);
  } catch {
    return d.toLocaleTimeString();
  }
}

const COLORS = {
  bg: "#f8fafc",
  card: "#ffffff",
  primary: "#2563eb",
  border: "#e5e7eb",
  text: "#0f172a",
  textSoft: "#6b7280",
  success: "#22c55e",
  danger: "#ef4444",
  info: "#0ea5e9",
};

function TypeChip({ tipo }) {
  const t = normTipo(tipo);
  const label =
    t === "transfer" ? "Traslado" : t === "in" ? "Ingreso" : t === "out" ? "Salida" : "Movimiento";
  const bg = t === "transfer" ? COLORS.info : t === "in" ? COLORS.success : COLORS.danger;

  return (
    <View style={[st.typeChip, { backgroundColor: bg }]}>
      <Text style={st.typeChipText}>{label}</Text>
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
    <View style={[st.qtyChip, { backgroundColor: bg }]}>
      <Text style={[st.qtyChipText, { color: fg }]}>
        {sign}
        {qty}
      </Text>
    </View>
  );
}

export default function InformeScreen({ navigation }) {
  // ✅ Solo agregué userToken aquí (para PDF)
  const { bodegas = [], movimientos = [], userToken } = useApp();

  // ✅ (esto ya lo estabas usando en bodegaNombre; si ya lo tenías en tu archivo, puedes dejar tu versión)
  const bodegasById = useMemo(() => {
    const map = {};
    bodegas.forEach((b) => (map[b.id] = b));
    return map;
  }, [bodegas]);

  // ✅ Navega hacia arriba hasta encontrar una ruta con ese nombre
  const navigateUpTo = (routeName, params) => {
    let nav = navigation;
    while (nav) {
      const names = nav.getState?.()?.routeNames || [];
      if (names.includes(routeName)) {
        nav.navigate(routeName, params);
        return true;
      }
      nav = nav.getParent?.();
    }
    return false;
  };

  const goToMenu = () => {
    // AppTab tiene id="AppTabs"
    const tabs = navigation.getParent?.("AppTabs");
    if (tabs?.navigate) return tabs.navigate("Menu");

    // fallback (por si esta screen no cuelga directo del Tab)
    return navigation.navigate("Main", { screen: "Menu" });
  };

  const goToMovimientos = () => {
    // 1) intenta dentro del stack actual
    const names = navigation.getState?.()?.routeNames || [];
    if (names.includes("MovimientosList")) return navigation.navigate("MovimientosList");
    if (names.includes("Movimientos")) return navigation.navigate("Movimientos");

    // 2) fallback: volver atrás (normalmente Informe -> Movimientos)
    if (navigation.canGoBack?.()) return navigation.goBack();

    // 3) último fallback: buscar en padres
    if (navigateUpTo("MovimientosList")) return;
    if (navigateUpTo("Movimientos")) return;

    Alert.alert("Navegación", "No encontré la ruta de Movimientos.");
  };

  const bodegaNombre = (id) => bodegasById?.[id]?.nombre || "—";

  const [range, setRange] = useState("day"); // day | week | month

  const { start, end, rangeLabel, subtitle } = useMemo(() => {
    const now = new Date();

    const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
    const endOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

    const startOfWeekMon = (d) => {
      const x = startOfDay(d);
      const day = x.getDay();
      const diff = (day + 6) % 7;
      x.setDate(x.getDate() - diff);
      return x;
    };

    const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);

    if (range === "week") {
      const s = startOfWeekMon(now);
      const e = endOfDay(now);
      return { start: s, end: e, rangeLabel: "Semana", subtitle: `${fmtFechaMed(s)} — ${fmtFechaMed(e)}` };
    }
    if (range === "month") {
      const s = startOfMonth(now);
      const e = endOfDay(now);
      return { start: s, end: e, rangeLabel: "Mes", subtitle: `${fmtFechaMed(s)} — ${fmtFechaMed(e)}` };
    }

    const s = startOfDay(now);
    const e = endOfDay(now);
    return { start: s, end: e, rangeLabel: "Hoy", subtitle: fmtFechaFull(now) };
  }, [range]);

  const rangeMovs = useMemo(() => {
    const s = start.getTime();
    const e = end.getTime();

    return (movimientos || [])
      .filter((m) => {
        const d = getDate(m);
        if (!d) return false;
        const t = d.getTime();
        return t >= s && t <= e;
      })
      .slice()
      .sort((a, b) => (getDate(b)?.getTime() || 0) - (getDate(a)?.getTime() || 0));
  }, [movimientos, start, end]);

  const summary = useMemo(() => {
    const s = { inCount: 0, outCount: 0, trCount: 0, inTot: 0, outTot: 0, trTot: 0 };
    rangeMovs.forEach((m) => {
      const t = normTipo(m?.tipo);
      const qty = Math.max(0, Number(m?.cantidad) || 0);
      if (t === "in") {
        s.inCount++;
        s.inTot += qty;
      } else if (t === "out") {
        s.outCount++;
        s.outTot += qty;
      } else if (t === "transfer") {
        s.trCount++;
        s.trTot += qty;
      }
    });
    return s;
  }, [rangeMovs]);

  const lineBodega = (m) => {
    const t = normTipo(m?.tipo);
    if (t === "transfer") {
      const from = m?.desdeBodega || bodegaNombre(m?.desdeBodegaId);
      const to = m?.haciaBodega || bodegaNombre(m?.haciaBodegaId);
      return `Bodega origen: ${from}\nBodega destino: ${to}`;
    }
    return m?.bodega || bodegaNombre(m?.bodegaId);
  };

  // =========================
  // ✅ DESCARGA PDF (TICKET)
  // =========================
  const API_BASE = Platform.OS === "android" ? "http://10.0.2.2:3000" : "http://localhost:3000";

  const downloadPdf = async () => {
    try {
      if (!userToken) {
        Alert.alert("Sesión", "No encontré token. Inicia sesión de nuevo.");
        return;
      }

      // 1) pedir ticket (endpoint protegido)
      const r = await fetch(`${API_BASE}/api/movimientos/informe/ticket`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${userToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      const j = await r.json().catch(() => null);
      if (!r.ok || j?.error || !j?.ticket) {
        throw new Error(j?.body || j?.message || "No pude generar el ticket");
      }

      // 2) link al PDF (sin headers; el ticket va por query)
  const url =
    `${API_BASE}/api/movimientos/informe/pdf` +
    `?ticket=${encodeURIComponent(j.ticket)}` +
    `&start=${encodeURIComponent(start.toISOString())}` +
    `&end=${encodeURIComponent(end.toISOString())}`;

  await Linking.openURL(url);
} catch (e) {
  console.log("[Informe] downloadPdf error:", e?.message);
  Alert.alert("Error", "No puedo abrir el enlace del PDF.");
}
  };

  return (
    <View style={st.screen}>
      <View style={st.headerRow}>
        <Text style={st.title}>Informe</Text>
        <Text style={st.subtitle}>{subtitle}</Text>
        <Text style={st.rangeTitle}>Rango: {rangeLabel}</Text>
      </View>

      <View style={st.rangeRow}>
        {[
          { k: "day", l: "Hoy" },
          { k: "week", l: "Semana" },
          { k: "month", l: "Mes" },
        ].map((x) => {
          const active = range === x.k;
          return (
            <TouchableOpacity
              key={x.k}
              style={[st.rangePill, active && st.rangePillA]}
              onPress={() => setRange(x.k)}
            >
              <Text style={[st.rangePillText, active && st.rangePillTextA]}>{x.l}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={st.summaryRow}>
        <View style={st.summaryCard}>
          <Text style={st.summaryTitle}>Entradas</Text>
          <Text style={st.summaryBig}>{summary.inCount}</Text>
          <Text style={st.summarySmall}>Unidades: {summary.inTot}</Text>
        </View>

        <View style={st.summaryCard}>
          <Text style={st.summaryTitle}>Salidas</Text>
          <Text style={st.summaryBig}>{summary.outCount}</Text>
          <Text style={st.summarySmall}>Unidades: {summary.outTot}</Text>
        </View>

        <View style={st.summaryCard}>
          <Text style={st.summaryTitle}>Traslados</Text>
          <Text style={st.summaryBig}>{summary.trCount}</Text>
          <Text style={st.summarySmall}>Unidades: {summary.trTot}</Text>
        </View>
      </View>

      <FlatList
        data={rangeMovs}
        keyExtractor={(m, idx) => String(m?.id ?? idx)}
        renderItem={({ item }) => {
          const d = getDate(item);
          const fecha = d ? fmtFechaMed(d) : "Sin fecha";
          const hora = d ? fmtHora(d) : "Sin hora";
          const who = getActor(item) || "—";

          return (
            <View style={st.card}>
              <View style={st.cardHeaderRow}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={st.cardTitle} numberOfLines={1}>
                    {item?.itemNombre || "Item"}
                  </Text>
                  <Text style={st.cardLineSmall}>Fecha: {fecha}</Text>
                  <Text style={st.cardLineSmall}>Hora: {hora}</Text>
                  <Text style={st.cardLineSmall}>Por: {who}</Text>
                </View>

                <View style={{ alignItems: "flex-end" }}>
                  <TypeChip tipo={item?.tipo} />
                  <View style={{ height: 6 }} />
                  <QtyChip tipo={item?.tipo} cantidad={item?.cantidad} />
                </View>
              </View>

              <Text style={st.cardDetail}>{lineBodega(item)}</Text>
            </View>
          );
        }}
        ListEmptyComponent={<Text style={st.emptyText}>No hay movimientos en este rango.</Text>}
        contentContainerStyle={{ paddingBottom: 210 }}
      />

      <View style={st.downloadWrap}>
        <TouchableOpacity style={st.downloadBtn} onPress={downloadPdf}>
          <Text style={st.downloadBtnText}>Descargar</Text>
        </TouchableOpacity>
      </View>

      <View style={st.bottomBar}>
        <TouchableOpacity style={st.bottomBtn} onPress={goToMenu}>
          <Text style={st.bottomBtnText}>Menú principal</Text>
        </TouchableOpacity>

        <TouchableOpacity style={st.bottomBtn} onPress={goToMovimientos}>
          <Text style={st.bottomBtnText}>Movimientos</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[st.bottomBtn, st.bottomBtnActive]} disabled>
          <Text style={[st.bottomBtnText, st.bottomBtnTextActive]}>Informe</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg, paddingHorizontal: 16, paddingTop: 18 },
  headerRow: { marginBottom: 6 },
  title: { fontSize: 20, fontWeight: "900", color: COLORS.text },
  subtitle: { fontSize: 12, color: COLORS.textSoft, fontWeight: "700", marginTop: 2 },
  rangeTitle: { fontSize: 12, color: COLORS.textSoft, fontWeight: "800", marginTop: 6 },

  rangeRow: { flexDirection: "row", gap: 8, marginTop: 8, marginBottom: 10 },
  rangePill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "#fff",
    alignItems: "center",
  },
  rangePillA: { backgroundColor: "#e0f2fe", borderColor: COLORS.info },
  rangePillText: { fontSize: 12, fontWeight: "900", color: COLORS.textSoft },
  rangePillTextA: { color: COLORS.text },

  summaryRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
  summaryCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 12,
  },
  summaryTitle: { fontSize: 11, color: COLORS.textSoft, fontWeight: "900" },
  summaryBig: { fontSize: 18, color: COLORS.text, fontWeight: "900", marginTop: 4 },
  summarySmall: { fontSize: 11, color: COLORS.textSoft, fontWeight: "700", marginTop: 2 },

  card: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
  },
  cardHeaderRow: { flexDirection: "row", justifyContent: "space-between" },
  cardTitle: { fontSize: 15, fontWeight: "900", color: COLORS.text },
  cardLineSmall: { fontSize: 13, color: COLORS.textSoft, fontWeight: "700", marginTop: 2 },
  cardDetail: { marginTop: 8, fontSize: 12, color: COLORS.text, fontWeight: "700", lineHeight: 18 },

  typeChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999, minWidth: 92, alignItems: "center" },
  typeChipText: { fontSize: 13, color: "#ffffff", fontWeight: "900" },

  qtyChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, minWidth: 64, alignItems: "center" },
  qtyChipText: { fontSize: 14, fontWeight: "900" },

  emptyText: { textAlign: "center", color: COLORS.textSoft, marginTop: 20, fontWeight: "700" },

  downloadWrap: { position: "absolute", left: 16, right: 16, bottom: 110 },
  downloadBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1d4ed8",
  },
  downloadBtnText: { color: "#fff", fontWeight: "900", fontSize: 13 },

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
