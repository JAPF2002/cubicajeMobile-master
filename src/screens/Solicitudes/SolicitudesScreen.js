// src/screens/Solicitudes/SolicitudesScreen.js
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

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
  warning: "#f97316",
};

/* --- BADGE DE ESTADO --- */
function StatusBadge({ status }) {
  let label = "";
  let style = {};
  if (status === "pendiente") {
    label = "Pendiente";
    style = { backgroundColor: "#fef3c7", color: "#92400e" };
  } else if (status === "aprobada") {
    label = "Aprobada";
    style = { backgroundColor: "#bbf7d0", color: "#166534" };
  } else if (status === "rechazada") {
    label = "Rechazada";
    style = { backgroundColor: "#fee2e2", color: "#991b1b" };
  } else {
    label = status;
    style = { backgroundColor: COLORS.border, color: COLORS.textSoft };
  }

  return (
    <View style={[styles.statusBadge, { backgroundColor: style.backgroundColor }]}>
      <Text style={[styles.statusBadgeText, { color: style.color }]}>{label}</Text>
    </View>
  );
}

/* --- CARD PARA ADMIN --- */
function RequestCardAdmin({ req, onApprove, onReject }) {
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
          <TouchableOpacity style={[styles.btn, styles.btnApprove]} onPress={onApprove}>
            <Text style={styles.btnApproveText}>Aprobar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.btnReject]} onPress={onReject}>
            <Text style={styles.btnRejectText}>Rechazar</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

/* --- CARD PARA EMPLEADO --- */
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

/* --- PANTALLA PRINCIPAL --- */
export default function SolicitudesScreen() {
  const navigation = useNavigation();

  // Modo demo: usuario fijo (cambia "empleado" por "admin" si quieres ver el modo admin)
  const [currentUser] = useState({
    id: 1,
    name: "Empleado Demo",
    role: "empleado", // pon "admin" para probar vista admin
  });

  const [requests, setRequests] = useState([
    {
      id: 3,
      nombreBodega: "Bodega Iquique Centro",
      detalle: "Cerrar por mantención programada de estanterías.",
      solicitanteId: 1,
      solicitanteNombre: "Empleado Demo",
      status: "pendiente",
    },
    {
      id: 2,
      nombreBodega: "Bodega Alto Hospicio",
      detalle: "Ampliar área de recepción.",
      solicitanteId: 2,
      solicitanteNombre: "Admin Demo",
      status: "aprobada",
    },
    {
      id: 1,
      nombreBodega: "Bodega IQQ Norte",
      detalle: "Cambio de layout por aumento de carga.",
      solicitanteId: 1,
      solicitanteNombre: "Empleado Demo",
      status: "rechazada",
    },
  ]);

  const isAdmin = currentUser.role === "admin";

  const [titulo, setTitulo] = useState("");
  const [motivo, setMotivo] = useState("");
  const [msg, setMsg] = useState("");
  const [filter, setFilter] = useState("pendiente");

  /* --- helpers locales (antes venían del store) --- */
  const createBodegaRequest = (payload) => {
    const maxId = requests.length ? Math.max(...requests.map((r) => r.id)) : 0;
    const nueva = {
      id: maxId + 1,
      status: "pendiente",
      ...payload,
    };
    setRequests((prev) => [nueva, ...prev]);
  };

  const setRequestStatus = (id, status) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status } : r))
    );
  };

  /* --- listas derivadas --- */
  const myRequests = useMemo(
    () =>
      requests
        .filter((r) => r.solicitanteId === currentUser?.id)
        .sort((a, b) => (a.id < b.id ? 1 : -1)),
    [requests, currentUser]
  );

  const filteredAdminRequests = useMemo(() => {
    let list = [...requests].sort((a, b) => (a.id < b.id ? 1 : -1));
    if (filter !== "all") {
      list = list.filter((r) => r.status === filter);
    }
    return list;
  }, [requests, filter]);

  /* --- enviar solicitud (modo demo, solo afecta estado local) --- */
  const handleSendRequest = () => {
    setMsg("");

    if (!titulo.trim() || !motivo.trim()) {
      setMsg("Completa título y motivo para enviar la solicitud.");
      return;
    }

    createBodegaRequest({
      nombreBodega: titulo.trim(),
      ciudad: "",
      detalle: motivo.trim(),
      solicitanteId: currentUser?.id,
      solicitanteNombre: currentUser?.name || "Empleado",
    });

    setTitulo("");
    setMotivo("");
    setMsg("Solicitud enviada. Podrás ver aquí el estado.");
    setTimeout(() => setMsg(""), 2500);
  };

  const goToMenu = () => {
    navigation.navigate("Menu");
  };

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>{isAdmin ? "Solicitudes" : "Mis solicitudes"}</Text>
      <Text style={styles.subtitle}>
        {isAdmin
          ? "Revisa, aprueba o rechaza solicitudes."
          : "Envía una solicitud y revisa el estado de tus pedidos."}
      </Text>

      {/* VISTA EMPLEADO */}
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
            />

            <TouchableOpacity
              style={[styles.btn, styles.btnPrimaryFull]}
              onPress={handleSendRequest}
            >
              <Text style={styles.btnPrimaryText}>Enviar solicitud</Text>
            </TouchableOpacity>

            {msg ? <Text style={styles.msgText}>{msg}</Text> : null}
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

      {/* VISTA ADMIN */}
      {isAdmin && (
        <>
          <View style={styles.filterRow}>
            {[
              { key: "all", label: "Todas" },
              { key: "pendiente", label: "Pendientes" },
              { key: "aprobada", label: "Aprobadas" },
              { key: "rechazada", label: "Rechazadas" },
            ].map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={[
                  styles.filterPill,
                  filter === opt.key && styles.filterPillActive,
                ]}
                onPress={() => setFilter(opt.key)}
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
            data={filteredAdminRequests}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <RequestCardAdmin
                req={item}
                onApprove={() => setRequestStatus(item.id, "aprobada")}
                onReject={() => setRequestStatus(item.id, "rechazada")}
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
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textSoft,
    marginBottom: 10,
  },
  formCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
  },
  formTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 6,
  },
  label: {
    fontSize: 10,
    color: COLORS.textSoft,
    marginTop: 4,
    marginBottom: 2,
  },
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
  inputMultiline: {
    minHeight: 70,
    textAlignVertical: "top",
  },
  btn: {
    marginTop: 10,
    paddingVertical: 8,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  btnPrimaryFull: {
    backgroundColor: COLORS.primary,
  },
  btnPrimaryText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
  msgText: {
    marginTop: 4,
    fontSize: 10,
    color: COLORS.primary,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 6,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 8,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  cardTitleWrapper: {
    flex: 1,
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
  },
  cardText: {
    fontSize: 10,
    color: COLORS.text,
    marginBottom: 4,
  },
  cardMeta: {
    fontSize: 9,
    color: COLORS.textSoft,
  },
  cardActionsRow: {
    flexDirection: "row",
    marginTop: 6,
    gap: 6,
  },
  btnApprove: {
    flex: 1,
    backgroundColor: COLORS.success,
    borderRadius: 999,
    paddingVertical: 6,
    alignItems: "center",
  },
  btnApproveText: {
    fontSize: 10,
    color: "#ffffff",
    fontWeight: "600",
  },
  btnReject: {
    flex: 1,
    backgroundColor: "#fee2e2",
    borderRadius: 999,
    paddingVertical: 6,
    alignItems: "center",
  },
  btnRejectText: {
    fontSize: 10,
    color: COLORS.danger,
    fontWeight: "600",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: "600",
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 8,
  },
  filterPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterPillActive: {
    backgroundColor: COLORS.primarySoft,
    borderColor: COLORS.primary,
  },
  filterPillText: {
    fontSize: 10,
    color: COLORS.textSoft,
  },
  filterPillTextActive: {
    color: COLORS.primary,
    fontWeight: "600",
  },
  emptyText: {
    fontSize: 11,
    color: COLORS.textSoft,
    textAlign: "center",
    marginTop: 16,
  },
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
  bottomBtnPrimary: {
    backgroundColor: COLORS.primary,
  },
  bottomBtnText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "600",
  },
  bottomInfo: {
    flex: 1,
    alignItems: "flex-end",
  },
  bottomInfoText: {
    fontSize: 9,
    color: COLORS.textSoft,
  },
});
