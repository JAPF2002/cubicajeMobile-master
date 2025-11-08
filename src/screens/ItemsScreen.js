// src/screens/ItemsScreen.js
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
} from "react-native";
import {
  useApp,
  vol,
  clampInt,
  itemVolTotal,
  pesoAClase,
  SIZE_CLASSES,
} from "../store";

/**
 * Mapa de productos por categoría.
 * Las keys DEBEN coincidir con "nombre" en tabla `categorias`.
 */
const PRODUCTOS_POR_CATEGORIA = {
  "Cintas Transportadoras": [
    "De PVC blanca (FDA) para transporte de productos alimenticios",
    "De PVC verde para transporte de hortalizas, frutas, cajas, etc.",
    "De cubiertas corrugadas para transporte en inclinación",
    "De caucho para transporte pesado (2, 3 y 4 telas)",
    "De caucho cubierta corrugada para transporte inclinado",
    "Tipo UM 5/1 – 09 Poliuretano blanco FDA",
    "Tipo UM 8/1 – 16 Poliuretano blanco FDA",
    "Tipo VM 10/2 – 16 PVC Tela Tela blanco FDA",
    "Tipo VM 10/1 – 16 PVC blanco diamantado FDA",
    "Tipo VM 9/2 – 20 PVC blanco diamantado FDA",
    "Tipo VM 10/2 – 30 PVC blanco diamantado FDA",
    "Tipo VM 10/2 – 25 PVC verde",
    "Tipo VM 10/2 – 30 PVC verde diamantado",
    "Tipo VM 10/2 – 42 PVC verde corrugada",
    "Multi 350 PVC negro",
  ],
  "Cintas de Transmisión": [
    "Correas trapeciales clásicas (Z, A, B, C, D, E)",
    "Correas trapeciales estrechas (3V, 5V, 8V)",
    "Correas trapeciales de flancos abiertos dentadas (3VX, 5VX, ZX, AX, BX, Cx, XPZ, XPA, XPB)",
    "Correas sincrónicas o de tiempo",
    "Correas síncronas de poliuretano (T5, T10, T20, AT5, AT10, AT20)",
    "Correas de variador de velocidad",
    "Correas Poly V",
    "Correas PJ",
    "Correas PK",
    "Correas PL perforadas",
    "Correas eslabonadas",
    "Correas redondas de poliuretano",
    "Correas de transmisión plana Balata",
  ],
  "Mallas Metálicas Inoxidables": [
    "Mallas metálicas acero inoxidable 304",
    "Mallas metálicas acero inoxidable 316",
    "Mallas metálicas acero 1065",
    "Mallas metálicas galvanizadas",
    "Mallas metálicas de polyamidas y otros materiales",
    "Mallas desde Nº 2 a Nº 400 (mesh) en distintas aberturas",
  ],
  "Telas Nylon": [
    "Telas/mallas de nylon monofilamento",
    "Telas/mallas de polyester monofilamento",
    "Telas/mallas de polipropileno monofilamento",
    "Telas tipo ASTM",
    "Telas tipo GG",
    "Telas tipo Triple Extra (XXX)",
    "Telas tipo Malling (Normal XX)",
  ],
  "Uniones para Empalmes Mecánicos": [
    "Uniones de golpe en acero corriente",
    "Unión de gancho (distintos aceros)",
    "Unión bisagra (corchetes) servicio liviano/mediano",
    "Unión bisagra apernada servicio pesado",
    "Unión de placa apernada servicio pesado",
  ],
  "Planchas de Acero Perforadas": [
    "Planchas perforadas en acero A-37",
    "Planchas perforadas en acero inoxidable AISI-304",
    "Perforaciones redondas y oblongas 1000×2000 mm",
    "Variados espesores y diámetros de perforación",
  ],
  "Mangueras de Caucho y PVC": [
    "Manguera PVC con refuerzo textil para aire/agua/químicos/aceite",
    "Cristalflex atóxica liviana anillada",
    "Cristalflex atóxica pesada",
    "Lactoflex atóxica blanca para leche y líquidos grasos",
    "Enoflex atóxico rojo para vinos, cervezas y alcoholes",
    "Liquiflex anillada transparente para agua",
    "Aquaflex anillada con anillos azules para agua",
    "Agroflex anillada verde oscuro para líquidos industriales",
    "Airflex anillada gris para ventilación/gases fríos",
    "Azul metálico anillada azul para ventilación industrial",
  ],
};

export default function ItemsScreen() {
  const {
    bodegas,
    items,
    categorias,
    saveItem,
    deleteItem,
    metricsOf,
  } = useApp();

  const [tab, setTab] = useState("form");

  const [form, setForm] = useState({
    id: null,
    categoriaId: null,
    categoriaNombre: "",
    productoNombre: "",
    ancho: "",
    alto: "",
    largo: "",
    peso: "",
    cantidad: "1",
    bodegaId: null,
  });

  const cantidadInt = clampInt(form.cantidad, 1);
  const volUnit = vol(form.ancho, form.alto, form.largo);
  const volNecesario = volUnit * cantidadInt;

  const bodegasDisponibles = useMemo(() => bodegas, [bodegas]);

  /* ---------- Selectores ---------- */

  // ✅ Versión paginada para mostrar TODAS las categorías (Alert en Android solo soporta máx. 3 botones)
  const seleccionarCategoria = () => {
    if (!categorias || categorias.length === 0) {
      return Alert.alert(
        "Categorías",
        "No hay categorías cargadas desde la base de datos."
      );
    }

    const mostrarPagina = (start) => {
      const slice = categorias.slice(start, start + 3);

      const botones = slice.map((c) => ({
        text: c.nombre.toUpperCase(),
        onPress: () =>
          setForm((prev) => ({
            ...prev,
            categoriaId: c.id || c.id_categoria,
            categoriaNombre: c.nombre,
            productoNombre: "",
          })),
      }));

      if (start + 3 < categorias.length) {
        botones.push({
          text: "Más...",
          onPress: () => mostrarPagina(start + 3),
        });
      }

      botones.push({ text: "Cancelar", style: "cancel" });

      Alert.alert("Selecciona categoría", "", botones);
    };

    mostrarPagina(0);
  };

  const seleccionarProducto = () => {
    if (!form.categoriaNombre) {
      return Alert.alert(
        "Producto",
        "Primero selecciona una categoría."
      );
    }

    const productos =
      PRODUCTOS_POR_CATEGORIA[form.categoriaNombre] || [];

    if (!productos.length) {
      return Alert.alert(
        "Producto",
        "No hay productos configurados para esta categoría."
      );
    }

    const opciones = productos.map((p) => ({
      text: p,
      onPress: () =>
        setForm((prev) => ({
          ...prev,
          productoNombre: p,
        })),
    }));

    Alert.alert("Selecciona producto", "", [
      ...opciones,
      { text: "Cancelar", style: "cancel" },
    ]);
  };

  const seleccionarBodega = () => {
    if (bodegasDisponibles.length === 0) {
      return Alert.alert(
        "Bodegas",
        "No hay bodegas registradas."
      );
    }

    const opciones = bodegasDisponibles.map((b) => {
      const m = metricsOf(b);
      return {
        text: `${b.nombre} · Libre: ${m.libre.toFixed(2)} m³`,
        onPress: () =>
          setForm((prev) => ({
            ...prev,
            bodegaId: b.id,
          })),
      };
    });

    Alert.alert("Selecciona bodega", "", [
      ...opciones,
      { text: "Cancelar", style: "cancel" },
    ]);
  };

  /* ---------- Guardar ---------- */

  const guardar = async () => {
    if (!form.categoriaId || !form.categoriaNombre) {
      return Alert.alert(
        "Falta categoría",
        "Selecciona una categoría."
      );
    }
    if (!form.productoNombre) {
      return Alert.alert(
        "Falta producto",
        "Selecciona un producto de la categoría."
      );
    }
    if (!form.bodegaId) {
      return Alert.alert(
        "Falta bodega",
        "Selecciona una bodega."
      );
    }

    const b = bodegas.find((x) => x.id === form.bodegaId);
    if (!b) {
      return Alert.alert(
        "Bodega",
        "La bodega seleccionada no existe."
      );
    }

    const m = metricsOf(b);
    if (isFinite(volNecesario) && volNecesario > m.libre + 1e-9) {
      return Alert.alert(
        "Sin espacio",
        `Vol ítem: ${volNecesario.toFixed(
          3
        )} m³ · Libre en bodega: ${m.libre.toFixed(3)} m³`
      );
    }

    try {
      await saveItem({
        id: form.id,
        nombre: form.productoNombre,
        id_categoria: form.categoriaId,
        bodegaId: form.bodegaId,
        ancho: form.ancho,
        alto: form.alto,
        largo: form.largo,
        peso: form.peso,
        cantidad: form.cantidad,
        clase: pesoAClase(form.peso),
      });

      setForm({
        id: null,
        categoriaId: null,
        categoriaNombre: "",
        productoNombre: "",
        ancho: "",
        alto: "",
        largo: "",
        peso: "",
        cantidad: "1",
        bodegaId: null,
      });
      setTab("view");
    } catch {
      // saveItem ya muestra el error
    }
  };

  /* ---------- Lista / filtros ---------- */

  const [filterBodegaId, setFilterBodegaId] = useState(null);
  const [filterClass, setFilterClass] = useState(null);
  const [showOrphans, setShowOrphans] = useState(false);
  const [sortBy, setSortBy] = useState("name");

  const filtered = useMemo(() => {
    let list = items.slice();

    if (showOrphans) {
      list = list.filter((it) => !it.bodegaId);
    } else if (filterBodegaId) {
      list = list.filter((it) => it.bodegaId === filterBodegaId);
    }

    if (filterClass) {
      list = list.filter(
        (it) => (it.clase || "N/D") === filterClass
      );
    }

    if (sortBy === "name") {
      list.sort((a, b) =>
        (a.nombre || "").localeCompare(b.nombre || "")
      );
    } else {
      list.sort((a, b) => itemVolTotal(b) - itemVolTotal(a));
    }

    return list;
  }, [items, showOrphans, filterBodegaId, filterClass, sortBy]);

  const resumen = useMemo(() => {
    const u = filtered.reduce(
      (acc, it) => acc + clampInt(it.cantidad, 1),
      0
    );
    const v = filtered.reduce(
      (acc, it) => acc + itemVolTotal(it),
      0
    );
    return { unidades: u, vol: v };
  }, [filtered]);

  const moveItem = (it) => {
    const vTotal = itemVolTotal(it);
    const opciones = bodegas
      .map((b) => ({ b, libre: metricsOf(b).libre }))
      .filter(
        (o) =>
          o.b.id !== it.bodegaId &&
          o.libre + 1e-9 >= vTotal
      )
      .sort((a, b) => a.libre - b.libre);

    if (!opciones.length) {
      return Alert.alert(
        "Sin destino con espacio",
        `Volumen: ${vTotal.toFixed(3)} m³`
      );
    }

    const opts = opciones.map((o) => ({
      text: `${o.b.nombre} · Libre: ${o.libre.toFixed(2)} m³`,
      onPress: async () => {
        await saveItem({
          ...it,
          bodegaId: o.b.id,
        });
      },
    }));

    Alert.alert("Mover ítem", "Elige bodega destino:", [
      ...opts,
      { text: "Cancelar", style: "cancel" },
    ]);
  };

  const renderCard = ({ item: it }) => {
    const b = bodegas.find((x) => x.id === it.bodegaId);
    const vUnit = vol(it.ancho, it.alto, it.largo);
    const cant = clampInt(it.cantidad, 1);
    const esSuelto = !it.bodegaId;

    return (
      <View style={st.card}>
        <Text style={st.cardTitle}>
          {it.nombre}{" "}
          <Text style={st.badge}>
            Clase: {it.clase || "N/D"}
          </Text>
          {esSuelto && (
            <Text style={[st.badge, { color: "#b45309" }]}>
              {" "}
              🟠 Sin bodega
            </Text>
          )}
        </Text>
        <Text style={st.cardLine}>
          📐 {it.ancho}×{it.alto}×{it.largo} m · Vol/unidad:{" "}
          {isFinite(vUnit) ? vUnit.toFixed(3) : "0.000"} m³
        </Text>
        <Text style={st.cardLine}>
          🔢 Cantidad: {cant} · Vol total:{" "}
          {isFinite(vUnit * cant)
            ? (vUnit * cant).toFixed(3)
            : "0.000"}{" "}
          m³
        </Text>
        <Text style={st.cardLine}>
          🏬 Bodega: {b ? b.nombre : "(sin asignar)"}
        </Text>

        <View style={[st.row, { gap: 8, marginTop: 8 }]}>
          {!esSuelto && (
            <TouchableOpacity
              style={[st.btn, st.btnInfo]}
              onPress={() => moveItem(it)}
            >
              <Text style={st.btnTxt}>↪️ Mover</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[st.btn, st.btnDanger]}
            onPress={() =>
              Alert.alert(
                "Eliminar",
                `¿Eliminar «${it.nombre}»?`,
                [
                  { text: "No", style: "cancel" },
                  {
                    text: "Sí",
                    style: "destructive",
                    onPress: () => deleteItem(it.id),
                  },
                ]
              )
            }
          >
            <Text style={st.btnTxt}>🗑️ Eliminar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  /* ---------- UI ---------- */

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={st.title}>Ítems</Text>

      <View style={st.tabs}>
        <TouchableOpacity
          style={[st.tabBtn, tab === "form" && st.activeTab]}
          onPress={() => setTab("form")}
        >
          <Text>Formulario</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[st.tabBtn, tab === "view" && st.activeTab]}
          onPress={() => setTab("view")}
        >
          <Text>Visualizar Ítems</Text>
        </TouchableOpacity>
      </View>

      {tab === "form" ? (
        <ScrollView>
          {/* Categoría */}
          <Text style={st.label}>Categoría</Text>
          <TouchableOpacity
            style={st.selectorBtn}
            onPress={seleccionarCategoria}
          >
            <Text style={st.selectorText}>
              {form.categoriaNombre ||
                "Toca para elegir categoría"}
            </Text>
          </TouchableOpacity>

          {/* Producto */}
          <Text style={st.label}>Producto</Text>
          <TouchableOpacity
            style={st.selectorBtn}
            onPress={seleccionarProducto}
            disabled={!form.categoriaNombre}
          >
            <Text style={st.selectorText}>
              {form.productoNombre
                ? form.productoNombre
                : form.categoriaNombre
                ? "Toca para elegir producto"
                : "Primero selecciona categoría"}
            </Text>
          </TouchableOpacity>

          {/* Dimensiones */}
          <Text style={st.label}>Dimensiones (m)</Text>
          <TextInput
            style={st.input}
            placeholder="Ancho"
            keyboardType="numeric"
            value={form.ancho}
            onChangeText={(v) =>
              setForm((f) => ({ ...f, ancho: v }))
            }
          />
          <TextInput
            style={st.input}
            placeholder="Alto"
            keyboardType="numeric"
            value={form.alto}
            onChangeText={(v) =>
              setForm((f) => ({ ...f, alto: v }))
            }
          />
          <TextInput
            style={st.input}
            placeholder="Largo"
            keyboardType="numeric"
            value={form.largo}
            onChangeText={(v) =>
              setForm((f) => ({ ...f, largo: v }))
            }
          />

          {/* Peso */}
          <Text style={st.label}>Peso (kg)</Text>
          <TextInput
            style={st.input}
            placeholder="Peso"
            keyboardType="numeric"
            value={form.peso}
            onChangeText={(v) =>
              setForm((f) => ({ ...f, peso: v }))
            }
          />

          {/* Cantidad */}
          <Text style={st.label}>Cantidad</Text>
          <TextInput
            style={st.input}
            placeholder="1"
            keyboardType="numeric"
            value={String(form.cantidad)}
            onChangeText={(v) =>
              setForm((f) => ({
                ...f,
                cantidad:
                  v.replace(/[^0-9]/g, "") || "1",
              }))
            }
          />

          {/* Bodega */}
          <Text style={st.label}>Bodega</Text>
          <TouchableOpacity
            style={st.selectorBtn}
            onPress={seleccionarBodega}
          >
            <Text style={st.selectorText}>
              {form.bodegaId
                ? bodegas.find(
                    (b) => b.id === form.bodegaId
                  )?.nombre || "(?)"
                : "Toca para elegir bodega"}
            </Text>
          </TouchableOpacity>

          {/* Panel cálculo */}
          <View style={st.calcPanel}>
            <Text style={st.calcTitle}>📏 Cálculo</Text>
            <Text style={st.calcLine}>
              Vol/unidad:{" "}
              {isFinite(volUnit)
                ? volUnit.toFixed(3)
                : "0.000"}{" "}
              m³
            </Text>
            <Text style={st.calcLine}>
              Cantidad: {cantidadInt}
            </Text>
            <Text style={st.calcLine}>
              Volumen necesario:{" "}
              {isFinite(volNecesario)
                ? volNecesario.toFixed(3)
                : "0.000"}{" "}
              m³
            </Text>
            <Text style={st.calcLine}>
              Clase por peso:{" "}
              <Text
                style={{
                  fontWeight: "700",
                }}
              >
                {pesoAClase(form.peso)}
              </Text>
            </Text>
          </View>

          <TouchableOpacity
            style={[
              st.btn,
              st.btnPrimary,
              { marginTop: 8 },
            ]}
            onPress={guardar}
          >
            <Text style={st.btnTxt}>GUARDAR</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <>
          {/* Filtros */}
          <View
            style={[
              st.row,
              {
                gap: 8,
                flexWrap: "wrap",
              },
            ]}
          >
            <TouchableOpacity
              style={[st.selectorBtn, { flex: 1 }]}
              onPress={() => {
                const opts = [
                  {
                    text: "Todas",
                    onPress: () => {
                      setFilterBodegaId(null);
                      setShowOrphans(false);
                    },
                  },
                  {
                    text: "Solo sin bodega",
                    onPress: () => {
                      setFilterBodegaId(null);
                      setShowOrphans(true);
                    },
                  },
                  ...bodegas.map((b) => ({
                    text: b.nombre,
                    onPress: () => {
                      setFilterBodegaId(b.id);
                      setShowOrphans(false);
                    },
                  })),
                  { text: "Cancelar", style: "cancel" },
                ];
                Alert.alert(
                  "Filtrar por bodega",
                  "",
                  opts
                );
              }}
            >
              <Text style={st.selectorText}>
                {showOrphans
                  ? "Solo sin bodega"
                  : filterBodegaId
                  ? bodegas.find(
                      (b) =>
                        b.id ===
                        filterBodegaId
                    )?.nombre || "(?)"
                  : "Todas las bodegas / sin filtro"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={st.clearFilterBtn}
              onPress={() => {
                setFilterBodegaId(null);
                setFilterClass(null);
                setShowOrphans(false);
              }}
            >
              <Text style={st.clearFilterText}>
                X
              </Text>
            </TouchableOpacity>
          </View>

          <View
            style={[
              st.row,
              {
                flexWrap: "wrap",
                gap: 8,
                marginVertical: 4,
              },
            ]}
          >
            {[null,
              ...SIZE_CLASSES.map(
                (c) => c.key
              ),
            ].map((k) => {
              const active =
                (k === null &&
                  filterClass ===
                    null) ||
                filterClass === k;
              const label =
                k || "Todas las clases";
              return (
                <TouchableOpacity
                  key={String(k)}
                  style={[
                    st.pill,
                    active && st.pillA,
                  ]}
                  onPress={() =>
                    setFilterClass(k)
                  }
                >
                  <Text
                    style={{
                      fontWeight:
                        "700",
                    }}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View
            style={[st.row, { gap: 8 }]}
          >
            <TouchableOpacity
              style={[st.selectorBtn, { flex: 1 }]}
              onPress={() =>
                setSortBy(
                  sortBy === "name"
                    ? "vol"
                    : "name"
                )
              }
            >
              <Text style={st.selectorText}>
                Orden:{" "}
                {sortBy === "name"
                  ? "Nombre"
                  : "Volumen"}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={st.summaryBox}>
            <Text style={st.summaryText}>
              Unidades:{" "}
              {resumen.unidades} ·
              Volumen total:{" "}
              {resumen.vol.toFixed(3)}{" "}
              m³
            </Text>
          </View>

          <FlatList
            data={filtered}
            keyExtractor={(it) =>
              String(it.id)
            }
            renderItem={renderCard}
            ListEmptyComponent={
              <Text
                style={{
                  textAlign:
                    "center",
                  color:
                    "#64748b",
                }}
              >
                No hay ítems
                para los
                filtros.
              </Text>
            }
          />
        </>
      )}
    </View>
  );
}

/* ---------- Estilos ---------- */
const st = StyleSheet.create({
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 12,
  },
  tabs: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  tabBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 10,
    backgroundColor: "#f8fafc",
  },
  activeTab: {
    backgroundColor: "#e0e7ff",
    borderColor: "#6366f1",
  },
  label: {
    color: "#475569",
    marginTop: 8,
    marginBottom: 6,
    fontSize: 13,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 10,
    padding: 12,
    backgroundColor: "#fff",
    marginBottom: 8,
  },
  selectorBtn: {
    borderWidth: 1,
    borderColor: "#d4d4d8",
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#fff",
    marginBottom: 6,
  },
  selectorText: {
    color: "#111827",
    fontWeight: "600",
  },
  calcPanel: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 12,
    marginVertical: 10,
  },
  calcTitle: {
    fontWeight: "700",
    color: "#1e293b",
  },
  calcLine: {
    color: "#475569",
    marginTop: 4,
  },
  card: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e293b",
  },
  cardLine: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 4,
  },
  badge: {
    color: "#64748b",
    fontWeight: "600",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  btn: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  btnPrimary: {
    backgroundColor: "#2563eb",
  },
  btnInfo: {
    backgroundColor: "#0ea5e9",
  },
  btnDanger: {
    backgroundColor: "#dc2626",
  },
  btnTxt: {
    color: "#fff",
    fontWeight: "700",
  },
  pill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 999,
    backgroundColor: "#fff",
  },
  pillA: {
    backgroundColor: "#e0e7ff",
    borderColor: "#6366f1",
  },
  clearFilterBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#ef4444",
    alignItems: "center",
    justifyContent: "center",
  },
  clearFilterText: {
    color: "#fff",
    fontWeight: "800",
  },
  summaryBox: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: "#e2e8f0",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    marginBottom: 8,
  },
  summaryText: {
    color: "#0f172a",
    fontWeight: "700",
    textAlign: "center",
  },
});
