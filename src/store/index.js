// C:\Users\japf2\Desktop\Tesis Cubicaje\Proyecto\proyectoPrincipal\cubicajeMobile-master\src\store\index.js
import React, {
  createContext,
  use,
  useCallback,
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
  egresarItemQty,
  getCategories,
  moveItemQty,
  getMovimientos, // ✅ NUEVO
  loginUser,
  saveNewUser
} from "../features/api";
import { log, set } from "react-native-reanimated";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";

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
  movimientos: [], // ✅ NUEVO
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

// (No la usamos ahora, pero la dejo por si más adelante quieres reutilizarla)
const normalizeBodegaRow = (row) => ({
  id: Number(row.id_bodega ?? row.id ?? 0),
  nombre: row.nombre ?? "",
  ciudad: row.nombre_ciudad ?? "",
  direccion: row.direccion ?? "",
  ancho: Number(row.ancho ?? 0),
  largo: Number(row.largo ?? 0),
  alto: Number(row.alto ?? 0),
  active:
    row.activo === 1 ||
    row.activo === true ||
    row.is_active === 1 ||
    row.is_active === true,
  layout: row.layout || row.bodega_layout || null,
});

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

  // Sincronización inicial desde la API
  useEffect(() => {
    if (!hydrated) return;

    (async () => {
      try {
        console.log("[AppProvider] sincronizando bodegas desde API...");
        await syncBodegasFromApi();
        // si quieres también categorías / ítems / movimientos:
        // await syncCategoriesFromApi();
        // await reloadItems();
        // await reloadMovimientos({ limit: 200 });
      } catch (err) {
        console.log("[AppProvider] error sincronizando datos iniciales:", err);
      }
    })();
  }, [hydrated]);

  // ---------- Derivados ----------

  // Items agrupados por id_bodega
const itemsByBodega = useMemo(() => {
  const m = new Map();
  for (const it of state.items) {
    const qty = Math.max(0, Number(it.cantidad ?? 0) || 0);

    if (qty <= 0) continue; // ✅ CAMBIO: si qty=0, “sale” de la bodega (no se muestra)

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
        vol(it.ancho, it.alto, it.largo) * Math.max(0, Number(it.cantidad ?? 0) || 0); // ✅ CAMBIO: respeta 0

      return acc + (Number.isFinite(v) ? v : 0);
    }, 0);
    const unidades = arr.reduce(
      (acc, it) => acc + Math.max(0, Number(it.cantidad ?? 0) || 0), // ✅ CAMBIO: respeta 0

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

  // ---------- MOVIMIENTOS ✅ NUEVO ----------

const reloadMovimientos = useCallback(async (opts = {}) => {
  const res = await getMovimientos(opts);

  const error = res?.error ?? false;
  if (error) {
    throw new Error(String(res?.body?.message || res?.body || "Error obteniendo movimientos"));
  }

  // Soportar varias formas de respuesta
  const topBody = res?.body ?? res?.data ?? res;

  let lista = [];
  if (Array.isArray(topBody)) {
    lista = topBody;
  } else if (Array.isArray(topBody?.body)) {
    lista = topBody.body;
  }

  setState((prev) => ({
    ...prev,
    movimientos: lista,
  }));

  return lista;
}, []); // ✅ importante: estabiliza la función


  // ---------- BODEGAS ----------

  const syncBodegasFromApi = async () => {
    try {
      const res = await getBodegas();
      console.log("[syncBodegasFromApi] res bruto:", res);

      // La API puede venir de varias formas, normalizamos:
      const error = res?.error ?? false;
      const topBody = res?.body ?? res?.data ?? res;

      if (error) {
        throw new Error(topBody?.message || "Error obteniendo bodegas");
      }

      let rows = [];

      // Distintos formatos posibles
      if (Array.isArray(res)) {
        rows = res;
      } else if (Array.isArray(res?.body?.body)) {
        rows = res.body.body;
      } else if (Array.isArray(res?.body)) {
        rows = res.body;
      } else if (Array.isArray(topBody?.body)) {
        rows = topBody.body;
      } else if (Array.isArray(topBody)) {
        rows = topBody;
      }

      console.log("[syncBodegasFromApi] rows detectadas:", rows.length);

      const bodegasFromDb = rows.map((row) => {
        // 🔹 Intentamos parsear el JSON del layout que viene desde MySQL
        let layoutMapaObj = null;

        if (row.layout_mapa_json) {
          try {
            if (typeof row.layout_mapa_json === "string") {
              layoutMapaObj = JSON.parse(row.layout_mapa_json);
            } else {
              layoutMapaObj = row.layout_mapa_json;
            }
          } catch (e) {
            console.log(
              "[syncBodegasFromApi] error parse layout_mapa_json para bodega",
              row.id_bodega ?? row.id,
              e
            );
            layoutMapaObj = null;
          }
        }
        return {
          id: Number(row.id_bodega ?? row.id),
          nombre: row.nombre || "",
          ciudad: row.nombre_ciudad || "",
          direccion: row.direccion || "",
          ancho: Number(row.ancho || 0),
          largo: Number(row.largo || 0),
          alto: Number(row.alto || 0),
          id_ciudad: row.ciudad,
          // estado activo (acepta activo o is_active)
          active:
            row.activo === 1 ||
            row.activo === true ||
            row.is_active === 1 ||
            row.is_active === true,

          id_usuario: row.id_usuario ?? null,

          // 🔹 Campos crudos del layout (por si se necesitan)
          layout_ancho: Number(row.layout_ancho || 0),
          layout_largo: Number(row.layout_largo || 0),
          layout_mapa_json: row.layout_mapa_json || null,

          // 🔹 OBJETO layout que usará Bodega3DScreen y otras pantallas
          layout: layoutMapaObj
            ? {
                ancho: Number(row.layout_ancho || 0),
                largo: Number(row.layout_largo || 0),
                mapa_json: layoutMapaObj,
              }
            : null,
        };
      });

      // 👀 Para que veas cómo queda el layout en memoria
      console.log(
        "[syncBodegasFromApi] bodegas mapeadas (resumen layout):",
        bodegasFromDb.map((b) => ({
          id: b.id,
          layout: b.layout,
        }))
      );

      setState((prev) => ({
        ...prev,
        bodegas: bodegasFromDb,
      }));
    } catch (err) {
      console.log("[syncBodegasFromApi] error:", err);
      throw err;
    }
  };

  const saveBodega = async (bodega) => {
    const isUpdate = !!bodega.id;
    //const userId = state.currentUser?.id ?? null;
    console.log("¿¿¿¿¿¿ENTRE???\n\n\n\n\n\n")
    console.log("\n\n\nsaveBodega: ", bodega)
    const payload = {
      nombre: (bodega.nombre || "").trim(),
      ciudad: (bodega.id_ciudad || ""),
      direccion: (bodega.direccion || "").trim(),
      ancho: Number(bodega.ancho) || 0,
      largo: Number(bodega.largo) || 0,
      alto: Number(bodega.alto) || 0,
      id_usuario: userId,
      activo: bodega.active ? 1 : 0,
      // 👇 layout completo (ancho, largo, mapa_json)
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

return { ...bodega, id: bodega.id };

      } else {
        const res = await insertBodega(payload);
        const { error, body, message } = normalizeRes(res);
        if (error) throw new Error(message || "Error creando bodega");

const idFromDb = body?.id_bodega ?? body?.id ?? null;

let nuevaCreada = null;

setState((prev) => {
  const id = idFromDb || nextId(prev.bodegas);
  nuevaCreada = { ...bodega, id };
  return { ...prev, bodegas: [...prev.bodegas, nuevaCreada] };
});

// ✅ devuelve una bodega con id seguro para navegar al Paso 2
return nuevaCreada ?? { ...bodega, id: idFromDb };

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
      cantidad: Math.max(0, Number(it.cantidad ?? 0) || 0), // ✅ CAMBIO: antes forzaba mínimo 1

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
      id_categoria: payload.id_categoria ?? payload.categoriaId ?? null,
      ancho: Number(payload.ancho ?? 0),
      largo: Number(payload.largo ?? 0),
      alto: Number(payload.alto ?? 0),
      peso: Number(payload.peso ?? 0),
    };

    // ✅ IMPORTANTE:
    // Solo al CREAR mandamos stock y bodega (porque el backend hace auto-ubicación real
    // y deja coherente bodega_ubicacion_items + bodega_items + item_movimientos).
    if (creating) {
      body.id_bodega = payload.bodegaId ?? payload.id_bodega ?? null;
      body.cantidad = Math.max(0, Number(payload.cantidad ?? 0) || 0);
    }

    if (creating) {
      await insertItem(body);
    } else {
      await updateItem(body);
    }

    await reloadItems();
    Alert.alert("Ítem", creating ? "Creado correctamente." : "Actualizado correctamente.");
  } catch (error) {
    console.log("[saveItem] ERROR:", error?.message);
    Alert.alert("Error", `No se pudo guardar el ítem.\n${error?.message || "Revisa la conexión."}`);
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

// cubicajeMobile-master/src/store/index.js

const moveItemPartial = async ({ id, fromBodegaId, toBodegaId, cantidad }) => {
  try {
    const res = await moveItemQty(id, { fromBodegaId, toBodegaId, cantidad });

    if (res?.error) {
      throw new Error(String(res?.body?.message || res?.body || "Error moviendo item"));
    }

    await reloadItems();
    return res;
  } catch (error) {
    console.log("[moveItemPartial] ERROR:", error?.message);
    Alert.alert(
      "Error",
      `No se pudo mover el ítem.\n${error?.message || "Revisa la conexión."}`
    );
    throw error;
  }
};

// ✅ NUEVO: egresar (sacar) unidades reales desde ubicaciones + kardex
const egresarItemPartial = async ({ id, bodegaId, cantidad }) => {
  try {
    if (!bodegaId) throw new Error("Este ítem no tiene bodega origen.");
    const res = await egresarItemQty(id, { bodegaId, cantidad });

    if (res?.error) {
      throw new Error(String(res?.body?.message || res?.body || "Error egresando item"));
    }

    await reloadItems();
    return res;
  } catch (error) {
    console.log("[egresarItemPartial] ERROR:", error?.message);
    Alert.alert(
      "Error",
      `No se pudo sacar unidades.\n${error?.message || "Revisa la conexión."}`
    );
    throw error;
  }
};


  // ---------- USUARIOS / AUTH ----------

  const [userLoading, setUserLoading] = useState(false);
  const [userToken, setUserToken] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userId, setUserId] = useState(null);
  const [userNombre, setUserNombre] = useState(null);

  const login = async (rut, password) => {
    const credentials = { rut, password };
    try {
      setUserLoading(true);
      const res = await loginUser(credentials); // Llama a la API para autenticar
      const data = res?.body ?? res;
      console.log("[login] respuesta loginUser:", res);
      if (res?.error) {
        throw new Error(String(res?.body?.message || res?.body || "Error en login"));
      } else {
        // Suponiendo que la respuesta contiene token, role e id
        setUserToken(data.token);
        setUserRole(data.rol);
        setUserId(data.id_usuario);
        setUserNombre(data.nombre);

        await AsyncStorage.setItem("userToken", data.token);
        await AsyncStorage.setItem("userRole", data.rol);
        await AsyncStorage.setItem("userId", String(data.id_usuario));
        await AsyncStorage.setItem("userNombre", data.nombre);

        return { ok: true };
      }
    } catch (error) {
      console.log("[login] ERROR:", error?.message);
      return { ok: false, message: error?.message || "Error en login" };
    } 
    finally {
      setUserLoading(false);
    }
  };
  
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

  const logout = async () => {
    setUserLoading(true);
    try {
      setUserToken(null);
      setUserRole(null);
      setUserId(null);
      setUserNombre(null);
      await AsyncStorage.removeItem("userToken");
      await AsyncStorage.removeItem("userRole");
      await AsyncStorage.removeItem("userId");
      await AsyncStorage.removeItem("userNombre");
      setState((prev) => ({
        ...prev,
        currentUser: null,
      }));
      
    } catch (error) {
      console.log("[logout] ERROR:", error?.message);
    } finally {
      setUserLoading(false);
    }
  };

  const isUserLoggedIn = async () => {
    console.log("Me ejecutó isUserLoggedIn");
    try {
      setUserLoading(true);
      let userToken = await AsyncStorage.getItem("userToken");
      let userRole = await AsyncStorage.getItem("userRole");
      let userId = await AsyncStorage.getItem("userId");
      let userNombre = await AsyncStorage.getItem("userNombre");

      if (userToken) {
        const decodeToken = jwtDecode(userToken);
        const isExpired = decodeToken.exp < Date.now() / 1000;
        if (isExpired) {
          await logout();
          return;
        } else {
          if (!userId){
            console.log("Sesión inválida: falta userId");
            await logout();
            return;
          }
          setUserToken(userToken);
          setUserRole(userRole);
          setUserId(userId);
          setUserNombre(userNombre);
        }
      }
    } catch (error) {
      console.log("[isUserLoggedIn] ERROR:", error?.message);
      logout();
    } finally {
      setUserLoading(false);
    }
  };

  useEffect(() => {
    isUserLoggedIn();
  }, []);

  // ---------- Valor de contexto ----------

  const value = useMemo(
  () => ({
    // Estado
    bodegas: state.bodegas,
    items: state.items,
    movimientos: state.movimientos,
    requests: state.requests,
    users: state.users,
    currentUser: state.currentUser,
    categorias: state.categorias,

    // Derivados
    metricsOf,

    // Movimientos
    reloadMovimientos,

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
    egresarItemPartial,

    // Usuarios / auth
    saveUser,
    loginAsDemo,
    loginWithCredentials,
    logout,
    login,
    userToken,
    userRole,
    userId,
    userNombre,
    userLoading,
  }),
  [state, reloadMovimientos, userToken, userRole, userId, userNombre, userLoading]
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
