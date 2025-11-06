import React from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import { clearSession } from "../auth/session";

let BODEGA_ICON = null;
try { BODEGA_ICON = require("../../assets/images/planning.png"); } catch {}

export default function MenuScreen({ navigation, user }) {
  const goTabs = () => navigation.replace("AppTabs"); // a las tabs (Items/Spaces/Plannings)
  const logout = async () => { await clearSession(); navigation.replace("Login"); };

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Menú principal</Text>
      {BODEGA_ICON ? <Image source={BODEGA_ICON} style={{width:120,height:120,marginBottom:12}}/> : <Text style={{fontSize:64}}>🏬</Text>}
      <Text style={styles.sub}>Hola <Text style={{fontWeight:"800"}}>{user?.name ?? "Usuario"}</Text></Text>

      <TouchableOpacity style={styles.btnPri} onPress={goTabs}><Text style={styles.btnTx}>Entrar a la app</Text></TouchableOpacity>
      <TouchableOpacity style={styles.btnSec} onPress={logout}><Text style={styles.btnTx}>Cerrar sesión</Text></TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap:{ flex:1, alignItems:"center", justifyContent:"center", padding:24 },
  title:{ fontSize:22, fontWeight:"800", color:"#0f172a", marginBottom:10 },
  sub:{ color:"#475569", marginBottom:16 },
  btnPri:{ backgroundColor:"#2563eb", borderRadius:12, padding:14, minWidth:220, marginTop:4 },
  btnSec:{ backgroundColor:"#64748b", borderRadius:12, padding:14, minWidth:220, marginTop:10 },
  btnTx:{ color:"#fff", textAlign:"center", fontWeight:"800" },
});
