// src/components/Tablero/useGridMap.js
import { useEffect, useMemo, useState } from "react";

export const ESTADOS_CELDA = {
  DISPONIBLE: "D",
  OCUPADO: "O",
  BLOQUEADO: "B",
  CON_ESPACIO_SUPERIOR: "A", // 👈 NUEVO ESTADO
};

export default function useGridMap({
  ancho = 0,
  largo = 0,
  mapaInicial = {},
  onGridMapChange,
}) {
  const [gridMap, setGridMap] = useState({});

  const totalCeldas = useMemo(() => {
    const a = Number(ancho) || 0;
    const l = Number(largo) || 0;
    return a > 0 && l > 0 ? a * l : 0;
  }, [ancho, largo]);

  // Inicializar el mapa cuando cambian las dimensiones o el mapaInicial
  useEffect(() => {
    if (totalCeldas <= 0) {
      setGridMap({});
      return;
    }

    // partimos con todo disponible
    const nuevo = {};
    for (let i = 0; i < totalCeldas; i++) {
      nuevo[i] = ESTADOS_CELDA.DISPONIBLE;
    }

    // mezclamos con el mapaInicial (si viene algo desde BD)
    if (mapaInicial && typeof mapaInicial === "object") {
      Object.keys(mapaInicial).forEach((key) => {
        const valor = mapaInicial[key];
        if (Object.values(ESTADOS_CELDA).includes(valor)) {
          nuevo[key] = valor;
        }
      });
    }

    setGridMap(nuevo);
  }, [totalCeldas, mapaInicial]);

  // 🔁 Modo actual: qué letra pintamos al hacer click
  const [modoActual, setModoActual] = useState(ESTADOS_CELDA.DISPONIBLE);

  // Click en celda: pone / quita el estado seleccionado
  const handleCellClick = (index) => {
    setGridMap((prevGridMap) => {
      const currentCellState =
        prevGridMap[index] || ESTADOS_CELDA.DISPONIBLE;

      // Si hago click con el mismo modo => vuelve a "Disponible"
      const newState =
        currentCellState === modoActual
          ? ESTADOS_CELDA.DISPONIBLE
          : modoActual;

      const newGrid = {
        ...prevGridMap,
        [index]: newState,
      };

      if (typeof onGridMapChange === "function") {
        onGridMapChange(newGrid);
      }

      return newGrid;
    });
  };

  // Estadísticas por tipo de estado
  const estadosContados = useMemo(() => {
    const counts = {
      [ESTADOS_CELDA.DISPONIBLE]: 0,
      [ESTADOS_CELDA.OCUPADO]: 0,
      [ESTADOS_CELDA.BLOQUEADO]: 0,
      [ESTADOS_CELDA.CON_ESPACIO_SUPERIOR]: 0, // 👈 NUEVO CONTADOR
    };
    Object.values(gridMap).forEach((state) => {
      if (counts.hasOwnProperty(state)) {
        counts[state]++;
      }
    });
    return counts;
  }, [gridMap]);

  return {
    gridMap,
    modoActual,
    setModoActual,
    handleCellClick,
    estadosContados,
    ESTADOS_CELDA,
  };
}
