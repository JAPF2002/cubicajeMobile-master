import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { loadUsers, saveUsers, getSession, setSession, clearSession, hash, validateStrongPassword } from "./session";

export default function LoginScreen({ onLoggedIn }) {
  const [tab, setTab] = useState("login"); // "login" | "register"
  const [login, setLogin] = useState({ email:"", password:"" });
  const [reg, setReg]     = useState({ name:"", email:"", password:"", confirm:"", role:"cliente" });

  // si ya había sesión guardada → entra directo
  useEffect(() => {
    (async () => {
      const s = await getSession();
      if (s?.user) onLoggedIn(s.user);
    })();
  }, []);

  const doLogin = async () => {
    if(!login.email.trim() || !login.password.trim()) return Alert.alert("Login","Completa email y contraseña");
    const users = await loadUsers();
    const u = users.find(x => x.email.toLowerCase() === login.email.trim().toLowerCase());
    if(!u || u.pass !== hash(login.password)) return Alert.alert("Login","Credenciales inválidas");
    await setSession({ user: { id:u.id, name:u.name, email:u.email, role:u.role } });
    onLoggedIn({ id:u.id, name:u.name, email:u.email, role:u.role });
  };

  const doRegister = async () => {
    if(!reg.name.trim() || !reg.email.trim() || !reg.password.trim()) return Alert.alert("Registro","Completa todos los campos");
    if(reg.password !== reg.confirm) return Alert.alert("Registro","La confirmación no coincide");
    const val = validateStrongPassword(reg.password); if(!val.ok) return Alert.alert("Contraseña", val.msg);

    const users = await loadUsers();
    if(users.some(x => x.email.toLowerCase() === reg.email.trim().toLowerCase()))
      return Alert.alert("Registro","Ese email ya existe");

    users.push({ id: Math.random().toString(36).slice(2,9), name: reg.name.trim(), email: reg.email.trim(), role: reg.role, pass: hash(reg.password) });
    await saveUsers(users);
    Alert.alert("Registro exitoso","Ahora inicia sesión");
    setTab("login");
    setLogin({ email: reg.email, password: "" });
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Bienvenido(a)</Text>

      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, tab==="login" && styles.tabOn]} onPress={()=>setTab("login")}><Text style={[styles.tabText, tab==="login"&&styles.tabTextOn]}>Iniciar sesión</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab==="register" && styles.tabOn]} onPress={()=>setTab("register")}><Text style={[styles.tabText, tab==="register"&&styles.tabTextOn]}>Registrarme</Text></TouchableOpacity>
      </View>

      {tab==="login" ? (
        <>
          <Text style={styles.label}>Email</Text>
          <TextInput style={styles.input} autoCapitalize="none" value={login.email} onChangeText={(v)=>setLogin({...login,email:v})}/>
          <Text style={styles.label}>Contraseña</Text>
          <TextInput style={styles.input} secureTextEntry autoCapitalize="none" value={login.password} onChangeText={(v)=>setLogin({...login,password:v})}/>
          <TouchableOpacity style={styles.btnPri} onPress={doLogin}><Text style={styles.btnTx}>ENTRAR</Text></TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.label}>Nombre</Text>
          <TextInput style={styles.input} value={reg.name} onChangeText={(v)=>setReg({...reg,name:v})}/>
          <Text style={styles.label}>Email</Text>
          <TextInput style={styles.input} autoCapitalize="none" value={reg.email} onChangeText={(v)=>setReg({...reg,email:v})}/>
          <Text style={styles.label}>Contraseña (12–16, Aa, 0-9, símbolo)</Text>
          <TextInput style={styles.input} secureTextEntry autoCapitalize="none" value={reg.password} onChangeText={(v)=>setReg({...reg,password: v.slice(0,16)})}/>
          <Text style={styles.label}>Confirmar</Text>
          <TextInput style={styles.input} secureTextEntry autoCapitalize="none" value={reg.confirm} onChangeText={(v)=>setReg({...reg,confirm: v.slice(0,16)})}/>
          <TouchableOpacity style={styles.btnPri} onPress={doRegister}><Text style={styles.btnTx}>CREAR CUENTA</Text></TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap:{ flex:1, padding:24, justifyContent:"center" },
  title:{ fontSize:22, fontWeight:"800", marginBottom:12, textAlign:"center", color:"#1e293b" },
  tabs:{ flexDirection:"row", gap:8, marginBottom:12 },
  tab:{ flex:1, paddingVertical:10, borderRadius:10, borderWidth:1, borderColor:"#cbd5e1", alignItems:"center", backgroundColor:"#f8fafc" },
  tabOn:{ backgroundColor:"#e0e7ff", borderColor:"#6366f1" },
  tabText:{ color:"#64748b", fontWeight:"700" },
  tabTextOn:{ color:"#3730a3" },
  label:{ color:"#475569", marginTop:8, marginBottom:4, fontWeight:"600" },
  input:{ borderWidth:1, borderColor:"#cbd5e1", borderRadius:10, padding:12, backgroundColor:"#fff", color:"#0f172a" },
  btnPri:{ backgroundColor:"#2563eb", borderRadius:10, padding:14, marginTop:12 },
  btnTx:{ color:"#fff", fontWeight:"800", textAlign:"center" },
});
