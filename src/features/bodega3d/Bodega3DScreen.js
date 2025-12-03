// C:\Users\japf2\Desktop\Tesis Cubicaje\Proyecto\proyectoPrincipal\cubicajeMobile-master\src\features\bodega3d\Bodega3DScreen.js

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { WebView } from "react-native-webview";
import { useIsFocused } from "@react-navigation/native";
import { useApp } from "../../store";
import BodegaItemsList from "./BodegaItemsList";
import {
  recubicarBodegaPrioridadApi,
  getBodegaUbicacionesApi,
  compactarBodegaTetrisApi,
} from "../api";

export default function Bodega3DScreen({ route }) {
  const isFocused = useIsFocused();
  const { bodegas, items, syncBodegasFromApi } = useApp();

  const [prioritySelection, setPrioritySelection] = useState({});
  const [loadingReorden, setLoadingReorden] = useState(false);

  const [ubicaciones, setUbicaciones] = useState([]);
  const [loadingUbicaciones, setLoadingUbicaciones] = useState(false);

  // ✅ Parte 12 (compactación tetris)
  const [movsPreview, setMovsPreview] = useState([]);
  const [loadingTetris, setLoadingTetris] = useState(false);

  const webviewRef = useRef(null);
  const mountedRef = useRef(true);

  const [selectedItemName, setSelectedItemName] = useState(null);

  // handshake: evitar postMessage antes de que el WebView esté listo
  const [webReady, setWebReady] = useState(false);
  const pendingMsgsRef = useRef([]);

  const { bodegaId, nombre, ancho, alto, largo, layout: layoutParam } = route.params || {};
  const bodega = bodegas.find((b) => b.id === bodegaId) || null;

  const bw = Number(bodega?.ancho ?? ancho) || 10;
  const bh = Number(bodega?.alto ?? alto) || 5;
  const bl = Number(bodega?.largo ?? largo) || 10;
  const bName = bodega?.nombre || nombre || "Bodega";

  const layout = bodega?.layout || layoutParam || null;
  const layoutAncho = Number(layout?.ancho ?? 0) || 0;
  const layoutLargo = Number(layout?.largo ?? 0) || 0;
  const layoutMapa = layout?.mapa_json || {};

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Cuando se va el foco, desmontamos el WebView (isFocused=false) y reseteamos handshake
  useEffect(() => {
    if (!isFocused) {
      setWebReady(false);
      pendingMsgsRef.current = [];
      webviewRef.current = null;

      // ✅ parte 12: limpiar preview al salir
      setMovsPreview([]);
      setLoadingTetris(false);
    }
  }, [isFocused]);

  const itemsInBodega = useMemo(() => {
    const targetId = bodega?.id ?? bodegaId;

    return (items || [])
      .filter((it) => (it.bodegaId ?? it.id_bodega ?? it.bodega_id) === targetId)
      .map((it) => {
        const rawCantidad = it.cantidad ?? 1;
        const parsedCantidad = parseInt(rawCantidad, 10);
        const cantidad = Number.isFinite(parsedCantidad) && parsedCantidad > 0 ? parsedCantidad : 1;

        return {
          id_item: Number(it.id_item ?? it.id),
          nombre: String(it.nombre ?? ""),
          w: Number(it.ancho ?? it.w) || 1,
          h: Number(it.alto ?? it.h) || 1,
          l: Number(it.largo ?? it.l) || 1,
          cantidad,
          clase: it.clase || "",
          categoriaId: it.id_categoria ?? it.categoriaId ?? null,
        };
      });
  }, [items, bodega?.id, bodegaId]);

  const sendToWeb = useCallback(
    (payload) => {
      const msg = JSON.stringify(payload);
      if (webReady && webviewRef.current) {
        webviewRef.current.postMessage(msg);
      } else {
        pendingMsgsRef.current.push(msg);
      }
    },
    [webReady]
  );

  const flushPending = useCallback(() => {
    if (!webviewRef.current) return;
    const q = pendingMsgsRef.current;
    pendingMsgsRef.current = [];
    q.forEach((m) => {
      try {
        webviewRef.current.postMessage(m);
      } catch {}
    });
  }, []);

  // Helper para ver un "resumen" de las ubicaciones en los logs
  function ubicacionesSignature(arr) {
    try {
      const occ = (arr || [])
        .filter((u) => Array.isArray(u.items) && u.items.length)
        .map((u) => {
          const itemsStr = (u.items || [])
            .filter((it) => (Number(it.qty) || 0) > 0)
            .map((it) => `${Number(it.id_item)}x${Number(it.qty)}`)
            .sort()
            .join(",");
          return `${Number(u.pos_x)},${Number(u.pos_y)}:${itemsStr}`;
        })
        .sort();

      // recortamos para que no explote el log
      return occ.slice(0, 30).join(" | ");
    } catch {
      return "SIG_ERROR";
    }
  }

  const reloadUbicaciones = useCallback(async () => {
    const id = bodega?.id ?? bodegaId;
    if (!id) return [];

    try {
      setLoadingUbicaciones(true);
      const res = await getBodegaUbicacionesApi(id, { expandUnits: true });

      if (res?.error) {
        console.log("[Bodega3DScreen] getUbicaciones error:", res);
        setUbicaciones([]);
        return [];
      }

      const body = Array.isArray(res?.body) ? res.body : [];
      console.log("[Bodega3DScreen] ubicaciones body length:", body.length);
      console.log("[Bodega3DScreen] ubicaciones SIG:", ubicacionesSignature(body));

      if (mountedRef.current) setUbicaciones(body);
      return body;
    } catch (e) {
      console.log("[Bodega3DScreen] getUbicaciones excepción:", e);
      if (mountedRef.current) setUbicaciones([]);
      return [];
    } finally {
      if (mountedRef.current) setLoadingUbicaciones(false);
    }
  }, [bodega?.id, bodegaId]);

  // Carga inicial al entrar a la pantalla y luego actualiza sin recargar WebView
  useEffect(() => {
    if (!isFocused) return;

    (async () => {
      const body = await reloadUbicaciones();

      // mandamos data inicial al WebView (cuando esté ready)
      sendToWeb({
        type: "updateData",
        bodega: { bw, bh, bl, bName },
        layout: { ancho: layoutAncho, largo: layoutLargo, mapa: layoutMapa },
        items: itemsInBodega,
        ubicaciones: body,
      });
    })();
  }, [
    isFocused,
    reloadUbicaciones,
    sendToWeb,
    bw,
    bh,
    bl,
    bName,
    layoutAncho,
    layoutLargo,
    layoutMapa,
    itemsInBodega,
  ]);

  const handleReordenarPorPrioridad = async () => {
    const id = bodega?.id ?? bodegaId;
    if (!id) return Alert.alert("Error", "No se encontró la bodega (id).");

    const idsSeleccionados = Object.keys(prioritySelection);
    if (!idsSeleccionados.length) {
      return Alert.alert("Aviso", "Primero selecciona al menos un ítem para priorizar.");
    }

    const payload = {
      items: idsSeleccionados.map((idStr) => ({
        id_item: Number(idStr),
        prioridad: prioritySelection[idStr],
      })),
    };

    setLoadingReorden(true);
    try {
      const res = await recubicarBodegaPrioridadApi(id, payload);

      if (res?.error) {
        const msg =
          typeof res?.body === "string"
            ? res.body
            : res?.body?.message || "No se pudo recubicar la bodega.";
        Alert.alert("Error", msg);
        return;
      }

      Alert.alert("OK", res?.body?.mensaje || "Recubicación por prioridad completada.");

      try {
        await syncBodegasFromApi?.();
      } catch (e) {
        console.log("[Bodega3DScreen] error al refrescar bodegas:", e);
      }

      // ✅ YA NO REMONTAMOS WEBVIEW. Solo actualizamos data.
      const body = await reloadUbicaciones();
      sendToWeb({
        type: "updateData",
        bodega: { bw, bh, bl, bName },
        layout: { ancho: layoutAncho, largo: layoutLargo, mapa: layoutMapa },
        items: itemsInBodega,
        ubicaciones: body,
      });

      setPrioritySelection({});
    } catch (e) {
      console.log("[Bodega3DScreen] recubicar excepción:", e);
      Alert.alert("Error", "Hubo un problema de conexión al recubicar.");
    } finally {
      setLoadingReorden(false);
    }
  };

  // ✅ PARTE 12: Preview compactación (dryRun)
const previewCompactacion = async () => {
  const id = bodega?.id ?? bodegaId;
  if (!id) return Alert.alert("Error", "No se encontró la bodega (id).");

  setLoadingTetris(true);
  try {
    const res = await compactarBodegaTetrisApi(id, { dryRun: true });

    // 🔎 LOGS CLAVE (para saber si realmente hay movimientos)
    console.log("[Bodega3DScreen] compactar(dryRun) res:", JSON.stringify(res));
    console.log(
      "[Bodega3DScreen] compactar(dryRun) movimientos:",
      Array.isArray(res?.body?.movimientos) ? res.body.movimientos.length : "N/A"
    );

    if (res?.error) {
      Alert.alert("Error", String(res?.body || "No se pudo generar el preview."));
      setMovsPreview([]);
      return;
    }

    const movs = Array.isArray(res?.body?.movimientos) ? res.body.movimientos : [];
    setMovsPreview(movs);

    // 👀 Extra: muestra las primeras 20 líneas para comprobar rápido
    const mini = movs
      .slice(0, 20)
      .map((m) => `${m.id_item}: ${m.from_ubicacion} -> ${m.to_ubicacion} (x${m.qty})`)
      .join("\n");

    Alert.alert(
      "Preview listo",
      `Movimientos: ${movs.length}${movs.length ? `\n\nPrimeros:\n${mini}` : ""}`
    );
  } catch (e) {
    console.log("[Bodega3DScreen] preview compactación excepción:", e);
    Alert.alert("Error", "Error de conexión en preview.");
    setMovsPreview([]);
  } finally {
    setLoadingTetris(false);
  }
};

// ✅ PARTE 12: Ejecutar compactación
const ejecutarCompactacion = async () => {
  const id = bodega?.id ?? bodegaId;
  if (!id) return Alert.alert("Error", "No se encontró la bodega (id).");

  Alert.alert("Confirmar", "¿Ejecutar compactación? Esto actualizará la base de datos.", [
    { text: "Cancelar", style: "cancel" },
    {
      text: "Ejecutar",
      style: "destructive",
      onPress: async () => {
        setLoadingTetris(true);
        try {
          const res = await compactarBodegaTetrisApi(id, {});

          // 🔎 LOGS CLAVE
          console.log("[Bodega3DScreen] compactar(EJEC) res:", JSON.stringify(res));
          console.log(
            "[Bodega3DScreen] compactar(EJEC) movimientos:",
            Array.isArray(res?.body?.movimientos) ? res.body.movimientos.length : "N/A"
          );

          if (res?.error) {
            Alert.alert("Error", String(res?.body || "No se pudo compactar."));
            return;
          }

          Alert.alert("OK", res?.body?.mensaje || "Compactación completada.");

          // ✅ IMPORTANTÍSIMO: recargar ubicaciones Y reenviar al WebView
          const body = await reloadUbicaciones();

          sendToWeb({
            type: "updateData",
            bodega: { bw, bh, bl, bName },
            layout: { ancho: layoutAncho, largo: layoutLargo, mapa: layoutMapa },
            items: itemsInBodega,
            ubicaciones: body,
          });

          setMovsPreview([]);
        } catch (e) {
          console.log("[Bodega3DScreen] ejecutar compactación excepción:", e);
          Alert.alert("Error", "Error de conexión al compactar.");
        } finally {
          setLoadingTetris(false);
        }
      },
    },
  ]);
};


  const handleSelectItem = (nombreItem) => {
    setSelectedItemName((prevName) => {
      const newName = prevName === nombreItem ? null : nombreItem;
      sendToWeb({ type: "selectItem", nombre: newName });
      return newName;
    });
  };

  const handleTogglePriority = (id_item) => {
    setPrioritySelection((prev) => {
      const current = prev[id_item] ?? 0;
      const next = current === 0 ? 1 : current === 1 ? 2 : current === 2 ? 3 : 0;

      const copy = { ...prev };
      if (next === 0) delete copy[id_item];
      else copy[id_item] = next;

      return copy;
    });
  };

  // HTML base: ahora el WebView recibe data por postMessage (updateData)
  const html = useMemo(() => {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
  />
  <title>Bodega 3D</title>
  <style>
    html, body { margin:0; padding:0; width:100%; height:100%; overflow:hidden; background:#020817; }
    #label {
      position:absolute; top:6px; left:6px; padding:4px 8px;
      font-family:system-ui, -apple-system, BlinkMacSystemFont, sans-serif; font-size:11px;
      color:#e5e7eb; background:rgba(2,8,23,0.9); border-radius:4px; z-index:10;
      max-width: 95vw;
      pointer-events:none;
      white-space:pre-line;
    }
    #c { display:block; width:100vw; height:100vh; background:#020817; touch-action:none; }
  </style>
</head>
<body>
  <div id="label">Cargando...</div>
  <canvas id="c"></canvas>

  <script>
    (function () {
      var canvas = document.getElementById('c');
      var ctx = canvas.getContext('2d');
      var label = document.getElementById('label');

      // data viva
      var BW=10, BH=5, BL=10, BNAME="Bodega";
      var items = [];
      var layoutData = { ancho:0, largo:0, mapa:{} };
      var ubicaciones = [];
      var UPDATE_SEQ = 0;

      var highlightedName = null;

      // ---- cámara (se conserva, nunca se resetea al updateData) ----
      var maxDim = 10, scale = 40, halfX=200, halfY=100, halfZ=200;
      var angleX = 0.6;
      var angleY = -0.7;
      var zoom = 1.6;
      function clampZoom(z) { return Math.max(0.6, Math.min(4.0, z)); }

      function resize() {
        var dpr = window.devicePixelRatio || 1;
        var rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      window.addEventListener('resize', resize);
      resize();

      var ITEM_PALETTE = [
        { fill: "rgba(59,130,246,0.55)", stroke: "rgba(37,99,235,1)" },
        { fill: "rgba(234,179,8,0.55)", stroke: "rgba(202,138,4,1)" },
        { fill: "rgba(168,85,247,0.55)", stroke: "rgba(126,34,206,1)" },
      ];
      function getColorsForBox(box) {
        var idx = 0;
        if (box.categoryId != null) idx = ((box.categoryId - 1) % 3 + 3) % 3;
        else idx = (box.colorIndex || 0) % 3;
        return ITEM_PALETTE[idx];
      }

      function recomputeWorld() {
        maxDim = Math.max(BW, BH, BL) || 1;
        var target = Math.min(window.innerWidth, window.innerHeight) * 0.75;
        scale = target / maxDim;

        halfX = (BW * scale) / 2;
        halfY = (BH * scale) / 2;
        halfZ = (BL * scale) / 2;
      }

      function buildItemBoxesFallback(missingItems, originX, originZ) {
        var boxes = [];
        if (!missingItems || !missingItems.length) return boxes;

        var cursorX = originX;
        var cursorZ = originZ;
        var layerY = -halfY;
        var rowDepth = 0;

        missingItems.forEach(function(it, idx) {
          var w = (it.w || 1) * scale;
          var h = (it.h || 1) * scale;
          var l = (it.l || 1) * scale;
          var count = it.cantidad || 1;

          for (var n = 0; n < count; n++) {
            if (cursorX + w > halfX) {
              cursorX = originX;
              cursorZ += rowDepth;
              rowDepth = 0;
            }
            if (cursorZ + l > halfZ) {
              cursorX = originX;
              cursorZ = originZ;
              layerY += h;
            }

            var cx = cursorX + w / 2;
            var cy = layerY + h / 2;
            var cz = cursorZ + l / 2;

            boxes.push({
              id_item: it.id_item,
              nombre: it.nombre,
              x: cx, y: cy, z: cz,
              w: w, h: h, l: l,
              colorIndex: idx,
              categoryId: it.categoriaId != null ? it.categoriaId : null,
            });

            cursorX += w;
            if (l > rowDepth) rowDepth = l;
          }
        });

        return boxes;
      }

function buildBoxesHybrid() {
  var boxes = [];
  var placedIds = {};

  if (layoutData && layoutData.ancho && layoutData.largo && ubicaciones && ubicaciones.length) {
    var gW = layoutData.ancho;
    var gL = layoutData.largo;

    var cellWorldW = ((BW * scale) / gW);
    var cellWorldL = ((BL * scale) / gL);

    ubicaciones.forEach(function (u, uIdx) {
      var gx = Number(u.pos_x) || 0;
      var gz = Number(u.pos_y) || 0;

      // centro de la celda en mundo
      var centerX = -halfX + cellWorldW * (gx + 0.5);
      var centerZ = -halfZ + cellWorldL * (gz + 0.5);

      // esquina "inicio" de celda en mundo (0,0 del sistema local de la celda)
      var cellStartX = centerX - (cellWorldW / 2);
      var cellStartZ = centerZ - (cellWorldL / 2);

      var baseY = -halfY;

      if (!u.items || !u.items.length) return;

      // ✅ Para evitar choque cuando vienen varios tipos dentro de la misma celda,
      // vamos “apilando grupos” uno encima de otro (visual seguro).
      var cellYOffset = 0;

      u.items.forEach(function (it, itIdx) {
        var qty = Number(it.qty) || 0;
        var idItem = Number((it.id_item ?? it.item_id ?? it.itemId) || 0);
        if (qty <= 0 || !idItem) return;

        placedIds[idItem] = true;

        // Si el backend mandó placements (expandUnits=1), úsalo.
        var hasPlacements = Array.isArray(it.placements) && it.placements.length > 0;

        if (hasPlacements) {
          // Dims reales desde placement (ya vienen con w,l,h)
          var maxLocalYPlusH = 0;

          for (var p = 0; p < it.placements.length; p++) {
            var pl = it.placements[p];
            var pw = (Number(pl.w) || Number(it.ancho) || 1) * scale;
            var plg = (Number(pl.l) || Number(it.largo) || 1) * scale;
            var ph = (Number(pl.h) || Number(it.alto) || 1) * scale;

            var localX = (Number(pl.x) || 0) * scale;
            var localZ = (Number(pl.z) || 0) * scale;
            var localY = (Number(pl.y) || 0) * scale;

            // convertir coords locales (celda) => coords mundo
            var cx = cellStartX + localX + pw / 2;
            var cz = cellStartZ + localZ + plg / 2;
            var cy = baseY + cellYOffset + localY + ph / 2;

            boxes.push({
              id_item: idItem,
              nombre: it.nombre || ("Item " + idItem),
              x: cx, y: cy, z: cz,
              w: pw, h: ph, l: plg,
              colorIndex: (uIdx * 17 + itIdx) % 50,
              categoryId:
                it.id_categoria != null ? Number(it.id_categoria) :
                (it.item_categoria_id != null ? Number(it.item_categoria_id) : null),
            });

            if (localY + (Number(pl.h) || Number(it.alto) || 1) > maxLocalYPlusH) {
              maxLocalYPlusH = localY + (Number(pl.h) || Number(it.alto) || 1);
            }
          }

          // subimos el “grupo” completo para que el siguiente tipo no se atraviese
          cellYOffset += (maxLocalYPlusH * scale) + (0.02 * scale);
          return;
        }

        // Fallback viejo (si no hay placements)
        var w = (Number(it.ancho) || 1) * scale;
        var l = (Number(it.largo) || 1) * scale;
        var h = (Number(it.alto)  || 1) * scale;

        var perRow = Math.max(1, Math.floor(cellWorldW / w));
        var perCol = Math.max(1, Math.floor(cellWorldL / l));
        var perLayer = Math.max(1, perRow * perCol);

        // centrado simple
        var usedX = perRow * w;
        var usedZ = perCol * l;
        var startX = centerX - (usedX / 2) + (w / 2);
        var startZ = centerZ - (usedZ / 2) + (l / 2);

        for (var k = 0; k < qty; k++) {
          var layer = Math.floor(k / perLayer);
          var idx = k % perLayer;

          var rx = idx % perRow;
          var rz = Math.floor(idx / perRow);

          var cx2 = startX + rx * w;
          var cz2 = startZ + rz * l;
          var cy2 = baseY + cellYOffset + (layer * h) + (h / 2);

          boxes.push({
            id_item: idItem,
            nombre: it.nombre || ("Item " + idItem),
            x: cx2, y: cy2, z: cz2,
            w: w, h: h, l: l,
            colorIndex: (uIdx * 17 + itIdx) % 50,
            categoryId:
              it.id_categoria != null ? Number(it.id_categoria) :
              (it.item_categoria_id != null ? Number(it.item_categoria_id) : null),
          });
        }

        // “altura usada” por este grupo
        var layersUsed = Math.ceil(qty / perLayer);
        cellYOffset += (layersUsed * h) + (0.02 * scale);
      });
    });
  }

  // ítems sin ubicación: fallback “esquina”
  var missing = items.filter(function (it) {
    return !placedIds[Number(it.id_item)];
  });

  boxes = boxes.concat(buildItemBoxesFallback(missing, -halfX, -halfZ));
  return boxes;
}


      var itemBoxes = [];

      var lastX = 0, lastY = 0, isRotating = false;
      var lastPinchDist = 0;
      function getTouchDist(e) {
        if (e.touches.length < 2) return 0;
        var t0 = e.touches[0], t1 = e.touches[1];
        var dx = t0.clientX - t1.clientX, dy = t0.clientY - t1.clientY;
        return Math.sqrt(dx*dx + dy*dy);
      }
      function onDown(x, y) { isRotating = true; lastX = x; lastY = y; }
      function onMove(x, y) {
        if (!isRotating) return;
        var dx = x - lastX, dy = y - lastY;
        lastX = x; lastY = y;
        angleY += dx * 0.005;
        angleX += dy * 0.005;
      }
      function onUp() { isRotating = false; }

      canvas.addEventListener('mousedown', function(e){ onDown(e.clientX, e.clientY); });
      canvas.addEventListener('mousemove', function(e){ onMove(e.clientX, e.clientY); });
      window.addEventListener('mouseup', onUp);

      canvas.addEventListener('wheel', function(e){
        e.preventDefault();
        zoom = clampZoom(zoom * (e.deltaY < 0 ? 1.1 : 0.9));
      }, { passive: false });

      canvas.addEventListener('touchstart', function(e){
        if (e.touches.length === 1) {
          var t = e.touches[0];
          onDown(t.clientX, t.clientY);
        } else if (e.touches.length === 2) {
          isRotating = false;
          lastPinchDist = getTouchDist(e);
          e.preventDefault();
        }
      }, { passive: false });

      canvas.addEventListener('touchmove', function(e){
        if (e.touches.length === 1 && isRotating) {
          var t = e.touches[0];
          onMove(t.clientX, t.clientY);
          e.preventDefault();
        } else if (e.touches.length === 2) {
          var d = getTouchDist(e);
          if (lastPinchDist > 0 && d > 0) zoom = clampZoom(zoom * (d / lastPinchDist));
          lastPinchDist = d;
          e.preventDefault();
        }
      }, { passive: false });

      canvas.addEventListener('touchend', function(e){
        if (e.touches.length===0){ onUp(); lastPinchDist=0; }
      }, { passive: false });

      canvas.addEventListener('touchcancel', function(){ onUp(); lastPinchDist=0; }, { passive: false });

      function project(v) {
        var baseDist = maxDim * scale * 2.2;
        var cz = baseDist / zoom;

        var cosY = Math.cos(angleY), sinY = Math.sin(angleY);
        var x1 = v.x * cosY - v.z * sinY;
        var z1 = v.x * sinY + v.z * cosY;

        var cosX = Math.cos(angleX), sinX = Math.sin(angleX);
        var y2 = v.y * cosX - z1 * sinX;
        var z2 = v.y * sinX + z1 * cosX;

        var pz = z2 + cz;
        var f = 500 / (pz || 1);
        var dpr = window.devicePixelRatio || 1;

        return {
          x: canvas.width / (2 * dpr) + x1 * f,
          y: canvas.height / (2 * dpr) - y2 * f
        };
      }

      function drawGrid() {
        var dpr = window.devicePixelRatio || 1;
        var w = canvas.width / dpr;
        var h = canvas.height / dpr;
        var step = 24;
        ctx.save();
        ctx.strokeStyle = "#111827";
        ctx.lineWidth = 1;
        for (var x = 0; x <= w; x += step) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,h); ctx.stroke(); }
        for (var y = 0; y <= h; y += step) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,h); ctx.stroke(); }
        ctx.restore();
      }

      function drawBodega() {
        var verts = [
          {x:-halfX,y:-halfY,z:-halfZ},{x: halfX,y:-halfY,z:-halfZ},{x: halfX,y:-halfY,z: halfZ},{x:-halfX,y:-halfY,z: halfZ},
          {x:-halfX,y: halfY,z:-halfZ},{x: halfX,y: halfY,z:-halfZ},{x: halfX,y: halfY,z: halfZ},{x:-halfX,y: halfY,z: halfZ},
        ];
        var edges = [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];
        var pts = verts.map(project);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        edges.forEach(function(e) {
          var a = pts[e[0]], b = pts[e[1]];
          ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke();
        });
      }

      function drawFloorCells() {
        if (!layoutData || !layoutData.ancho || !layoutData.largo) return;
        var gW = layoutData.ancho;
        var gL = layoutData.largo;
        var mapa = layoutData.mapa || {};

        var cellWorldW = ((BW * scale) / gW);
        var cellWorldL = ((BL * scale) / gL);

        for (var index = 0; index < gW * gL; index++) {
          var estado = (mapa[index] ?? mapa[String(index)] ?? "D");
          var gx = index % gW;
          var gz = Math.floor(index / gW);

          var centerX = -halfX + cellWorldW * (gx + 0.5);
          var centerZ = -halfZ + cellWorldL * (gz + 0.5);
          var y = -halfY;

          var hw = cellWorldW / 2;
          var hl = cellWorldL / 2;

          var color;
          if (estado === "B") color = "rgba(239,68,68,0.55)";
          else if (estado === "O") color = "rgba(234,179,8,0.55)";
          else color = "rgba(34,197,94,0.35)";

          var p0 = project({x:centerX - hw, y:y, z:centerZ - hl});
          var p1 = project({x:centerX + hw, y:y, z:centerZ - hl});
          var p2 = project({x:centerX + hw, y:y, z:centerZ + hl});
          var p3 = project({x:centerX - hw, y:y, z:centerZ + hl});

          ctx.beginPath();
          ctx.moveTo(p0.x, p0.y);
          ctx.lineTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.lineTo(p3.x, p3.y);
          ctx.closePath();

          ctx.fillStyle = color;
          ctx.fill();
          ctx.strokeStyle = "rgba(15,23,42,0.9)";
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }

      function drawItems() {
        for (var bi=0; bi<itemBoxes.length; bi++) {
          var box = itemBoxes[bi];
          var hw = box.w / 2, hh = box.h / 2, hl = box.l / 2;

          var v = [
            { x: box.x - hw, y: box.y - hh, z: box.z - hl },
            { x: box.x + hw, y: box.y - hh, z: box.z - hl },
            { x: box.x + hw, y: box.y - hh, z: box.z + hl },
            { x: box.x - hw, y: box.y - hh, z: box.z + hl },
            { x: box.x - hw, y: box.y + hh, z: box.z - hl },
            { x: box.x + hw, y: box.y + hh, z: box.z - hl },
            { x: box.x + hw, y: box.y + hh, z: box.z + hl },
            { x: box.x - hw, y: box.y + hh, z: box.z + hl },
          ];

          var pts = v.map(project);

          var faces = [
            [4, 5, 6, 7],
            [0, 1, 2, 3],
            [0, 1, 5, 4],
            [1, 2, 6, 5],
            [2, 3, 7, 6],
            [3, 0, 4, 7],
          ];

          var colors = getColorsForBox(box);
          var fillColor = colors.fill;
          var strokeColor = colors.stroke;

          var isHighlighted = highlightedName && box.nombre === highlightedName;
          ctx.lineWidth = isHighlighted ? 2 : 1;
          if (isHighlighted) {
            fillColor = "rgba(250,250,250,0.12)";
            strokeColor = "#facc15";
          }

          for (var fi=0; fi<faces.length; fi++) {
            var face = faces[fi];
            var p0 = pts[face[0]];
            ctx.beginPath();
            ctx.moveTo(p0.x, p0.y);
            for (var i = 1; i < face.length; i++) {
              var pi = pts[face[i]];
              ctx.lineTo(pi.x, pi.y);
            }
            ctx.closePath();
            ctx.fillStyle = fillColor;
            ctx.fill();
            ctx.strokeStyle = strokeColor;
            ctx.stroke();
          }
        }
      }

      function updateLabel() {
        label.textContent =
          "Bodega: " + BNAME + "\\n" +
          BW + "m (ancho) × " + BH + "m (alto) × " + BL + "m (largo)\\n" +
          "Ítems (lista): " + (items ? items.length : 0) + "\\n" +
          "Ubicaciones (backend): " + (ubicaciones ? ubicaciones.length : 0) + "\\n" +
          "UpdateSeq: " + UPDATE_SEQ;
      }

      function applyUpdateData(payload) {
        try {
          UPDATE_SEQ += 1;

          if (payload.bodega) {
            BW = Number(payload.bodega.bw || BW);
            BH = Number(payload.bodega.bh || BH);
            BL = Number(payload.bodega.bl || BL);
            BNAME = String(payload.bodega.bName || BNAME);
          }
          if (payload.layout) {
            layoutData = payload.layout;
          }
          if (Array.isArray(payload.items)) items = payload.items;
          if (Array.isArray(payload.ubicaciones)) ubicaciones = payload.ubicaciones;

          recomputeWorld();
          itemBoxes = buildBoxesHybrid();
          updateLabel();
        } catch (e) {}
      }

      function handleMessageFromRN(event) {
        try {
          var msg = JSON.parse(event.data);
          if (msg.type === "selectItem") highlightedName = msg.nombre || null;
          if (msg.type === "updateData") applyUpdateData(msg);
        } catch (e) {}
      }
      document.addEventListener("message", handleMessageFromRN);
      window.addEventListener("message", handleMessageFromRN);

      try {
        window.ReactNativeWebView &&
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: "ready" }));
      } catch (e) {}

      function render() {
        var dpr = window.devicePixelRatio || 1;
        var w = canvas.width / dpr;
        var h = canvas.height / dpr;

        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = "#020817";
        ctx.fillRect(0, 0, w, h);

        drawGrid();
        drawBodega();
        drawFloorCells();
        drawItems();

        requestAnimationFrame(render);
      }

      recomputeWorld();
      updateLabel();
      render();
    })();
  </script>
</body>
</html>
`;
  }, []);

  const onWebMessage = useCallback((e) => {
    try {
      const data = JSON.parse(e?.nativeEvent?.data || "{}");
      if (data.type === "ready") {
        setWebReady(true);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (webReady) flushPending();
  }, [webReady, flushPending]);

  return (
    <View style={styles.container}>
      {isFocused ? (
        <WebView
          ref={webviewRef}
          originWhitelist={["*"]}
          source={{ html }}
          onMessage={onWebMessage}
          javaScriptEnabled
          domStorageEnabled
          mixedContentMode="always"
          androidHardwareAccelerationDisabled={false}
          scrollEnabled={false}
          style={styles.webview}
        />
      ) : (
        <View style={styles.webview} />
      )}

      <BodegaItemsList
        items={itemsInBodega}
        selectedItemName={selectedItemName}
        onSelectItem={handleSelectItem}
        prioritySelection={prioritySelection}
        onTogglePriority={handleTogglePriority}
        onApplyRecubicaje={handleReordenarPorPrioridad}
        loadingReorden={loadingReorden || loadingUbicaciones || loadingTetris}
        onPreviewCompactacion={previewCompactacion}
        onEjecutarCompactacion={ejecutarCompactacion}
        movsPreview={movsPreview}
        loadingTetris={loadingTetris}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#020817" },
  webview: { flex: 1, backgroundColor: "#020817" },
});
