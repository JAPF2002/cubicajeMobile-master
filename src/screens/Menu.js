// src/screens/Menu.js
import React from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useApp } from "../store";

let BODEGA_ICON = null;
try { BODEGA_ICON = require("../assets/images/bodega-icon.png"); } catch { BODEGA_ICON = null; }

export default function Menu() {
  const { currentUser, pendingCount, onLogout } = useApp();
  const nav = useNavigation();

  const handleCerrarSesion = async () => {
    if (currentUser) await onLogout(); // si hay sesión, la cierra
    nav.navigate("Auth");              // y muestra la pantalla de login
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
      <Text style={s.title}>Menú Principal</Text>
      {BODEGA_ICON
        ? <Image source={BODEGA_ICON} style={{ width: 120, height: 120, marginBottom: 20 }} />
        : <Text style={{ fontSize: 64, marginBottom: 20 }}>🏬</Text>}
      <Text style={{ color: "#334155", marginBottom: 14 }}>
        Hola, <Text style={{ fontWeight: "700" }}>{currentUser?.name || "Invitado"}</Text> · Rol:{" "}
        <Text style={{ fontWeight: "700" }}>{currentUser?.role || "N/A"}</Text>
      </Text>

      <TouchableOpacity style={s.btn} onPress={() => nav.navigate("Bodegas")}>
        <Text style={s.btnTxt}>Interfaz de Bodegas</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[s.btn, { backgroundColor: "#64748b" }]} onPress={() => nav.navigate("Items")}>
        <Text style={s.btnTxt}>Interfaz de Ítems</Text>
      </TouchableOpacity>

      {currentUser?.role === "admin" && (
        <>
          <TouchableOpacity style={[s.btn, { backgroundColor: "#0ea5e9" }]} onPress={() => nav.navigate("AdminUsers")}>
            <Text style={s.btnTxt}>
              Administrar {pendingCount > 0 ? `· ${pendingCount} solicitud(es)` : "usuarios/solicitudes"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.btn, { backgroundColor: "#0f766e" }]} onPress={() => nav.navigate("UsersList")}>
            <Text style={s.btnTxt}>Lista de usuarios</Text>
          </TouchableOpacity>
        </>
      )}

      {/* Botón único: siempre indica "Cerrar sesión" */}
      <TouchableOpacity style={[s.btn, { backgroundColor: "#dc2626" }]} onPress={handleCerrarSesion}>
        <Text style={s.btnTxt}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  title: { fontSize: 22, fontWeight: "700", marginBottom: 12 },
  btn: { backgroundColor: "#2563eb", padding: 14, borderRadius: 12, marginTop: 10, width: 260 },
  btnTxt: { color: "#fff", textAlign: "center", fontWeight: "700" },
});
