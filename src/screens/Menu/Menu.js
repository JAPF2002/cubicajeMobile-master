// src/screens/Menu/Menu.js
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useApp } from "../../store";

export default function Menu() {
  const navigation = useNavigation();
  const { currentUser, logout } = useApp();

  const nombre = currentUser?.nombre || currentUser?.name || "Invitado";

  const roleLabel = !currentUser
    ? "Invitado"
    : currentUser.role === "admin" || currentUser.rol === "admin"
    ? "Administrador"
    : "Empleado";

  const isAdmin =
    currentUser?.role === "admin" || currentUser?.rol === "admin";

  const goToBodegas = () => {
    navigation.navigate("Bodegas"); // nombre de la tab
  };

  const goToItemsList = () => {
    navigation.navigate("Items"); // nombre de la tab
  };

  const goToPerfil = () => {
    navigation.navigate("Profile");
  };

  const goToSolicitudes = () => {
    navigation.navigate("Solicitudes");
  };

  const goToUsers = () => {
    navigation.navigate("UsersList");
  };

  const goToLogin = () => {
    logout(); // limpiamos currentUser en el store
    navigation.replace("Login");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Menú Principal</Text>

      <Text style={styles.subtitle}>
        Hola, <Text style={styles.bold}>{nombre}</Text> · Rol:{" "}
        <Text style={styles.bold}>{roleLabel}</Text>
      </Text>

      {/* Bodegas */}
      <TouchableOpacity style={styles.btn} onPress={goToBodegas}>
        <Text style={styles.btnTxt}>Bodegas</Text>
      </TouchableOpacity>

      {/* Ítems */}
      <TouchableOpacity style={styles.btn} onPress={goToItemsList}>
        <Text style={styles.btnTxt}>Ítems</Text>
      </TouchableOpacity>

      {/* Perfil */}
      <TouchableOpacity style={styles.btn} onPress={goToPerfil}>
        <Text style={styles.btnTxt}>Perfil</Text>
      </TouchableOpacity>

      {/* Solicitudes */}
      <TouchableOpacity style={styles.btn} onPress={goToSolicitudes}>
        <Text style={styles.btnTxt}>Solicitudes</Text>
      </TouchableOpacity>

      {/* Gestión de usuarios solo admin */}
      {isAdmin && (
        <TouchableOpacity style={styles.btn} onPress={goToUsers}>
          <Text style={styles.btnTxt}>Lista de usuarios</Text>
        </TouchableOpacity>
      )}

      {/* Cerrar sesión */}
      <TouchableOpacity
        style={[styles.btn, styles.logoutBtn]}
        onPress={goToLogin}
      >
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
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 12,
    color: "#e5e7eb",
  },
  subtitle: {
    color: "#9ca3af",
    marginBottom: 16,
    fontSize: 13,
  },
  bold: {
    fontWeight: "700",
    color: "#ffffff",
  },
  btn: {
    backgroundColor: "#2563eb",
    padding: 14,
    borderRadius: 12,
    marginTop: 10,
  },
  btnTxt: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
    fontSize: 14,
  },
  logoutBtn: {
    backgroundColor: "#ef4444",
    marginTop: 18,
  },
  logoutTxt: {
    color: "#ffffff",
    textAlign: "center",
    fontWeight: "700",
    fontSize: 14,
  },
});
