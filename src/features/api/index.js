// cubicajeMobile-master/src/features/api/index.js
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

const getItems = async () => await reqHelper(`${Config.API_URL}/api/items`, "get");

const insertItem = async (data) =>
  await reqHelper(`${Config.API_URL}/api/items`, "post", data);

const updateItem = async (data) =>
  await reqHelper(`${Config.API_URL}/api/items`, "put", data);

const deleteItemApi = async (id) =>
  await reqHelper(`${Config.API_URL}/api/items/${id}`, "delete");

// NUEVO: mover cantidad parcial de un ítem entre bodegas
const moveItemQty = async (id, data) =>
  await reqHelper(`${Config.API_URL}/api/items/${id}/move`, "post", data);

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
  const id = data.id_bodega || data.id;
  if (!id) throw new Error("ID requerido para actualizar bodega");

  const url = `${Config.API_URL}/api/bodegas/${id}`;
  console.log("[API] updateBodegaApi URL =>", url, "payload:", data);
  return await reqHelper(url, "put", data);
};

const deleteBodegaApi = async (id_bodega, mode) => {
  const q = mode ? `?mode=${encodeURIComponent(mode)}` : "";
  const url = `${Config.API_URL}/api/bodegas/${id_bodega}${q}`;
  console.log("[API] deleteBodegaApi URL =>", url);
  return await reqHelper(url, "delete");
};

// 🔹 Reordenar ítems por prioridad dentro de una bodega
// body = { items: [ { id_item, prioridad }, ... ] }
const recubicarBodegaPrioridadApi = async (id_bodega, data) => {
  const url = `${Config.API_URL}/api/bodegas/${id_bodega}/recubicar-prioridad`;
  console.log("[API] recubicarBodegaPrioridad URL =>", url, "payload:", data);
  return await reqHelper(url, "post", data);
};

// 🔹 Obtener ubicaciones reales de una bodega (para render 3D real)
const getBodegaUbicacionesApi = async (id_bodega) => {
  const url = `${Config.API_URL}/api/bodegas/${id_bodega}/ubicaciones`;
  console.log("[API] getBodegaUbicacionesApi URL =>", url);
  return await reqHelper(url, "get");
};

/* ------------ CATEGORÍAS (msApiCubicaje) ------------ */

const getCategories = async () =>
  await reqHelper(`${Config.API_URL}/api/categorias`, "get");

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

  // Categorías
  getCategories,
};
