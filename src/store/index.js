// src/store/index.js
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Alert } from "react-native";

import { loadState, saveState } from "./localStore";
import { vol, clampInt, pesoAClase, SIZE_CLASSES } from "./helpers";

// APIs (msApiCubicaje)
import {
  getBodegas,
  insertBodega,
  updateBodegaApi,
  deleteBodegaApi,
  getItems,
  insertItem,
  updateItem,
  deleteItemApi,
  getCategories,
  moveItemQty,
} from "../features/api";

// --------- Usuarios demo ---------
const adminUserDemo = {
  id: 1,
  nombre: "Admin Demo",
  correo: "admin@demo.cl",
  password: "admin123",
  role: "admin",
  active: true,
};

const empleadoDemo = {
  id: 2,
  nombre: "Empleado Demo",
  correo: "empleado@demo.cl",
  password: "empleado123",
  role: "empleado",
  active: true,
};

const initialState = {
  bodegas: [],
  items: [],
  requests: [],
  users: [adminUserDemo, empleadoDemo],
  currentUser: null,
  categorias: [],
};

// ---------- Contexto ----------
const AppContext = createContext(null);

function nextId(list) {
  if (!Array.isArray(list) || list.length === 0) return 1;
  const maxId = list.reduce((max, it) => {
    const id = typeof it.id === "number" ? it.id : parseInt(it.id || "0", 10);
    return Number.isFinite(id) && id > max ? id : max;
  }, 0);
  return maxId + 1;
}

export function AppProvider({ children }) {
  const [state, setState] = useState(initialState);
  const [hydrated, setHydrated] = useState(false);

  // Carga inicial desde AsyncStorage
  useEffect(() => {
    (async () => {
      try {
        const stored = await loadState();
        if (stored && typeof stored === "object") {
          // Merge suave: respetamos estructura actual
          setState((prev) => ({
            ...prev,
            ...stored,
          }));
        }
      } catch (err) {
        console.log("[store] loadState error:", err);
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  // Persistencia automática
  useEffect(() => {
    if (!hydrated) return;
    (async () => {
      try {
        await saveState(state);
      } catch (err) {
        console.log("[store] saveState error:", err);
      }
    })();
  }, [state, hydrated]);

  // ---------- Derivados ----------

  // Items agrupados por bodegaId
  const itemsByBodega = useMemo(() => {
    const m = new Map();
    for (const it of state.items) {
      const key = it.bodegaId || "__ORPHAN__";
      const arr = m.get(key) || [];
      arr.push(it);
      m.set(key, arr);
    }
    return m;
  }, [state.items]);

  const metricsOf = (bodega) => {
    if (!bodega) {
      return {
        capacidad: 0,
        ocupado: 0,
        libre: 0,
        count: 0,
        unidades: 0,
      };
    }
    const capacidad = vol(bodega.ancho, bodega.alto, bodega.largo) || 0;
    const arr = itemsByBodega.get(bodega.id) || [];
    const ocupado = arr.reduce((acc, it) => {
      const v =
        vol(it.ancho, it.alto, it.largo) * clampInt(it.cantidad || 0, 1);
      return acc + (Number.isFinite(v) ? v : 0);
    }, 0);
    const unidades = arr.reduce(
      (acc, it) => acc + clampInt(it.cantidad || 0, 1),
      0
    );
    const libre = Math.max(capacidad - ocupado, 0);

    return {
      capacidad,
      ocupado,
      libre,
      count: arr.length,
      unidades,
    };
  };

  // ---------- BODEGAS ----------

  const normalizeBodegaRow = (row) => ({
    id: Number(row.id_bodega ?? row.id ?? 0),
    nombre: row.nombre ?? "",
    ciudad: row.ciudad ?? "",
    direccion: row.direccion ?? "",
    ancho: Number(row.ancho ?? 0),
    largo: Number(row.largo ?? 0),
    alto: Number(row.alto ?? 0),
    active: row.activo === 1 || row.activo === true,
    layout: row.layout || row.bodega_layout || null,
  });

  const syncBodegasFromApi = async () => {
    try {
      const res = await getBodegas();
      const raw = Array.isArray(res?.body)
        ? res.body
        : Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
        ? res.data
        : [];

      if (!Array.isArray(raw)) {
        throw new Error("Formato inesperado en /api/bodegas");
      }

      const bodegas = raw.map(normalizeBodegaRow);

      setState((prev) => ({
        ...prev,
        bodegas,
      }));
    } catch (err) {
      console.log("[syncBodegasFromApi] error:", err);
      Alert.alert(
        "Error",
        err?.message || "No se pudieron cargar las bodegas."
      );
    }
  };

  const saveBodega = async (bodega) => {
    const isUpdate = !!bodega.id;
    const userId = state.currentUser?.id ?? null;

    const payload = {
      nombre: (bodega.nombre || "").trim(),
      ciudad: (bodega.ciudad || "").trim(),
      direccion: (bodega.direccion || "").trim(),
      ancho: Number(bodega.ancho) || 0,
      largo: Number(bodega.largo) || 0,
      alto: Number(bodega.alto) || 0,
      id_usuario: userId,
      activo: bodega.active ? 1 : 0,
      layout: bodega.layout || null,
    };

    const normalizeRes = (res) => {
      if (!res) return { error: false, body: null, message: null };
      const error = res.error ?? false;
      const body = res.body ?? res.data ?? res;
      const message = res.message ?? body?.message ?? body?.error ?? null;
      return { error, body, message };
    };

    try {
      if (isUpdate) {
        const res = await updateBodegaApi({
          ...payload,
          id_bodega: bodega.id,
          id: bodega.id,
        });
        const { error, body, message } = normalizeRes(res);
        if (error) throw new Error(message || "Error actualizando bodega");

        setState((prev) => ({
          ...prev,
          bodegas: prev.bodegas.map((b) =>
            b.id === bodega.id ? { ...b, ...bodega } : b
          ),
        }));

        return body;
      } else {
        const res = await insertBodega(payload);
        const { error, body, message } = normalizeRes(res);
        if (error) throw new Error(message || "Error creando bodega");

        const idFromDb = body?.id_bodega ?? body?.id ?? null;

        setState((prev) => {
          const id = idFromDb || nextId(prev.bodegas);
          const nueva = { ...bodega, id };
          return { ...prev, bodegas: [...prev.bodegas, nueva] };
        });

        return body;
      }
    } catch (err) {
      console.log("[saveBodega] error:", err);
      Alert.alert(
        "Error",
        err?.message || "No se pudo guardar la bodega. Revisa la conexión."
      );
      throw err;
    }
  };

  const setBodegaActive = async (id, active) => {
    const bodega = state.bodegas.find((b) => b.id === id);
    if (!bodega) return;

    try {
      await saveBodega({ ...bodega, active });
    } catch (err) {
      // saveBodega ya muestra el Alert
    }
  };

  const deleteBodega = async (id, mode = "") => {
    try {
      await deleteBodegaApi({ id_bodega: id, mode });

      setState((prev) => ({
        ...prev,
        bodegas: prev.bodegas.filter((b) => b.id !== id),
        items: prev.items.filter((it) => it.bodegaId !== id),
      }));
    } catch (err) {
      console.log("[deleteBodega] error:", err);
      Alert.alert(
        "Error",
        err?.message || "No se pudo eliminar la bodega."
      );
    }
  };

  // ---------- CATEGORÍAS ----------

  const syncCategoriesFromApi = async () => {
    try {
      const res = await getCategories();
      const topBody = res?.body ?? res?.data ?? res;

      let rows = [];
      if (Array.isArray(res)) rows = res;
      else if (Array.isArray(res?.body?.body)) rows = res.body.body;
      else if (Array.isArray(res?.body)) rows = res.body;
      else if (Array.isArray(topBody?.body)) rows = topBody.body;
      else if (Array.isArray(topBody)) rows = topBody;

      const categoriasFromDb = rows.map((row) => ({
        id: Number(row.id_categoria),
        nombre: row.nombre,
        descripcion: row.descripcion || "",
        activo: row.activo === 1 || row.activo === true,
      }));

      setState((prev) => ({
        ...prev,
        categorias: categoriasFromDb,
      }));
    } catch (err) {
      console.log("[syncCategoriesFromApi] error:", err);
      Alert.alert(
        "Error",
        err?.message || "No se pudieron cargar las categorías."
      );
    }
  };

  // ---------- ITEMS ----------

  const reloadItems = async () => {
    const res = await getItems();
    const lista = Array.isArray(res?.body)
      ? res.body
      : Array.isArray(res)
      ? res
      : [];

    if (!Array.isArray(lista)) {
      throw new Error("Formato inesperado en /api/items");
    }

    const normalizadas = lista.map((it) => ({
      id: it.id ?? it.id_item,
      nombre: it.nombre,
      ancho: Number(it.ancho ?? 0),
      alto: Number(it.alto ?? 0),
      largo: Number(it.largo ?? 0),
      peso: Number(it.peso ?? 0),
      cantidad: clampInt(it.cantidad ?? 0, 1),
      bodegaId:
        it.bodegaId ??
        it.id_bodega ??
        it.bodega_id ??
        null,
      id_categoria: it.id_categoria ?? it.categoriaId ?? null,
      clase: it.clase || pesoAClase(it.peso),
    }));

    setState((prev) => ({
      ...prev,
      items: normalizadas,
    }));
  };

  const saveItem = async (payload) => {
    try {
      const creating = !payload.id;

      const body = {
        id_item: payload.id,
        nombre: payload.nombre,
        id_categoria:
          payload.id_categoria ?? payload.categoriaId ?? null,
        id_bodega:
          payload.bodegaId ?? payload.id_bodega ?? null,
        ancho: Number(payload.ancho ?? 0),
        largo: Number(payload.largo ?? 0),
        alto: Number(payload.alto ?? 0),
        peso: Number(payload.peso ?? 0),
        cantidad: clampInt(payload.cantidad || 1, 1),
      };

      if (creating) {
        await insertItem(body);
      } else {
        await updateItem(body);
      }

      await reloadItems();
      Alert.alert(
        "Ítem",
        creating ? "Creado correctamente." : "Actualizado correctamente."
      );
    } catch (error) {
      console.log("[saveItem] ERROR:", error?.message);
      Alert.alert(
        "Error",
        `No se pudo guardar el ítem.\n${
          error?.message || "Revisa la conexión."
        }`
      );
    }
  };

  const deleteItem = async (id) => {
    try {
      await deleteItemApi(id);
      await reloadItems();
      Alert.alert("Ítem", "Eliminado correctamente.");
    } catch (error) {
      console.log("[deleteItem] ERROR:", error?.message);
      Alert.alert(
        "Error",
        `No se pudo eliminar el ítem.\n${
          error?.message || "Revisa la conexión."
        }`
      );
    }
  };

  const moveItemPartial = async ({ id, fromBodegaId, toBodegaId, cantidad }) => {
    try {
      await moveItemQty(id, {
        fromBodegaId,
        toBodegaId,
        cantidad,
      });
      await reloadItems();
    } catch (error) {
      console.log("[moveItemPartial] ERROR:", error?.message);
      Alert.alert(
        "Error",
        `No se pudo mover el ítem.\n${
          error?.message || "Revisa la conexión."
        }`
      );
    }
  };

  // ---------- USUARIOS / AUTH ----------

  const saveUser = (user) => {
    setState((prev) => {
      const exists = prev.users.find((u) => u.id === user.id);
      if (exists) {
        return {
          ...prev,
          users: prev.users.map((u) =>
            u.id === user.id ? { ...u, ...user } : u
          ),
        };
      }
      const id = user.id || nextId(prev.users);
      return {
        ...prev,
        users: [...prev.users, { ...user, id, active: true }],
      };
    });
  };

  const loginAsDemo = (type) => {
    const user = type === "admin" ? adminUserDemo : empleadoDemo;
    setState((prev) => ({
      ...prev,
      currentUser: user,
    }));
  };

  const loginWithCredentials = (correo, password) => {
    const user = state.users.find(
      (u) =>
        u.correo?.toLowerCase() === correo.toLowerCase() &&
        u.password === password &&
        u.active !== false
    );

    if (!user) {
      return {
        ok: false,
        error: "Correo o contraseña inválidos.",
      };
    }

    setState((prev) => ({
      ...prev,
      currentUser: user,
    }));

    return { ok: true };
  };

  const logout = () => {
    setState((prev) => ({
      ...prev,
      currentUser: null,
    }));
  };

  // ---------- Valor de contexto ----------

  const value = useMemo(
    () => ({
      // Estado
      bodegas: state.bodegas,
      items: state.items,
      requests: state.requests,
      users: state.users,
      currentUser: state.currentUser,
      categorias: state.categorias,

      // Derivados
      metricsOf,

      // Bodegas
      saveBodega,
      deleteBodega,
      setBodegaActive,
      syncBodegasFromApi,

      // Categorías
      syncCategoriesFromApi,

      // Items
      saveItem,
      deleteItem,
      moveItemPartial,

      // Usuarios / auth
      saveUser,
      loginAsDemo,
      loginWithCredentials,
      logout,
    }),
    [state]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// Hook para usar el store
export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error("useApp debe usarse dentro de un <AppProvider />");
  }
  return ctx;
}

// Re-export helpers
export { vol, clampInt, pesoAClase, SIZE_CLASSES };
