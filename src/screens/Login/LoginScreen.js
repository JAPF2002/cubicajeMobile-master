// src/screens/Login/LoginScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useApp } from "../../store";

const COLORS = {
  bg: "#0f172a",
  card: "#111827",
  primary: "#2563eb",
  border: "#1f2937",
  text: "#e5e7eb",
  textSoft: "#9ca3af",
  danger: "#ef4444",
};

export default function LoginScreen() {
  const navigation = useNavigation();
  const { loginAsDemo, loginWithCredentials } = useApp();

  const [correo, setCorreo] = useState("admin@demo.cl");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");

  const irAlMain = () => {
    navigation.replace("Main");
  };

  const handleLogin = () => {
    setError("");
    const res = loginWithCredentials(correo, password);
    if (!res.ok) {
      setError(res.error || "No se pudo iniciar sesión.");
      return;
    }
    irAlMain();
  };

  const quickLogin = (type) => {
    // "admin" o "empleado"
    loginAsDemo(type);
    irAlMain();
  };

  const goToRegister = () => {
    navigation.navigate("Register");
  };

  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.title}>Ingreso</Text>
        <Text style={styles.subtitle}>
          Usa tu correo y contraseña para acceder.
        </Text>

        <Text style={styles.label}>Correo</Text>
        <TextInput
          style={styles.input}
          value={correo}
          onChangeText={setCorreo}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="ej: admin@demo.cl"
          placeholderTextColor={COLORS.textSoft}
        />

        <Text style={styles.label}>Contraseña</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="Tu contraseña"
          placeholderTextColor={COLORS.textSoft}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.btn, styles.btnPrimary]}
          onPress={handleLogin}
        >
          <Text style={styles.btnPrimaryText}>Ingresar</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <Text style={styles.helper}>Demo rápida:</Text>

        <View style={styles.quickRow}>
          <TouchableOpacity
            style={styles.quickBtn}
            onPress={() => quickLogin("admin")}
          >
            <Text style={styles.quickText}>Admin Demo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickBtn}
            onPress={() => quickLogin("empleado")}
          >
            <Text style={styles.quickText}>Empleado Demo</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.linkBtn} onPress={goToRegister}>
          <Text style={styles.linkText}>
            ¿No tienes cuenta?{" "}
            <Text style={styles.linkTextStrong}>Crear cuenta</Text>
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
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textSoft,
    marginBottom: 14,
  },
  label: {
    fontSize: 11,
    color: COLORS.textSoft,
    marginTop: 6,
    marginBottom: 2,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    color: COLORS.text,
    marginBottom: 4,
  },
  btn: {
    marginTop: 10,
    paddingVertical: 9,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  btnPrimary: {
    backgroundColor: COLORS.primary,
  },
  btnPrimaryText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 10,
  },
  helper: {
    fontSize: 10,
    color: COLORS.textSoft,
    marginBottom: 6,
  },
  quickRow: {
    flexDirection: "row",
    gap: 8,
  },
  quickBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
  },
  quickText: {
    fontSize: 10,
    color: COLORS.textSoft,
    fontWeight: "500",
  },
  linkBtn: {
    marginTop: 10,
    alignItems: "center",
  },
  linkText: {
    fontSize: 10,
    color: COLORS.textSoft,
  },
  linkTextStrong: {
    color: COLORS.primary,
    fontWeight: "600",
  },
  error: {
    color: COLORS.danger,
    fontSize: 10,
    marginTop: 4,
  },
});
