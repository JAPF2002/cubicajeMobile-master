// C:\Users\japf2\Desktop\Tesis Cubicaje\Proyecto\proyectoPrincipal\cubicajeMobile-master\src\store.js

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Alert } from "react-native";
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
} from "./features/api";

/* ----------------- Storage (web/RN fallback) ----------------- */

const memStore = {
  _map: new Map(),
  async getItem(k) {
    return this._map.has(k) ? this._map.get(k) : null;
  },
  async setItem(k, v) {
    this._map.set(k, v);
  },
  async removeItem(k) {
    this._map.delete(k);
  },
};

export const LocalStore = {
  async getItem(key) {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch {}
    return memStore.getItem(key);
  },
  async setItem(key, value) {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(key, value);
        return;
      }
    } catch {}
    return memStore.setItem(key, value);
  },
  async removeItem(key) {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.removeItem(key);
        return;
      }
    } catch {}
    return memStore.removeItem(key);
  },
};

/* ----------------- Keys ----------------- */

export const K_BODEGAS = "@bodegas";
export const K_ITEMS = "@items";
export const K_USERS = "@users";
export const K_SESSION = "@session";
export const K_BDG_REQUESTS = "@bodega_requests";

/* ----------------- Helpers ----------------- */

export const num = (v) => {
  const n = parseFloat(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};

export const vol = (ancho, alto, largo) =>
  num(ancho) * num(alto) * num(largo); // m³

export const clampInt = (v, min = 1) =>
  Math.max(parseInt(v || "0", 10) || 0, min);

export const genId = () => Math.random().toString(36).slice(2, 9);

export const itemVolTotal = (it) =>
  vol(it.ancho, it.alto, it.largo) * clampInt(it.cantidad, 1);

export const SIZE_CLASSES = [
  { key: "XS", label: "XS", min: 0, max: 0.5 },
  { key: "S", label: "S", min: 0.51, max: 1.5 },
  { key: "M", label: "M", min: 1.51, max: 3 },
  { key: "L", label: "L", min: 3.01, max: 6 },
  { key: "XL", label: "XL", min: 6.01, max: 10 },
  { key: "XXL", label: "XXL", min: 10.01, max: 15 },
  { key: "XL+1", label: "XL+1", min: 15.01, max: Infinity },
];

export function pesoAClase(pesoKg) {
  const p = num(pesoKg);
  for (const c of SIZE_CLASSES) {
    if (p >= c.min && p <= c.max) return c.key;
  }
  return "N/D";
}

/* ----------------- Contexto ----------------- */

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

export function AppProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [bodegas, setBodegas] = useState([]);
  const [items, setItems] = useState([]);
  const [requests, setRequests] = useState([]);
  const [categorias, setCategorias] = useState([]);

  /* ---------- Carga inicial ---------- */

  useEffect(() => {
    (async () => {
      try {
        const [itemsStr, reqsStr, usersStr, sessionStr] =
          await Promise.all([
            LocalStore.getItem(K_ITEMS),
            LocalStore.getItem(K_BDG_REQUESTS),
            LocalStore.getItem(K_USERS),
            LocalStore.getItem(K_SESSION),
          ]);

        const itLocal = JSON.parse(itemsStr || "[]");
        const reqs = JSON.parse(reqsStr || "[]");
        const users = JSON.parse(usersStr || "[]");
        const session = JSON.parse(sessionStr || "null");

        setItems(Array.isArray(itLocal) ? itLocal : []);
        setRequests(Array.isArray(reqs) ? reqs : []);

        if (session && Array.isArray(users) && users.length) {
          const u = users.find((x) => x.id === session.userId);
          if (u) {
            setCurrentUser({
              id: u.id,
              name: u.name,
              email: u.email,
              role: u.role,
            });
          }
        }

        await Promise.all([
          reloadBodegasSafe(),
          reloadItemsSafe(),
          loadCategoriasSafe(),
        ]);
      } catch (e) {
        console.log("Error inicializando store:", e?.message);
      }
    })();
  }, []);

  /* ---------- Persistencia local ---------- */

  useEffect(() => {
    LocalStore.setItem(K_BODEGAS, JSON.stringify(bodegas));
  }, [bodegas]);

  useEffect(() => {
    LocalStore.setItem(K_ITEMS, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    LocalStore.setItem(K_BDG_REQUESTS, JSON.stringify(requests));
  }, [requests]);

  /* ---------- Helpers internos: API BODEGAS ---------- */

  const reloadBodegas = async () => {
    const res = await getBodegas();

    const lista = Array.isArray(res?.body)
      ? res.body
      : Array.isArray(res)
      ? res
      : [];

    if (!Array.isArray(lista)) {
      throw new Error("Formato inesperado en /api/bodegas");
    }

    const normalizadas = lista.map((b) => ({
      id: b.id_bodega ?? b.id,
      nombre: b.nombre,
      ciudad: b.ciudad,
      direccion: b.direccion,
      ancho: num(b.ancho),
      alto: num(b.alto),
      largo: num(b.largo),
      active:
        b.is_active !== undefined
          ? b.is_active !== 0
          : (b.active ?? true) !== false,
    }));

    setBodegas(normalizadas);
    await LocalStore.setItem(K_BODEGAS, JSON.stringify(normalizadas));
  };

  const reloadBodegasSafe = async () => {
    try {
      await reloadBodegas();
    } catch (e) {
      console.log("[reloadBodegasSafe] ERROR:", e?.message);
      const bStr = await LocalStore.getItem(K_BODEGAS);
      const b = JSON.parse(bStr || "[]");
      setBodegas(Array.isArray(b) ? b : []);
    }
  };

  /* ---------- Helpers internos: API ITEMS ---------- */

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

    // Los ítems deberían venir normalizados desde el backend,
    // pero mantenemos un mapeo defensivo.
    const normalizadas = lista.map((it) => ({
      id: it.id_item ?? it.id,
      nombre: it.nombre,
      ancho: num(it.ancho),
      alto: num(it.alto),
      largo: num(it.largo),
      peso: num(it.peso),
      cantidad: clampInt(it.cantidad ?? it.qty ?? 1, 1),
      bodegaId:
        it.bodegaId ?? it.id_bodega ?? it.bodega_id ?? null,
      id_categoria:
        it.id_categoria ?? it.categoriaId ?? null,
      clase: it.clase || pesoAClase(it.peso),
    }));

    setItems(normalizadas);
    await LocalStore.setItem(K_ITEMS, JSON.stringify(normalizadas));
  };

  const reloadItemsSafe = async () => {
    try {
      await reloadItems();
    } catch (e) {
      console.log("[reloadItemsSafe] ERROR:", e?.message);
      const itStr = await LocalStore.getItem(K_ITEMS);
      const it = JSON.parse(itStr || "[]");
      setItems(Array.isArray(it) ? it : []);
    }
  };

  const loadCategoriasSafe = async () => {
    try {
      const res = await getCategories();

      const lista = Array.isArray(res?.body)
        ? res.body
        : Array.isArray(res)
        ? res
        : [];

      const norm = lista
        .map((c) => ({
          id: c.id_categoria ?? c.id,
          nombre: c.nombre ?? c.name,
        }))
        .filter((c) => c.id && c.nombre);

      setCategorias(norm);
      console.log(
        "[loadCategoriasSafe] OK:",
        norm.length,
        "categorías"
      );
    } catch (e) {
      console.log("[loadCategoriasSafe] ERROR:", e?.message);
    }
  };

  /* ---------- Derivados ---------- */

  const itemsByBodega = useMemo(() => {
    const m = new Map();
    for (const it of items) {
      const key = it.bodegaId || "__ORPHAN__";
      const arr = m.get(key) || [];
      arr.push(it);
      m.set(key, arr);
    }
    return m;
  }, [items]);

  const metricsOf = (b) => {
    const capacidad = vol(b.ancho, b.alto, b.largo);
    const arr = itemsByBodega.get(b.id) || [];
    const ocupado = arr.reduce(
      (acc, it) => acc + itemVolTotal(it),
      0
    );
    const unidades = arr.reduce(
      (acc, it) => acc + clampInt(it.cantidad, 1),
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

  /* ---------- Acciones BODEGAS ---------- */

  const saveBodega = async (payload) => {
    try {
      const creating = !payload.id;
      const usuarioId = currentUser?.id || 1;

      const body = {
        ...payload,
        id_bodega: payload.id,
        usuario_id: usuarioId,
        id_usuario: usuarioId,
      };

      if (creating) {
        await insertBodega(body);
      } else {
        await updateBodegaApi(body);
      }

      await reloadBodegas();
      Alert.alert(
        "Bodega",
        creating
          ? "Creada correctamente."
          : "Actualizada correctamente."
      );
    } catch (error) {
      console.log("[saveBodega] ERROR:", error?.message);
      Alert.alert(
        "Error",
        `No se pudo guardar la bodega.\n${
          error?.message || "Revisa la conexión."
        }`
      );
    }
  };

  const setBodegaActive = async (id, active) => {
    try {
      await updateBodegaApi({
        id_bodega: id,
        is_active: active ? 1 : 0,
      });

      await reloadBodegas();
      Alert.alert(
        "Bodega",
        active
          ? "Bodega activada correctamente."
          : "Bodega desactivada correctamente."
      );
    } catch (error) {
      console.log("[setBodegaActive] ERROR:", error?.message);
      Alert.alert(
        "Error",
        `No se pudo cambiar el estado de la bodega.\n${
          error?.message || "Revisa la conexión."
        }`
      );
    }
  };

  const deleteBodegaOrphanItems = async (id, force = false) => {
    try {
      const res = await deleteBodegaApi(
        id,
        force ? "unassign" : undefined
      );

      if (res?.status === 409 || res?.body?.hasItems) {
        return res;
      }

      await reloadBodegas();
      Alert.alert("Bodega", "Eliminada correctamente.");
      return res;
    } catch (error) {
      console.log("[deleteBodega] ERROR:", error?.message);
      Alert.alert(
        "Error",
        `No se pudo eliminar la bodega.\n${
          error?.message || "Revisa la conexión."
        }`
      );
    }
  };

  /* ---------- Acciones ITEMS ---------- */

  const saveItem = async (payload) => {
    try {
      const creating = !payload.id;

      // Aquí solo preparamos el body; la lógica de normalización/guardado vive en el backend.
      const body = {
        id: payload.id,
        id_item: payload.id,
        nombre: payload.nombre,
        id_categoria:
          payload.id_categoria ?? payload.categoriaId ?? null,
        id_bodega:
          payload.bodegaId ?? payload.id_bodega ?? null,
        ancho: payload.ancho,
        largo: payload.largo,
        alto: payload.alto,
        peso: payload.peso,
        cantidad: payload.cantidad,
      };

      if (creating) {
        await insertItem(body);
      } else {
        await updateItem(body);
      }

      await reloadItems();
      Alert.alert(
        "Ítem",
        creating
          ? "Creado correctamente."
          : "Actualizado correctamente."
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

  const deleteItemWrapped = async (id) => {
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

  /* ---------- Solicitudes de desactivación ---------- */

  const createDeactivateRequest = async ({
    bodegaId,
    userId,
    motivo = "",
  }) => {
    const exists = requests.some(
      (r) =>
        r.bodegaId === bodegaId &&
        r.status === "pending"
    );

    if (exists) {
      return Alert.alert(
        "Solicitud",
        "Ya existe una solicitud pendiente para esta bodega."
      );
    }

    const req = {
      id: genId(),
      bodegaId,
      byUserId: userId,
      motivo,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    setRequests((prev) => [req, ...prev]);

    Alert.alert(
      "Solicitud enviada",
      "Un administrador revisará tu solicitud."
    );
  };

  const approveRequest = async (reqId) => {
    const req = requests.find((r) => r.id === reqId);
    if (!req) return;

    await setBodegaActive(req.bodegaId, false);

    setRequests((prev) =>
      prev.map((r) =>
        r.id === reqId
          ? {
              ...r,
              status: "approved",
              resolvedAt: new Date().toISOString(),
            }
          : r
      )
    );

    Alert.alert(
      "Solicitud aprobada",
      "La bodega fue desactivada y sus ítems quedaron sueltos."
    );
  };

  const rejectRequest = async (reqId) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === reqId
          ? {
              ...r,
              status: "rejected",
              resolvedAt: new Date().toISOString(),
            }
          : r
      )
    );
  };

  /* ---------- Auth ---------- */

  const onLogin = async (user) => {
    setCurrentUser(user);
    await LocalStore.setItem(
      K_SESSION,
      JSON.stringify({ userId: user.id })
    );
  };

  const onLogout = async () => {
    setCurrentUser(null);
    await LocalStore.removeItem(K_SESSION);
  };

  /* ---------- Derivado ---------- */

  const pendingCount = useMemo(
    () =>
      requests.filter(
        (r) => r.status === "pending"
      ).length,
    [requests]
  );

  /* ---------- Provider ---------- */

  return (
    <Ctx.Provider
      value={{
        currentUser,
        bodegas,
        items,
        categorias,
        requests,
        itemsByBodega,
        metricsOf,
        pendingCount,
        // Bodegas
        saveBodega,
        deleteBodegaOrphanItems,
        setBodegaActive,
        // Items
        saveItem,
        deleteItem: deleteItemWrapped,
        // Requests
        createDeactivateRequest,
        approveRequest,
        rejectRequest,
        // Auth
        onLogin,
        onLogout,
        // Utils
        vol,
        clampInt,
        itemVolTotal,
        SIZE_CLASSES,
        pesoAClase,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}
