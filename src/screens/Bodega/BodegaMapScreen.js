/*C:\Users\japf2\Desktop\Tesis Cubicaje\Proyecto\proyectoPrincipal\cubicajeMobile-master\src\screens\Bodega\BodegaMapScreen.js*/

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  InteractionManager,
} from "react-native";
import { useApp } from "../../store";
import Tablero from "../../components/Tablero/Tablero";

function parseMap(raw) {
  if (!raw) return {};
  try {
    if (typeof raw === "string") return JSON.parse(raw);
    if (typeof raw === "object") return raw;
  } catch {}
  return {};
}

// ✅ Nunca dibujar más de esto
const MAX_CELLS = 12000;

// Opciones de “metros por celda”
const CELL_METERS_OPTIONS = ["AUTO", 1, 2, 5, 10, 20, 50, 100];

function clampMin1(n) {
  const x = Math.ceil(Number(n) || 0);
  return x < 1 ? 1 : x;
}

function computeGridFromMeters({ anchoM, largoM, desiredCellM }) {
  const cellM = Number(desiredCellM);
  const cols = clampMin1(anchoM / cellM);
  const rows = clampMin1(largoM / cellM);
  return { cols, rows, cellM };
}

function computeGridAuto({ anchoM, largoM }) {
  const maxDim = Math.max(anchoM, largoM);

  // ✅ Si la bodega es grande, no partimos en 1m/celda
  const options =
    maxDim > 100 ? [10, 20, 50, 100, 200, 500] : [1, 2, 5, 10, 20, 50, 100, 200];

  for (const opt of options) {
    const { cols, rows } = computeGridFromMeters({
      anchoM,
      largoM,
      desiredCellM: opt,
    });
    if (cols * rows <= MAX_CELLS) return { cols, rows, cellM: opt };
  }

  const last = options[options.length - 1];
  const { cols, rows } = computeGridFromMeters({
    anchoM,
    largoM,
    desiredCellM: last,
  });

  return { cols, rows, cellM: last };
}

export default function BodegaMapScreen({ route, navigation }) {
  const { bodegas, saveBodega } = useApp();
  const bodegaId = route?.params?.bodegaId ?? null;
  const bodegaFromParams = route?.params?.bodega ?? null;

  const bodega = useMemo(
    () => bodegas.find((b) => b.id === bodegaId) || bodegaFromParams || null,
    [bodegas, bodegaId, bodegaFromParams]
  );

  const anchoM = Number(bodega?.ancho ?? 0) || 0;
  const largoM = Number(bodega?.largo ?? 0) || 0;

  const existingLayout = bodega?.layout ?? null;
  const hasExistingLayout = !!(existingLayout?.ancho && existingLayout?.largo);

  // Selector
  const [cellMetersChoice, setCellMetersChoice] = useState("AUTO");

  // ✅ “Switching” para no mostrar pantalla congelada al cambiar resolución
  const [switching, setSwitching] = useState(false);

  // ✅ NUEVO: texto para el overlay
  const [pendingChoice, setPendingChoice] = useState(null);

  // ✅ NUEVO: token para ignorar callbacks viejos (si tocas chips rápido)
  const switchTokenRef = useRef(0);

  // ✅ NUEVO: señal/version actual para Tablero (onReady token)
  const [readySignal, setReadySignal] = useState(0);

  // ✅ inicial dims
  const [gridDims, setGridDims] = useState(() => {
    if (hasExistingLayout) {
      return {
        cols: Number(existingLayout.ancho) || 1,
        rows: Number(existingLayout.largo) || 1,
        cellM: Math.max(
          (anchoM || 1) / (Number(existingLayout.ancho) || 1),
          (largoM || 1) / (Number(existingLayout.largo) || 1)
        ),
      };
    }
    return computeGridAuto({ anchoM: anchoM || 1, largoM: largoM || 1 });
  });

  // Mapa inicial de BD
  const mapaInicialBase = useMemo(() => {
    const raw =
      bodega?.layout?.mapa_json ||
      bodega?.layout_mapa_json ||
      bodega?.mapa_json ||
      {};
    return parseMap(raw);
  }, [bodegaId, bodega?.layout, bodega?.layout_mapa_json, bodega?.mapa_json]);

  // ✅ mapa editable en ref (evita lags)
  const gridMapRef = useRef(mapaInicialBase);

  // mapa “inicial” que recibe Tablero (para reset al cambiar resolución)
  const [mapaInicialTablero, setMapaInicialTablero] = useState(mapaInicialBase);

  // Task cancellable (si apretas chips rápido, cancela el anterior)
  const taskRef = useRef(null);

  const onGridMapChange = useCallback((m) => {
    gridMapRef.current = m || {};
  }, []);

  // ✅ NUEVO: Tablero avisa cuando ya renderizó con la resolución actual
  const onBoardReady = useCallback((token) => {
    if (token != null && token !== switchTokenRef.current) return; // ignora "ready" viejo
    setSwitching(false);
  }, []);

  // cuando cambias bodega: reset
  useEffect(() => {
    gridMapRef.current = mapaInicialBase || {};
    setMapaInicialTablero(mapaInicialBase || {});
    setSwitching(false);

    // ✅ invalida callbacks anteriores y sincroniza readySignal
    switchTokenRef.current += 1;
    setReadySignal(switchTokenRef.current);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bodegaId]);

  const applyResolution = useCallback(
    (opt) => {
      if (!bodega) return;
      if (hasExistingLayout) return;

      // cancela tarea anterior si existe
      try {
        taskRef.current?.cancel?.();
      } catch {}
      taskRef.current = null;

      setCellMetersChoice(opt);
      setPendingChoice(opt);

      const anchoSafe = anchoM > 0 ? anchoM : 1;
      const largoSafe = largoM > 0 ? largoM : 1;

      let next = null;

      if (opt === "AUTO") {
        next = computeGridAuto({ anchoM: anchoSafe, largoM: largoSafe });
      } else {
        const { cols, rows, cellM } = computeGridFromMeters({
          anchoM: anchoSafe,
          largoM: largoSafe,
          desiredCellM: opt,
        });

        if (cols * rows > MAX_CELLS) {
          const auto = computeGridAuto({ anchoM: anchoSafe, largoM: largoSafe });
          Alert.alert(
            "Bodega muy grande",
            `Con ${opt}m/celda se generan ${cols * rows} celdas.\n` +
              `Se ajustó automáticamente a ${auto.cellM}m/celda (${auto.cols}×${auto.rows}).`
          );
          setCellMetersChoice("AUTO");
          setPendingChoice("AUTO");
          next = auto;
        } else {
          next = { cols, rows, cellM };
        }
      }

      // ✅ reset mapa ya (sin estado pesado)
      gridMapRef.current = {};
      setMapaInicialTablero({});

      // ✅ overlay inmediato
      setSwitching(true);

      // ✅ nuevo token de este cambio
      const token = (switchTokenRef.current += 1);
      setReadySignal(token);

      // ✅ deja pintar overlay antes del trabajo pesado
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          taskRef.current = InteractionManager.runAfterInteractions(() => {
            // si el usuario tocó otra opción, ignoramos esta
            if (switchTokenRef.current !== token) return;

            setGridDims(next);
            // ❗ NO apagamos switching aquí; lo apaga Tablero con onReady(token)
          });
        });
      });
    },
    [bodega, hasExistingLayout, anchoM, largoM]
  );

  useEffect(() => {
    return () => {
      try {
        taskRef.current?.cancel?.();
      } catch {}
    };
  }, []);

  const anchoTablero = gridDims.cols;
  const largoTablero = gridDims.rows;
  const totalCells = anchoTablero * largoTablero;

  const goBack = () => navigation?.goBack?.();

  const handleGuardarMapa = async () => {
    if (!bodega) return Alert.alert("Error", "Bodega no encontrada");
    if (!anchoTablero || !largoTablero) {
      return Alert.alert("Validación", "No hay resolución válida para mapear.");
    }

    try {
      await saveBodega({
        ...bodega,
        layout: {
          ancho: anchoTablero,
          largo: largoTablero,
          mapa_json: gridMapRef.current || {},
        },
      });

      Alert.alert("OK", "Mapa guardado.", [{ text: "Volver", onPress: goBack }]);
    } catch (e) {
      Alert.alert("Error", e?.message || "No se pudo guardar el mapa");
    }
  };

  if (!bodega) {
    return (
      <View style={st.screen}>
        <Text style={st.title}>Paso 2: Mapear bodega</Text>
        <Text style={st.sub}>No se encontró la bodega.</Text>
        <TouchableOpacity style={st.btn} onPress={goBack}>
          <Text style={st.btnText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={st.screen}>
      <Text style={st.title}>Paso 2: Mapear bodega</Text>
      <Text style={st.sub}>Bodega: {bodega.nombre}</Text>

      <View style={{ marginTop: 10 }}>
        <Text style={st.label}>Resolución del mapa</Text>

        {hasExistingLayout ? (
          <Text style={st.help}>
            Esta bodega ya tiene layout guardado: {anchoTablero}×{largoTablero} (celda ~{" "}
            {gridDims.cellM?.toFixed?.(2) ?? "?"}m). Para cambiarlo habría que reiniciar el mapa.
          </Text>
        ) : (
          <>
            <Text style={st.help}>
              Elige “m/celda” para controlar cuántas celdas se dibujan (evita que se cuelgue).
            </Text>

            <View style={st.chipsRow}>
              {CELL_METERS_OPTIONS.map((opt) => {
                const key = String(opt);
                const selected = cellMetersChoice === opt;
                const label = opt === "AUTO" ? "Auto" : `${opt}m/celda`;

                return (
                  <TouchableOpacity
                    key={key}
                    style={[st.chip, selected && st.chipSelected]}
                    onPress={() => applyResolution(opt)}
                    disabled={switching}
                  >
                    <Text style={[st.chipText, selected && st.chipTextSelected]}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={st.help}>
              Resultado: {anchoTablero}×{largoTablero} = {totalCells.toLocaleString()} celdas
              {"\n"}Cada celda representa aprox. {gridDims.cellM}m × {gridDims.cellM}m
            </Text>
          </>
        )}
      </View>

      {/* ✅ CAMBIO: Tablero siempre montado + overlay encima */}
      <View style={{ marginTop: 12, position: "relative" }}>
        <View style={{ flex: 1 }} pointerEvents={switching ? "none" : "auto"}>
          <Tablero
            ancho={anchoTablero}
            largo={largoTablero}
            mapaInicial={mapaInicialTablero}
            onGridMapChange={onGridMapChange}
            onReady={onBoardReady}
            readySignal={readySignal}
          />
        </View>

        {switching && (
          <View style={st.rebuildOverlay} pointerEvents="auto">
            <View style={st.loadingBox}>
              <ActivityIndicator />
              <Text style={st.loadingTxt}>
                Cambiando resolución{pendingChoice ? ` (${String(pendingChoice)})` : ""}...
              </Text>
            </View>
          </View>
        )}
      </View>

      <View style={st.bottomBar}>
        <TouchableOpacity style={[st.bottomBtn, st.btnSec]} onPress={goBack} disabled={switching}>
          <Text style={[st.bottomBtnText, st.txtSec]}>Volver</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[st.bottomBtn, st.btnPri]} onPress={handleGuardarMapa} disabled={switching}>
          <Text style={st.bottomBtnText}>Guardar mapa</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f3f4f6", paddingHorizontal: 16, paddingTop: 18 },
  title: { fontSize: 20, fontWeight: "800", color: "#111827" },
  sub: { marginTop: 4, fontSize: 12, color: "#6b7280" },

  label: { fontSize: 12, fontWeight: "700", color: "#374151", marginBottom: 4 },
  help: { fontSize: 11, color: "#6b7280", marginBottom: 8 },

  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#d4d4d8",
    backgroundColor: "#fff",
  },
  chipSelected: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
  chipText: { fontSize: 11, color: "#374151", fontWeight: "600" },
  chipTextSelected: { color: "#fff" },

  loadingBox: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  loadingTxt: { fontSize: 12, color: "#6b7280", fontWeight: "700" },

  rebuildOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.18)",
  },

  btn: { marginTop: 12, padding: 12, borderRadius: 999, backgroundColor: "#2563eb", alignItems: "center" },
  btnText: { color: "#fff", fontWeight: "800" },

  bottomBar: { position: "absolute", left: 16, right: 16, bottom: 30, flexDirection: "row", gap: 10 },
  bottomBtn: { flex: 1, paddingVertical: 12, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  btnPri: { backgroundColor: "#2563eb" },
  btnSec: { backgroundColor: "#e5e7eb" },
  bottomBtnText: { color: "#fff", fontWeight: "800" },
  txtSec: { color: "#111827" },
});
