// src/screens/Perfil/ProfileScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

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

export default function ProfileScreen() {
  const navigation = useNavigation();

  // Datos DEMO por ahora (sin store, solo UI)
  const [nombre, setNombre] = useState("Empleado Demo");
  const [correo, setCorreo] = useState("empleado@demo.cl");
  const [role] = useState("empleado"); // "admin" | "empleado"

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [editing, setEditing] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const validatePassword = (pwd) => {
    if (pwd.length < 12) return "La contraseña debe tener al menos 12 caracteres.";
    if (!/[A-Z]/.test(pwd)) return "Debe incluir al menos una letra mayúscula.";
    if (!/[a-z]/.test(pwd)) return "Debe incluir al menos una letra minúscula.";
    if (!/[0-9]/.test(pwd)) return "Debe incluir al menos un número.";
    if (!/[!@#$%^&*()_+\-=[\]{};':\"\\|,.<>/?`~]/.test(pwd))
      return "Debe incluir al menos un símbolo especial.";
    return "";
  };

  const handleSave = () => {
    setErrorMsg("");
    setSavedMsg("");

    if (!nombre.trim() || !correo.trim()) {
      setErrorMsg("Nombre y correo son obligatorios.");
      return;
    }

    if (newPassword || confirmPassword) {
      if (!newPassword || !confirmPassword) {
        setErrorMsg("Debes ingresar la nueva contraseña en ambos campos.");
        return;
      }
      const pwdError = validatePassword(newPassword);
      if (pwdError) {
        setErrorMsg(pwdError);
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMsg("Las contraseñas no coinciden.");
        return;
      }
      // Por ahora NO guardamos en backend, solo simulamos éxito
    }

    setEditing(false);
    setNewPassword("");
    setConfirmPassword("");
    setErrorMsg("");
    setSavedMsg("Cambios guardados correctamente.");
    setTimeout(() => setSavedMsg(""), 2000);
  };

  const handleCancel = () => {
    // Como no tenemos backend todavía, solo limpiamos campos de contraseña y salimos de edición
    setNewPassword("");
    setConfirmPassword("");
    setErrorMsg("");
    setSavedMsg("");
    setEditing(false);
  };

  const initials = (nombre || "AD")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const goToMenu = () => {
    navigation.navigate("Menu");
  };

  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Mi perfil</Text>
            <Text style={styles.subtitle}>
              Gestiona los datos de tu cuenta.
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.avatarRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{nombre || "Usuario"}</Text>
              <Text style={styles.email}>{correo || "sin correo"}</Text>
              <View style={styles.rolePill}>
                <Text style={styles.rolePillText}>
                  {role === "admin" ? "Administrador" : "Empleado"}
                </Text>
              </View>
            </View>
          </View>

          {editing ? (
            <>
              <Text style={styles.label}>Nombre</Text>
              <TextInput
                style={styles.input}
                value={nombre}
                onChangeText={setNombre}
                placeholder="Tu nombre"
                placeholderTextColor={COLORS.textSoft}
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
              />

              <Text style={styles.label}>Nueva contraseña</Text>
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                placeholder="Opcional, si deseas cambiarla"
                placeholderTextColor={COLORS.textSoft}
              />

              <Text style={styles.label}>Confirmar nueva contraseña</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                placeholder="Repite la nueva contraseña"
                placeholderTextColor={COLORS.textSoft}
              />

              <View style={styles.requirementsBox}>
                <Text style={styles.requireTitle}>
                  Requisitos para cambiar la contraseña:
                </Text>
                <Text style={styles.requireItem}>
                  • Mínimo 12 caracteres.
                </Text>
                <Text style={styles.requireItem}>
                  • Al menos una letra mayúscula (A-Z).
                </Text>
                <Text style={styles.requireItem}>
                  • Al menos una letra minúscula (a-z).
                </Text>
                <Text style={styles.requireItem}>
                  • Al menos un número (0-9).
                </Text>
                <Text style={styles.requireItem}>
                  • Al menos un símbolo especial (!@#$%^&*...).
                </Text>
              </View>
            </>
          ) : (
            <>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Nombre</Text>
                <Text style={styles.infoValue}>{nombre || "-"}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Correo</Text>
                <Text style={styles.infoValue}>{correo || "-"}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Contraseña</Text>
                <Text style={styles.infoValueMuted}>••••••••</Text>
              </View>
            </>
          )}

          {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}
          {savedMsg ? <Text style={styles.savedText}>{savedMsg}</Text> : null}
        </View>
      </View>

      {/* Bottom bar flotante */}
      <View style={styles.bottomBar}>
        {editing ? (
          <>
            <TouchableOpacity
              style={[styles.bottomBtn, styles.bottomBtnGhost]}
              onPress={handleCancel}
            >
              <Text style={styles.bottomBtnGhostText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.bottomBtn, styles.bottomBtnPrimary]}
              onPress={handleSave}
            >
              <Text style={styles.bottomBtnText}>Guardar cambios</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.bottomBtn, styles.bottomBtnGhost]}
              onPress={goToMenu}
            >
              <Text style={styles.bottomBtnGhostText}>Menú</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.bottomBtn, styles.bottomBtnPrimary]}
              onPress={() => setEditing(true)}
            >
              <Text style={styles.bottomBtnText}>Editar perfil</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 140, // reserva espacio para la barra
  },
  content: { flex: 1, justifyContent: "center" },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  title: { fontSize: 22, fontWeight: "700", color: COLORS.text },
  subtitle: { fontSize: 12, color: COLORS.textSoft },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 280,
    justifyContent: "flex-start",
  },
  avatarRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
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
  email: { fontSize: 12, color: COLORS.textSoft },
  rolePill: {
    alignSelf: "flex-start",
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: COLORS.primarySoft,
  },
  rolePillText: { fontSize: 10, color: "#ffffff", fontWeight: "600" },
  label: {
    fontSize: 11,
    color: COLORS.textSoft,
    marginTop: 8,
    marginBottom: 2,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: COLORS.cardSoft,
    fontSize: 12,
    color: COLORS.text,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  infoLabel: { fontSize: 11, color: COLORS.textSoft },
  infoValue: { fontSize: 12, color: COLORS.text, fontWeight: "500" },
  infoValueMuted: { fontSize: 12, color: COLORS.textSoft },
  requirementsBox: { marginTop: 8 },
  requireTitle: {
    fontSize: 10,
    color: COLORS.danger,
    fontWeight: "600",
    marginBottom: 2,
  },
  requireItem: { fontSize: 10, color: COLORS.danger, marginBottom: 1 },
  errorText: {
    marginTop: 8,
    fontSize: 11,
    color: COLORS.danger,
    fontWeight: "500",
  },
  savedText: {
    marginTop: 6,
    fontSize: 11,
    color: COLORS.accent,
    fontWeight: "500",
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
    paddingVertical: 8,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomBtnPrimary: { backgroundColor: COLORS.primary },
  bottomBtnText: { color: "#ffffff", fontSize: 12, fontWeight: "600" },
  bottomBtnGhost: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  bottomBtnGhostText: {
    color: COLORS.textSoft,
    fontSize: 11,
    fontWeight: "600",
  },
});
