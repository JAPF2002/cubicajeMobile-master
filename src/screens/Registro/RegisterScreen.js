// src/screens/Registro/RegisterScreen.js

import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

const COLORS = {
  bg: "#020817",
  card: "#020817",
  primary: "#2563eb",
  primarySoft: "#1d4ed8",
  border: "#1f2937",
  text: "#e5e7eb",
  textSoft: "#9ca3af",
  danger: "#ef4444",
  success: "#22c55e",
};

export default function RegisterScreen() {
  const navigation = useNavigation();

  const [nombre, setNombre] = useState("");
  const [rut, setRut] = useState(""); // solo cuerpo (sin DV)
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");

  const rules = useMemo(() => {
    const pwd = password || "";
    return {
      len: pwd.length >= 12,
      upper: /[A-Z]/.test(pwd),
      lower: /[a-z]/.test(pwd),
      digit: /[0-9]/.test(pwd),
      symbol: /[^A-Za-z0-9]/.test(pwd),
    };
  }, [password]);

  const validatePassword = (pwd) => {
    if (!pwd || pwd.length < 12)
      return "La contraseña debe tener al menos 12 caracteres.";
    if (!/[A-Z]/.test(pwd)) return "Debe incluir al menos una letra mayúscula.";
    if (!/[a-z]/.test(pwd)) return "Debe incluir al menos una letra minúscula.";
    if (!/[0-9]/.test(pwd)) return "Debe incluir al menos un número.";
    if (!/[^A-Za-z0-9]/.test(pwd))
      return "Debe incluir al menos un símbolo.";
    return "";
  };

  // RUT: solo números, sin DV (máx 8 dígitos)
  const onChangeRut = (v) => {
    const onlyDigits = (v || "").replace(/\D/g, "").slice(0, 8);
    setRut(onlyDigits);
  };

  const goToLogin = () => {
    navigation.goBack(); // volvemos al login
  };

  const handleRegister = () => {
    setError("");
    setOkMsg("");

    if (!nombre.trim() || !rut.trim()) {
      setError("Completa nombre y RUT.");
      return;
    }
    if (rut.length < 7 || rut.length > 8) {
      setError("El RUT debe ser solo el número sin DV.");
      return;
    }
    if (!password || !confirm) {
      setError("Debes ingresar y confirmar la contraseña.");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    const pwdError = validatePassword(password);
    if (pwdError) {
      setError(pwdError);
      return;
    }

    // POR AHORA: solo mostramos mensaje y volvemos al login
    setOkMsg("Cuenta creada. Ahora puedes iniciar sesión.");
    setNombre("");
    setRut("");
    setCorreo("");
    setPassword("");
    setConfirm("");

    setTimeout(() => {
      setOkMsg("");
      goToLogin();
    }, 900);
  };

  const RuleLine = ({ ok, text }) => (
    <View style={styles.ruleRow}>
      <Text
        style={[
          styles.ruleDot,
          { backgroundColor: ok ? COLORS.success : COLORS.border },
        ]}
      />
      <Text
        style={[
          styles.ruleText,
          { color: ok ? COLORS.success : COLORS.textSoft },
        ]}
      >
        {text}
      </Text>
    </View>
  );

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.card}
        contentContainerStyle={{ paddingBottom: 180 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Crear cuenta</Text>
        <Text style={styles.subtitle}>
          Regístrate como empleado para acceder al sistema.
        </Text>

        {/* Tipo de cuenta fijo */}
        <View style={styles.typeBox}>
          <Text style={styles.typeLabel}>Tipo de cuenta</Text>
          <Text style={styles.typeValue}>Empleado</Text>
          <Text style={styles.typeHint}>
            Los permisos de administrador solo pueden ser asignados por un
            usuario con rol Admin.
          </Text>
        </View>

        <Text style={styles.label}>Nombre completo</Text>
        <TextInput
          style={styles.input}
          value={nombre}
          onChangeText={setNombre}
          placeholder="Ej: Juan Pérez"
          placeholderTextColor={COLORS.textSoft}
        />

        <Text style={styles.label}>RUT</Text>
        <TextInput
          style={styles.input}
          value={rut}
          onChangeText={onChangeRut}
          keyboardType="number-pad"
          placeholder="Ej: 12345678"
          placeholderTextColor={COLORS.textSoft}
        />
        <Text style={styles.helper}>
          Sin puntos, sin guion y sin dígito verificador (DV).
        </Text>

        <Text style={styles.label}>Correo</Text>
        <TextInput
          style={styles.input}
          value={correo}
          onChangeText={setCorreo}
          autoCapitalize="none"
          keyboardType="default"
          placeholder="Crear correo"
          placeholderTextColor={COLORS.textSoft}
        />

        <Text style={styles.label}>Contraseña</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="Crear contraseña"
          placeholderTextColor={COLORS.textSoft}
        />

        <View style={styles.rulesBox}>
          <Text style={styles.rulesTitle}>Requisitos de seguridad</Text>
          <RuleLine ok={rules.len} text="Al menos 12 caracteres" />
          <RuleLine
            ok={rules.upper}
            text="Incluye al menos una mayúscula (A-Z)"
          />
          <RuleLine
            ok={rules.lower}
            text="Incluye al menos una minúscula (a-z)"
          />
          <RuleLine
            ok={rules.digit}
            text="Incluye al menos un número (0-9)"
          />
          <RuleLine
            ok={rules.symbol}
            text="Incluye al menos un símbolo (!@#$%&*…)"
          />
        </View>

        <Text style={styles.label}>Confirmar contraseña</Text>
        <TextInput
          style={styles.input}
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
          placeholder="Repite la contraseña"
          placeholderTextColor={COLORS.textSoft}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {okMsg ? <Text style={styles.ok}>{okMsg}</Text> : null}

        <TouchableOpacity
          style={[styles.btn, styles.btnPrimary, styles.btnRaised]}
          onPress={handleRegister}
        >
          <Text style={styles.btnPrimaryText}>Crear cuenta</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.linkBtn, styles.linkBtnRaised]}
          onPress={goToLogin}
        >
          <Text style={styles.linkText}>
            ¿Ya tienes cuenta? Inicia sesión
          </Text>
        </TouchableOpacity>
      </ScrollView>
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
    paddingBottom: 20,
  },
  card: {
    width: "100%",
    maxWidth: 400,
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
  typeBox: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "#020817",
    marginBottom: 8,
  },
  typeLabel: { fontSize: 10, color: COLORS.textSoft },
  typeValue: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
    marginTop: 2,
  },
  typeHint: { fontSize: 9, color: COLORS.textSoft, marginTop: 4 },

  helper: { fontSize: 9.5, color: COLORS.textSoft, marginBottom: 6 },

  rulesBox: {
    marginTop: 6,
    marginBottom: 4,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "#0b1220",
  },
  rulesTitle: {
    fontSize: 10,
    color: COLORS.textSoft,
    marginBottom: 6,
    fontWeight: "700",
  },
  ruleRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  ruleDot: { width: 8, height: 8, borderRadius: 999, marginRight: 8 },
  ruleText: { fontSize: 11, fontWeight: "600" },

  error: {
    fontSize: 10,
    color: COLORS.danger,
    marginTop: 6,
    marginBottom: 2,
    fontWeight: "600",
  },
  ok: {
    fontSize: 10,
    color: COLORS.success,
    marginTop: 6,
    marginBottom: 2,
    fontWeight: "600",
  },

  btn: {
    marginTop: 10,
    paddingVertical: 9,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  btnPrimary: { backgroundColor: COLORS.primary },
  btnPrimaryText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "600",
  },

  btnRaised: { marginBottom: 14 },
  linkBtn: { marginTop: 10, alignItems: "center" },
  linkBtnRaised: { marginBottom: 10 },

  linkText: {
    fontSize: 11,
    color: COLORS.textSoft,
    textDecorationLine: "underline",
  },
});
