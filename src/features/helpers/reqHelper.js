// C:\Users\japf2\Desktop\Tesis Cubicaje\Proyecto\proyectoPrincipal\cubicajeMobile-master\src\features\helpers\reqHelper.js

import axios from "axios";

const axiosInstance = axios.create();

async function reqHelper(url, method, body) {
  try {
    const { data } = await axiosInstance({
      url,
      method: (method || "get").toUpperCase(),
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      data: body,
    });

    // La API ya responde con { error, status, body }
    return data;
  } catch (error) {
    // Normalizamos el error al mismo formato
    const status = error.response?.status || 500;
    const message =
      error.response?.data?.body ||
      error.message ||
      "Error de conexión";

    console.log("[reqHelper] ERROR:", status, message);

    return {
      error: true,
      status,
      body: message,
    };
  }
}

export default reqHelper;
