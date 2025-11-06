// src/screens/AdminUsers.js
import React from "react";
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from "react-native";
import { useApp } from "../store";

export default function AdminUsers(){
  const { requests, bodegas, approveRequest, rejectRequest } = useApp();

  const renderRequest = ({ item:r }) => {
    const b = bodegas.find(x=>x.id===r.bodegaId);
    return (
      <View style={s.card}>
        <Text style={s.cardTitle}>Solicitud #{r.id.slice(0,6)} — {r.status==="pending"?"🟡 Pendiente": r.status==="approved"?"🟢 Aprobada":"🔴 Rechazada"}</Text>
        <Text style={s.cardLine}>Bodega: {b ? `${b.nombre} (${b.active?"activa":"inactiva"})` : "(no encontrada)"}</Text>
        <Text style={s.cardLine}>Fecha: {new Date(r.createdAt).toLocaleString()}</Text>
        {r.status==="pending" && (
          <View style={s.row}>
            <TouchableOpacity style={[s.btn, s.btnOk]} onPress={()=>approveRequest(r.id)}><Text style={s.btnT}>✅ Aprobar</Text></TouchableOpacity>
            <TouchableOpacity style={[s.btn, s.btnNo]} onPress={()=>rejectRequest(r.id)}><Text style={s.btnT}>❌ Rechazar</Text></TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={{flex:1, padding:20}}>
      <Text style={s.title}>Solicitudes de desactivación</Text>
      <FlatList
        data={requests}
        keyExtractor={(r)=>String(r.id)}
        renderItem={renderRequest}
        ListEmptyComponent={<Text style={{textAlign:"center", color:"#64748b"}}>No hay solicitudes.</Text>}
      />
    </View>
  );
}

const s = StyleSheet.create({
  title:{fontSize:22,fontWeight:"700",marginBottom:12},
  card:{backgroundColor:"#fff", borderWidth:1, borderColor:"#d4d4d8", borderRadius:12, padding:14, marginBottom:12},
  cardTitle:{fontSize:18, fontWeight:"700", color:"#1e293b"},
  cardLine:{fontSize:14, color:"#64748b", marginTop:4},
  row:{flexDirection:"row", gap:8, marginTop:8},
  btn:{flex:1, padding:12, borderRadius:10, alignItems:"center"},
  btnOk:{backgroundColor:"#16a34a"}, btnNo:{backgroundColor:"#dc2626"},
  btnT:{color:"#fff", fontWeight:"700"},
});
