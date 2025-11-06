// src/screens/UsersListScreen.js
import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { LocalStore, K_USERS } from "../store";

export default function UsersListScreen(){
  const [users, setUsers] = useState([]);

  useEffect(()=>{
    (async ()=>{
      const arr = JSON.parse((await LocalStore.getItem(K_USERS)) || "[]");
      setUsers(arr);
    })();
  },[]);

  const renderUser = ({ item:u }) => (
    <View style={s.card}>
      <Text style={s.cardTitle}>{u.name} <Text style={s.badge}>({u.role})</Text></Text>
      <Text style={s.cardLine}>📧 {u.email}</Text>
      <Text style={s.cardLine}>✔ Verificado: {u.emailVerified ? "Sí" : "No"}</Text>
    </View>
  );

  return (
    <View style={{flex:1, padding:20}}>
      <Text style={s.title}>Usuarios</Text>
      <FlatList
        data={users}
        keyExtractor={(u)=>String(u.id)}
        renderItem={renderUser}
        ListEmptyComponent={<Text style={{textAlign:"center", color:"#64748b"}}>No hay usuarios.</Text>}
      />
    </View>
  );
}

const s = StyleSheet.create({
  title:{fontSize:22,fontWeight:"700",marginBottom:12},
  card:{backgroundColor:"#fff", borderWidth:1, borderColor:"#d4d4d8", borderRadius:12, padding:14, marginBottom:12},
  cardTitle:{fontSize:18, fontWeight:"700", color:"#1e293b"},
  cardLine:{fontSize:14, color:"#64748b", marginTop:4},
  badge:{color:"#64748b", fontWeight:"600"},
});
