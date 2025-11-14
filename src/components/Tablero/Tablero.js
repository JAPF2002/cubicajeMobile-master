// src/components/Tablero/Tablero.js
import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

const MODOS = {
  D: { label: "Disponible", color: "#dcfce7", borderColor: "#16a34a" },
  O: { label: "Ocupada", color: "#fee2e2", borderColor: "#dc2626" },
  B: { label: "Bloqueada", color: "#e5e7eb", borderColor: "#6b7280" },
  A: { label: "Altura libre", color: "#e0f2fe", borderColor: "#0284c7" },
};

export default function Tablero({
  ancho = 0,
  largo = 0,
  mapaInicial = {},
  onGridMapChange,
}) {
  const [gridMap, setGridMap] = useState({});
  const [modoActual, setModoActual] = useState("D");

  // Cuando cambie el mapaInicial o las dimensiones, lo cargamos
  useEffect(() => {
    if (!mapaInicial || typeof mapaInicial !== "object") {
      setGridMap({});
      return;
    }
    setGridMap(mapaInicial);
  }, [mapaInicial, ancho, largo]);

  const totalCeldas = Math.max(0, ancho) * Math.max(0, largo);

  const handleCellPress = (index) => {
    if (!totalCeldas) return;

    setGridMap((prev) => {
      const nuevo = { ...prev, [index]: modoActual };
      if (onGridMapChange) {
        onGridMapChange(nuevo);
      }
      return nuevo;
    });
  };

  const renderCell = (index) => {
    const value = gridMap[index] || "D";
    const config = MODOS[value] || MODOS.D;

    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.cell,
          {
            backgroundColor: config.color,
            borderColor: config.borderColor,
          },
        ]}
        onPress={() => handleCellPress(index)}
        activeOpacity={0.7}
      >
        <Text style={styles.cellText}>{value}</Text>
      </TouchableOpacity>
    );
  };

  if (!ancho || !largo) {
    return (
      <View style={styles.emptyBox}>
        <Text style={styles.emptyText}>
          Ingresa ancho y largo para ver el mapa.
        </Text>
      </View>
    );
  }

  const filas = [];
  for (let fila = 0; fila < largo; fila++) {
    const rowCells = [];
    for (let col = 0; col < ancho; col++) {
      const index = fila * ancho + col;
      rowCells.push(renderCell(index));
    }
    filas.push(
      <View key={fila} style={styles.row}>
        {rowCells}
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      {/* Selector de modo */}
      <View style={styles.modesRow}>
        {Object.entries(MODOS).map(([key, cfg]) => {
          const selected = modoActual === key;
          return (
            <TouchableOpacity
              key={key}
              style={[
                styles.modeChip,
                selected && styles.modeChipSelected,
              ]}
              onPress={() => setModoActual(key)}
            >
              <Text
                style={[
                  styles.modeChipText,
                  selected && styles.modeChipTextSelected,
                ]}
              >
                {cfg.label} ({key})
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.modeHelp}>
        Modo actual: {MODOS[modoActual].label}. Toca una celda para marcarla
        con esta letra.
      </Text>

      {/* Grilla */}
      <View style={styles.board}>{filas}</View>

      {/* Leyenda */}
      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Leyenda</Text>
        <Text style={styles.legendText}>D = disponible</Text>
        <Text style={styles.legendText}>O = ocupada</Text>
        <Text style={styles.legendText}>B = bloqueada / pasillo</Text>
        <Text style={styles.legendText}>A = hay espacio en altura</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 8,
    padding: 10,
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  modesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    justifyContent: "flex-start",
    marginBottom: 6,
  },
  modeChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#d4d4d8",
    backgroundColor: "#f3f4f6",
    marginRight: 6,
    marginBottom: 6,
  },
  modeChipSelected: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
  },
  modeChipText: {
    fontSize: 11,
    color: "#111827",
  },
  modeChipTextSelected: {
    color: "#ffffff",
    fontWeight: "600",
  },
  modeHelp: {
    fontSize: 11,
    color: "#6b7280",
    marginBottom: 6,
  },
  board: {
    width: "100%",        // 🔹 ocupa todo el ancho del contenedor
    alignSelf: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  row: {
    flexDirection: "row",
  },
  cell: {
    flex: 1,
    aspectRatio: 1,       // 🔹 cuadradas, grandes
    borderWidth: 0.5,
    alignItems: "center",
    justifyContent: "center",
  },
  cellText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  emptyBox: {
    marginTop: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
  },
  emptyText: {
    fontSize: 11,
    color: "#6b7280",
    textAlign: "center",
  },
  legend: {
    marginTop: 8,
  },
  legendTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
  },
  legendText: {
    fontSize: 11,
    color: "#6b7280",
  },
});
