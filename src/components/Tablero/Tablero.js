/*C:\Users\japf2\Desktop\Tesis Cubicaje\Proyecto\proyectoPrincipal\cubicajeMobile-master\src\components\Tablero\Tablero.js*/
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  TouchableOpacity,
  StyleSheet,
  VirtualizedList,
  useWindowDimensions,
  PanResponder,
} from "react-native";

const MODOS = {
  D: { label: "Disponible", bg: "#dcfce7", br: "#16a34a" },
  B: { label: "Bloqueada", bg: "#e5e7eb", br: "#6b7280" },
};

const Cell = React.memo(
  function Cell({ size, isBlocked, onTap, onLongStart, index, suppressTapRef }) {
    const cfg = isBlocked ? MODOS.B : MODOS.D;

    return (
      <Pressable
        onPress={() => {
          if (suppressTapRef.current) {
            suppressTapRef.current = false;
            return;
          }
          onTap(index);
        }}
        onLongPress={() => {
          suppressTapRef.current = true;
          onLongStart(index);
        }}
        delayLongPress={140}
        style={[
          styles.cell,
          {
            width: size,
            height: size,
            backgroundColor: cfg.bg,
            borderColor: cfg.br,
          },
        ]}
      />
    );
  },
  (p, n) => p.size === n.size && p.isBlocked === n.isBlocked
);

const Row = React.memo(
  function Row({
    rowIndex,
    cols,
    cellSize,
    blockedRef,
    onTap,
    onLongStart,
    dirtyTick,
    suppressTapRef,
  }) {
    const cells = useMemo(() => {
      const start = rowIndex * cols;
      const arr = new Array(cols);

      for (let c = 0; c < cols; c++) {
        const idx = start + c;
        const blocked = blockedRef.current.has(idx);

        arr[c] = (
          <Cell
            key={idx}
            size={cellSize}
            isBlocked={blocked}
            onTap={onTap}
            onLongStart={onLongStart}
            index={idx}
            suppressTapRef={suppressTapRef}
          />
        );
      }
      return arr;
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rowIndex, cols, cellSize, dirtyTick]);

    return <View style={styles.row}>{cells}</View>;
  },
  (p, n) =>
    p.rowIndex === n.rowIndex &&
    p.cols === n.cols &&
    p.cellSize === n.cellSize &&
    p.dirtyTick === n.dirtyTick
);

function parseMap(raw) {
  if (!raw) return {};
  try {
    if (typeof raw === "string") return JSON.parse(raw);
    if (typeof raw === "object") return raw;
  } catch {}
  return {};
}

export default function Tablero({
  ancho = 0,
  largo = 0,
  mapaInicial = null,
  onGridMapChange,
  onReady,
  readySignal,
}) {
  const { width: screenW, height: screenH } = useWindowDimensions();

  const cols = Math.max(0, Number(ancho) || 0);
  const rows = Math.max(0, Number(largo) || 0);
  const total = cols > 0 && rows > 0 ? cols * rows : 0;

  // ✅ sparse state
  const blockedRef = useRef(new Set());
  const mapObjRef = useRef({});

  const [modo, setModo] = useState("B");
  const modoRef = useRef("B");
  useEffect(() => {
    modoRef.current = modo;
  }, [modo]);

  const [boardW, setBoardW] = useState(Math.max(0, Math.floor(screenW - 40)));
  const boardHeight = useMemo(
    () => Math.max(260, Math.min(560, Math.floor(screenH * 0.55))),
    [screenH]
  );

  // ✅ SIN ZOOM: tamaño para que quepan columnas en pantalla
  const cellSize = useMemo(() => {
    if (!boardW || !cols) return 12;
    return Math.max(8, Math.min(48, Math.floor(boardW / cols)));
  }, [boardW, cols]);

  // ✅ render: solo refrescamos filas tocadas
  const [dirtyRows, setDirtyRows] = useState({});
  const rafRef = useRef(null);
  const pendingRowsRef = useRef(new Map());
  const pendingNeedsSyncRef = useRef(false);

  // caja
  const [boxing, setBoxing] = useState(false);
  const isBoxingRef = useRef(false);
  const boxModeRef = useRef("B");
  const boxStartRef = useRef({ row: 0, col: 0 });
  const boxEndRef = useRef({ row: 0, col: 0 });
  const [boxOverlay, setBoxOverlay] = useState(null);

  const suppressTapRef = useRef(false);

  const boardRef = useRef(null);
  const boardWinRef = useRef({ x: 0, y: 0, w: 0, h: 0 });
  const scrollYRef = useRef(0);

  const measureBoard = useCallback(() => {
    if (!boardRef.current?.measureInWindow) return;
    boardRef.current.measureInWindow((x, y, w, h) => {
      boardWinRef.current = { x, y, w, h };
    });
  }, []);

  const flushFrame = useCallback(() => {
    rafRef.current = null;

    const pending = pendingRowsRef.current;
    if (pending.size > 0) {
      setDirtyRows((prev) => {
        const next = { ...prev };
        for (const [r, inc] of pending.entries()) {
          next[r] = (next[r] || 0) + inc;
        }
        return next;
      });
      pending.clear();
    }

    if (pendingNeedsSyncRef.current) {
      pendingNeedsSyncRef.current = false;
      if (typeof onGridMapChange === "function") onGridMapChange(mapObjRef.current);
    }
  }, [onGridMapChange]);

  const scheduleFlush = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(flushFrame);
  }, [flushFrame]);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // ✅ init mapa (solo bloqueadas)
  useEffect(() => {
    blockedRef.current = new Set();
    mapObjRef.current = {};
    setDirtyRows({});
    setBoxOverlay(null);
    setBoxing(false);
    isBoxingRef.current = false;

    if (total > 0) {
      const m = parseMap(mapaInicial);
      for (const k in m) {
        if (!Object.prototype.hasOwnProperty.call(m, k)) continue;
        const idx = Number(k);
        if (!Number.isInteger(idx) || idx < 0 || idx >= total) continue;
        if (m[k] === "B") {
          blockedRef.current.add(idx);
          mapObjRef.current[idx] = "B";
        }
      }
    }

    if (typeof onGridMapChange === "function") onGridMapChange(mapObjRef.current);

    requestAnimationFrame(() => {
      measureBoard();
    });
  }, [total, mapaInicial, onGridMapChange, measureBoard]);

  // ✅ ready (para apagar overlay en BodegaMapScreen)
  useEffect(() => {
    if (typeof onReady !== "function") return;
    if (!total) return;

    let cancelled = false;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (cancelled) return;
        onReady(readySignal);
      });
    });

    return () => {
      cancelled = true;
    };
  }, [total, cellSize, readySignal, onReady]);

  const getCellFromScreenXY = useCallback(
    (x, y) => {
      const b = boardWinRef.current;
      const localX = x - b.x;
      const localY = y - b.y + (scrollYRef.current || 0);
      if (localX < 0 || localY < 0) return null;

      const col = Math.floor(localX / cellSize);
      const row = Math.floor(localY / cellSize);
      if (col < 0 || row < 0 || col >= cols || row >= rows) return null;

      return { row, col, idx: row * cols + col };
    },
    [cellSize, cols, rows]
  );

  const onTapCell = useCallback(
    (index) => {
      if (!total) return;
      if (isBoxingRef.current) return;

      const mode = modoRef.current;
      const isBlocked = blockedRef.current.has(index);

      if (mode === "B") {
        if (isBlocked) {
          blockedRef.current.delete(index);
          delete mapObjRef.current[index];
        } else {
          blockedRef.current.add(index);
          mapObjRef.current[index] = "B";
        }
      } else {
        if (isBlocked) {
          blockedRef.current.delete(index);
          delete mapObjRef.current[index];
        }
      }

      const r = Math.floor(index / cols);
      pendingRowsRef.current.set(r, (pendingRowsRef.current.get(r) || 0) + 1);
      pendingNeedsSyncRef.current = true;
      scheduleFlush();
    },
    [cols, total, scheduleFlush]
  );

  const updateBoxOverlay = useCallback(() => {
    const r1 = boxStartRef.current.row;
    const c1 = boxStartRef.current.col;
    const r2 = boxEndRef.current.row;
    const c2 = boxEndRef.current.col;

    const rowMin = Math.min(r1, r2);
    const rowMax = Math.max(r1, r2);
    const colMin = Math.min(c1, c2);
    const colMax = Math.max(c1, c2);

    const left = colMin * cellSize;
    const top = rowMin * cellSize - (scrollYRef.current || 0);
    const width = (colMax - colMin + 1) * cellSize;
    const height = (rowMax - rowMin + 1) * cellSize;

    setBoxOverlay({ left, top, width, height });
  }, [cellSize]);

  const onLongStart = useCallback(
    (index) => {
      if (!total) return;

      boxModeRef.current = modoRef.current;
      isBoxingRef.current = true;
      setBoxing(true);

      const row = Math.floor(index / cols);
      const col = index % cols;

      boxStartRef.current = { row, col };
      boxEndRef.current = { row, col };

      requestAnimationFrame(() => {
        measureBoard();
        updateBoxOverlay();
      });
    },
    [cols, total, measureBoard, updateBoxOverlay]
  );

  const moveBoxAt = useCallback(
    (x, y) => {
      if (!isBoxingRef.current) return;
      const cell = getCellFromScreenXY(x, y);
      if (!cell) return;

      const prev = boxEndRef.current;
      if (prev.row === cell.row && prev.col === cell.col) return;

      boxEndRef.current = { row: cell.row, col: cell.col };
      updateBoxOverlay();
    },
    [getCellFromScreenXY, updateBoxOverlay]
  );

  const applyBox = useCallback(() => {
    const r1 = boxStartRef.current.row;
    const c1 = boxStartRef.current.col;
    const r2 = boxEndRef.current.row;
    const c2 = boxEndRef.current.col;

    const rowMin = Math.min(r1, r2);
    const rowMax = Math.max(r1, r2);
    const colMin = Math.min(c1, c2);
    const colMax = Math.max(c1, c2);

    const modeToApply = boxModeRef.current;

    for (let r = rowMin; r <= rowMax; r++) {
      const start = r * cols + colMin;
      const end = r * cols + colMax;

      if (modeToApply === "B") {
        for (let idx = start; idx <= end; idx++) {
          if (!blockedRef.current.has(idx)) {
            blockedRef.current.add(idx);
            mapObjRef.current[idx] = "B";
          }
        }
      } else {
        for (let idx = start; idx <= end; idx++) {
          if (blockedRef.current.has(idx)) {
            blockedRef.current.delete(idx);
            delete mapObjRef.current[idx];
          }
        }
      }

      pendingRowsRef.current.set(r, (pendingRowsRef.current.get(r) || 0) + 1);
    }

    pendingNeedsSyncRef.current = true;
    scheduleFlush();
  }, [cols, scheduleFlush]);

  const stopBox = useCallback(() => {
    if (!isBoxingRef.current) return;
    applyBox();
    isBoxingRef.current = false;
    setBoxing(false);
    setBoxOverlay(null);
  }, [applyBox]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => isBoxingRef.current,
        onMoveShouldSetPanResponder: () => isBoxingRef.current,
        onPanResponderMove: (_, g) => moveBoxAt(g.moveX, g.moveY),
        onPanResponderRelease: stopBox,
        onPanResponderTerminate: stopBox,
      }),
    [moveBoxAt, stopBox]
  );

  const getItemCount = useCallback(() => rows, [rows]);
  const getItem = useCallback((_, index) => index, []);

  const initialRows = useMemo(() => {
    const need = Math.ceil(boardHeight / cellSize) + 2;
    return Math.min(rows, Math.max(8, need));
  }, [rows, boardHeight, cellSize]);

  const maxBatch = useMemo(
    () => Math.min(12, Math.max(4, Math.floor(initialRows / 2))),
    [initialRows]
  );

  const renderRow = useCallback(
    ({ item: r }) => (
      <Row
        rowIndex={r}
        cols={cols}
        cellSize={cellSize}
        blockedRef={blockedRef}
        onTap={onTapCell}
        onLongStart={onLongStart}
        dirtyTick={dirtyRows[r] || 0}
        suppressTapRef={suppressTapRef}
      />
    ),
    [cols, cellSize, onTapCell, onLongStart, dirtyRows]
  );

  if (!cols || !rows) {
    return (
      <View style={styles.emptyBox}>
        <Text style={styles.emptyText}>Ingresa una resolución válida para ver el mapa.</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      {/* ✅ BOTONES MODO (ahora sí con texto visible) */}
      <View style={styles.modesRow}>
        {Object.entries(MODOS).map(([key, cfg], i, arr) => {
          const selected = modo === key;
          const isLast = i === arr.length - 1;

          return (
            <TouchableOpacity
              key={key}
              onPress={() => setModo(key)}
              style={[
                styles.modeChip,
                selected && styles.modeChipSelected,
                !isLast && styles.modeChipGap, // ✅ evita usar gap
              ]}
              activeOpacity={0.85}
            >
              <Text
                style={[styles.modeChipText, selected && styles.modeChipTextSelected]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {cfg.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.modeHelp}>
        Mantén presionado y arrastra (caja). Suelta para aplicar:{" "}
        <Text style={{ fontWeight: "900" }}>{MODOS[modo].label}</Text>
      </Text>

      <View
        ref={boardRef}
        style={[styles.board, { height: boardHeight }]}
        onLayout={(e) => {
          setBoardW(e.nativeEvent.layout.width);
          requestAnimationFrame(() => measureBoard());
        }}
        {...panResponder.panHandlers}
      >
        {boxOverlay ? (
          <View
            pointerEvents="none"
            style={[
              styles.boxOverlay,
              { left: boxOverlay.left, top: boxOverlay.top, width: boxOverlay.width, height: boxOverlay.height },
            ]}
          />
        ) : null}

        <VirtualizedList
          style={{ flex: 1 }}
          data={null}
          getItemCount={getItemCount}
          getItem={getItem}
          key={`rows-${cols}x${rows}-${cellSize}`}
          keyExtractor={(r) => String(r)}
          renderItem={renderRow}
          scrollEnabled={!boxing}
          onScroll={(e) => (scrollYRef.current = e.nativeEvent.contentOffset.y)}
          scrollEventThrottle={16}
          initialNumToRender={initialRows}
          maxToRenderPerBatch={maxBatch}
          updateCellsBatchingPeriod={8}
          windowSize={5}
          getItemLayout={(_, index) => ({ length: cellSize, offset: cellSize * index, index })}
          removeClippedSubviews={false}
          nestedScrollEnabled
          showsVerticalScrollIndicator
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 10,
    padding: 12,
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  // ✅ SIN gap: Android a veces da problemas con gap
  modesRow: { flexDirection: "row", marginBottom: 20 }, // ✅ más aire
  modeChipGap: { marginRight: 8 },

  // ✅ Más alto + centrado: asegura que el texto se vea
  modeChip: {
    flex: 1,
    minHeight: 36,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#d4d4d8",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  modeChipSelected: { backgroundColor: "#2563eb", borderColor: "#2563eb" },

  // ✅ Text bien visible en Android
  modeChipText: {
    fontSize: 13,
    color: "#111827",
    fontWeight: "800",
    textAlign: "center",
    includeFontPadding: false,
  },
  modeChipTextSelected: { color: "#fff" },

  modeHelp: { fontSize: 11, color: "#6b7280", marginBottom: 20 }, // ✅ más aire

  board: {
    position: "relative",
    width: "100%",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    overflow: "hidden",
  },
  boxOverlay: {
    position: "absolute",
    borderWidth: 2,
    borderColor: "#2563eb",
    backgroundColor: "rgba(37, 99, 235, 0.10)",
    zIndex: 10,
  },

  row: { flexDirection: "row" },
  cell: { borderWidth: 0.5 },

  emptyBox: {
    marginTop: 10,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
  },
  emptyText: { fontSize: 11, color: "#6b7280", textAlign: "center" },
});
