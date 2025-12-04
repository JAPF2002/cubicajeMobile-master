// cubicajeMobile-master/src/screens/Item/ItemFormScreen.js
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  Modal,
  FlatList,
} from "react-native";
import { useApp, vol, clampInt } from "../../store";
import { getCategories } from "../../features/api";

// ---------- Categorías y productos permitidos (solo sugerencias de productos) ----------
const PRODUCTOS_POR_CATEGORIA = {
  "Cintas Transportadoras": [
    "Cinta transportadora PU 1.5mm",
    "Cinta transportadora caucho antideslizante",
    "Cinta modular plástica",
    "Cinta transportadora grado alimenticio",
  ],

  "Mallas Metálicas Inoxidables": [
    "Malla acero inoxidable 304",
    "Malla acero inoxidable 316",
    "Malla galvanizada",
    "Malla inox microperforada",
    "Malla electrosoldada inoxidable",
  ],

  "Planchas de Acero Perforadas": [
    "Plancha acero perforada A-37",
    "Plancha acero perforada AISI-304",
    "Plancha acero perforada ranurada",
  ],
};

export default function ItemFormScreen(props) {
  const { goToMenu, goToItemsList, item: propItem, navigation, route } = props;

  const { bodegas, saveItem, metricsOf } = useApp();

  // item puede venir por props o por route.params
  const item = propItem || route?.params?.item || null;

  const [form, setForm] = useState({
    id: item?.id ?? null,
    categoriaId: item?.id_categoria ?? null,
    categoriaNombre: "",
    productoNombre: item?.nombre ?? "",
    ancho: item?.ancho ? String(item.ancho) : "",
    alto: item?.alto ? String(item.alto) : "",
    largo: item?.largo ? String(item.largo) : "",
    peso: item?.peso ? String(item.peso) : "",
    cantidad: item?.cantidad ? String(item.cantidad) : "1",
    bodegaId: item?.bodegaId ?? null,
  });

  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [productModalVisible, setProductModalVisible] = useState(false);
  const [bodegaModalVisible, setBodegaModalVisible] = useState(false);

  // Categorías cargadas directamente desde la API
  const [categoriasLocal, setCategoriasLocal] = useState([]);

  // Cargar categorías directamente del backend al montar la pantalla
  useEffect(() => {
    (async () => {
      try {
        const res = await getCategories();
        console.log("[ItemFormScreen] getCategories res:", res);

        const error = res?.error ?? false;
        const topBody = res?.body ?? res?.data ?? res;

        if (error) {
          throw new Error(topBody?.message || "Error obteniendo categorías");
        }

        let rows = [];
        if (Array.isArray(res)) {
          rows = res;
        } else if (Array.isArray(res?.body?.body)) {
          rows = res.body.body;
        } else if (Array.isArray(res?.body)) {
          rows = res.body;
        } else if (Array.isArray(topBody?.body)) {
          rows = topBody.body;
        } else if (Array.isArray(topBody)) {
          rows = topBody;
        }

        const categoriasFromDb = rows.map((row) => ({
          id: Number(row.id_categoria),
          nombre: row.nombre,
          descripcion: row.descripcion || "",
          activo: row.activo === 1 || row.activo === true,
        }));

        console.log("[ItemFormScreen] categoriasFromDb (local):", categoriasFromDb);

        setCategoriasLocal(categoriasFromDb);
      } catch (err) {
        console.log("[ItemFormScreen] error cargando categorías:", err);
        Alert.alert("Error", "No se pudieron cargar las categorías.");
      }
    })();
  }, []); // solo al montar

  // Lista de categorías construida SOLO desde la respuesta de la API
  const CATEGORY_LIST = useMemo(
    () => (categoriasLocal || []).filter((c) => c.activo),
    [categoriasLocal]
  );

  console.log("[ItemFormScreen] CATEGORY_LIST para modal:", CATEGORY_LIST);

  // ✅ NUEVO: SOLO bodegas activas para el selector
  const ACTIVE_BODEGAS = useMemo(() => {
    const list = Array.isArray(bodegas) ? bodegas : [];
    return list.filter((b) => b?.active === true);
  }, [bodegas]);

  // Lista de productos sugeridos según la categoría seleccionada
  const productosDeCategoria = useMemo(() => {
    if (!form.categoriaNombre) return [];
    return PRODUCTOS_POR_CATEGORIA[form.categoriaNombre] || [];
  }, [form.categoriaNombre]);

  // --- helpers de navegación (funcionan con props o navigation) ---
  const irMenu = () => {
    if (typeof goToMenu === "function") return goToMenu();
    if (navigation?.navigate) return navigation.navigate("Menu");
  };

  const irItemsList = () => {
    if (typeof goToItemsList === "function") return goToItemsList();
    if (navigation?.goBack) return navigation.goBack();
  };

  // Inicializar form cuando venga un item (edición) o cambien las categorías
  useEffect(() => {
    if (item) {
      const categoria = CATEGORY_LIST.find((c) => c.id === item.id_categoria);

      setForm((prev) => ({
        ...prev,
        id: item.id,
        categoriaId: item.id_categoria || null,
        categoriaNombre: categoria?.nombre || "",
        productoNombre: item.nombre || "",
        ancho: String(item.ancho ?? ""),
        alto: String(item.alto ?? ""),
        largo: String(item.largo ?? ""),
        peso: String(item.peso ?? ""),
        cantidad: String(item.cantidad ?? "1"),
        bodegaId: item.bodegaId ?? null,
      }));
    } else {
      setForm((prev) => ({
        ...prev,
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
      }));
    }
  }, [item, CATEGORY_LIST]);

  const cantidadInt = form.cantidad ? clampInt(form.cantidad, 1) : 0;
  const volUnit = vol(form.ancho, form.alto, form.largo);
  const volNecesario =
    Number.isFinite(volUnit) && cantidadInt ? volUnit * cantidadInt : 0;

  /* ---------- Handlers de UI ---------- */

  const openCategoryModal = () => {
    if (!CATEGORY_LIST.length)
      return Alert.alert("Categorías", "No hay categorías configuradas o activas.");
    setCategoryModalVisible(true);
  };

  const selectCategory = (cat) => {
    setForm((prev) => ({
      ...prev,
      categoriaId: cat.id, // id real de la BD
      categoriaNombre: cat.nombre,
      productoNombre: "",
    }));
    setCategoryModalVisible(false);
  };

  const openProductModal = () => {
    if (!form.categoriaNombre)
      return Alert.alert("Producto", "Primero selecciona una categoría.");
    if (!productosDeCategoria.length)
      return Alert.alert("Producto", "No hay productos sugeridos para esta categoría.");
    setProductModalVisible(true);
  };

  const selectProduct = (nombre) => {
    setForm((prev) => ({
      ...prev,
      productoNombre: nombre,
    }));
    setProductModalVisible(false);
  };

  const openBodegaModal = () => {
    if (!ACTIVE_BODEGAS.length) {
      return Alert.alert("Bodega", "No hay bodegas activas disponibles.");
    }
    setBodegaModalVisible(true);
  };

  const selectBodega = (b) => {
    setForm((prev) => ({
      ...prev,
      bodegaId: b.id,
    }));
    setBodegaModalVisible(false);
  };

  /* ---------- Guardar ---------- */
  const guardar = async () => {
    if (!form.categoriaId || !form.categoriaNombre)
      return Alert.alert("Falta categoría", "Selecciona una categoría.");
    if (!form.productoNombre)
      return Alert.alert("Falta producto", "Selecciona un producto.");
    if (!form.bodegaId)
      return Alert.alert("Falta bodega", "Selecciona una bodega.");

    const b = (bodegas || []).find((x) => x.id === form.bodegaId);
    if (!b) return Alert.alert("Bodega", "La bodega seleccionada no existe.");

    const m = metricsOf(b);
    if (isFinite(volNecesario) && volNecesario > m.libre + 1e-9) {
      return Alert.alert(
        "Capacidad excedida",
        "El volumen total del ítem supera el espacio libre de la bodega."
      );
    }

    try {
      await saveItem({
        id: form.id,
        nombre: form.productoNombre,
        id_categoria: form.categoriaId,
        bodegaId: form.bodegaId,
        ancho: Number(form.ancho || 0),
        alto: Number(form.alto || 0),
        largo: Number(form.largo || 0),
        peso: Number(form.peso || 0),
        cantidad: cantidadInt,
      });

      irItemsList();
    } catch (err) {
      console.log("[ItemFormScreen] guardar error:", err);
    }
  };

  const bodegaNombre =
    form.bodegaId && (bodegas || []).find((b) => b.id === form.bodegaId)?.nombre;

  const bodegaOptionsText =
    ACTIVE_BODEGAS.length
      ? "Bodegas activas: " + ACTIVE_BODEGAS.map((b) => `${b.id} (${b.nombre})`).join(", ")
      : "No hay bodegas activas.";

  return (
    <View style={st.container}>
      <ScrollView contentContainerStyle={st.scrollContent}>
        {/* Header */}
        <View style={st.headerRow}>
          <TouchableOpacity onPress={irMenu} style={st.headerBack}>
            <Text style={st.headerBackText}>{"<"}</Text>
          </TouchableOpacity>
          <Text style={st.headerTitle}>{form.id ? "Editar ítem" : "Nuevo ítem"}</Text>
        </View>

        {/* Categoría */}
        <Text style={st.label}>Categoría</Text>
        <TouchableOpacity style={st.touchField} onPress={openCategoryModal} activeOpacity={0.7}>
          <Text style={[st.touchFieldText, !form.categoriaNombre && st.placeholderText]}>
            {form.categoriaNombre || "Toca para elegir categoría"}
          </Text>
        </TouchableOpacity>

        {/* Producto */}
        <Text style={st.label}>Producto</Text>
        <TouchableOpacity style={st.touchField} onPress={openProductModal} activeOpacity={0.7}>
          <Text style={[st.touchFieldText, !form.productoNombre && st.placeholderText]}>
            {form.productoNombre || "Toca para elegir producto sugerido"}
          </Text>
        </TouchableOpacity>

        <TextInput
          style={[st.input, { marginTop: 6 }]}
          placeholder="O escribe el nombre del producto"
          value={form.productoNombre}
          onChangeText={(texto) => setForm((prev) => ({ ...prev, productoNombre: texto }))}
        />

        {/* Dimensiones */}
        <View style={st.fieldLabelRow}>
          <Text style={st.label}>Dimensiones (m)</Text>
          {Number.isFinite(volUnit) && (
            <View style={st.volBadge}>
              <Text style={st.volText}>Vol. unitario: {volUnit.toFixed(2)} m³</Text>
            </View>
          )}
        </View>

        <View style={st.inputRow}>
          <View style={st.inputGroup}>
            <Text style={st.smallLabel}>Ancho</Text>
            <TextInput
              style={st.input}
              keyboardType="numeric"
              value={form.ancho}
              onChangeText={(v) => setForm((prev) => ({ ...prev, ancho: v.replace(",", ".") }))}
            />
          </View>
          <View style={st.inputGroup}>
            <Text style={st.smallLabel}>Alto</Text>
            <TextInput
              style={st.input}
              keyboardType="numeric"
              value={form.alto}
              onChangeText={(v) => setForm((prev) => ({ ...prev, alto: v.replace(",", ".") }))}
            />
          </View>
          <View style={st.inputGroup}>
            <Text style={st.smallLabel}>Largo</Text>
            <TextInput
              style={st.input}
              keyboardType="numeric"
              value={form.largo}
              onChangeText={(v) => setForm((prev) => ({ ...prev, largo: v.replace(",", ".") }))}
            />
          </View>
        </View>

        {/* Peso y cantidad */}
        <View style={st.inputRow}>
          <View style={st.inputGroup}>
            <Text style={st.smallLabel}>Peso (kg)</Text>
            <TextInput
              style={st.input}
              keyboardType="numeric"
              value={form.peso}
              onChangeText={(v) => setForm((prev) => ({ ...prev, peso: v.replace(",", ".") }))}
            />
          </View>
          <View style={st.inputGroup}>
            <Text style={st.smallLabel}>Cantidad</Text>
            <TextInput
              style={st.input}
              keyboardType="numeric"
              value={form.cantidad}
              onChangeText={(v) => setForm((prev) => ({ ...prev, cantidad: v.replace(",", ".") }))}
            />
          </View>
        </View>

        {/* Bodega */}
        <Text style={[st.label, { marginTop: 16 }]}>Bodega</Text>
        <TouchableOpacity style={st.touchField} onPress={openBodegaModal} activeOpacity={0.7}>
          <Text style={[st.touchFieldText, !bodegaNombre && st.placeholderText]}>
            {bodegaNombre || "Toca para elegir bodega (solo activas)"}
          </Text>
        </TouchableOpacity>
        <Text style={st.helperText}>{bodegaOptionsText}</Text>

        {/* Volumen necesario */}
        {Number.isFinite(volNecesario) && (
          <View style={{ marginTop: 16 }}>
            <Text style={st.label}>Volumen total requerido</Text>
            <Text style={st.helperText}>
              {cantidadInt} unidades x {volUnit.toFixed(2)} m³ = {volNecesario.toFixed(2)} m³
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom bar: Lista / Guardar */}
      <View style={st.bottomBar}>
        <TouchableOpacity style={st.bottomBtn} onPress={irItemsList}>
          <Text style={st.bottomBtnText}>Lista de ítems</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[st.bottomBtn, st.bottomBtnActive]} onPress={guardar}>
          <Text style={[st.bottomBtnText, st.bottomBtnTextActive]}>Guardar</Text>
        </TouchableOpacity>
      </View>

      {/* MODAL CATEGORÍAS */}
      <Modal
        visible={categoryModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCategoryModalVisible(false)}
      >
        <View style={st.modalOverlay}>
          <View style={st.modalCard}>
            <Text style={st.modalTitle}>Selecciona una categoría</Text>
            <FlatList
              data={CATEGORY_LIST}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item: cat }) => (
                <TouchableOpacity style={st.modalItem} onPress={() => selectCategory(cat)}>
                  <Text style={st.modalItemText}>{cat.nombre}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={[st.btn, st.btnPrimary, { marginTop: 8 }]}
              onPress={() => setCategoryModalVisible(false)}
            >
              <Text style={st.btnTxt}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL PRODUCTOS */}
      <Modal
        visible={productModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setProductModalVisible(false)}
      >
        <View style={st.modalOverlay}>
          <View style={st.modalCard}>
            <Text style={st.modalTitle}>Productos sugeridos</Text>
            <FlatList
              data={productosDeCategoria}
              keyExtractor={(item, index) => String(index)}
              renderItem={({ item: nombre }) => (
                <TouchableOpacity style={st.modalItem} onPress={() => selectProduct(nombre)}>
                  <Text style={st.modalItemText}>{nombre}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={[st.btn, st.btnPrimary, { marginTop: 8 }]}
              onPress={() => setProductModalVisible(false)}
            >
              <Text style={st.btnTxt}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL BODEGAS (SOLO ACTIVAS) */}
      <Modal
        visible={bodegaModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setBodegaModalVisible(false)}
      >
        <View style={st.modalOverlay}>
          <View style={st.modalCard}>
            <Text style={st.modalTitle}>Selecciona una bodega (activas)</Text>

            <FlatList
              data={ACTIVE_BODEGAS}
              keyExtractor={(b) => String(b.id)}
              renderItem={({ item: b }) => (
                <TouchableOpacity style={st.destItem} onPress={() => selectBodega(b)}>
                  <Text style={st.destItemText}>{b.nombre}</Text>
                  <Text style={{ fontSize: 10, color: "#6b7280", marginTop: 2 }}>
                    ID {b.id} · {b.ciudad || "-"}
                  </Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={{ paddingVertical: 12, color: "#6b7280", fontSize: 12 }}>
                  No hay bodegas activas.
                </Text>
              }
            />

            <TouchableOpacity
              style={[st.btn, st.btnPrimary, { marginTop: 8 }]}
              onPress={() => setBodegaModalVisible(false)}
            >
              <Text style={st.btnTxt}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  scrollContent: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 140 },

  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  headerBack: { marginRight: 12, paddingHorizontal: 8, paddingVertical: 4 },
  headerBackText: { fontSize: 18, color: "#2563eb", fontWeight: "600" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },

  label: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 4, marginTop: 12 },
  smallLabel: { fontSize: 11, fontWeight: "500", color: "#4b5563", marginBottom: 2 },

  touchField: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#ffffff",
  },
  touchFieldText: { fontSize: 13, color: "#111827" },
  placeholderText: { color: "#9ca3af" },

  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    backgroundColor: "#ffffff",
  },

  inputRow: { flexDirection: "row", gap: 8, marginTop: 6 },
  inputGroup: { flex: 1 },

  fieldLabelRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 12 },
  volBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, backgroundColor: "#eff6ff" },
  volText: { fontSize: 10, color: "#1d4ed8", fontWeight: "500" },

  helperText: { fontSize: 11, color: "#6b7280", marginTop: 4 },

  bottomBar: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 40,
    padding: 6,
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    gap: 6,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  bottomBtn: { flex: 1, paddingVertical: 7, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  bottomBtnActive: { backgroundColor: "#2563eb" },
  bottomBtnText: { fontSize: 11, color: "#6b7280", fontWeight: "500" },
  bottomBtnTextActive: { color: "#ffffff", fontWeight: "600" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  modalCard: { width: "100%", maxHeight: "80%", backgroundColor: "#ffffff", borderRadius: 16, padding: 16 },
  modalTitle: { fontSize: 15, fontWeight: "600", color: "#111827", marginBottom: 8 },

  modalItem: { paddingVertical: 8 },
  modalItemText: { fontSize: 13, color: "#111827" },

  btn: { paddingVertical: 8, borderRadius: 999, alignItems: "center", justifyContent: "center", marginTop: 4 },
  btnPrimary: { backgroundColor: "#2563eb" },
  btnTxt: { fontSize: 13, color: "#ffffff", fontWeight: "600" },

  destItem: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
  destItemText: { fontSize: 13, color: "#111827" },
});
