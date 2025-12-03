// C:\Users\japf2\Desktop\Tesis Cubicaje\Proyecto\proyectoPrincipal\cubicajeMobile-master\src\store\helpers.js

// Volumen en m³ (acepta string o número)
export function vol(ancho, alto, largo) {
  const a = parseFloat(String(ancho || "").replace(",", "."));
  const h = parseFloat(String(alto || "").replace(",", "."));
  const l = parseFloat(String(largo || "").replace(",", "."));

  if (!Number.isFinite(a) || !Number.isFinite(h) || !Number.isFinite(l)) {
    return NaN;
  }
  const v = a * h * l;
  return Number.isFinite(v) ? v : NaN;
}

// Convierte a entero >= min (por defecto 0)
export function clampInt(value, min = 0) {
  const n = parseInt(String(value || "").replace(/[^0-9-]/g, ""), 10);
  if (!Number.isFinite(n)) return min;
  return n < min ? min : n;
}

// Clasificación simple por peso (en kg)
export function pesoAClase(peso) {
  const p = parseFloat(String(peso || "").replace(",", "."));
  if (!Number.isFinite(p) || p <= 0) return "N/D";

  if (p <= 10) return "LIVIANO";
  if (p <= 30) return "MEDIO";
  return "PESADO";
}

// Lista de clases disponibles para los filtros de ItemsListScreen
export const SIZE_CLASSES = [
  { key: "LIVIANO", label: "Liviano (≤ 10 kg)" },
  { key: "MEDIO", label: "Medio (10–30 kg)" },
  { key: "PESADO", label: "Pesado (> 30 kg)" },
];
