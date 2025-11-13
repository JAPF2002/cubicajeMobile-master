import { useState, useEffect, useMemo } from "react";

const ESTADOS_CELDA = {
  DISPONIBLE: "D",
  OCUPADO: "O",
  BLOQUEADO: "B",
};

export function useGridMap({ largo, ancho, mapaInicial = null }) {
  const [modoActual, setModoActual] = useState(ESTADOS_CELDA.DISPONIBLE);
  const [gridMap, setGridMap] = useState({});

  useEffect(() => {
    if (mapaInicial && Object.keys(mapaInicial).length > 0) {
      setGridMap(mapaInicial);
    } else if (largo > 0 && ancho > 0) {
      const newGridMap = {};
      const totalCeldas = largo * ancho;
      for (let i = 0; i < totalCeldas; i++) {
        newGridMap[i] = ESTADOS_CELDA.DISPONIBLE;
      }
      setGridMap(newGridMap);
    } else {
      setGridMap({});
    }
  }, [largo, ancho, mapaInicial]);

  const handleCellClick = (index) => {
    setGridMap((prevGridMap) => {
      const currentCellState = prevGridMap[index] || ESTADOS_CELDA.DISPONIBLE;
      const newState =
        currentCellState === modoActual ? ESTADOS_CELDA.DISPONIBLE : modoActual;

      return {
        ...prevGridMap,
        [index]: newState,
      };
    });
    console.log(gridMap)
  };

  const estadosContados = useMemo(() => {
    const counts = {
      [ESTADOS_CELDA.DISPONIBLE]: 0,
      [ESTADOS_CELDA.OCUPADO]: 0,
      [ESTADOS_CELDA.BLOQUEADO]: 0,
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
