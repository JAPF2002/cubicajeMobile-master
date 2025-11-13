// src/store/index.js
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { loadState, saveState } from "./localStore";
import { vol, clampInt, pesoAClase, SIZE_CLASSES } from "./helpers";

// --------- usuarios demo ---------
const adminUserDemo = {
  id: 1,
  nombre: "Admin Demo",
  correo: "admin@demo.cl",
  password: "admin123",
  role: "admin",
  rol: "admin", // compatibilidad
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

// --------- estado inicial ---------
const initialState = {
  bodegas: [],
  items: [],
  requests: [],
  users: [adminUserDemo, empleadoDemo],
  currentUser: null, // empieza deslogueado
};

// contexto
const AppContext = createContext(null);

// ========= provider =========
export function AppProvider({ children }) {
  const [state, setState] = useState(initialState);
  const [hydrated, setHydrated] = useState(false);

  // cargar desde AsyncStorage
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

  // guardar cuando cambie
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
      // (password no se guarda realmente, solo ejemplo)
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

  // ========= BODEGAS =========

  const nextId = (list) =>
    list.length ? Math.max(...list.map((x) => Number(x.id) || 0)) + 1 : 1;

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

  const saveBodega = async (bodega) => {
    setState((prev) => {
      if (bodega.id) {
        const bodegas = prev.bodegas.map((b) =>
          b.id === bodega.id ? { ...b, ...bodega } : b
        );
        return { ...prev, bodegas };
      }
      const id = nextId(prev.bodegas);
      const nueva = { ...bodega, id };
      return { ...prev, bodegas: [...prev.bodegas, nueva] };
    });
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

      // restar del origen
      const restante = total - cant;
      items[idx] = { ...item, cantidad: restante, bodegaId: fromBodegaId };

      if (restante <= 0) {
        items.splice(idx, 1);
      }

      // crear / sumar en destino
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
        // si es el currentUser, actualizarlo también
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

  // --------- value del contexto ---------
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
      logout,
      updateCurrentUser,

      // bodegas
      metricsOf,
      saveBodega,
      setBodegaActive,

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

// hook para usar el store
export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error("useApp debe usarse dentro de un <AppProvider />");
  }
  return ctx;
}

// re-export helpers por comodidad
export { vol, clampInt, pesoAClase, SIZE_CLASSES };
