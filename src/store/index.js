// cubicajeMobile-master/src/store/index.js
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { loadState, saveState } from "./localStore";
import { vol, clampInt, pesoAClase, SIZE_CLASSES } from "./helpers";

// ⚠️ APIs de bodegas (msApiCubicaje)
import { getBodegas, insertBodega, updateBodegaApi } from "../features/api";

// --------- Usuarios demo ---------
const adminUserDemo = {
  id: 1,
  nombre: "Admin Demo",
  correo: "admin@demo.cl",
  password: "admin123",
  role: "admin",
  rol: "admin",
  active: true,
};

const empleadoDemo = {
  id: 2,
  nombre: "Empleado Demo",
  correo: "empleado@demo.cl",
  password: "empleado123",
  role: "empleado",
  rol: "empleado",
  active: true,
};

// --------- Estado inicial ---------
const initialState = {
  bodegas: [],
  items: [],
  requests: [],
  users: [adminUserDemo, empleadoDemo],
  currentUser: null, // empieza deslogueado
};

// Contexto
const AppContext = createContext(null);

// ========= PROVIDER =========
export function AppProvider({ children }) {
  const [state, setState] = useState(initialState);
  const [hydrated, setHydrated] = useState(false);

  // Cargar desde AsyncStorage
  useEffect(() => {
    (async () => {
      try {
        const saved = await loadState();
        if (saved && typeof saved === "object") {
          setState((prev) => ({
            ...prev,
            ...saved,
          }));
        }
      } catch (e) {
        console.warn("[AppProvider] error loadState", e);
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  // Guardar cuando cambie
  useEffect(() => {
    if (!hydrated) return;
    saveState(state).catch((e) =>
      console.warn("[AppProvider] error saveState", e)
    );
  }, [state, hydrated]);

  // ========= AUTH / USUARIO ACTUAL =========

  const loginAsDemo = (type) => {
    const user =
      type === "empleado" || type === "employee" ? empleadoDemo : adminUserDemo;

    setState((prev) => {
      const exists = prev.users.some((u) => u.id === user.id);
      const users = exists ? prev.users : [...prev.users, user];

      return {
        ...prev,
        users,
        currentUser: user,
      };
    });
  };

  const loginWithCredentials = (correo, password) => {
    const email = (correo || "").trim().toLowerCase();
    const pwd = (password || "").trim();

    if (!email || !pwd) {
      return { ok: false, error: "Debes ingresar correo y contraseña." };
    }

    const user = state.users.find(
      (u) =>
        (u.correo || "").toLowerCase() === email &&
        (u.password || "") === pwd &&
        u.active !== false
    );

    if (!user) {
      return { ok: false, error: "Correo o contraseña incorrectos." };
    }

    setState((prev) => ({
      ...prev,
      currentUser: user,
    }));

    return { ok: true, user };
  };

  const logout = () => {
    setState((prev) => ({
      ...prev,
      currentUser: null,
    }));
  };

  const updateCurrentUser = ({ nombre, correo, password }) => {
    setState((prev) => {
      if (!prev.currentUser) return prev;
      const updated = {
        ...prev.currentUser,
        nombre: nombre ?? prev.currentUser.nombre,
        correo: correo ?? prev.currentUser.correo,
      };
      if (password) {
        updated.password = password;
      }

      const users = prev.users.map((u) =>
        u.id === updated.id ? { ...u, ...updated } : u
      );
      return {
        ...prev,
        currentUser: updated,
        users,
      };
    });
  };

  // ========= HELPERS GENERALES =========

  const nextId = (list) =>
    list.length ? Math.max(...list.map((x) => Number(x.id) || 0)) + 1 : 1;

  // ========= BODEGAS =========

  const metricsOf = (bodega) => {
    if (!bodega) {
      return { capacidad: 0, ocupado: 0, libre: 0 };
    }
    const capacidad = vol(bodega.ancho, bodega.alto, bodega.largo);

    const itemsDeBodega = state.items.filter(
      (it) => it.bodegaId === bodega.id
    );

    let ocupado = 0;
    for (const it of itemsDeBodega) {
      const vUnit = vol(it.ancho, it.alto, it.largo);
      const cant = clampInt(it.cantidad, 1);
      if (Number.isFinite(vUnit) && cant > 0) {
        ocupado += vUnit * cant;
      }
    }

    const libre = Math.max(capacidad - ocupado, 0);
    return { capacidad, ocupado, libre };
  };

  // Cargar bodegas desde la API y guardarlas en el estado global
  const syncBodegasFromApi = async () => {
    try {
      const res = await getBodegas();

      // 👀 Log para ver qué llega realmente del helper
      console.log("[syncBodegasFromApi] res bruto:", res);

      const error = res?.error ?? false;
      const topBody = res?.body ?? res?.data ?? res;

      if (error) {
        throw new Error(topBody?.message || "Error obteniendo bodegas");
      }

      // Intentar encontrar el array de bodegas
      let rows = [];

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

      const bodegasFromDb = rows.map((row) => ({
        id: Number(row.id_bodega),
        nombre: row.nombre,
        ciudad: row.ciudad || "",
        direccion: row.direccion || "",
        ancho: Number(row.ancho || 0),
        alto: Number(row.alto || 0),
        largo: Number(row.largo || 0),
        // viene como is_active desde el SELECT:
        // activo AS is_active
        active: row.is_active === 1 || row.is_active === true,
      }));

      console.log(
        "[syncBodegasFromApi] bodegas mapeadas:",
        bodegasFromDb.length
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

  // Guardar/actualizar bodega llamando a la API
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
    };

    const normalize = (res) => {
      if (!res) return { error: false, body: null, message: null };
      const error = res.error ?? false;
      const body = res.body ?? res.data ?? res;
      const message = res.message ?? body?.message ?? body?.error ?? null;
      return { error, body, message };
    };

    try {
      if (isUpdate) {
        // UPDATE
        const res = await updateBodegaApi({
          ...payload,
          id_bodega: bodega.id,
          id: bodega.id,
        });
        const { error, body, message } = normalize(res);
        if (error) {
          throw new Error(message || "Error actualizando bodega");
        }

        setState((prev) => ({
          ...prev,
          bodegas: prev.bodegas.map((b) =>
            b.id === bodega.id ? { ...b, ...bodega } : b
          ),
        }));

        return body;
      } else {
        // INSERT
        const res = await insertBodega(payload);
        const { error, body, message } = normalize(res);
        if (error) {
          throw new Error(message || "Error creando bodega");
        }

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
      throw err;
    }
  };

  const setBodegaActive = (id, active) => {
    setState((prev) => ({
      ...prev,
      bodegas: prev.bodegas.map((b) =>
        b.id === id ? { ...b, active } : b
      ),
    }));
  };

  // ========= ITEMS =========

  const saveItem = async (item) => {
    setState((prev) => {
      if (item.id) {
        const items = prev.items.map((it) =>
          it.id === item.id ? { ...it, ...item } : it
        );
        return { ...prev, items };
      }
      const id = nextId(prev.items);
      const nuevo = { ...item, id };
      return { ...prev, items: [...prev.items, nuevo] };
    });
  };

  const deleteItem = async (id) => {
    setState((prev) => ({
      ...prev,
      items: prev.items.filter((it) => it.id !== id),
    }));
  };

  const moveItemPartial = async ({ id, fromBodegaId, toBodegaId, cantidad }) => {
    setState((prev) => {
      const items = [...prev.items];
      const idx = items.findIndex((it) => it.id === id);
      if (idx === -1) return prev;

      const item = items[idx];
      const total = clampInt(item.cantidad, 1);
      const cant = clampInt(cantidad, 1);
      if (!cant || cant > total) return prev;

      const restante = total - cant;
      items[idx] = { ...item, cantidad: restante, bodegaId: fromBodegaId };

      if (restante <= 0) {
        items.splice(idx, 1);
      }

      const destinoIdx = items.findIndex(
        (it) =>
          it.bodegaId === toBodegaId &&
          it.nombre === item.nombre &&
          it.ancho === item.ancho &&
          it.alto === item.alto &&
          it.largo === item.largo &&
          it.peso === item.peso
      );

      if (destinoIdx !== -1) {
        const dest = items[destinoIdx];
        items[destinoIdx] = {
          ...dest,
          cantidad: clampInt(dest.cantidad, 1) + cant,
        };
      } else {
        items.push({
          ...item,
          id: nextId(items),
          bodegaId: toBodegaId,
          cantidad: cant,
        });
      }

      return { ...prev, items };
    });
  };

  // ========= SOLICITUDES =========

  const createBodegaRequest = (req) => {
    setState((prev) => {
      const id = nextId(prev.requests);
      const nueva = {
        id,
        status: "pendiente",
        ...req,
      };
      return { ...prev, requests: [nueva, ...prev.requests] };
    });
  };

  const setRequestStatus = (id, status) => {
    setState((prev) => ({
      ...prev,
      requests: prev.requests.map((r) =>
        r.id === id ? { ...r, status } : r
      ),
    }));
  };

  // ========= USUARIOS =========

  const saveUser = (user) => {
    setState((prev) => {
      if (user.id) {
        const users = prev.users.map((u) =>
          u.id === user.id ? { ...u, ...user } : u
        );
        const currentUser =
          prev.currentUser && prev.currentUser.id === user.id
            ? { ...prev.currentUser, ...user }
            : prev.currentUser;

        return { ...prev, users, currentUser };
      }
      const id = nextId(prev.users);
      const nuevo = { ...user, id };
      return { ...prev, users: [...prev.users, nuevo] };
    });
  };

  const setUserActive = (id, active) => {
    setState((prev) => ({
      ...prev,
      users: prev.users.map((u) =>
        u.id === id ? { ...u, active } : u
      ),
    }));
  };

  const deleteUser = (id) => {
    setState((prev) => ({
      ...prev,
      users: prev.users.filter((u) => u.id !== id),
      currentUser:
        prev.currentUser && prev.currentUser.id === id
          ? null
          : prev.currentUser,
    }));
  };

  // --------- VALUE DEL CONTEXTO ---------
  const value = useMemo(
    () => ({
      ...state,

      // helpers
      vol,
      clampInt,
      pesoAClase,
      SIZE_CLASSES,

      // auth
      loginAsDemo,
      loginWithCredentials,
      logout,
      updateCurrentUser,

      // bodegas
      metricsOf,
      saveBodega,
      setBodegaActive,
      syncBodegasFromApi, // 👈 aquí está expuesto

      // items
      saveItem,
      deleteItem,
      moveItemPartial,

      // solicitudes
      createBodegaRequest,
      setRequestStatus,

      // usuarios
      saveUser,
      setUserActive,
      deleteUser,
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
