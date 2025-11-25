// cubicajeMobile-master/src/features/bodega3d/Bodega3DScreen.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { WebView } from "react-native-webview";
import { useApp } from "../../store";
import BodegaItemsList from "./BodegaItemsList";
import {
  recubicarBodegaPrioridadApi,
  getBodegaUbicacionesApi,
} from "../api";

export default function Bodega3DScreen({ route }) {
  const { bodegas, items, syncBodegasFromApi } = useApp();

  // estados para prioridad
  const [prioritySelection, setPrioritySelection] = useState({});
  const [loadingReorden, setLoadingReorden] = useState(false);

  // ubicaciones reales
  const [ubicaciones, setUbicaciones] = useState([]);
  const [loadingUbicaciones, setLoadingUbicaciones] = useState(false);

  // para refrescar el WebView cuando cambien datos
  const [refreshKey, setRefreshKey] = useState(0);

  const webviewRef = useRef(null);
  const [selectedItemName, setSelectedItemName] = useState(null);

  const { bodegaId, nombre, ancho, alto, largo, layout: layoutParam } =
    route.params || {};

  const bodega = bodegas.find((b) => b.id === bodegaId) || null;

  const bw = Number(bodega?.ancho ?? ancho) || 10;
  const bh = Number(bodega?.alto ?? alto) || 5;
  const bl = Number(bodega?.largo ?? largo) || 10;
  const bName = bodega?.nombre || nombre || "Bodega";

  // Layout de la bodega (mapeo D / B / O)
  const layout = bodega?.layout || layoutParam || null;
  const layoutAncho = Number(layout?.ancho ?? 0) || 0;
  const layoutLargo = Number(layout?.largo ?? 0) || 0;
  const layoutMapa = layout?.mapa_json || {};

  // Ítems dentro de esta bodega (para la lista inferior)
  const itemsInBodega = useMemo(() => {
    return items
      .filter((it) => it.bodegaId === (bodega?.id ?? bodegaId))
      .map((it) => ({
        id_item: it.id_item ?? it.id,
        nombre: it.nombre,
        w: Number(it.ancho) || 1,
        h: Number(it.alto) || 1,
        l: Number(it.largo) || 1,
        cantidad:
          parseInt(it.cantidad ?? 1, 10) > 0
            ? parseInt(it.cantidad, 10)
            : 1,
        clase: it.clase || "",
        categoriaId: it.id_categoria ?? null,
      }));
  }, [items, bodega?.id, bodegaId]);

  // ---- cargar ubicaciones reales desde backend ----
  const reloadUbicaciones = async () => {
    if (!bodega?.id) return;
    try {
      setLoadingUbicaciones(true);
      const res = await getBodegaUbicacionesApi(bodega.id);

      if (res?.error) {
        console.log("[Bodega3DScreen] getUbicaciones error:", res);
        setUbicaciones([]);
      } else {
        setUbicaciones(Array.isArray(res?.body) ? res.body : []);
      }
    } catch (e) {
      console.log("[Bodega3DScreen] getUbicaciones excepción:", e);
      setUbicaciones([]);
    } finally {
      setLoadingUbicaciones(false);
    }
  };

  useEffect(() => {
    reloadUbicaciones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bodega?.id]);

  // ---- recubicaje por prioridad ----
  const handleReordenarPorPrioridad = async () => {
    if (!bodega) {
      Alert.alert("Error", "No se encontró la bodega en memoria.");
      return;
    }

    const idsSeleccionados = Object.keys(prioritySelection);
    if (!idsSeleccionados.length) {
      Alert.alert("Aviso", "Primero selecciona al menos un ítem para priorizar.");
      return;
    }

    const payload = {
      items: idsSeleccionados.map((idStr) => ({
        id_item: Number(idStr),
        prioridad: prioritySelection[idStr],
      })),
    };

    try {
      setLoadingReorden(true);
      const res = await recubicarBodegaPrioridadApi(bodega.id, payload);

      if (res?.error) {
        console.log("[Bodega3DScreen] recubicar error:", res);
        Alert.alert("Error", res?.body?.message || "No se pudo recubicar la bodega.");
        setLoadingReorden(false);
        return;
      }

      Alert.alert("OK", res?.body?.mensaje || "Recubicación por prioridad completada.");

      // refrescar (layout/bodega si aplica)
      try {
        await syncBodegasFromApi?.();
      } catch (e) {
        console.log("[Bodega3DScreen] error al refrescar bodegas:", e);
      }

      // 🔥 lo importante: recargar ubicaciones reales para que el 3D se actualice
      await reloadUbicaciones();

      // remount webview para asegurar redraw
      setRefreshKey((k) => k + 1);

      // limpiar prioridades
      setPrioritySelection({});

      setLoadingReorden(false);
    } catch (e) {
      setLoadingReorden(false);
      console.log("[Bodega3DScreen] recubicar excepción:", e);
      Alert.alert("Error", "Hubo un problema de conexión al recubicar.");
    }
  };

  const handleSelectItem = (nombreItem) => {
    setSelectedItemName((prevName) => {
      const newName = prevName === nombreItem ? null : nombreItem;

      if (webviewRef.current) {
        webviewRef.current.postMessage(
          JSON.stringify({ type: "selectItem", nombre: newName })
        );
      }
      return newName;
    });
  };

  // ciclo 0 → 1 → 2 → 3 → 0
  const handleTogglePriority = (id_item) => {
    setPrioritySelection((prev) => {
      const current = prev[id_item] ?? 0;
      let next;
      if (current === 0) next = 1;
      else if (current === 1) next = 2;
      else if (current === 2) next = 3;
      else next = 0;

      const copy = { ...prev };
      if (next === 0) delete copy[id_item];
      else copy[id_item] = next;

      return copy;
    });
  };

  // JSON para WebView
  const itemsJson = JSON.stringify(itemsInBodega).replace(/</g, "\\u003c");
  const layoutJson = JSON.stringify(
    { ancho: layoutAncho, largo: layoutLargo, mapa: layoutMapa },
    null,
    0
  ).replace(/</g, "\\u003c");

  const ubicacionesJson = JSON.stringify(ubicaciones).replace(/</g, "\\u003c");

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Bodega 3D</title>
        <style>
          html, body { margin:0; padding:0; width:100%; height:100%; overflow:hidden; background:#020817; }
          #label {
            position:absolute; top:6px; left:6px; padding:4px 8px;
            font-family:system-ui, -apple-system, BlinkMacSystemFont, sans-serif; font-size:11px;
            color:#e5e7eb; background:rgba(2,8,23,0.9); border-radius:4px; z-index:10;
          }
          #c { display:block; width:100vw; height:100vh; background:#020817; }
        </style>
      </head>
      <body>
        <div id="label">
          Bodega: ${bName}<br/>
          ${bw}m (ancho) × ${bh}m (alto) × ${bl}m (largo)<br/>
          Ítems (lista): ${itemsInBodega.length}<br/>
          Ubicaciones (backend): ${(ubicaciones || []).length}
        </div>
        <canvas id="c"></canvas>

        <script>
          (function () {
            var canvas = document.getElementById('c');
            var ctx = canvas.getContext('2d');

            var items = ${itemsJson};
            var layoutData = ${layoutJson};
            var ubicaciones = ${ubicacionesJson};

            var highlightedName = null;

            function handleMessageFromRN(event) {
              try {
                var msg = JSON.parse(event.data);
                if (msg.type === "selectItem") highlightedName = msg.nombre || null;
              } catch (e) {}
            }
            document.addEventListener("message", handleMessageFromRN);
            window.addEventListener("message", handleMessageFromRN);

            function resize() {
              var dpr = window.devicePixelRatio || 1;
              var rect = canvas.getBoundingClientRect();
              canvas.width = rect.width * dpr;
              canvas.height = rect.height * dpr;
              ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            }
            window.addEventListener('resize', resize);
            resize();

            var maxDim = Math.max(${bw}, ${bh}, ${bl}) || 1;
            var target = Math.min(window.innerWidth, window.innerHeight) * 0.75;
            var scale = target / maxDim;

            var halfX = (${bw} * scale) / 2;
            var halfY = (${bh} * scale) / 2;
            var halfZ = (${bl} * scale) / 2;

            // colores por categoria (azul/amarillo/morado)
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

            // ---- build de cajas REAL: desde ubicaciones ----
            function buildItemBoxesFromUbicaciones() {
              var boxes = [];

              if (!layoutData || !layoutData.ancho || !layoutData.largo) return boxes;
              if (!ubicaciones || !ubicaciones.length) return boxes;

              var gW = layoutData.ancho;
              var gL = layoutData.largo;

              var cellWorldW = ((${bw} * scale) / gW);
              var cellWorldL = ((${bl} * scale) / gL);

              ubicaciones.forEach(function(u, uIdx){
                var gx = Number(u.pos_x) || 0;
                var gz = Number(u.pos_y) || 0;

                var centerX = -halfX + cellWorldW * (gx + 0.5);
                var centerZ = -halfZ + cellWorldL * (gz + 0.5);

                var baseY = -halfY;
                var stackY = 0;

                if (!u.items || !u.items.length) return;

                u.items.forEach(function(it, itIdx){
                  var qty = Number(it.qty) || 0;
                  if (qty <= 0) return;

                  // dimensiones reales del item del backend
                  var w = (Number(it.ancho) || 1) * scale;
                  var l = (Number(it.largo) || 1) * scale;
                  var h = (Number(it.alto)  || 1) * scale;

                  for (var k=0; k<qty; k++){
                    var cy = baseY + stackY + (h/2);

                    boxes.push({
                      nombre: it.nombre || it.item_nombre || ("Item " + it.id_item),
                      x: centerX,
                      y: cy,
                      z: centerZ,
                      w: w,
                      h: h,
                      l: l,
                      colorIndex: (uIdx * 17 + itIdx) % 50,
                      categoryId: it.id_categoria != null ? Number(it.id_categoria) : (it.item_categoria_id != null ? Number(it.item_categoria_id) : null),
                    });

                    // apilar
                    stackY += h;
                    // si se pasa del alto de bodega, igual dibujamos (pero podrías cortar si quieres)
                  }
                });
              });

              return boxes;
            }

            // fallback viejo si no hay ubicaciones
            function buildItemBoxesFallback() {
              var boxes = [];
              if (!items || !items.length) return boxes;

              var originX = -halfX;
              var originZ = -halfZ;

              var cursorX = originX;
              var cursorZ = originZ;
              var layerY = -halfY;
              var rowDepth = 0;

              items.forEach(function(it, idx) {
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
                    nombre: it.nombre,
                    x: cx,
                    y: cy,
                    z: cz,
                    w: w,
                    h: h,
                    l: l,
                    colorIndex: idx,
                    categoryId: it.categoriaId != null ? it.categoriaId : null,
                  });

                  cursorX += w;
                  if (l > rowDepth) rowDepth = l;
                }
              });

              return boxes;
            }

            var itemBoxes = buildItemBoxesFromUbicaciones();
            if (!itemBoxes.length) itemBoxes = buildItemBoxesFallback();

            // ---- cámara ----
            var angleX = 0.6;
            var angleY = -0.7;
            var zoom = 1.6;
            var baseDist = maxDim * scale * 2.2;
            function clampZoom(z) { return Math.max(0.4, Math.min(5, z)); }

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
              if (e.touches.length === 1) { var t = e.touches[0]; onDown(t.clientX, t.clientY); }
              else if (e.touches.length === 2) { isRotating = false; lastPinchDist = getTouchDist(e); }
            }, { passive: true });

            canvas.addEventListener('touchmove', function(e){
              if (e.touches.length === 1 && isRotating) { var t = e.touches[0]; onMove(t.clientX, t.clientY); }
              else if (e.touches.length === 2) {
                var d = getTouchDist(e);
                if (lastPinchDist > 0 && d > 0) zoom = clampZoom(zoom * (d / lastPinchDist));
                lastPinchDist = d;
              }
            }, { passive: false });

            canvas.addEventListener('touchend', function(e){ if (e.touches.length===0){ onUp(); lastPinchDist=0; }});
            canvas.addEventListener('touchcancel', function(){ onUp(); lastPinchDist=0; });

            function project(v) {
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

              var cellWorldW = ((${bw} * scale) / gW);
              var cellWorldL = ((${bl} * scale) / gL);

              for (var index = 0; index < gW * gL; index++) {
                var estado = mapa[index] ?? mapa[String(index)] ?? "D";
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
              if (!itemBoxes.length) return;

              itemBoxes.forEach(function (box) {
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
                if (isHighlighted) {
                  fillColor = "rgba(250,250,250,0.12)";
                  strokeColor = "#facc15";
                  ctx.lineWidth = 2;
                } else {
                  ctx.lineWidth = 1;
                }

                faces.forEach(function (face) {
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
                });
              });
            }

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

            render();
          })();
        </script>
      </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <WebView
        key={refreshKey}
        ref={webviewRef}
        originWhitelist={["*"]}
        source={{ html }}
        javaScriptEnabled
        domStorageEnabled
        mixedContentMode="always"
        androidHardwareAccelerationDisabled={false}
        style={styles.webview}
      />

      <BodegaItemsList
        items={itemsInBodega}
        selectedItemName={selectedItemName}
        onSelectItem={handleSelectItem}
        prioritySelection={prioritySelection}
        onTogglePriority={handleTogglePriority}
        onApplyRecubicaje={handleReordenarPorPrioridad}
        loadingReorden={loadingReorden || loadingUbicaciones}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#020817" },
  webview: { flex: 1, backgroundColor: "#020817" },
});
