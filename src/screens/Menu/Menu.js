// src/screens/Menu/Menu.js
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useApp } from "../../store";

export default function Menu() {
  const navigation = useNavigation();
  const { currentUser, logout } = useApp();

  const userName = currentUser?.nombre || currentUser?.name || "Invitado";
  const roleKey = currentUser?.role || currentUser?.rol || "invitado";

  const roleLabel =
    roleKey === "admin"
      ? "Administrador"
      : roleKey === "empleado"
      ? "Empleado"
      : "Invitado";

  const goToBodegas = () => navigation.navigate("Bodegas"); // nombre de la tab
  const goToItemsList = () => navigation.navigate("Items"); // nombre de la tab
  const goToPerfil = () => navigation.navigate("Profile");
  const goToSolicitudes = () => navigation.navigate("Solicitudes");
  const goToUsers = () => navigation.navigate("UsersList");

  // ✅ ÚNICO BOTÓN: entra a Movimientos (y desde ahí vas a Informe)
  const goToHistorial = () => navigation.navigate("Movimientos");

  const goToLogin = () => {
    logout();
    navigation.replace("Login");
  };

  const isAdmin = roleKey === "admin";

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Menú Principal</Text>

      <Text style={styles.subtitle}>
        Hola, <Text style={styles.bold}>{userName}</Text> · Rol:{" "}
        <Text style={styles.bold}>{roleLabel}</Text>
      </Text>

      <TouchableOpacity style={styles.btn} onPress={goToBodegas}>
        <Text style={styles.btnTxt}>Bodegas</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.btn} onPress={goToItemsList}>
        <Text style={styles.btnTxt}>Ítems</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.btn} onPress={goToPerfil}>
        <Text style={styles.btnTxt}>Perfil</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.btn} onPress={goToSolicitudes}>
        <Text style={styles.btnTxt}>Solicitudes</Text>
      </TouchableOpacity>

      {/* ✅ Historial (Movimientos + Informe adentro) */}
      <TouchableOpacity style={styles.btn} onPress={goToHistorial}>
        <Text style={styles.btnTxt}>Historial</Text>
      </TouchableOpacity>

      {isAdmin && (
        <TouchableOpacity style={styles.btn} onPress={goToUsers}>
          <Text style={styles.btnTxt}>Lista de usuarios</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={[styles.btn, styles.logoutBtn]} onPress={goToLogin}>
        <Text style={styles.logoutTxt}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    backgroundColor: "#0f172a",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 12,
    color: "#e5e7eb",
  },
  subtitle: {
    color: "#9ca3af",
    marginBottom: 16,
    fontSize: 15,
    lineHeight: 20,
  },
  bold: {
    fontWeight: "700",
    color: "#ffffff",
  },
  btn: {
    backgroundColor: "#2563eb",
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderRadius: 14,
    marginTop: 10,
    minHeight: 52,
    justifyContent: "center",
  },
  btnTxt: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "800",
    fontSize: 18,
    letterSpacing: 0.2,
  },
  logoutBtn: {
    backgroundColor: "#ef4444",
    marginTop: 18,
  },
  logoutTxt: {
    color: "#ffffff",
    textAlign: "center",
    fontWeight: "800",
    fontSize: 18,
    letterSpacing: 0.2,
  },
});
