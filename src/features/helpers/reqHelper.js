// C:\Users\japf2\Desktop\Tesis Cubicaje\Proyecto\proyectoPrincipal\cubicajeMobile-master\src\features\helpers\reqHelper.js

import axios from "axios";

const axiosInstance = axios.create();

async function reqHelper(url, method, body) {
  try {
    console.log("[reqHelper] REQUEST =>", (method || "get").toUpperCase(), url); // ✅ AÑADIR
    // console.log("[reqHelper] PAYLOAD =>", body); // ✅ opcional si quieres ver body

    const { data } = await axiosInstance({
      url,
      method: (method || "get").toUpperCase(),
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      data: body,
    });

    return data;
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.body || error.message || "Error de conexión";

    console.log("[reqHelper] ERROR:", status, "URL:", url, "METHOD:", (method || "get").toUpperCase(), "MSG:", message); // ✅ CAMBIAR

    return { error: true, status, body: message };
  }
}


export default reqHelper;
