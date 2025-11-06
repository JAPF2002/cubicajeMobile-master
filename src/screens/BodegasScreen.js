// src/screens/BodegasScreen.js
import React, { useState, useMemo } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, FlatList, ScrollView, Vibration, StyleSheet } from "react-native";
import { useApp, vol, clampInt } from "../store";

export default function BodegasScreen(){
  const { currentUser,bodegas,itemsByBodega,metricsOf,saveBodega,deleteBodegaOrphanItems,setBodegaActive,createDeactivateRequest } = useApp();
  const [tab,setTab]=useState("view");
  const [form,setForm]=useState({ id:null, nombre:"", direccion:"", ciudad:"Iquique", ancho:"", alto:"", largo:"", active:true });

  const guardar=async()=>{
    if(!form.nombre.trim()||!form.direccion.trim()) return Alert.alert("Campos incompletos","Completa nombre y dirección.");
    await saveBodega({ ...form, nombre:form.nombre.trim(), direccion:form.direccion.trim(), active:form.active??true });
    setForm({ id:null, nombre:"", direccion:"", ciudad:"Iquique", ancho:"", alto:"", largo:"", active:true });
    setTab("view");
  };

  const confirmarEliminarCliente=(b)=>{
    Alert.alert("Eliminar bodega","Sus ítems quedarán sueltos (sin bodega).",[
      {text:"Cancelar",style:"cancel"},
      {text:"Eliminar",style:"destructive", onPress:async()=>{ Vibration.vibrate(40); await deleteBodegaOrphanItems(b.id); Alert.alert("Bodega eliminada","Los ítems quedaron sueltos."); }}
    ]);
  };

  const solicitarDesactivacion=(b)=>{
    Alert.alert("Solicitar desactivación","Al aprobarse, los ítems quedarán sueltos.",[
      {text:"Cancelar",style:"cancel"},
      {text:"Enviar", onPress:()=>createDeactivateRequest({ bodegaId:b.id, userId:currentUser?.id }) }
    ]);
  };

  const adminToggle=(b)=>{
    if(b.active){
      Alert.alert("Desactivar bodega","Ítems quedarán sueltos. ¿Confirmas?",[
        {text:"Cancelar",style:"cancel"},
        {text:"Desactivar",style:"destructive", onPress:()=>setBodegaActive(b.id,false)}
      ]);
    }else setBodegaActive(b.id,true);
  };

  const renderCard=({item:b})=>{
    const m = metricsOf(b); const its=itemsByBodega.get(b.id)||[];
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{b.nombre} <Text style={styles.badge}>{b.ciudad}</Text> · {b.active?"🟢 Activa":"🔴 Inactiva"}</Text>
        <Text style={styles.cardLine}>📍 {b.direccion}</Text>
        <Text style={styles.cardLine}>📦 {b.ancho}×{b.alto}×{b.largo} m</Text>
        <Text style={styles.cardLine}>📊 Cap: {m.capacidad.toFixed(2)} m³ | Ocup: {m.ocupado.toFixed(2)} m³ | Libre: {m.libre.toFixed(2)} m³</Text>
        <Text style={[styles.cardLine,{marginTop:8,fontWeight:"700"}]}>🗂 Ítems</Text>
        {its.length===0? <Text style={styles.cardLine}>— Sin ítems —</Text> : its.map(it=>{
          const vUnit=vol(it.ancho,it.alto,it.largo); const cant=clampInt(it.cantidad,1);
          return <Text key={it.id} style={styles.cardLine}>• {it.nombre} — {cant} u — {(vUnit*cant).toFixed(3)} m³</Text>
        })}
        <View style={{flexDirection:"row",gap:8,marginTop:8}}>
          <TouchableOpacity style={[styles.btn, styles.warn]} onPress={()=>{setForm(b); setTab("form");}}><Text style={styles.btnT}>✏️ Editar</Text></TouchableOpacity>
          {currentUser?.role==="admin" ? (
            <TouchableOpacity style={[styles.btn, b.active?styles.danger:styles.info]} onPress={()=>adminToggle(b)}><Text style={[styles.btnT,{color:"#fff"}]}>{b.active?"⛔ Desactivar":"✅ Activar"}</Text></TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity style={[styles.btn, styles.info]} onPress={()=>solicitarDesactivacion(b)}><Text style={styles.btnT}>📨 Solicitar desactivación</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.danger]} onPress={()=>confirmarEliminarCliente(b)}><Text style={[styles.btnT,{color:"#fff"}]}>🗑️ Eliminar</Text></TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={{flex:1, padding:20}}>
      <Text style={styles.title}>Bodegas</Text>
      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tabBtn, tab==="form" && styles.active]} onPress={()=>setTab("form")}><Text>Formulario</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.tabBtn, tab==="view" && styles.active]} onPress={()=>setTab("view")}><Text>Visualizar Bodegas</Text></TouchableOpacity>
      </View>

      {tab==="form"? (
        <ScrollView>
          <Text style={styles.label}>Nombre</Text>
          <TextInput style={styles.input} value={form.nombre} onChangeText={(v)=>setForm({...form,nombre:v})}/>
          <Text style={styles.label}>Ciudad</Text>
          <View style={{flexDirection:"row", gap:8}}>
            {["Iquique","Alto Hospicio"].map(c=>(
              <TouchableOpacity key={c} style={[styles.pill, form.ciudad===c && styles.pillActive]} onPress={()=>setForm({...form,ciudad:c})}><Text style={{fontWeight:"700"}}>{c}</Text></TouchableOpacity>
            ))}
          </View>
          <Text style={styles.label}>Dirección</Text>
          <TextInput style={styles.input} value={form.direccion} onChangeText={(v)=>setForm({...form,direccion:v})}/>
          <Text style={styles.label}>Dimensiones (m)</Text>
          <TextInput style={styles.input} placeholder="Ancho"  keyboardType="numeric" value={form.ancho} onChangeText={(v)=>setForm({...form,ancho:v})}/>
          <TextInput style={styles.input} placeholder="Altura" keyboardType="numeric" value={form.alto}  onChangeText={(v)=>setForm({...form,alto:v})}/>
          <TextInput style={styles.input} placeholder="Largo"  keyboardType="numeric" value={form.largo} onChangeText={(v)=>setForm({...form,largo:v})}/>
          <View style={{flexDirection:"row", gap:8, marginVertical:8}}>
            <TouchableOpacity style={[styles.pill, form.active && styles.pillActive]} onPress={()=>setForm(prev=>({...prev,active:!prev.active}))}>
              <Text style={{fontWeight:"700"}}>Estado: {form.active?"Activa":"Inactiva"}</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={[styles.btn, styles.primary]} onPress={guardar}><Text style={styles.btnT}>GUARDAR</Text></TouchableOpacity>
        </ScrollView>
      ) : (
        <FlatList data={bodegas} keyExtractor={(b)=>String(b.id)} renderItem={renderCard}
          ListEmptyComponent={<Text style={{textAlign:"center", color:"#64748b"}}>Aún no hay bodegas.</Text>} />
      )}
    </View>
  );
}

const styles=StyleSheet.create({
  title:{fontSize:22,fontWeight:"700",marginBottom:12},
  tabs:{flexDirection:"row", gap:8, marginBottom:10},
  tabBtn:{flex:1, alignItems:"center", paddingVertical:10, borderWidth:1, borderColor:"#d4d4d8", borderRadius:10, backgroundColor:"#f8fafc"},
  active:{backgroundColor:"#e0e7ff", borderColor:"#6366f1"},
  label:{color:"#475569", marginTop:8, marginBottom:6, fontSize:13},
  input:{borderWidth:1, borderColor:"#d4d4d8", borderRadius:10, padding:12, backgroundColor:"#fff", marginBottom:8},
  card:{backgroundColor:"#fff", borderWidth:1, borderColor:"#d4d4d8", borderRadius:12, padding:14, marginBottom:12},
  cardTitle:{fontSize:18, fontWeight:"700", color:"#1e293b"},
  cardLine:{fontSize:14, color:"#64748b", marginTop:4},
  badge:{color:"#64748b", fontWeight:"600"},
  btn:{flex:1, padding:12, borderRadius:12, alignItems:"center"},
  btnT:{fontWeight:"700", color:"#1e293b"},
  primary:{backgroundColor:"#2563eb"}, info:{backgroundColor:"#0ea5e9"}, warn:{backgroundColor:"#f59e0b"}, danger:{backgroundColor:"#dc2626"},
  pill:{paddingVertical:8,paddingHorizontal:12, borderWidth:1,borderColor:"#d4d4d8", borderRadius:999, backgroundColor:"#fff"},
  pillActive:{backgroundColor:"#e0e7ff", borderColor:"#6366f1"},
});
