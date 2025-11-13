// src/components/Tablero/Tablero.js

import React, { useEffect } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { useGridMap } from "./useGridMap";

function Tablero(props) {
  console.log(props)
  const {
    gridMap,
    modoActual,
    setModoActual,
    handleCellClick,
    estadosContados,
    ESTADOS_CELDA,
  } = useGridMap(props);

  const { largo, ancho, onGridMapChange } = props;

  useEffect(() => {
    if (typeof onGridMapChange === "function") {
      onGridMapChange(gridMap);
    }
  }, [gridMap, onGridMapChange]);

  if (!largo || !ancho || largo <= 0 || ancho <= 0) {
    return (
      <View style={styles.gridErrorMessage}>
        <Text>El "Largo" y "Ancho" deben ser mayores a cero.</Text>
      </View>
    );
  }

  const totalCeldas = largo * ancho;
  const celdasArray = Array.from({ length: totalCeldas }, (_, index) => index);

  const CELL_STYLE_BY_STATE = {
    [ESTADOS_CELDA.DISPONIBLE]: styles.gridCellDisponible,
    [ESTADOS_CELDA.OCUPADO]: styles.gridCellOcupado,
    [ESTADOS_CELDA.BLOQUEADO]: styles.gridCellBloqueado,
  };

  const BUTTON_STYLE_BY_STATE = {
    [ESTADOS_CELDA.DISPONIBLE]: styles.menuButtonDisponible,
    [ESTADOS_CELDA.OCUPADO]: styles.menuButtonOcupado,
    [ESTADOS_CELDA.BLOQUEADO]: styles.menuButtonBloqueado,
  };

  const renderTextoModo = () => {
    if (modoActual === ESTADOS_CELDA.DISPONIBLE) return "Disponible";
    if (modoActual === ESTADOS_CELDA.OCUPADO) return "Ocupado";
    return "Bloqueado";
  };

  const textoModo = renderTextoModo();

  return (
    <View style={styles.gridComponentWrapper}>
      <Text style={styles.gridTitle}>Panel de Control de la bodega</Text>

      {/* Menú de modos */}
      <View style={styles.gridMenu}>
        {Object.values(ESTADOS_CELDA).map((estado) => (
          <Pressable
            key={estado}
            onPress={() => setModoActual(estado)}
            style={[
              styles.menuButton,
              BUTTON_STYLE_BY_STATE[estado],
              modoActual === estado && styles.menuButtonActive,
            ]}
          >
            <Text style={styles.menuButtonText}>
              {estado === ESTADOS_CELDA.DISPONIBLE && "Disponible"}
              {estado === ESTADOS_CELDA.OCUPADO && "Ocupado"}
              {estado === ESTADOS_CELDA.BLOQUEADO && "Bloqueado"}
            </Text>
            <Text style={styles.menuButtonCount}>
              ({estadosContados[estado] ?? 0})
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Texto modo actual */}
      <Text style={styles.gridStatusText}>
        Modo actual:{" "}
        <Text
          style={
            modoActual === ESTADOS_CELDA.DISPONIBLE
              ? styles.textDisponible
              : modoActual === ESTADOS_CELDA.OCUPADO
              ? styles.textOcupado
              : styles.textBloqueado
          }
        >
          {textoModo}
        </Text>
        . Haz clic en una celda para cambiar su estado.
      </Text>

      {/* Grid */}
      <ScrollView
        style={styles.gridScroll}
        contentContainerStyle={[
          styles.gridContainer,
          { width: "100%" },
        ]}
      >
        {celdasArray.map((index) => {
          const cellState =
            gridMap[index] || ESTADOS_CELDA.DISPONIBLE;
          const estadoStyle = CELL_STYLE_BY_STATE[cellState];

          return (
            <Pressable
              key={index}
              onPress={() => handleCellClick(index)}
              style={[
                styles.gridCell,
                estadoStyle,
                {
                  width: `${100 / ancho}%`, // divide el ancho en "ancho" columnas
                },
              ]}
            >
              <Text style={styles.gridCellText}>{cellState}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  // Contenedor principal
  gridComponentWrapper: {
    padding: 16,
  },
  gridTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
  },

  // Menú
  gridMenu: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  menuButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 6,
    backgroundColor: "#6b7280",
  },
  menuButtonText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 12,
  },
  menuButtonCount: {
    marginLeft: 8,
    fontSize: 14,
    color: "#ffffff",
    opacity: 0.9,
    fontWeight: "500",
  },
  menuButtonDisponible: {
    backgroundColor: "#10b981",
  },
  menuButtonOcupado: {
    backgroundColor: "#ef4444",
  },
  menuButtonBloqueado: {
    backgroundColor: "#6b7280",
  },
  menuButtonActive: {
    borderWidth: 2,
    borderColor: "#818cf8",
  },

  // Texto estado
  gridStatusText: {
    marginBottom: 16,
    color: "#374151",
    fontSize: 14,
  },
  textDisponible: {
    color: "#059669",
    fontWeight: "600",
  },
  textOcupado: {
    color: "#dc2626",
    fontWeight: "600",
  },
  textBloqueado: {
    color: "#4b5563",
    fontWeight: "600",
  },

  // Grid
  gridScroll: {
    maxHeight: "70%",
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    borderWidth: 1,
    borderColor: "#ccc",
  },
  gridCell: {
    aspectRatio: 1,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
  },
  gridCellText: {
    fontWeight: "700",
    fontSize: 14,
  },

  // Colores de celdas
  gridCellDisponible: {
    backgroundColor: "#d1fae5",
    borderColor: "#10b981",
  },
  gridCellOcupado: {
    backgroundColor: "#fee2e2",
    borderColor: "#ef4444",
  },
  gridCellBloqueado: {
    backgroundColor: "#e5e7eb",
    borderColor: "#6b7280",
  },

  // Error
  gridErrorMessage: {
    marginTop: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#fcd34d",
    borderRadius: 6,
    backgroundColor: "#fefce8",
    alignItems: "center",
  },
});

export default Tablero;
