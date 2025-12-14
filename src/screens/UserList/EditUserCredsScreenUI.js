// src/screens/UserList/EditUserCredsScreenUI.js
import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { getUserById, updateUserById } from "../../features/api";

const COLORS = {
  bg: "#0f172a",
  card: "#111827",
  cardSoft: "#1f2937",
  primary: "#2563eb",
  primarySoft: "#1d4ed8",
  border: "#374151",
  text: "#e5e7eb",
  textSoft: "#9ca3af",
  accent: "#22c55e",
  danger: "#ef4444",
};

export default function EditUserCredsScreenUI() {
    const navigation = useNavigation();
    const route = useRoute();

    const id_usuario = route?.params?.id_usuario;

    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState(null);

    // ✅ Solo los campos que quieres editar
    const [nombre, setNombre] = useState("");
    const [correo, setCorreo] = useState("");
    const [savedMsg, setSavedMsg] = useState("");
    const [errorMsg, setErrorMsg] = useState("");

    const loadUser = async () => {
        if (!id_usuario) return;
        setLoading(true);
        try {
        const resp = await getUserById(id_usuario);
        const usuario = resp?.usuario ?? resp;

        setUser(usuario);
        setNombre(usuario?.nombre ?? "");
        setCorreo(usuario?.correo ?? "");
        } catch (e) {
        console.log("Error al obtener usuario:", e);
        Alert.alert("Error", "No se pudieron cargar los datos del usuario.");
        } finally {
        setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
        loadUser();
        }, [id_usuario])
    );

    const initials = useMemo(() => {
        const base = (nombre || user?.nombre || "US").trim();
        return base
        .split(" ")
        .filter(Boolean)
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
    }, [nombre, user?.nombre]);

  const handleUpdateUser = async () => {    
    setErrorMsg("");
    setSavedMsg("");

    if (!nombre.trim() || !correo.trim()) {
    setErrorMsg("Nombre y correo son obligatorios.");
    return;
    }

    try {
    const updatedData = {
        nombre,
        correo
    };
    const response = await updateUserById(id_usuario, updatedData);
    console.log("Respuesta actualización usuario =>", response);
        if (!response.error) {
            setUser((prev) => ({
            ...(prev || {}),
            nombre,
            correo,
        }));
        Alert.alert("Éxito", "Datos del usuario actualizados correctamente.");
        setSavedMsg("Datos actualizados correctamente.");
        setTimeout(() => setSavedMsg(""), 2000);
    } else {
        Alert.alert("Error", response.authMensaje || "No se pudo crear el usuario. Intenta nuevamente.");
        setErrorMsg("Error al actualizar los datos. Intenta nuevamente.");
    }
    } catch (error) {
    console.log(error)
    Alert.alert("Error", "No se pudieron actualizar los datos del usuario.");
    }
}

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Editar usuario</Text>
              <Text style={styles.subtitle}>
                {loading
                  ? "Cargando datos..."
                  : id_usuario
                  ? `ID usuario: ${id_usuario}`
                  : "No se recibió id_usuario"}
              </Text>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.avatarRow}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.name}>
                  {user?.nombre || (loading ? "Cargando..." : "Usuario")}
                </Text>
                <Text style={styles.emailSmall}>
                  {user?.correo || (loading ? "..." : "sin correo")}
                </Text>

                <View style={styles.rolePill}>
                  <Text style={styles.rolePillText}>
                    {user?.rol === "admin" ? "Administrador" : "Empleado"}
                  </Text>
                </View>
              </View>
            </View>

            {/* Info básica (solo lectura, compacta) */}
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>RUT</Text>
                <Text style={styles.metaValue}>{user?.rut || "-"}</Text>
              </View>

              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Estado</Text>
                <Text style={styles.metaValue}>
                  {user?.estado ? "Activo" : "Inactivo"}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* ✅ Inputs simples */}
            <Text style={styles.label}>Nombre</Text>
            <TextInput
              style={styles.input}
              value={nombre}
              onChangeText={setNombre}
              placeholder="Nombre del usuario"
              placeholderTextColor={COLORS.textSoft}
              editable={!loading}
            />

            <Text style={styles.label}>Correo</Text>
            <TextInput
              style={styles.input}
              value={correo}
              onChangeText={setCorreo}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="tu@correo.cl"
              placeholderTextColor={COLORS.textSoft}
              editable={!loading}
            />

            {loading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator />
                <Text style={styles.loadingText}>Cargando usuario…</Text>
              </View>
            ) : null}
          </View>
        </ScrollView>

        {/* Bottom bar (simple) */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.bottomBtn, styles.bottomBtnGhost]}
            activeOpacity={0.9}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.bottomBtnGhostText}>Volver</Text>
          </TouchableOpacity>

          {/* ✅ SOLO VISUAL / NO FUNCIONAL */}
          <TouchableOpacity
            style={[styles.bottomBtn, styles.bottomBtnPrimary]}
            activeOpacity={0.9}
            onPress={handleUpdateUser}
          >
            <Text style={styles.bottomBtnText}>Guardar</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 140,
  },
  scrollContent: { paddingBottom: 20 },

  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 14, gap: 10 },
  title: { fontSize: 22, fontWeight: "700", color: COLORS.text },
  subtitle: { fontSize: 12, color: COLORS.textSoft, marginTop: 2 },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  avatarRow: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  avatarText: { fontSize: 22, fontWeight: "700", color: "#ffffff" },
  name: { fontSize: 18, fontWeight: "700", color: COLORS.text },
  emailSmall: { fontSize: 12, color: COLORS.textSoft, marginTop: 2 },

  rolePill: {
    alignSelf: "flex-start",
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: COLORS.primarySoft,
  },
  rolePillText: { fontSize: 10, color: "#ffffff", fontWeight: "600" },

  metaRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 2,
    marginBottom: 4,
  },
  metaItem: {
    flex: 1,
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cardSoft,
  },
  metaLabel: { fontSize: 10, color: COLORS.textSoft, marginBottom: 2 },
  metaValue: { fontSize: 12, color: COLORS.text, fontWeight: "600" },

  divider: { height: 1, backgroundColor: COLORS.border, opacity: 0.6, marginVertical: 14 },

  label: { fontSize: 11, color: COLORS.textSoft, marginTop: 8, marginBottom: 2 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
    backgroundColor: COLORS.cardSoft,
    fontSize: 12,
    color: COLORS.text,
  },

  loadingRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 12 },
  loadingText: { color: COLORS.textSoft, fontSize: 12 },

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
    justifyContent: "space-between",
    gap: 8,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  bottomBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomBtnPrimary: { backgroundColor: COLORS.primary },
  bottomBtnText: { color: "#ffffff", fontSize: 12, fontWeight: "800" },
  bottomBtnGhost: { backgroundColor: "transparent", borderWidth: 1, borderColor: COLORS.border },
  bottomBtnGhostText: { color: COLORS.textSoft, fontSize: 11, fontWeight: "800" },
});
