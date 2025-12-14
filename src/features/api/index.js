// C:\Users\japf2\Desktop\Tesis Cubicaje\Proyecto\proyectoPrincipal\cubicajeMobile-master\src\features\api\index.js
import Config from "react-native-config";
import reqHelper from "../helpers/reqHelper";

// 👀 LOG INICIAL: ver qué lee react-native-config
console.log("[API] API_URL =", Config.API_URL);
console.log("[API] PLANNING_URL =", Config.PLANNING_URL);

/* ------------ PLANNINGS (msCubicajePlanning) ------------ */

const getPlannings = async () =>
  await reqHelper(`${Config.PLANNING_URL}/api/plannings`, "get");

const insertPlanning = async (data) =>
  await reqHelper(`${Config.PLANNING_URL}/api/plannings`, "post", data);

const getItemsByPlanning = async (id) =>
  await reqHelper(`${Config.PLANNING_URL}/api/plannings/items/${id}`, "get");

const updatePlanning = async (data) =>
  await reqHelper(`${Config.PLANNING_URL}/api/plannings`, "patch", data);

/* ------------ ITEMS (msApiCubicaje) ------------ */

const getItems = async () =>
  await reqHelper(`${Config.API_URL}/api/items`, "get");

const insertItem = async (data) =>
  await reqHelper(`${Config.API_URL}/api/items`, "post", data);

// ✅ updateItem: /api/items/:id  (sin fallback)
const updateItem = async (data) => {
  const id = data?.id_item ?? data?.id;
  if (!id) throw new Error("ID requerido para actualizar item");

  return await reqHelper(`${Config.API_URL}/api/items/${id}`, "put", data);
};

const deleteItemApi = async (id) =>
  await reqHelper(`${Config.API_URL}/api/items/${id}`, "delete");

// ✅ mover cantidad parcial (transferencia física + registra item_movimientos)
const moveItemQty = async (id, data) =>
  await reqHelper(`${Config.API_URL}/api/items/${id}/move`, "post", data);

// ✅ sacar/egresar unidades (AFECTA ubicaciones + bodega_items + item_movimientos)
const egresarItemQty = async (id, data) =>
  await reqHelper(`${Config.API_URL}/api/items/${id}/egreso`, "post", data);

// ✅ movimientos por ítem (kardex)
const getMovimientosByItem = async (id) =>
  await reqHelper(`${Config.API_URL}/api/items/${id}/movimientos`, "get");

/* ------------ SPACES (msApiCubicaje) ------------ */

const getSpaces = async () =>
  await reqHelper(`${Config.API_URL}/api/spaces`, "get");

const insertSpace = async (data) =>
  await reqHelper(`${Config.API_URL}/api/spaces`, "post", data);

const updateSpace = async (data) =>
  await reqHelper(`${Config.API_URL}/api/spaces`, "put", data);

/* ------------ TYPES (legacy) ------------ */

const getTypes = async () =>
  await reqHelper(`${Config.API_URL}/api/types`, "get");

/* ------------ BODEGAS (msApiCubicaje) ------------ */

const getCiudades = async () => {
  const url = `${Config.API_URL}/api/bodegas/ciudades`;
  console.log("[API] getCiudades URL =>", url);
  const response = await reqHelper(url, "get");
  return response
}

const getBodegas = async () => {
  const url = `${Config.API_URL}/api/bodegas`;
  console.log("[API] getBodegas URL =>", url);
  return await reqHelper(url, "get");
};

const insertBodega = async (data) => {
  const url = `${Config.API_URL}/api/bodegas`;
  console.log("[API] insertBodega URL =>", url, "payload:", data);
  return await reqHelper(url, "post", data);
};

const updateBodegaApi = async (data) => {
  const id = data?.id_bodega ?? data?.id;
  if (!id) throw new Error("ID requerido para actualizar bodega");

  const url = `${Config.API_URL}/api/bodegas/${id}`;
  console.log("[API] updateBodegaApi URL =>", url, "payload:", data);
  return await reqHelper(url, "put", data);
};

// ✅ CAMBIO IMPORTANTE: compatible con ambos estilos
// - deleteBodegaApi(3, "hard")
// - deleteBodegaApi({ id_bodega: 3, mode: "hard" })
const deleteBodegaApi = async (arg1, arg2) => {
  const id_bodega =
    (typeof arg1 === "object"
      ? (arg1?.id_bodega ?? arg1?.id)
      : arg1) ?? null;

  const mode = (typeof arg1 === "object" ? arg1?.mode : arg2) ?? "";

  if (!id_bodega) throw new Error("ID requerido para eliminar bodega");

  const q = mode ? `?mode=${encodeURIComponent(mode)}` : "";
  const url = `${Config.API_URL}/api/bodegas/${id_bodega}${q}`;
  console.log("[API] deleteBodegaApi URL =>", url);

  return await reqHelper(url, "delete");
};

const recubicarBodegaPrioridadApi = async (id_bodega, data) => {
  const url = `${Config.API_URL}/api/bodegas/${id_bodega}/recubicar-prioridad`;
  console.log("[API] recubicarBodegaPrioridad URL =>", url, "payload:", data);
  return await reqHelper(url, "post", data);
};

const compactarBodegaTetrisApi = async (id_bodega, data = {}) => {
  const url = `${Config.API_URL}/api/bodegas/${id_bodega}/compactar-tetris`;
  console.log("[API] compactarBodegaTetrisApi URL =>", url, "payload:", data);
  return await reqHelper(url, "post", data);
};

const getBodegaUbicacionesApi = async (id_bodega, opts = {}) => {
  const { expandUnits = false } = opts;

  const q = expandUnits ? "?expandUnits=1" : "";
  const url = `${Config.API_URL}/api/bodegas/${id_bodega}/ubicaciones${q}`;

  console.log("[API] getBodegaUbicacionesApi URL =>", url);
  return await reqHelper(url, "get");
};

/* ------------ CATEGORÍAS (msApiCubicaje) ------------ */

const getCategories = async () =>
  await reqHelper(`${Config.API_URL}/api/categorias`, "get");

/* ------------ SOLICITUDES (msApiCubicaje) ------------ */

const getSolicitudes = async (opts = {}) => {
  const { estado, id_empleado, empleadoId } = opts;

  const params = [];
  const emp = id_empleado ?? empleadoId;

  if (emp != null) params.push(`id_empleado=${encodeURIComponent(emp)}`);
  if (estado != null) params.push(`estado=${encodeURIComponent(estado)}`);

  const qs = params.length ? `?${params.join("&")}` : "";
  const url = `${Config.API_URL}/api/solicitudes${qs}`;

  console.log("[API] getSolicitudes URL =>", url);
  return await reqHelper(url, "get");
};

const insertSolicitud = async (data) => {
  const url = `${Config.API_URL}/api/solicitudes`;
  console.log("[API] insertSolicitud URL =>", url, "payload:", data);
  return await reqHelper(url, "post", data);
};

const updateSolicitudEstado = async (id_solicitud, estado, id_usuario) => {
  const url = `${Config.API_URL}/api/solicitudes/${id_solicitud}/estado`;
  console.log("[API] updateSolicitudEstado URL =>", url, "estado:", estado);
  return await reqHelper(url, "patch", { estado, id_usuario });
};

/* ------------ MOVIMIENTOS (msApiCubicaje) ------------ */
// OJO: esto requiere que exista un endpoint GET /api/movimientos en tu backend.
// Si no lo tienes, usa getMovimientosByItem(id).
const getMovimientos = async (opts = {}) => {
  const { limit, id_item, id_bodega, tipo } = opts;

  const params = [];
  if (limit != null) params.push(`limit=${encodeURIComponent(limit)}`);
  if (id_item != null) params.push(`id_item=${encodeURIComponent(id_item)}`);
  if (id_bodega != null) params.push(`id_bodega=${encodeURIComponent(id_bodega)}`);
  if (tipo != null) params.push(`tipo=${encodeURIComponent(tipo)}`);

  const qs = params.length ? `?${params.join("&")}` : "";
  const url = `${Config.API_URL}/api/movimientos${qs}`;

  console.log("[API] getMovimientos URL =>", url);
  return await reqHelper(url, "get");
};

/* ------------ USUARIOS  ------------ */
const loginUser = async (credentials) => {
  const url = `${Config.API_URL}/api/usuario/login`;
  const response = await reqHelper(url, "post", credentials);
  return response;
}

const getUsuarios = async () => {
  const url = `${Config.API_URL}/api/usuario`;
  const response = await reqHelper(url, "get");
  return response;
}

const changeUserState = async (id_usuario) => {
  const url = `${Config.API_URL}/api/usuario/cambiar_estado/${id_usuario}`;
  const response = await reqHelper(url, "patch");
  return response;
}

const changeUserRole = async (id_usuario, new_role) => {
  const url = `${Config.API_URL}/api/usuario/asignar_rol/${id_usuario}`;
  const response = await reqHelper(url, "patch", { rol: new_role });
  return response;
}

const saveNewUser = async (userData) => {
  const url = `${Config.API_URL}/api/usuario/crear`;
  const response = await reqHelper(url, "post", userData);
  return response;
}

const getUserById = async (id_usuario) => {
  const url = `${Config.API_URL}/api/usuario/${id_usuario}`;
  const response = await reqHelper(url, "get");
  return response;
}

const updateUserById = async (id_usuario, userData) => {
  const url = `${Config.API_URL}/api/usuario/actualizar_datos/${id_usuario}`;
  const response = await reqHelper(url, "patch", userData);
  return response;
}

const updatePassword = async (passwordData) => {
  const url = `${Config.API_URL}/api/usuario/cambiar_password`;
  const response = await reqHelper(url, "patch", passwordData);
  return response;
}

/* ------------ EXPORTS ------------ */
export {
  // Plannings
  getPlannings,
  insertPlanning,
  getItemsByPlanning,
  updatePlanning,

  // Items
  getItems,
  insertItem,
  updateItem,
  deleteItemApi,
  moveItemQty,
  egresarItemQty,
  getMovimientosByItem,

  // Spaces
  getSpaces,
  insertSpace,
  updateSpace,

  // Types
  getTypes,

  // Bodegas
  getBodegas,
  insertBodega,
  updateBodegaApi,
  deleteBodegaApi,
  recubicarBodegaPrioridadApi,
  getBodegaUbicacionesApi,
  compactarBodegaTetrisApi,
  getCiudades,

  // Categorías
  getCategories,

  // Solicitudes
  getSolicitudes,
  insertSolicitud,
  updateSolicitudEstado,

  // Movimientos
  getMovimientos,

  // Usuarios
  loginUser,
  getUsuarios,
  changeUserState,
  changeUserRole,
  saveNewUser,
  getUserById,
  updateUserById,
  updatePassword
};
