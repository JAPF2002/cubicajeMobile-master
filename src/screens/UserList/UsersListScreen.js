// src/screens/UserList/UsersListScreen.js
import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { getUsuarios, changeUserState, changeUserRole } from "../../features/api";
import { set } from "react-native-reanimated";
import { useApp } from "../../store";

const COLORS = {
  bg: "#f8fafc",
  card: "#ffffff",
  primary: "#2563eb",
  primarySoft: "#dbeafe",
  border: "#e5e7eb",
  text: "#0f172a",
  textSoft: "#6b7280",
  success: "#22c55e",
  danger: "#ef4444",
};

const DEMO_CURRENT_USER = {
  id: 1,
  nombre: "Admin Demo",
  correo: "admin@demo.cl",
  rut: "11111111-1",
  rol: "admin",
  estado: true,
};

function StatusChip({ active }) {
  const bg = active ? COLORS.success : COLORS.danger;
  const label = active ? "Activo" : "Inactivo";
  return (
    <View style={[styles.statusChip, { backgroundColor: bg }]}>
      <Text style={styles.statusChipText}>{label}</Text>
    </View>
  );
}

function RoleChip({ role }) {
  const label = role === "admin" ? "Admin" : "Empleado";
  return (
    <View
      style={[
        styles.roleChip,
        role === "admin" && styles.roleChipAdmin,
        role === "empleado" && styles.roleChipEmpleado,
      ]}
    >
      <Text
        style={[
          styles.roleChipText,
          role === "admin" && styles.roleChipTextAdmin,
          role === "empleado" && styles.roleChipTextEmpleado,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

function UserCard({
  user,
  onToggleConfirm,
  onDeleteConfirm,
  onToggleRoleConfirm,
  onEditPress
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <View>
          <Text style={styles.cardTitle}>{user.nombre}</Text>
          <Text style={styles.cardSubtitle}>{user.correo}</Text>
          <Text style={styles.cardLineSmall}>RUT: {user.rut}</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <RoleChip role={user.rol} />
          <StatusChip active={user.estado} />
        </View>
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.btn, styles.btnToggle]}
          onPress={onToggleConfirm}
        >
          <Text style={styles.btnToggleText}>
            {user.estado ? "Desactivar" : "Activar"}
          </Text>
        </TouchableOpacity>

        {onToggleRoleConfirm && (
          <>
            <TouchableOpacity
              style={[styles.btn, styles.btnRole]}
              onPress={onToggleRoleConfirm}
            >
              <Text style={styles.btnRoleText}>
                {user.rol === "admin" ? "Quitar admin" : "Hacer admin"}
              </Text>
            </TouchableOpacity>

            {/* BOTÓN SOLO VISUAL */}
            <TouchableOpacity
              style={[styles.btn, styles.btnEdit]}
              onPress={onEditPress}
            >
              <Text style={styles.btnEditText}>Editar</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

function StatusFilter({ value, onChange }) {
  const options = [
    { key: "all", label: "Todos" },
    { key: "active", label: "Activos" },
    { key: "inactive", label: "Inactivos" },
    { key: "admin", label: "Solo Admin" },
    { key: "empleado", label: "Solo Empleado" },
  ];
  return (
    <View style={styles.filterRow}>
      {options.map((opt) => (
        <TouchableOpacity
          key={opt.key}
          style={[
            styles.filterPill,
            value === opt.key && styles.filterPillActive,
          ]}
          onPress={() => onChange(opt.key)}
        >
          <Text
            style={[
              styles.filterPillText,
              value === opt.key && styles.filterPillTextActive,
            ]}
          >
            {opt.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function UsersListScreen(props) {
  const navigation = useNavigation();
  const {userId, userRole} = useApp();
  // si el padre pasa props, las usamos; si no, usamos navigation
  const goToMenu =
    typeof props.goToMenu === "function"
      ? props.goToMenu
      : () => navigation.navigate("Menu");

  const goToNewUser =
    typeof props.goToNewUser === "function"
      ? props.goToNewUser
      : () => navigation.navigate("UserForm"); // ajusta el nombre si tu ruta se llama distinto

  const [currentUser] = useState({id_usuario: userId, rol: userRole});
  const [users, setUsers] = useState([]);
  const [userLoading, setUserLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const isAdmin = currentUser?.rol === "admin";

  const getUsers = async () => {
    setUserLoading(true);
    try {
      const resp = await getUsuarios();
      setUsers(resp.usuarios);
      console.log(resp.usuarios);
    } catch (error) {
      console.log("Error al cargar usuarios:", error);
      setUsers([]);
    } finally {
      setUserLoading(false);
    }
  };

  const handleChangeUserState = async (id_usuario) => {
    const resp = await changeUserState(id_usuario);
    if(resp.ok){
      setUsers((prev) =>
        prev.map((u) =>
          u.id_usuario === id_usuario ? { ...u, estado: resp.nuevo_estado } : u
        )
      );
    }
  }

  const handleChangeUserRole = async (id_usuario, new_role) => {
    const resp = await changeUserRole(id_usuario, new_role);
    if(resp.ok){
      setUsers((prev) =>
        prev.map((u) =>
          u.id_usuario === id_usuario ? { ...u, rol: new_role } : u
        )
      );
    } else{
      Alert.alert("Error", resp.authMensaje || "No se pudo cambiar el rol.");
    }
  }

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const term = search.toLowerCase();

      if (
        term &&
        !(
          (u.nombre || "").toLowerCase().includes(term) ||
          (u.correo || "").toLowerCase().includes(term) ||
          (u.rut || "").toLowerCase().includes(term)
        )
      ) {
        return false;
      }

      if (filter === "active" && !u.estado) return false;
      if (filter === "inactive" && u.estado) return false;
      if (filter === "admin" && u.rol !== "admin") return false;
      if (filter === "empleado" && u.rol !== "empleado") return false;

      return true;
    });
  }, [users, search, filter]);

  const confirmToggle = (user) => {
    const action = user.estado ? "desactivar" : "activar";
    Alert.alert(
      user.estado ? "Desactivar usuario" : "Activar usuario",
      `¿Seguro que quieres ${action} la cuenta de "${user.nombre}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          style: "destructive",
          onPress: () => 
            handleChangeUserState(user.id_usuario)
        },
      ]
    );
  };


  const confirmToggleRole = (user) => {
    if (user.id_usuario === currentUser?.id_usuario) {
      Alert.alert("Acción no permitida", "No puedes cambiar tu propio rol.");
      return;
    }

    if (user.rol === "admin") {
      Alert.alert(
        "Quitar rol administrador",
        `¿Seguro que quieres quitar el rol administrador a "${user.nombre}"?`,
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Confirmar",
            style: "destructive",
            onPress: () =>
              handleChangeUserRole(user.id_usuario, "empleado")
          },
        ]
      );
    } else {
      Alert.alert(
        "Dar rol administrador",
        `¿Seguro que quieres otorgar rol administrador a "${user.nombre}"?\n\nEste usuario tendrá acceso a gestión completa.`,
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Confirmar",
            style: "destructive",
            onPress: () =>
              handleChangeUserRole(user.id_usuario, "admin")
          },
        ]
      );
    }
  };

  useFocusEffect(
    useCallback(() => {
      getUsers();
    }, [])
  );

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Usuarios</Text>
      <Text style={styles.subtitle}>Lista de cuentas, roles y estados.</Text>

      <TextInput
        placeholder="Buscar por nombre, correo o RUT"
        placeholderTextColor={COLORS.textSoft}
        style={styles.searchInput}
        value={search}
        onChangeText={setSearch}
      />

      <StatusFilter value={filter} onChange={setFilter} />
      
      {
        userLoading ? (
          <Text style={styles.emptyText}>Cargando usuarios...</Text>
        ) : <FlatList
        data={filtered}
        keyExtractor={(u) => String(u.id_usuario)}
        renderItem={({ item }) => (
          <UserCard
            user={item}
            onToggleConfirm={() => confirmToggle(item)}
            onDeleteConfirm={() => confirmDelete(item)}
            onToggleRoleConfirm={
              isAdmin ? () => confirmToggleRole(item) : undefined
            }
            onEditPress={() => navigation.navigate("EditUserCreds", {id_usuario: item.id_usuario})}
          />
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No hay usuarios con esos filtros.</Text>
        }
        contentContainerStyle={{ paddingBottom: 130 }}
      />
      }
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.bottomBtn} onPress={goToMenu}>
          <Text style={styles.bottomBtnText}>Menú principal</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.bottomBtn, styles.bottomBtnActive]} disabled>
          <Text style={[styles.bottomBtnText, styles.bottomBtnTextActive]}>
            Usuarios
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.bottomBtn} onPress={goToNewUser}>
          <Text style={styles.bottomBtnText}>Crear usuario</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg, paddingHorizontal: 16, paddingTop: 20 },
  title: { fontSize: 22, fontWeight: "700", color: COLORS.text },
  subtitle: { fontSize: 13, color: COLORS.textSoft, marginBottom: 12 },
  searchInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#ffffff",
    fontSize: 13,
    marginBottom: 8,
  },
  card: {
    backgroundColor: COLORS.card,
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeaderRow: { flexDirection: "row", justifyContent: "space-between" },
  cardTitle: { fontSize: 15, fontWeight: "700", color: COLORS.text },
  cardSubtitle: { fontSize: 11, color: COLORS.textSoft },
  cardLineSmall: { fontSize: 11, color: COLORS.textSoft },
  actionsRow: { flexDirection: "row", marginTop: 8, gap: 6 },
  btn: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  btnToggle: { backgroundColor: COLORS.primary },
  btnToggleText: { fontSize: 11, color: "#ffffff", fontWeight: "600" },
  btnRole: { backgroundColor: "#1d4ed8" },
  btnRoleText: { fontSize: 11, color: "#ffffff", fontWeight: "600" },

  // NUEVO (solo visual)
  btnEdit: { backgroundColor: COLORS.primarySoft, borderWidth: 1, borderColor: COLORS.border },
  btnEditText: { fontSize: 11, color: COLORS.primary, fontWeight: "700" },

  btnDanger: { backgroundColor: COLORS.danger },
  btnDangerText: { fontSize: 11, color: "#ffffff", fontWeight: "600" },
  filterRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 6 },
  filterPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterPillActive: { backgroundColor: COLORS.primarySoft, borderColor: COLORS.primary },
  filterPillText: { fontSize: 10, color: COLORS.textSoft },
  filterPillTextActive: { color: COLORS.primary, fontWeight: "600" },
  statusChip: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, marginTop: 4 },
  statusChipText: { fontSize: 9, color: "#ffffff", fontWeight: "600" },
  roleChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    marginBottom: 2,
    backgroundColor: COLORS.border,
  },
  roleChipAdmin: { backgroundColor: COLORS.primary },
  roleChipEmpleado: { backgroundColor: "#e5e7eb" },
  roleChipText: { fontSize: 9, fontWeight: "600", color: COLORS.text },
  roleChipTextAdmin: { color: "#ffffff" },
  roleChipTextEmpleado: { color: COLORS.textSoft },
  emptyText: { textAlign: "center", fontSize: 12, color: COLORS.textSoft, marginTop: 40 },
  bottomBar: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 40,
    padding: 6,
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  bottomBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomBtnActive: { backgroundColor: COLORS.primary },
  bottomBtnText: { fontSize: 10.5, color: COLORS.textSoft, fontWeight: "500" },
  bottomBtnTextActive: { color: "#ffffff", fontWeight: "600" },
});
