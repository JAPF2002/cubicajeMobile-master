// src/screens/AuthScreen.js
import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from "react-native";
import { LocalStore, K_USERS, K_SESSION, validateStrongPassword, hash } from "../store";
import { useApp } from "../store";

export default function AuthScreen() {
  const { onLogin } = useApp();
  const [tab, setTab] = useState("login");
  const [login, setLogin] = useState({ email:"", password:"" });
  const [reg, setReg]     = useState({ name:"", email:"", password:"", confirm:"", role:"cliente" });

  const loadUsers = async () => JSON.parse((await LocalStore.getItem(K_USERS)) || "[]");
  const saveUsers = async (arr) => LocalStore.setItem(K_USERS, JSON.stringify(arr));

  const handleLogin = async () => {
    if (!login.email.trim() || !login.password.trim()) return Alert.alert("Login","Ingresa email y contraseña.");
    const users = await loadUsers();
    const u = users.find(x=>x.email.toLowerCase()===login.email.trim().toLowerCase());
    if (!u || u.pass !== hash(login.password)) return Alert.alert("Login","Credenciales inválidas.");
    await LocalStore.setItem(K_SESSION, JSON.stringify({ userId:u.id }));
    onLogin({ id:u.id, name:u.name, email:u.email, role:u.role });
  };

  const handleRegister = async () => {
    if (!reg.name.trim() || !reg.email.trim() || !reg.password.trim()) return Alert.alert("Registro","Completa todos los campos.");
    if (reg.password !== reg.confirm) return Alert.alert("Registro","La confirmación no coincide.");
    const val = validateStrongPassword(reg.password); if (!val.ok) return Alert.alert("Contraseña", val.msg);

    const users = await loadUsers();
    if (users.some(u=>u.email.toLowerCase()===reg.email.trim().toLowerCase()))
      return Alert.alert("Registro","Ese email ya existe.");

    const newUser = {
      id: Math.random().toString(36).slice(2,9),
      name: reg.name.trim(),
      email: reg.email.trim().toLowerCase(),
      role: reg.role,
      pass: hash(reg.password),
      emailVerified: true, // demo: directo
    };
    await saveUsers([newUser, ...users]);
    Alert.alert("OK","Cuenta creada. Ahora inicia sesión.");
    setTab("login");
    setLogin({ email:newUser.email, password:"" });
  };

  return (
    <View style={{flex:1, justifyContent:"center", padding:20}}>
      <Text style={s.title}>Bienvenido(a)</Text>

      <View style={s.tabs}>
        <TouchableOpacity style={[s.tab, tab==="login" && s.tabA]} onPress={()=>setTab("login")}><Text style={[s.tabT, tab==="login"&&s.tabTA]}>Iniciar Sesión</Text></TouchableOpacity>
        <TouchableOpacity style={[s.tab, tab==="register" && s.tabA]} onPress={()=>setTab("register")}><Text style={[s.tabT, tab==="register"&&s.tabTA]}>Registrarme</Text></TouchableOpacity>
      </View>

      {tab==="login" ? (
        <View>
          <Text style={s.label}>Email</Text>
          <TextInput style={s.input} autoCapitalize="none" value={login.email} onChangeText={(v)=>setLogin({...login,email:v})}/>
          <Text style={s.label}>Contraseña</Text>
          <TextInput style={s.input} secureTextEntry value={login.password} onChangeText={(v)=>setLogin({...login,password:v})}/>
          <TouchableOpacity style={s.btn} onPress={handleLogin}><Text style={s.btnT}>ENTRAR</Text></TouchableOpacity>
        </View>
      ) : (
        <View>
          <Text style={s.label}>Nombre</Text>
          <TextInput style={s.input} value={reg.name} onChangeText={(v)=>setReg({...reg,name:v})}/>
          <Text style={s.label}>Email</Text>
          <TextInput style={s.input} autoCapitalize="none" value={reg.email} onChangeText={(v)=>setReg({...reg,email:v})}/>
          <Text style={s.label}>Contraseña</Text>
          <TextInput style={s.input} secureTextEntry value={reg.password} onChangeText={(v)=>setReg({...reg,password:v})} placeholder="12–16, Aa, 0-9 y símbolo"/>
          <Text style={s.label}>Confirmar contraseña</Text>
          <TextInput style={s.input} secureTextEntry value={reg.confirm} onChangeText={(v)=>setReg({...reg,confirm:v})}/>
          <View style={{flexDirection:"row", gap:8, marginBottom:8}}>
            {["cliente","admin"].map(r=>(
              <TouchableOpacity key={r} style={[s.pill, reg.role===r && s.pillA]} onPress={()=>setReg({...reg,role:r})}>
                <Text style={{fontWeight:"700"}}>{r}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={s.btn} onPress={handleRegister}><Text style={s.btnT}>CREAR CUENTA</Text></TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  title:{fontSize:22, fontWeight:"700", marginBottom:12},
  tabs:{flexDirection:"row", gap:8, marginBottom:10},
  tab:{flex:1, borderWidth:1, borderColor:"#d4d4d8", backgroundColor:"#f8fafc", paddingVertical:10, borderRadius:10, alignItems:"center"},
  tabA:{backgroundColor:"#e0e7ff", borderColor:"#6366f1"},
  tabT:{color:"#475569", fontWeight:"600"},
  tabTA:{color:"#3730a3"},
  label:{color:"#475569", marginTop:8, marginBottom:6, fontSize:13},
  input:{borderWidth:1, borderColor:"#d4d4d8", borderRadius:10, padding:12, backgroundColor:"#fff", marginBottom:8},
  btn:{backgroundColor:"#2563eb", padding:14, borderRadius:12},
  btnT:{color:"#fff", fontWeight:"700", textAlign:"center"},
  pill:{paddingVertical:8,paddingHorizontal:12, borderWidth:1,borderColor:"#d4d4d8", borderRadius:999, backgroundColor:"#fff"},
  pillA:{backgroundColor:"#e0e7ff", borderColor:"#6366f1"},
});
