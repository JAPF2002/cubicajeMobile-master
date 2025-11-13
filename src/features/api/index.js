// src/features/api/index.js
import Config from 'react-native-config';
import reqHelper from '../helpers/reqHelper';

/* ------------ PLANNINGS (msCubicajePlanning) ------------ */

const getPlannings = async () =>
  await reqHelper(`${Config.PLANNING_URL}/api/plannings`, 'get');

const insertPlanning = async (data) =>
  await reqHelper(`${Config.PLANNING_URL}/api/plannings`, 'post', data);

const getItemsByPlanning = async (id) =>
  await reqHelper(`${Config.PLANNING_URL}/api/plannings/items/${id}`, 'get');

const updatePlanning = async (data) =>
  await reqHelper(`${Config.PLANNING_URL}/api/plannings`, 'patch', data);

/* ------------ ITEMS (msApiCubicaje) ------------ */

const getItems = async () =>
  await reqHelper(`${Config.API_URL}/api/items`, 'get');

const insertItem = async (data) =>
  await reqHelper(`${Config.API_URL}/api/items`, 'post', data);

const updateItem = async (data) =>
  await reqHelper(`${Config.API_URL}/api/items`, 'put', data);

const deleteItemApi = async (id) =>
  await reqHelper(`${Config.API_URL}/api/items/${id}`, 'delete');

// NUEVO: mover cantidad parcial de un ítem entre bodegas
const moveItemQty = async (id, data) =>
  await reqHelper(`${Config.API_URL}/api/items/${id}/move`, 'post', data);

/* ------------ SPACES (msApiCubicaje) ------------ */

const getSpaces = async () =>
  await reqHelper(`${Config.API_URL}/api/spaces`, 'get');

const insertSpace = async (data) =>
  await reqHelper(`${Config.API_URL}/api/spaces`, 'post', data);

const updateSpace = async (data) =>
  await reqHelper(`${Config.API_URL}/api/spaces`, 'put', data);

/* ------------ TYPES (legacy) ------------ */

const getTypes = async () =>
  await reqHelper(`${Config.API_URL}/api/types`, 'get');

/* ------------ BODEGAS (msApiCubicaje) ------------ */

const getBodegas = async () =>
  await reqHelper(`${Config.API_URL}/api/bodegas`, 'get');

const insertBodega = async (data) =>
  await reqHelper(`${Config.API_URL}/api/bodegas`, 'post', data);

const updateBodegaApi = async (data) => {
  const id = data.id_bodega || data.id;
  if (!id) {
    throw new Error('ID requerido para actualizar bodega');
  }
  return await reqHelper(
    `${Config.API_URL}/api/bodegas/${id}`,
    'put',
    data
  );
};

const deleteBodegaApi = async (id_bodega, mode) => {
  const q = mode ? `?mode=${encodeURIComponent(mode)}` : '';
  return await reqHelper(
    `${Config.API_URL}/api/bodegas/${id_bodega}${q}`,
    'delete'
  );
};

/* ------------ CATEGORÍAS (msApiCubicaje) ------------ */

const getCategories = async () =>
  await reqHelper(`${Config.API_URL}/api/categorias`, 'get');

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
  // Categorías
  getCategories,
};
