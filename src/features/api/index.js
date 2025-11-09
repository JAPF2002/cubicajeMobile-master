// C:\Users\japf2\Desktop\Tesis Cubicaje\Proyecto\proyectoPrincipal\cubicajeMobile-master\src\features\api\index.js

import Config from "react-native-config";
import reqHelper from "../helpers/reqHelper";

/* ------------ PLANNINGS (msCubicajePlanning) ------------ */

const getPlannings = async () =>
  await reqHelper(`${Config.PLANNING_URL}/api/plannings`, "get");

const insertPlanning = async (data) =>
  await reqHelper(`${Config.PLANNING_URL}/api/plannings`, "post", data);

const getItemsByPlanning = async (id) =>
  await reqHelper(
    `${Config.PLANNING_URL}/api/plannings/items/${id}`,
    "get"
  );

const updatePlanning = async (data) =>
  await reqHelper(`${Config.PLANNING_URL}/api/plannings`, "patch", data);

/* ------------ ITEMS (msApiCubicaje) ------------ */

// GET /api/items
const getItems = async () =>
  await reqHelper(`${Config.API_URL}/api/items`, "get");

// POST /api/items
const insertItem = async (data) =>
  await reqHelper(`${Config.API_URL}/api/items`, "post", data);

// PUT /api/items  (el id va en el body: id_item / id)
const updateItem = async (data) =>
  await reqHelper(`${Config.API_URL}/api/items`, "put", data);

// DELETE /api/items/:id
const deleteItemApi = async (id) =>
  await reqHelper(`${Config.API_URL}/api/items/${id}`, "delete");

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

// GET /api/bodegas
const getBodegas = async () =>
  await reqHelper(`${Config.API_URL}/api/bodegas`, "get");

// POST /api/bodegas
const insertBodega = async (data) =>
  await reqHelper(`${Config.API_URL}/api/bodegas`, "post", data);

// PUT /api/bodegas/:id
const updateBodegaApi = async (data) => {
  const id = data.id_bodega || data.id;
  if (!id) {
    throw new Error("ID requerido para actualizar bodega");
  }
  return await reqHelper(
    `${Config.API_URL}/api/bodegas/${id}`,
    "put",
    data
  );
};

// DELETE /api/bodegas/:id[?mode=...]
const deleteBodegaApi = async (id_bodega, mode) => {
  const q = mode ? `?mode=${encodeURIComponent(mode)}` : "";
  return await reqHelper(
    `${Config.API_URL}/api/bodegas/${id_bodega}${q}`,
    "delete"
  );
};

/* ------------ CATEGORÍAS (msApiCubicaje) ------------ */

// Ajusta esta ruta al backend real: /api/category o /api/categorias
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
  // Categorías
  getCategories,
};
