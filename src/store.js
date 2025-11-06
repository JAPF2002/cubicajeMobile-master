// src/store.js
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Alert } from "react-native";
import { getBodegas, insertBodega, updateBodegaApi } from "./features/api";


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
      if (typeof window !== "undefined" && window.localStorage)
        return window.localStorage.getItem(key);
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
export const K_LOGIN_LOG = "@login_log";
export const K_EMAIL_CODES = "@email_codes";
export const K_BDG_REQUESTS = "@bodega_requests";

/* ----------------- Helpers compartidos ----------------- */
export const num = (v) => {
  const n = parseFloat(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};

export const vol = (ancho, alto, largo) => num(ancho) * num(alto) * num(largo); // m³

export const clampInt = (v, min = 1) =>
  Math.max(parseInt(v || "0", 10) || 0, min);

export const genId = () => Math.random().toString(36).slice(2, 9);

export const hash = (s) => {
  try {
    return btoa(unescape(encodeURIComponent(s)));
  } catch {
    return s;
  }
};

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

export function validateStrongPassword(pw) {
  if (typeof pw !== "string")
    return { ok: false, msg: "Contraseña inválida." };
  if (pw.length < 12 || pw.length > 16)
    return {
      ok: false,
      msg: "La contraseña debe tener entre 12 y 16 caracteres.",
    };
  if (!/[a-z]/.test(pw))
    return { ok: false, msg: "Debe incluir al menos 1 letra minúscula." };
  if (!/[A-Z]/.test(pw))
    return { ok: false, msg: "Debe incluir al menos 1 letra mayúscula." };
  if (!/[0-9]/.test(pw))
    return { ok: false, msg: "Debe incluir al menos 1 número." };
  if (!/[^A-Za-z0-9]/.test(pw))
    return {
      ok: false,
      msg: "Debe incluir al menos 1 carácter especial.",
    };
  return { ok: true, msg: "OK" };
}

/* ----------------- Contexto de la App ----------------- */
const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

export function AppProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [bodegas, setBodegas] = useState([]);
  const [items, setItems] = useState([]);
  const [requests, setRequests] = useState([]);

  // Cargar datos iniciales:
  // - items, requests, users, session desde storage
  // - bodegas desde API (con fallback a storage)
  useEffect(() => {
    (async () => {
      try {
        // 1) Otros datos desde storage
        const [itemsStr, reqsStr, usersStr, sessionStr] = await Promise.all([
          LocalStore.getItem(K_ITEMS),
          LocalStore.getItem(K_BDG_REQUESTS),
          LocalStore.getItem(K_USERS),
          LocalStore.getItem(K_SESSION),
        ]);

        const it = JSON.parse(itemsStr || "[]");
        const reqs = JSON.parse(reqsStr || "[]");
        const users = JSON.parse(usersStr || "[]");
        const session = JSON.parse(sessionStr || "null");

        setItems(Array.isArray(it) ? it : []);
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

        // 2) Bodegas desde la API
        try {
          const res = await getBodegas();
          console.log("Respuesta /api/bodegas:", res);

          // Puede venir como { body: [...] } o directamente [...]
          const lista = Array.isArray(res?.body) ? res.body : res;

          if (Array.isArray(lista)) {
            const normalizadas = lista.map((b) => ({
              id: b.id_bodega || b.id,
              nombre: b.nombre,
              direccion: b.direccion,
              ciudad: b.ciudad,
              ancho: b.ancho,
              alto: b.alto,
              largo: b.largo,
              active:
                b.is_active !== undefined
                  ? b.is_active !== 0
                  : b.active !== 0 && b.active !== false,
            }));

            setBodegas(normalizadas);
            await LocalStore.setItem(
              K_BODEGAS,
              JSON.stringify(normalizadas)
            );
          } else {
            console.log(
              "Formato inesperado en /api/bodegas, uso storage local si existe"
            );
            const bStr = await LocalStore.getItem(K_BODEGAS);
            const b = JSON.parse(bStr || "[]");
            setBodegas(Array.isArray(b) ? b : []);
          }
        } catch (eApi) {
          console.log("Error llamando /api/bodegas:", eApi?.message);
          const bStr = await LocalStore.getItem(K_BODEGAS);
          const b = JSON.parse(bStr || "[]");
          setBodegas(Array.isArray(b) ? b : []);
        }
      } catch (e) {
        console.log("Error inicializando store:", e?.message);
      }
    })();
  }, []);

  /* ----------------- Persistencia ----------------- */
  useEffect(() => {
    LocalStore.setItem(K_BODEGAS, JSON.stringify(bodegas));
  }, [bodegas]);

  useEffect(() => {
    LocalStore.setItem(K_ITEMS, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    LocalStore.setItem(K_BDG_REQUESTS, JSON.stringify(requests));
  }, [requests]);

  /* ----------------- Derivados ----------------- */

  // Agrupar items por bodega
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

  // Métricas por bodega
  const metricsOf = (b) => {
    const capacidad = vol(b.ancho, b.alto, b.largo);
    const arr = itemsByBodega.get(b.id) || [];
    const ocupado = arr.reduce(
      (acc, it) =>
        acc +
        vol(it.ancho, it.alto, it.largo) * clampInt(it.cantidad, 1),
      0
    );
    const unidades = arr.reduce(
      (acc, it) => acc + clampInt(it.cantidad, 1),
      0
    );
    const libre = Math.max(capacidad - ocupado, 0);
    return { capacidad, ocupado, libre, count: arr.length, unidades };
  };

  /* ----------------- Acciones bodegas ----------------- */

  const saveBodega = async (payload) => {
    try {
      const creating = !payload.id;
      const usuarioId = currentUser?.id || 1;

      // Body según msApiCubicaje:
      // - el backend nos pidió usuario_id
      // - por compatibilidad mandamos también id_usuario
      const body = creating
        ? {
            nombre: (payload.nombre || "").trim(),
            ciudad: (payload.ciudad || "").trim(),
            direccion: (payload.direccion || "").trim(),
            ancho: Number(payload.ancho),
            largo: Number(payload.largo),
            alto: Number(payload.alto),
            usuario_id: usuarioId,
            id_usuario: usuarioId,
          }
        : {
            id_bodega: payload.id,
            nombre: (payload.nombre || "").trim(),
            ciudad: (payload.ciudad || "").trim(),
            direccion: (payload.direccion || "").trim(),
            ancho: Number(payload.ancho),
            largo: Number(payload.largo),
            alto: Number(payload.alto),
            usuario_id: usuarioId,
            id_usuario: usuarioId,
            is_active: payload.active === false ? 0 : 1,
          };

      console.log(
        "[saveBodega]",
        creating ? "CREATE" : "UPDATE",
        "body:",
        body
      );

      const apiRes = creating
        ? await insertBodega(body)
        : await updateBodegaApi(body);

      console.log("[saveBodega] raw response:", apiRes);

      // Si reqHelper nos devuelve un AxiosError
      if (apiRes?.isAxiosError || apiRes?._isAxiosError) {
        const data = apiRes.response?.data;
        console.log("[saveBodega] backend error payload:", data || apiRes);

        const msg =
          data?.body ||
          data?.message ||
          data?.error ||
          apiRes.message ||
          "El servidor rechazó la solicitud.";
        throw new Error(msg);
      }

      // Formato { error:true, body:"..." } desde el backend
      if (apiRes && apiRes.error) {
        console.log("[saveBodega] backend error payload:", apiRes);
        throw new Error(apiRes.body || apiRes.message || "Error en API de bodegas.");
      }

      // ✅ Si no hubo error, recargamos bodegas desde la API
      const listRes = await getBodegas();
      const lista = Array.isArray(listRes?.body) ? listRes.body : listRes;

      if (!Array.isArray(lista)) {
        console.log("[saveBodega] listRes inesperado:", listRes);
        throw new Error("Formato inesperado al recargar bodegas.");
      }

      const normalizadas = lista.map((b) => ({
        id: b.id_bodega ?? b.id,
        nombre: b.nombre,
        ciudad: b.ciudad,
        direccion: b.direccion,
        ancho: Number(b.ancho),
        alto: Number(b.alto),
        largo: Number(b.largo),
        active:
          b.is_active !== undefined
            ? b.is_active !== 0
            : (b.active ?? true) !== false,
      }));

      setBodegas(normalizadas);

      Alert.alert(
        "Bodega",
        creating
          ? "Creada correctamente en la base de datos."
          : "Actualizada correctamente en la base de datos."
      );
    } catch (error) {
      console.log(
        "[saveBodega] ERROR:",
        error?.message,
        error?.response?.data || ""
      );

      Alert.alert(
        "Error",
        `No se pudo guardar la bodega.\n${
          error?.message ||
          error?.response?.data?.message ||
          "Revisa la conexión y los campos obligatorios."
        }`
      );
    }
  };


  const deleteBodegaOrphanItems = async (id) => {
    const b = bodegas.find((x) => x.id === id);
    const lastName = b?.nombre || "—";

    // Dejar ítems huérfanos con referencia al último nombre
    setItems((prev) =>
      prev.map((it) =>
        it.bodegaId === id
          ? { ...it, bodegaId: null, lastBodegaName: lastName }
          : it
      )
    );

    // Quitar la bodega del estado
    setBodegas((prev) => prev.filter((bd) => bd.id !== id));
  };

  const setBodegaActive = async (id, active) => {
    const b = bodegas.find((x) => x.id === id);
    if (!b) return;

    if (active === false) {
      // Si se desactiva, soltamos ítems
      setItems((prev) =>
        prev.map((it) =>
          it.bodegaId === id
            ? { ...it, bodegaId: null, lastBodegaName: b.nombre }
            : it
        )
      );
    }

    setBodegas((prev) =>
      prev.map((x) => (x.id === id ? { ...x, active } : x))
    );
  };

  /* ----------------- Acciones items ----------------- */

  const saveItem = async (payload) => {
    const clase = pesoAClase(payload.peso);
    const normalized = { ...payload, clase };

    if (payload.id) {
      setItems((prev) =>
        prev.map((it) => (it.id === payload.id ? normalized : it))
      );
    } else {
      setItems((prev) => [...prev, { ...normalized, id: genId() }]);
    }
  };

  const deleteItem = async (id) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  /* ----------------- Solicitudes de desactivación ----------------- */

  const createDeactivateRequest = async ({ bodegaId, userId, motivo = "" }) => {
    const exists = requests.some(
      (r) => r.bodegaId === bodegaId && r.status === "pending"
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


  /* ----------------- Auth ----------------- */

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

  /* ----------------- Derivados finales ----------------- */

  const pendingCount = useMemo(
    () => requests.filter((r) => r.status === "pending").length,
    [requests]
  );

  /* ----------------- Provider ----------------- */

  return (
    <Ctx.Provider
      value={{
        currentUser,
        bodegas,
        items,
        requests,
        itemsByBodega,
        metricsOf,
        pendingCount,
        saveBodega,
        deleteBodegaOrphanItems,
        setBodegaActive,
        saveItem,
        deleteItem,
        createDeactivateRequest,
        approveRequest,
        rejectRequest,
        onLogin,
        onLogout,
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
