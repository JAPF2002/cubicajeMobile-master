// src/features/bodega3d/Bodega3DScreen.js
import React from "react";
import { View, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";

export default function Bodega3DScreen({ route }) {
  const { nombre, ancho, alto, largo } = route.params || {};

  const w = Number(ancho) || 10;
  const h = Number(alto) || 5;
  const l = Number(largo) || 10;

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
          ${nombre ? `Bodega: ${nombre}<br/>` : ""}
          ${w}m (ancho) × ${h}m (alto) × ${l}m (largo)
        </div>
        <canvas id="c"></canvas>

        <script>
          (function () {
            var canvas = document.getElementById('c');
            var ctx = canvas.getContext('2d');

            function resize() {
              var dpr = window.devicePixelRatio || 1;
              var rect = canvas.getBoundingClientRect();
              canvas.width = rect.width * dpr;
              canvas.height = rect.height * dpr;
              ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            }
            window.addEventListener('resize', resize);
            resize();

            // Escala para que la caja siempre quepa
            var maxDim = Math.max(${w}, ${h}, ${l}) || 1;
            var target = Math.min(window.innerWidth, window.innerHeight) * 0.35;
            var scale = target / maxDim;

            var halfX = (${w} * scale) / 2;
            var halfY = (${h} * scale) / 2;
            var halfZ = (${l} * scale) / 2;

            // Vértices del prisma
            var vertices = [
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

            // Aristas
            var edges = [
              [0,1],[1,2],[2,3],[3,0], // abajo
              [4,5],[5,6],[6,7],[7,4], // arriba
              [0,4],[1,5],[2,6],[3,7]  // verticales
            ];

            var angleX = 0.6;
            var angleY = -0.7;

            // -------- Zoom --------
            var zoom = 1.4;                   // nivel inicial
            var baseDist = maxDim * scale * 3;
            function clampZoom(z) {
              return Math.max(0.4, Math.min(5, z));
            }

            // -------- Rotación / pinch --------
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

            // Mouse
            canvas.addEventListener('mousedown', function(e){
              onDown(e.clientX, e.clientY);
            });
            canvas.addEventListener('mousemove', function(e){
              onMove(e.clientX, e.clientY);
            });
            window.addEventListener('mouseup', onUp);

            // Wheel zoom (desktop)
            canvas.addEventListener('wheel', function(e){
              e.preventDefault();
              var factor = e.deltaY < 0 ? 1.1 : 0.9;
              zoom = clampZoom(zoom * factor);
            }, { passive: false });

            // Touch: 1 dedo rota, 2 dedos zoom
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
              var cz = baseDist / zoom; // más zoom => cámara más cerca

              // rotación Y
              var cosY = Math.cos(angleY);
              var sinY = Math.sin(angleY);
              var x1 = v.x * cosY - v.z * sinY;
              var z1 = v.x * sinY + v.z * cosY;

              // rotación X
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
              ctx.strokeStyle = "#1f2937";
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
                ctx.lineTo(w, y);
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

              // X rojo
              ctx.strokeStyle = "#ef4444";
              ctx.beginPath();
              ctx.moveTo(origin.x, origin.y);
              ctx.lineTo(xAxis.x, xAxis.y);
              ctx.stroke();

              // Y verde
              ctx.strokeStyle = "#22c55e";
              ctx.beginPath();
              ctx.moveTo(origin.x, origin.y);
              ctx.lineTo(yAxis.x, yAxis.y);
              ctx.stroke();

              // Z azul
              ctx.strokeStyle = "#3b82f6";
              ctx.beginPath();
              ctx.moveTo(origin.x, origin.y);
              ctx.lineTo(zAxis.x, zAxis.y);
              ctx.stroke();
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

              var pts = vertices.map(project);

              ctx.strokeStyle = "#ffffff";
              ctx.lineWidth = 2;
              edges.forEach(function(e) {
                var a = pts[e[0]];
                var b = pts[e[1]];
                ctx.beginPath();
                ctx.moveTo(a.x, a.y);
                ctx.lineTo(b.x, b.y);
                ctx.stroke();
              });

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
