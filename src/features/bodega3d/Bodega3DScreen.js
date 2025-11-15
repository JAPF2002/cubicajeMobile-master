// src/features/bodega3d/Bodega3DScreen.js

import React from "react";
import { View, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";
import { useApp } from "../../store";

export default function Bodega3DScreen({ route }) {
  const { bodegas, items } = useApp();

  // Se espera que venga bodegaId en los params
  const { bodegaId, nombre, ancho, alto, largo, layout: layoutParam } =
    route.params || {};

  // Buscar la bodega en el store si tenemos id
  const bodega = bodegas.find((b) => b.id === bodegaId) || null;

  const bw = Number(bodega?.ancho ?? ancho) || 10;
  const bh = Number(bodega?.alto ?? alto) || 5;
  const bl = Number(bodega?.largo ?? largo) || 10;
  const bName = bodega?.nombre || nombre || "Bodega";

  // 👉 Layout de la bodega (mapeo D / B / O)
  const layout = bodega?.layout || layoutParam || null;
  const layoutAncho = Number(layout?.ancho ?? bw) || 0;
  const layoutLargo = Number(layout?.largo ?? bl) || 0;
  const layoutMapa = layout?.mapa_json || {};

  // Ítems dentro de esta bodega
  const itemsInBodega = items
    .filter((it) => it.bodegaId === (bodega?.id ?? bodegaId))
    .map((it) => ({
      nombre: it.nombre,
      w: Number(it.ancho) || 1,
      h: Number(it.alto) || 1,
      l: Number(it.largo) || 1,
      cantidad:
        parseInt(it.cantidad ?? 1, 10) > 0
          ? parseInt(it.cantidad, 10)
          : 1,
      clase: it.clase || "",
    }));

  // Serializamos a JSON seguro para incrustar en el HTML
  const itemsJson = JSON.stringify(itemsInBodega).replace(/</g, "\\u003c");

  // Pasamos también el layout al WebView
  const layoutJson = JSON.stringify(
    {
      ancho: layoutAncho,
      largo: layoutLargo,
      mapa: layoutMapa, // objeto tipo { "0":"D", "1":"B", ... }
    },
    null,
    0
  ).replace(/</g, "\\u003c");

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Bodega 3D</title>
        <style>
          html, body {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
            background: #020817; /* azul muy oscuro */
          }
          #label {
            position: absolute;
            top: 6px;
            left: 6px;
            padding: 4px 8px;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
            font-size: 11px;
            color: #e5e7eb;
            background: rgba(2,8,23,0.9);
            border-radius: 4px;
            z-index: 10;
          }
          #c {
            display: block;
            width: 100vw;
            height: 100vh;
            background: #020817;
          }
        </style>
      </head>
      <body>
        <div id="label">
          Bodega: ${bName}<br/>
          ${bw}m (ancho) × ${bh}m (alto) × ${bl}m (largo)<br/>
          Ítems cargados: ${itemsInBodega.length}
        </div>
        <canvas id="c"></canvas>

        <script>
          (function () {
            var canvas = document.getElementById('c');
            var ctx = canvas.getContext('2d');

            // Datos que vienen desde React Native
            var items = ${itemsJson};
            var layoutData = ${layoutJson};

            function resize() {
              var dpr = window.devicePixelRatio || 1;
              var rect = canvas.getBoundingClientRect();
              canvas.width = rect.width * dpr;
              canvas.height = rect.height * dpr;
              ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            }
            window.addEventListener('resize', resize);
            resize();

            // Escala para que TODO quepa (bodega + cajas)
            var maxDim = Math.max(${bw}, ${bh}, ${bl}) || 1;
            var target = Math.min(window.innerWidth, window.innerHeight) * 0.42;
            var scale = target / maxDim;

            var halfX = (${bw} * scale) / 2;
            var halfY = (${bh} * scale) / 2;
            var halfZ = (${bl} * scale) / 2;

            /* ------- Vértices bodega ------- */
            var bodegaVerts = [
              // base inferior
              {x:-halfX,y:-halfY,z:-halfZ},
              {x: halfX,y:-halfY,z:-halfZ},
              {x: halfX,y:-halfY,z: halfZ},
              {x:-halfX,y:-halfY,z: halfZ},
              // base superior
              {x:-halfX,y: halfY,z:-halfZ},
              {x: halfX,y: halfY,z:-halfZ},
              {x: halfX,y: halfY,z: halfZ},
              {x:-halfX,y: halfY,z: halfZ},
            ];

            var bodegaEdges = [
              [0,1],[1,2],[2,3],[3,0],
              [4,5],[5,6],[6,7],[7,4],
              [0,4],[1,5],[2,6],[3,7]
            ];

            /* ------- Layout de ítems dentro de la bodega ------- */
            function buildItemBoxes() {
              var boxes = [];
              if (!items || !items.length) return boxes;

              var originX = -halfX;
              var originZ = -halfZ;

              var cursorX = originX;
              var cursorZ = originZ;
              var layerY = -halfY; // piso
              var rowDepth = 0;

              items.forEach(function(it, idx) {
                var w = (it.w || 1) * scale;
                var h = (it.h || 1) * scale;
                var l = (it.l || 1) * scale;
                var count = it.cantidad || 1;

                for (var n = 0; n < count; n++) {
                  // salto de fila si no cabe en X
                  if (cursorX + w > halfX) {
                    cursorX = originX;
                    cursorZ += rowDepth;
                    rowDepth = 0;
                  }
                  // nueva capa si no cabe en Z
                  if (cursorZ + l > halfZ) {
                    cursorX = originX;
                    cursorZ = originZ;
                    layerY += h; // subir capa
                  }

                  // centro de la caja
                  var cx = cursorX + w / 2;
                  var cy = layerY + h / 2;
                  var cz = cursorZ + l / 2;

                  // guardamos caja
                  boxes.push({
                    nombre: it.nombre,
                    x: cx,
                    y: cy,
                    z: cz,
                    w: w,
                    h: h,
                    l: l,
                    colorIndex: idx
                  });

                  cursorX += w;
                  if (l > rowDepth) rowDepth = l;
                }
              });

              return boxes;
            }

            var itemBoxes = buildItemBoxes();

            /* ------- Cámara / interacción ------- */

            var angleX = 0.6;
            var angleY = -0.7;

            var zoom = 1.4;
            var baseDist = maxDim * scale * 3;
            function clampZoom(z) {
              return Math.max(0.4, Math.min(5, z));
            }

            var lastX = 0;
            var lastY = 0;
            var isRotating = false;

            var lastPinchDist = 0;
            function getTouchDist(e) {
              if (e.touches.length < 2) return 0;
              var t0 = e.touches[0];
              var t1 = e.touches[1];
              var dx = t0.clientX - t1.clientX;
              var dy = t0.clientY - t1.clientY;
              return Math.sqrt(dx*dx + dy*dy);
            }

            function onDown(x, y) {
              isRotating = true;
              lastX = x;
              lastY = y;
            }
            function onMove(x, y) {
              if (!isRotating) return;
              var dx = x - lastX;
              var dy = y - lastY;
              lastX = x;
              lastY = y;
              angleY += dx * 0.005;
              angleX += dy * 0.005;
            }
            function onUp() {
              isRotating = false;
            }

            canvas.addEventListener('mousedown', function(e){
              onDown(e.clientX, e.clientY);
            });
            canvas.addEventListener('mousemove', function(e){
              onMove(e.clientX, e.clientY);
            });
            window.addEventListener('mouseup', onUp);

            canvas.addEventListener('wheel', function(e){
              e.preventDefault();
              var factor = e.deltaY < 0 ? 1.1 : 0.9;
              zoom = clampZoom(zoom * factor);
            }, { passive: false });

            canvas.addEventListener('touchstart', function(e){
              if (e.touches.length === 1) {
                var t = e.touches[0];
                onDown(t.clientX, t.clientY);
              } else if (e.touches.length === 2) {
                isRotating = false;
                lastPinchDist = getTouchDist(e);
              }
            }, { passive: true });

            canvas.addEventListener('touchmove', function(e){
              if (e.touches.length === 1 && isRotating) {
                var t = e.touches[0];
                onMove(t.clientX, t.clientY);
              } else if (e.touches.length === 2) {
                var d = getTouchDist(e);
                if (lastPinchDist > 0 && d > 0) {
                  var factor = d / lastPinchDist;
                  zoom = clampZoom(zoom * factor);
                }
                lastPinchDist = d;
              }
            }, { passive: false });

            canvas.addEventListener('touchend', function(e){
              if (e.touches.length === 0) {
                onUp();
                lastPinchDist = 0;
              }
            });
            canvas.addEventListener('touchcancel', function(){
              onUp();
              lastPinchDist = 0;
            });

            function project(v) {
              var cx = 0, cy = 0;
              var cz = baseDist / zoom;

              var cosY = Math.cos(angleY);
              var sinY = Math.sin(angleY);
              var x1 = v.x * cosY - v.z * sinY;
              var z1 = v.x * sinY + v.z * cosY;

              var cosX = Math.cos(angleX);
              var sinX = Math.sin(angleX);
              var y2 = v.y * cosX - z1 * sinX;
              var z2 = v.y * sinX + z1 * cosX;

              var px = x1 - cx;
              var py = y2 - cy;
              var pz = z2 + cz;

              var f = 500 / (pz || 1);
              var dpr = window.devicePixelRatio || 1;

              return {
                x: canvas.width / (2 * dpr) + px * f,
                y: canvas.height / (2 * dpr) - py * f
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
              for (var x = 0; x <= w; x += step) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, h);
                ctx.stroke();
              }
              for (var y = 0; y <= h; y += step) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(w, h);
                ctx.stroke();
              }
              ctx.restore();
            }

            function drawAxes() {
              var origin = project({x:0,y:0,z:0});
              var xAxis = project({x:halfX*1.4,y:0,z:0});
              var yAxis = project({x:0,y:halfY*1.4,z:0});
              var zAxis = project({x:0,y:0,z:halfZ*1.4});

              ctx.lineWidth = 2;

              ctx.strokeStyle = "#ef4444"; // X
              ctx.beginPath();
              ctx.moveTo(origin.x, origin.y);
              ctx.lineTo(xAxis.x, xAxis.y);
              ctx.stroke();

              ctx.strokeStyle = "#22c55e"; // Y
              ctx.beginPath();
              ctx.moveTo(origin.x, origin.y);
              ctx.lineTo(yAxis.x, yAxis.y);
              ctx.stroke();

              ctx.strokeStyle = "#3b82f6"; // Z
              ctx.beginPath();
              ctx.moveTo(origin.x, origin.y);
              ctx.lineTo(zAxis.x, zAxis.y);
              ctx.stroke();
            }

            function drawBodega() {
              var pts = bodegaVerts.map(project);
              ctx.strokeStyle = "#ffffff";
              ctx.lineWidth = 2;
              bodegaEdges.forEach(function(e) {
                var a = pts[e[0]];
                var b = pts[e[1]];
                ctx.beginPath();
                ctx.moveTo(a.x, a.y);
                ctx.lineTo(b.x, b.y);
                ctx.stroke();
              });
            }

            // 🟩🟥 DIBUJAR EL MAPE0 DEL PISO SEGÚN layoutData (D/B/O) + LETRAS
            function drawFloorCells() {
              if (!layoutData || !layoutData.ancho || !layoutData.largo) return;

              var gW = layoutData.ancho;
              var gL = layoutData.largo;
              var mapa = layoutData.mapa || {};

              // Cada celda ocupa un pedazo del ancho/largo total de la bodega
              var cellWorldW = ((${bw} * scale) / gW);
              var cellWorldL = ((${bl} * scale) / gL);

              for (var index = 0; index < gW * gL; index++) {
                var estado = mapa[index] ?? mapa[String(index)] ?? "D";

                var gx = index % gW;
                var gz = Math.floor(index / gW);

                var centerX = -halfX + cellWorldW * (gx + 0.5);
                var centerZ = -halfZ + cellWorldL * (gz + 0.5);
                var y = -halfY; // piso

                var hw = cellWorldW / 2;
                var hl = cellWorldL / 2;

                var color;
                if (estado === "B") {
                  color = "rgba(239,68,68,0.55)"; // rojo bloqueado
                } else if (estado === "O") {
                  color = "rgba(234,179,8,0.55)"; // amarillo ocupado
                } else {
                  color = "rgba(34,197,94,0.35)"; // verde disponible
                }

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

                // 👉 LETRA EN EL CENTRO (D / B / O)
                var centerProj = project({x: centerX, y: y + 0.01, z: centerZ});
                ctx.fillStyle = "#e5e7eb";
                ctx.font = "10px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(estado, centerProj.x, centerProj.y);
              }
            }

            function drawItems() {
              if (!itemBoxes.length) return;

              itemBoxes.forEach(function(box) {
                var hw = box.w / 2;
                var hh = box.h / 2;
                var hl = box.l / 2;

                var v = [
                  {x: box.x - hw, y: box.y - hh, z: box.z - hl},
                  {x: box.x + hw, y: box.y - hh, z: box.z - hl},
                  {x: box.x + hw, y: box.y - hh, z: box.z + hl},
                  {x: box.x - hw, y: box.y - hh, z: box.z + hl},
                  {x: box.x - hw, y: box.y + hh, z: box.z - hl},
                  {x: box.x + hw, y: box.y + hh, z: box.z - hl},
                  {x: box.x + hw, y: box.y + hh, z: box.z + hl},
                  {x: box.x - hw, y: box.y + hh, z: box.z + hl},
                ];

                var edges = [
                  [0,1],[1,2],[2,3],[3,0],
                  [4,5],[5,6],[6,7],[7,4],
                  [0,4],[1,5],[2,6],[3,7]
                ];

                var pts = v.map(project);

                // Color por itemIndex (simple)
                var hue = (box.colorIndex * 57) % 360;
                ctx.strokeStyle = "hsl(" + hue + ", 80%, 60%)";
                ctx.lineWidth = 1.5;

                edges.forEach(function(e) {
                  var a = pts[e[0]];
                  var b = pts[e[1]];
                  ctx.beginPath();
                  ctx.moveTo(a.x, a.y);
                  ctx.lineTo(b.x, b.y);
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
              drawAxes();
              drawBodega();
              drawFloorCells(); // 👈 aquí se ve el MAPE0 (D/B/O) con letras
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
        originWhitelist={["*"]}
        source={{ html }}
        javaScriptEnabled
        domStorageEnabled
        mixedContentMode="always"
        androidHardwareAccelerationDisabled={false}
        style={styles.webview}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#020817" },
  webview: { flex: 1, backgroundColor: "#020817" },
});
