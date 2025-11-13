// src/screens/User/UserFormScreen.js 
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useApp } from "../../store";

const COLORS = {
  bg: "#f8fafc",
  card: "#ffffff",
  primary: "#2563eb",
  primarySoft: "#dbeafe",
  border: "#e5e7eb",
  text: "#0f172a",
  textSoft: "#6b7280",
  danger: "#ef4444",
  success: "#22c55e",
};

export default function UserFormScreen(props) {
  // ⬅️ navegación de React Navigation
  const navigation = useNavigation();

  // props que quizá vengan desde un padre
  const { goToUsersList, goToMenu, user } = props;

  // fallback: si NO vienen las props, usamos navigation
  const goMenu =
    typeof goToMenu === "function"
      ? goToMenu
      : () => navigation.navigate("Menu"); // cambia "Menu" si tu ruta tiene otro nombre

  const goUsers =
    typeof goToUsersList === "function"
      ? goToUsersList
      : () => navigation.navigate("UsersList"); // cambia "UsersList" si tu ruta tiene otro nombre

  const { saveUser } = useApp();

  const [form, setForm] = useState({
    id: null,
    nombre: "",
    rut: "",
    correo: "",
    password: "",
    rol: "empleado",
    active: true,
  });

  useEffect(() => {
    if (user) {
      setForm({
        id: user.id,
        nombre: user.nombre || "",
        rut: user.rut || "",
        correo: user.correo || "",
        password: "",
        rol: user.rol || "empleado",
        active: user.active ?? true,
      });
    } else {
      setForm({
        id: null,
        nombre: "",
        rut: "",
        correo: "",
        password: "",
        rol: "empleado",
        active: true,
      });
    }
  }, [user]);

  const onChange = (field) => (value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const passwordMeetsRules = (pwd) => {
    if (!pwd || pwd.length < 12) return false;
    if (!/[a-z]/.test(pwd)) return false;
    if (!/[A-Z]/.test(pwd)) return false;
    if (!/[0-9]/.test(pwd)) return false;
    if (!/[^A-Za-z0-9]/.test(pwd)) return false;
    return true;
  };

  const handleSave = () => {
    if (!form.nombre.trim()) {
      return Alert.alert("Falta nombre", "Ingresa el nombre del usuario.");
    }
    if (!form.rut.trim()) {
      return Alert.alert("Falta RUT", "Ingresa el RUT del usuario.");
    }
    if (!form.correo.trim()) {
      return Alert.alert("Falta correo", "Ingresa el correo del usuario.");
    }

    if (!form.id) {
      if (!passwordMeetsRules(form.password.trim())) {
        return Alert.alert(
          "Contraseña inválida",
          "La contraseña debe cumplir todos los requisitos indicados."
        );
      }
    }

    if (form.id && form.password.trim()) {
      if (!passwordMeetsRules(form.password.trim())) {
        return Alert.alert(
          "Contraseña inválida",
          "La nueva contraseña debe cumplir todos los requisitos indicados."
        );
      }
    }

    const payload = {
      id: form.id,
      nombre: form.nombre.trim(),
      rut: form.rut.trim(),
      correo: form.correo.trim(),
      rol: form.rol,
      active: form.active,
    };

    if (form.password.trim()) {
      payload.password = form.password.trim();
    }

    saveUser(payload);

    // ⬅️ después de guardar, volvemos a la lista
    goUsers();
  };

  const actionLabel = form.id ? "Guardar cambios" : "Crear usuario";

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>
        {form.id ? "Editar usuario" : "Nuevo usuario"}
      </Text>
      <Text style={styles.subtitle}>Completa los datos del usuario.</Text>

      <ScrollView
        style={styles.formContainer}
        contentContainerStyle={{ paddingBottom: 130 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.label}>Nombre</Text>
        <TextInput
          style={styles.input}
          value={form.nombre}
          onChangeText={onChange("nombre")}
          placeholder="Nombre completo"
        />

        <Text style={styles.label}>RUT</Text>
        <TextInput
          style={styles.input}
          value={form.rut}
          onChangeText={onChange("rut")}
          placeholder="11.111.111-1"
        />

        <Text style={styles.label}>Correo</Text>
        <TextInput
          style={styles.input}
          value={form.correo}
          onChangeText={onChange("correo")}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="usuario@empresa.cl"
        />

        <Text style={styles.label}>Contraseña</Text>
        <TextInput
          style={styles.input}
          value={form.password}
          onChangeText={onChange("password")}
          secureTextEntry
          placeholder={
            form.id
              ? "Deja en blanco para mantener la actual"
              : "Mínimo 12 caracteres + requisitos"
          }
        />

        <View style={styles.passwordInfoContainer}>
          <Text style={styles.passwordInfoTitle}>
            Requisitos para la contraseña:
          </Text>
          <Text style={styles.passwordInfoItem}>• Al menos 12 caracteres.</Text>
          <Text style={styles.passwordInfoItem}>
            • Debe incluir letras mayúsculas y minúsculas.
          </Text>
          <Text style={styles.passwordInfoItem}>
            • Debe incluir al menos un número.
          </Text>
          <Text style={styles.passwordInfoItem}>
            • Debe incluir al menos un símbolo (ej: !@#$%&*).
          </Text>
        </View>

        <Text style={styles.label}>Rol</Text>
        <View style={styles.stateRow}>
          <TouchableOpacity
            style={[
              styles.statePill,
              form.rol === "admin" && styles.statePillActive,
            ]}
            onPress={() => setForm((p) => ({ ...p, rol: "admin" }))}
          >
            <Text
              style={[
                styles.statePillText,
                form.rol === "admin" && styles.statePillTextActive,
              ]}
            >
              Admin
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.statePill,
              form.rol === "empleado" && styles.statePillActive,
            ]}
            onPress={() => setForm((p) => ({ ...p, rol: "empleado" }))}
          >
            <Text
              style={[
                styles.statePillText,
                form.rol === "empleado" && styles.statePillTextActive,
              ]}
            >
              Empleado
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Estado</Text>
        <View style={styles.stateRow}>
          <TouchableOpacity
            style={[
              styles.statePill,
              form.active && styles.statePillActiveGreen,
            ]}
            onPress={() => setForm((p) => ({ ...p, active: true }))}
          >
            <Text
              style={[
                styles.statePillText,
                form.active && styles.statePillTextOnColor,
              ]}
            >
              Activo
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.statePill,
              !form.active && styles.statePillInactiveRed,
            ]}
            onPress={() => setForm((p) => ({ ...p, active: false }))}
          >
            <Text
              style={[
                styles.statePillText,
                !form.active && styles.statePillTextOnColor,
              ]}
            >
              Inactivo
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.bottomBtn} onPress={goMenu}>
          <Text style={styles.bottomBtnText}>Menú principal</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.bottomBtn} onPress={goUsers}>
          <Text style={styles.bottomBtnText}>Usuarios</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.bottomBtn, styles.bottomBtnActive]}
          onPress={handleSave}
        >
          <Text style={[styles.bottomBtnText, styles.bottomBtnTextActive]}>
            {actionLabel}
          </Text>
        </TouchableOpacity>
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
  },
  title: { fontSize: 22, fontWeight: "700", color: COLORS.text },
  subtitle: { fontSize: 13, color: COLORS.textSoft, marginBottom: 12 },
  formContainer: { flex: 1 },
  label: { fontSize: 11, color: COLORS.textSoft, marginBottom: 2, marginTop: 6 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: COLORS.card,
    fontSize: 12,
  },
  stateRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  statePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statePillActive: { backgroundColor: COLORS.primarySoft, borderColor: COLORS.primary },
  statePillText: { fontSize: 11, color: COLORS.textSoft },
  statePillTextActive: { color: COLORS.primary, fontWeight: "600" },
  statePillActiveGreen: { backgroundColor: COLORS.success, borderColor: COLORS.success },
  statePillInactiveRed: { backgroundColor: COLORS.danger, borderColor: COLORS.danger },
  statePillTextOnColor: { color: "#ffffff", fontWeight: "600" },
  passwordInfoContainer: { marginTop: 4, marginBottom: 4 },
  passwordInfoTitle: { fontSize: 10, color: COLORS.danger, fontWeight: "700" },
  passwordInfoItem: { fontSize: 10, color: COLORS.danger, marginTop: 1 },
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
  bottomBtnActive: { backgroundColor: COLORS.primary },
  bottomBtnText: { fontSize: 10.5, color: COLORS.textSoft, fontWeight: "500" },
  bottomBtnTextActive: { color: "#ffffff", fontWeight: "600" },
});
