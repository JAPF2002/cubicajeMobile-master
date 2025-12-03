import React, { useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";

import { useApp } from "../../store";

import {
  getSolicitudes,
  insertSolicitud,
  updateSolicitudEstado,
} from "../../features/api";

const COLORS = {
  bg: "#f8fafc",
  card: "#ffffff",
  primary: "#2563eb",
  primarySoft: "#dbeafe",
  border: "#e5e7eb",
  text: "#0f172a",
  textSoft: "#6b7280",
  success: "#16a34a",
  danger: "#dc2626",
};

// ✅ Como en BD "motivo" es TEXT, el límite lo decides por UX:
const MOTIVO_MAX = 500;

/* -------- helpers -------- */

function unwrapApi(res) {
  const isApiShape =
    res && typeof res === "object" && "error" in res && "body" in res;

  if (isApiShape) {
    if (res.error) throw new Error(String(res.body || "Error en API"));
    return res.body;
  }

  if (res && typeof res === "object" && res.isAxiosError) {
    const data = res.response?.data;
    const msg =
      (data && (data.body || data.message)) || res.message || "Error de red";
    throw new Error(String(msg));
  }

  return res?.body ?? res?.data ?? res;
}

function mapSolicitudRow(row) {
  return {
    id: Number(row.id_solicitud ?? row.id ?? 0),
    nombreBodega: row.nombre_sugerido_bodega ?? row.nombreBodega ?? "",
    detalle: row.motivo ?? row.detalle ?? "",
    solicitanteId: Number(row.id_empleado ?? row.solicitanteId ?? 0),
    solicitanteNombre:
      row.empleado_nombre ??
      row.solicitanteNombre ??
      row.nombre_empleado ??
      "Empleado",
    status: row.estado ?? row.status ?? "pendiente",
  };
}

/* --- BADGE --- */
function StatusBadge({ status }) {
  let label = status;
  let style = { backgroundColor: COLORS.border, color: COLORS.textSoft };

  if (status === "pendiente") {
    label = "Pendiente";
    style = { backgroundColor: "#fef3c7", color: "#92400e" };
  } else if (status === "aceptada") {
    label = "Aprobada";
    style = { backgroundColor: "#bbf7d0", color: "#166534" };
  } else if (status === "rechazada") {
    label = "Rechazada";
    style = { backgroundColor: "#fee2e2", color: "#991b1b" };
  } else if (status === "anulada") {
    label = "Anulada";
    style = { backgroundColor: "#e5e7eb", color: "#374151" };
  }

  return (
    <View style={[styles.statusBadge, { backgroundColor: style.backgroundColor }]}>
      <Text style={[styles.statusBadgeText, { color: style.color }]}>{label}</Text>
    </View>
  );
}

/* --- CARD ADMIN --- */
function RequestCardAdmin({ req, onApprove, onReject, disabled }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleWrapper}>
          <Text style={styles.cardTitle} numberOfLines={2} ellipsizeMode="tail">
            {req.nombreBodega}
          </Text>
        </View>
        <StatusBadge status={req.status} />
      </View>

      <Text style={styles.cardText}>Motivo: {req.detalle}</Text>
      <Text style={styles.cardMeta}>Solicitado por: {req.solicitanteNombre}</Text>

      {req.status === "pendiente" && (
        <View style={styles.cardActionsRow}>
          <TouchableOpacity
            style={[styles.btn, styles.btnApprove, disabled && styles.btnDisabled]}
            onPress={onApprove}
            disabled={disabled}
          >
            <Text style={styles.btnApproveText}>Aprobar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, styles.btnReject, disabled && styles.btnDisabled]}
            onPress={onReject}
            disabled={disabled}
          >
            <Text style={styles.btnRejectText}>Rechazar</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

/* --- CARD EMPLEADO --- */
function RequestCardEmployee({ req }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleWrapper}>
          <Text style={styles.cardTitle} numberOfLines={2} ellipsizeMode="tail">
            {req.nombreBodega}
          </Text>
        </View>
        <StatusBadge status={req.status} />
      </View>
      <Text style={styles.cardText}>Motivo: {req.detalle}</Text>
      <Text style={styles.cardMeta}>ID solicitud: {req.id}</Text>
    </View>
  );
}

/* --- BARRA INFERIOR --- */
function BottomBar({ goToMenu, isAdmin }) {
  return (
    <View style={styles.bottomBar}>
      <TouchableOpacity
        style={[styles.bottomBtn, styles.bottomBtnPrimary]}
        onPress={goToMenu}
      >
        <Text style={styles.bottomBtnText}>Volver al menú</Text>
      </TouchableOpacity>
      {isAdmin && (
        <View style={styles.bottomInfo}>
          <Text style={styles.bottomInfoText}>Admin · gestión de solicitudes</Text>
        </View>
      )}
    </View>
  );
}

/* --- SCREEN --- */
export default function SolicitudesScreen() {
  const navigation = useNavigation();
  const { currentUser } = useApp();

  const roleKey = String(currentUser?.role || currentUser?.rol || "").toLowerCase();
  const isAdmin = roleKey === "admin";

  const userId = Number(
    currentUser?.id ||
      currentUser?.id_usuario ||
      currentUser?.idUsuario ||
      currentUser?.id_empleado ||
      0
  );

  const [requests, setRequests] = useState([]);
  const [titulo, setTitulo] = useState("");
  const [motivo, setMotivo] = useState("");
  const [msg, setMsg] = useState("");
  const [filter, setFilter] = useState("pendiente");
  const [loading, setLoading] = useState(false);

  const loadRequests = useCallback(async () => {
    setMsg("");
    setLoading(true);

    try {
      let res;

      if (isAdmin) {
        const params = filter === "all" ? {} : { estado: filter };
        res = await getSolicitudes(params);
      } else {
        if (!userId) throw new Error("Usuario sin ID (sesión inválida).");
        res = await getSolicitudes({ id_empleado: userId });
      }

      const body = unwrapApi(res);

      const list = Array.isArray(body)
        ? body
        : Array.isArray(body?.body)
        ? body.body
        : [];

      setRequests(list.map(mapSolicitudRow));
    } catch (e) {
      setRequests([]);
      setMsg(e?.message || "No se pudieron cargar las solicitudes.");
    } finally {
      setLoading(false);
    }
  }, [isAdmin, filter, userId]);

  useFocusEffect(
    useCallback(() => {
      loadRequests();
    }, [loadRequests])
  );

  const myRequests = useMemo(() => {
    if (isAdmin) return [];
    return [...requests].sort((a, b) => (a.id < b.id ? 1 : -1));
  }, [requests, isAdmin]);

  const adminRequests = useMemo(() => {
    if (!isAdmin) return [];
    return [...requests].sort((a, b) => (a.id < b.id ? 1 : -1));
  }, [requests, isAdmin]);

  const handleSendRequest = async () => {
    setMsg("");

    if (!titulo.trim() || !motivo.trim()) {
      setMsg("Completa título y motivo para enviar la solicitud.");
      return;
    }
    if (!userId) {
      setMsg("No hay usuario logueado (ID faltante).");
      return;
    }

    try {
      const res = await insertSolicitud({
        id_empleado: userId,
        nombre_sugerido_bodega: titulo.trim(),
        motivo: motivo.trim(),
      });

      unwrapApi(res);

      setTitulo("");
      setMotivo("");
      setMsg("Solicitud enviada.");
      await loadRequests();
      setTimeout(() => setMsg(""), 2500);
    } catch (e) {
      setMsg(e?.message || "No se pudo enviar la solicitud.");
    }
  };

  const handleSetStatus = async (id, estado) => {
    setMsg("");
    try {
      const res = await updateSolicitudEstado(id, estado);
      unwrapApi(res);
      await loadRequests();
    } catch (e) {
      setMsg(e?.message || "No se pudo actualizar la solicitud.");
    }
  };

  const goToMenu = () => navigation.navigate("Menu");

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>{isAdmin ? "Solicitudes" : "Mis solicitudes"}</Text>
      <Text style={styles.subtitle}>
        {isAdmin
          ? "Revisa, aprueba o rechaza solicitudes."
          : "Envía una solicitud y revisa el estado de tus pedidos."}
      </Text>

      {msg ? <Text style={styles.msgText}>{msg}</Text> : null}

      {loading ? (
        <View style={{ paddingTop: 10, paddingBottom: 6 }}>
          <ActivityIndicator />
        </View>
      ) : null}

      {!isAdmin && (
        <>
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Solicitud</Text>

            <Text style={styles.label}>Título</Text>
            <TextInput
              style={styles.input}
              value={titulo}
              onChangeText={setTitulo}
              placeholder="Ej: Nueva bodega en Alto Hospicio"
              placeholderTextColor={COLORS.textSoft}
            />

            <Text style={styles.label}>Motivo / Detalle</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              value={motivo}
              onChangeText={setMotivo}
              placeholder="Explica por qué se necesita esta nueva bodega o cambio."
              placeholderTextColor={COLORS.textSoft}
              multiline
              maxLength={MOTIVO_MAX}
            />

            <Text style={styles.counterText}>
              {motivo.length}/{MOTIVO_MAX}
            </Text>

            <TouchableOpacity
              style={[styles.btn, styles.btnPrimaryFull, loading && styles.btnDisabled]}
              onPress={handleSendRequest}
              disabled={loading}
            >
              <Text style={styles.btnPrimaryText}>Enviar solicitud</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Estado de mis solicitudes</Text>

          <FlatList
            data={myRequests}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => <RequestCardEmployee req={item} />}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Aún no has enviado solicitudes.</Text>
            }
            contentContainerStyle={{ paddingBottom: 120 }}
          />
        </>
      )}

      {isAdmin && (
        <>
          <View style={styles.filterRow}>
            {[
              { key: "all", label: "Todas" },
              { key: "pendiente", label: "Pendientes" },
              { key: "aceptada", label: "Aprobadas" },
              { key: "rechazada", label: "Rechazadas" },
            ].map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={[
                  styles.filterPill,
                  filter === opt.key && styles.filterPillActive,
                ]}
                onPress={() => setFilter(opt.key)}
                disabled={loading}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    filter === opt.key && styles.filterPillTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <FlatList
            data={adminRequests}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <RequestCardAdmin
                req={item}
                disabled={loading}
                onApprove={() => handleSetStatus(item.id, "aceptada")}
                onReject={() => handleSetStatus(item.id, "rechazada")}
              />
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No hay solicitudes con este filtro.</Text>
            }
            contentContainerStyle={{ paddingBottom: 120 }}
          />
        </>
      )}

      <BottomBar goToMenu={goToMenu} isAdmin={isAdmin} />
    </View>
  );
}

/* --- ESTILOS --- */
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingHorizontal: 16,
    paddingTop: 18,
  },
  title: { fontSize: 20, fontWeight: "700", color: COLORS.text },
  subtitle: { fontSize: 12, color: COLORS.textSoft, marginBottom: 10 },
  msgText: { marginTop: 4, fontSize: 10, color: COLORS.primary },

  formCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
  },
  formTitle: { fontSize: 14, fontWeight: "600", color: COLORS.text, marginBottom: 6 },
  label: { fontSize: 10, color: COLORS.textSoft, marginTop: 4, marginBottom: 2 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: "#ffffff",
    fontSize: 11,
    color: COLORS.text,
  },
  inputMultiline: { minHeight: 70, textAlignVertical: "top" },

  // ✅ contador
  counterText: {
    marginTop: 4,
    fontSize: 10,
    color: COLORS.textSoft,
    textAlign: "right",
  },

  btn: {
    marginTop: 10,
    paddingVertical: 8,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  btnDisabled: { opacity: 0.6 },
  btnPrimaryFull: { backgroundColor: COLORS.primary },
  btnPrimaryText: { color: "#ffffff", fontSize: 12, fontWeight: "600" },

  sectionTitle: { fontSize: 13, fontWeight: "600", color: COLORS.text, marginBottom: 6 },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 8,
  },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", marginBottom: 4 },
  cardTitleWrapper: { flex: 1, marginRight: 8 },
  cardTitle: { fontSize: 14, fontWeight: "600", color: COLORS.text },
  cardText: { fontSize: 10, color: COLORS.text, marginBottom: 4 },
  cardMeta: { fontSize: 9, color: COLORS.textSoft },

  cardActionsRow: { flexDirection: "row", marginTop: 6, gap: 6 },

  btnApprove: {
    flex: 1,
    backgroundColor: COLORS.success,
    borderRadius: 999,
    paddingVertical: 6,
    alignItems: "center",
  },
  btnApproveText: { fontSize: 10, color: "#ffffff", fontWeight: "600" },

  btnReject: {
    flex: 1,
    backgroundColor: "#fee2e2",
    borderRadius: 999,
    paddingVertical: 6,
    alignItems: "center",
  },
  btnRejectText: { fontSize: 10, color: COLORS.danger, fontWeight: "600" },

  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  statusBadgeText: { fontSize: 9, fontWeight: "600" },

  filterRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 8 },
  filterPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterPillActive: { backgroundColor: COLORS.primarySoft, borderColor: COLORS.primary },
  filterPillText: { fontSize: 10, color: COLORS.textSoft },
  filterPillTextActive: { color: COLORS.primary, fontWeight: "600" },

  emptyText: { fontSize: 11, color: COLORS.textSoft, textAlign: "center", marginTop: 16 },

  bottomBar: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 40,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: "row",
    backgroundColor: COLORS.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    gap: 8,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  bottomBtn: {
    flex: 1.4,
    paddingVertical: 7,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomBtnPrimary: { backgroundColor: COLORS.primary },
  bottomBtnText: { color: "#ffffff", fontSize: 11, fontWeight: "600" },
  bottomInfo: { flex: 1, alignItems: "flex-end" },
  bottomInfoText: { fontSize: 9, color: COLORS.textSoft },
});
