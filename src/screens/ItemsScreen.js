// src/screens/ItemsScreen.js
import React, { useMemo, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, FlatList, ScrollView, StyleSheet } from "react-native";
import { useApp } from "../store";

export default function ItemsScreen(){
  const { bodegas, items, saveItem, deleteItem, metricsOf, vol, clampInt, itemVolTotal, SIZE_CLASSES, pesoAClase } = useApp();

  const [tab, setTab] = useState("form");
  const [form, setForm] = useState({ id:null, nombre:"", ancho:"", alto:"", largo:"", peso:"", cantidad:"1", bodegaId:null });

  const cantidadInt = clampInt(form.cantidad, 1);
  const volUnit = vol(form.ancho, form.alto, form.largo);
  const volNecesario = volUnit * cantidadInt;

  const bodegasActivas = useMemo(()=> bodegas.filter(b=>b.active), [bodegas]);

  const seleccionarBodega = () => {
    if (bodegasActivas.length===0) return Alert.alert("Bodegas","No hay bodegas activas.");
    const opts = bodegasActivas.map(b=>{
      const m = metricsOf(b);
      return { text:`${b.nombre} · Libre: ${m.libre.toFixed(2)} m³`, onPress:()=>setForm({...form,bodegaId:b.id}) };
    });
    Alert.alert("Selecciona bodega","", [...opts, {text:"Cancelar", style:"cancel"}]);
  };

  const guardar = async () => {
    if (!form.nombre.trim()) return Alert.alert("Falta nombre","Ponle un nombre al ítem.");
    if (!form.bodegaId) return Alert.alert("Bodega","Selecciona una bodega activa.");
    const b = bodegas.find(x=>x.id===form.bodegaId);
    if (!b || !b.active) return Alert.alert("Bodega","Bodega inválida/inactiva.");
    const m = metricsOf(b);
    if (volNecesario > m.libre + 1e-9) return Alert.alert("Sin espacio", `Vol ítem: ${volNecesario.toFixed(3)} · Libre: ${m.libre.toFixed(3)} m³`);

    await saveItem({ ...form, nombre:form.nombre.trim(), cantidad:String(cantidadInt), clase:pesoAClase(form.peso) });
    Alert.alert("Ok", `«${form.nombre.trim()}» guardado en ${b.nombre}`);
    setForm({ id:null, nombre:"", ancho:"", alto:"", largo:"", peso:"", cantidad:"1", bodegaId:null });
    setTab("view");
  };

  // -------- LISTA ----------
  const [filterBodegaId, setFilterBodegaId] = useState(null);
  const [showOrphans, setShowOrphans] = useState(false);
  const [filterClass, setFilterClass] = useState(null);
  const [sortBy, setSortBy] = useState("name"); // name | vol

  const filtered = useMemo(()=>{
    let list = items.slice();
    if (showOrphans) list = list.filter(it=>!it.bodegaId);
    else if (filterBodegaId) list = list.filter(it=>it.bodegaId===filterBodegaId);
    if (filterClass) list = list.filter(it=>(it.clase||"N/D")===filterClass);
    if (sortBy==="name") list.sort((a,b)=>a.nombre.localeCompare(b.nombre));
    else list.sort((a,b)=>itemVolTotal(b)-itemVolTotal(a));
    return list;
  }, [items, showOrphans, filterBodegaId, filterClass, sortBy]);

  const resumen = useMemo(()=>{
    const u = filtered.reduce((acc,it)=>acc+clampInt(it.cantidad,1),0);
    const v = filtered.reduce((acc,it)=>acc+itemVolTotal(it),0);
    return { unidades:u, vol:v };
  }, [filtered]);

  const moveItem = (it) => {
    const vTotal = itemVolTotal(it);
    const opciones = bodegas
      .filter(b => b.active)
      .map(b => ({ b, libre: metricsOf(b).libre }))
      .filter(o => o.b.id !== it.bodegaId && o.libre + 1e-9 >= vTotal)
      .sort((a,b)=>a.libre-b.libre);

    if (opciones.length===0) return Alert.alert("Sin destino con espacio", `Volumen: ${vTotal.toFixed(3)} m³`);

    const opts = opciones.map(o=>({
      text:`${o.b.nombre} · Libre: ${o.libre.toFixed(2)} m³`,
      onPress:async()=>{ await saveItem({ ...it, bodegaId:o.b.id }); Alert.alert("Movido", `Ahora en ${o.b.nombre}`); }
    }));
    Alert.alert("Mover ítem","Elige bodega destino:", [...opts, {text:"Cancelar", style:"cancel"}]);
  };

  const renderCard = ({ item: it }) => {
    const b = bodegas.find(x=>x.id===it.bodegaId);
    const vUnit = vol(it.ancho, it.alto, it.largo);
    const cant = clampInt(it.cantidad,1);
    const esSuelto = !it.bodegaId;

    return (
      <View style={st.card}>
        <Text style={st.cardTitle}>
          {it.nombre} <Text style={st.badge}>Clase: {it.clase || "N/D"}</Text> {esSuelto ? <Text style={[st.badge,{color:"#b45309"}]}>🟠 Suelto</Text> : null}
        </Text>
        <Text style={st.cardLine}>⚖️ Peso: {it.peso||"-"} kg</Text>
        <Text style={st.cardLine}>📐 {it.ancho}×{it.alto}×{it.largo} m · Vol/unidad: {vUnit.toFixed(3)} m³</Text>
        <Text style={st.cardLine}>🔢 Cantidad: {cant} · Vol total: {(vUnit*cant).toFixed(3)} m³</Text>
        <Text style={st.cardLine}>🏬 Bodega: {b ? `${b.nombre} (${b.active?"activa":"inactiva"})` : "(sin asignar)"} </Text>

        {esSuelto && (
          <View style={st.detailBox}>
            <Text style={st.detailTitle}>Detalles (sin asignar)</Text>
            <Text style={st.detailLine}>Item: {it.nombre}</Text>
            <Text style={st.detailLine}>Dimensiones: {it.ancho}×{it.alto}×{it.largo} m</Text>
            <Text style={st.detailLine}>Peso: {it.peso || "-"} kg</Text>
            <Text style={st.detailLine}>Última ubicación: {it.lastBodegaName || "—"}</Text>
            <TouchableOpacity style={[st.btn, st.btnMove]} onPress={()=>moveItem(it)}><Text style={st.btnTxt}>Mover ítem a otra bodega</Text></TouchableOpacity>
          </View>
        )}

        {!esSuelto && (
          <View style={[st.row,{gap:8}]}>
            <TouchableOpacity style={[st.btn, st.btnInfo]} onPress={()=>moveItem(it)}><Text style={st.btnTxt}>↪️ Mover</Text></TouchableOpacity>
            <TouchableOpacity style={[st.btn, st.btnDanger]} onPress={()=>Alert.alert("Eliminar",`¿Eliminar «${it.nombre}»?`,[
              {text:"No", style:"cancel"},
              {text:"Sí", style:"destructive", onPress:()=>deleteItem(it.id)}
            ])}><Text style={st.btnTxt}>🗑️ Eliminar</Text></TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={{flex:1, padding:20}}>
      <Text style={st.title}>Ítems</Text>

      <View style={st.tabs}>
        <TouchableOpacity style={[st.tabBtn, tab==="form"&&st.active]} onPress={()=>setTab("form")}><Text>Formulario</Text></TouchableOpacity>
        <TouchableOpacity style={[st.tabBtn, tab==="view"&&st.active]} onPress={()=>setTab("view")}><Text>Visualizar Ítems</Text></TouchableOpacity>
      </View>

      {tab==="form" ? (
        <ScrollView>
          <Text style={st.label}>Nombre</Text>
          <TextInput style={st.input} value={form.nombre} onChangeText={(v)=>setForm({...form,nombre:v})}/>

          <Text style={st.label}>Dimensiones (m)</Text>
          <TextInput style={st.input} placeholder="Ancho"  keyboardType="numeric" value={form.ancho} onChangeText={(v)=>setForm({...form,ancho:v})}/>
          <TextInput style={st.input} placeholder="Altura" keyboardType="numeric" value={form.alto}  onChangeText={(v)=>setForm({...form,alto:v})}/>
          <Text style={st.label}>Largo</Text>
          <TextInput style={st.input} placeholder="Largo"  keyboardType="numeric" value={form.largo} onChangeText={(v)=>setForm({...form,largo:v})}/>

          <Text style={st.label}>Peso (kg)</Text>
          <TextInput style={st.input} placeholder="Peso" keyboardType="numeric" value={form.peso} onChangeText={(v)=>setForm({...form,peso:v})}/>

          <Text style={st.label}>Cantidad</Text>
          <TextInput style={st.input} placeholder="1" keyboardType="numeric" value={String(form.cantidad)} onChangeText={(v)=>setForm({...form,cantidad: v.replace(/[^0-9]/g,"") || "1"})}/>

          <Text style={st.label}>Bodega</Text>
          <TouchableOpacity style={st.selectorBtn} onPress={seleccionarBodega}>
            <Text style={st.selectorText}>{form.bodegaId ? (bodegas.find(b=>b.id===form.bodegaId)?.nombre ?? "(?)") : "Toca para elegir bodega activa"}</Text>
          </TouchableOpacity>

          <View style={st.calcPanel}>
            <Text style={st.calcTitle}>📏 Cálculo</Text>
            <Text style={st.calcLine}>Vol/unidad: {isFinite(volUnit)?volUnit.toFixed(3):"0.000"} m³</Text>
            <Text style={st.calcLine}>Cantidad: {cantidadInt}</Text>
            <Text style={st.calcLine}>Volumen necesario: {isFinite(volNecesario)?volNecesario.toFixed(3):"0.000"} m³</Text>
            <Text style={st.calcLine}>Clase por peso: <Text style={{fontWeight:"700"}}>{pesoAClase(form.peso)}</Text></Text>
          </View>

          <TouchableOpacity style={[st.btn, st.btnPrimary]} onPress={guardar}><Text style={st.btnTxt}>GUARDAR</Text></TouchableOpacity>
        </ScrollView>
      ) : (
        <>
          {/* Filtros */}
          <View style={[st.row,{gap:8, flexWrap:"wrap"}]}>
            <TouchableOpacity style={[st.selectorBtn,{flex:1}]} onPress={()=>{
              const opts = [
                { text:"Todas", onPress:()=>{ setFilterBodegaId(null); setShowOrphans(false); } },
                { text:"Solo sueltos", onPress:()=>{ setFilterBodegaId(null); setShowOrphans(true); } },
                ...bodegas.map(b=>({ text:b.active?`${b.nombre} (activa)`: `${b.nombre} (inactiva)`, onPress:()=>{ setFilterBodegaId(b.id); setShowOrphans(false); } })),
                { text:"Cancelar", style:"cancel" }
              ];
              Alert.alert("Filtrar por bodega","",opts);
            }}>
              <Text style={st.selectorText}>{showOrphans ? "Solo sueltos" : (filterBodegaId ? (bodegas.find(b=>b.id===filterBodegaId)?.nombre ?? "(?)") : "Todas las bodegas / sueltos")}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={st.clearFilterBtn} onPress={()=>{ setFilterBodegaId(null); setFilterClass(null); setShowOrphans(false); }}>
              <Text style={st.clearFilterText}>X</Text>
            </TouchableOpacity>
          </View>

          <View style={[st.row,{flexWrap:"wrap", gap:8}]}>
            {[null, ...SIZE_CLASSES.map(c=>c.key)].map(k=>{
              const active = filterClass===k || (k===null && filterClass===null);
              const label = k || "Todas las clases";
              return (
                <TouchableOpacity key={String(k)} style={[st.pill, active && st.pillA]} onPress={()=>setFilterClass(k)}>
                  <Text style={{fontWeight:"700"}}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={[st.row,{gap:8}]}>
            <TouchableOpacity style={[st.selectorBtn,{flex:1}]} onPress={()=>setSortBy(sortBy==="name"?"vol":"name")}>
              <Text style={st.selectorText}>Orden: {sortBy==="name"?"Nombre":"Volumen"}</Text>
            </TouchableOpacity>
            <View style={{flex:1}} />
          </View>

          <View style={st.summaryBox}><Text style={st.summaryText}>Unidades: {resumen.unidades} · Volumen total: {resumen.vol.toFixed(3)} m³</Text></View>

          <FlatList
            data={filtered}
            keyExtractor={(it)=>String(it.id)}
            renderItem={renderCard}
            ListEmptyComponent={<Text style={{textAlign:"center", color:"#64748b"}}>No hay ítems para los filtros seleccionados.</Text>}
          />
        </>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  title:{fontSize:22,fontWeight:"700",marginBottom:12},
  tabs:{flexDirection:"row", gap:8, marginBottom:10},
  tabBtn:{flex:1, alignItems:"center", paddingVertical:10, borderWidth:1, borderColor:"#d4d4d8", borderRadius:10, backgroundColor:"#f8fafc"},
  active:{backgroundColor:"#e0e7ff", borderColor:"#6366f1"},
  label:{color:"#475569", marginTop:8, marginBottom:6, fontSize:13},
  input:{borderWidth:1, borderColor:"#d4d4d8", borderRadius:10, padding:12, backgroundColor:"#fff", marginBottom:8},
  selectorBtn:{ borderWidth:1, borderColor:"#d4d4d8", padding:12, borderRadius:10, backgroundColor:"#fff" },
  selectorText:{ color:"#1e293b", fontWeight:"700" },
  calcPanel:{ borderWidth:1, borderColor:"#e2e8f0", backgroundColor:"#f8fafc", borderRadius:12, padding:12, marginVertical:10 },
  calcTitle:{ fontWeight:"700", color:"#1e293b" },
  calcLine:{ color:"#475569", marginTop:4 },

  card:{backgroundColor:"#fff", borderWidth:1, borderColor:"#d4d4d8", borderRadius:12, padding:14, marginBottom:12},
  cardTitle:{fontSize:18, fontWeight:"700", color:"#1e293b"},
  cardLine:{fontSize:14, color:"#64748b", marginTop:4},
  badge:{color:"#64748b", fontWeight:"600"},

  row:{ flexDirection:"row", alignItems:"center" },
  btn:{ flex:1, padding:12, borderRadius:10, alignItems:"center", marginTop:8 },
  btnPrimary:{ backgroundColor:"#2563eb" },
  btnInfo:{ backgroundColor:"#0ea5e9" },
  btnDanger:{ backgroundColor:"#dc2626" },
  btnMove:{ backgroundColor:"#6366f1" },
  btnTxt:{ color:"#fff", fontWeight:"700" },

  pill:{paddingVertical:8,paddingHorizontal:12, borderWidth:1,borderColor:"#d4d4d8", borderRadius:999, backgroundColor:"#fff"},
  pillA:{backgroundColor:"#e0e7ff", borderColor:"#6366f1"},

  clearFilterBtn:{ width:36, height:36, borderRadius:8, backgroundColor:"#ef4444", alignItems:"center", justifyContent:"center" },
  clearFilterText:{ color:"#fff", fontWeight:"800" },
  summaryBox:{ padding:10, borderRadius:10, backgroundColor:"#e2e8f0", borderWidth:1, borderColor:"#cbd5e1", marginBottom:8 },
  summaryText:{ color:"#0f172a", fontWeight:"700", textAlign:"center" },

  detailBox:{ marginTop:10, borderWidth:1, borderColor:"#c7d2fe", backgroundColor:"#eef2ff", borderRadius:10, padding:10 },
  detailTitle:{ fontWeight:"700", color:"#3730a3" },
  detailLine:{ color:"#3730a3", marginTop:4 },
});
