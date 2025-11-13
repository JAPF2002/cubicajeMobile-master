// src/screens/Item/ItemFormScreen.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  Modal,
  FlatList,
} from "react-native";
import { useApp, vol, clampInt, pesoAClase } from "../../store";

// ---------- Categorías y productos permitidos ----------
const PRODUCTOS_POR_CATEGORIA = {
  "Mallas Metálicas Inoxidables": [
    "Malla acero inoxidable 304",
    "Malla acero inoxidable 316",
    "Malla galvanizada",
  ],
  "Telas Nylon": [
    "Tela nylon monofilamento",
    "Tela polyester monofilamento",
  ],
  "Uniones para Empalmes Mecánicos": [
    "Unión de gancho",
    "Unión bisagra",
    "Unión de placa apernada",
  ],
  "Planchas de Acero Perforadas": [
    "Plancha perforada A-37",
    "Plancha perforada inoxidable 304",
  ],
  "Mangueras de Caucho y PVC": [
    "Manguera PVC reforzada",
    "Manguera Cristalflex",
    "Manguera Enoflex",
  ],
};

const CATEGORY_LIST = Object.keys(PRODUCTOS_POR_CATEGORIA).map(
  (nombre, index) => ({ id: index + 1, nombre })
);

export default function ItemFormScreen(props) {
  const { goToMenu, goToItemsList, item: propItem, navigation, route } = props;
  const { bodegas, saveItem, metricsOf } = useApp();

  // item puede venir por props o por route.params
  const item = propItem || route?.params?.item || null;

  const [form, setForm] = useState({
    id: null,
    categoriaId: null,
    categoriaNombre: "",
    productoNombre: "",
    ancho: "",
    alto: "",
    largo: "",
    peso: "",
    cantidad: "",
    bodegaId: null,
  });

  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [productModalVisible, setProductModalVisible] = useState(false);
  const [bodegaModalVisible, setBodegaModalVisible] = useState(false);

  // --- helpers de navegación (funcionan con props o navigation) ---
  const irMenu = () => {
    if (typeof goToMenu === "function") return goToMenu();
    if (navigation?.navigate) return navigation.navigate("Menu");
  };

  const irItemsList = () => {
    if (typeof goToItemsList === "function") return goToItemsList();
    if (navigation?.navigate) return navigation.navigate("ItemsList");
    if (navigation?.goBack) return navigation.goBack();
  };

  useEffect(() => {
    if (item) {
      setForm({
        id: item.id,
        categoriaId: item.id_categoria || null,
        categoriaNombre:
          CATEGORY_LIST.find((c) => c.id === item.id_categoria)?.nombre ||
          "",
        productoNombre: item.nombre || "",
        ancho: String(item.ancho ?? ""),
        alto: String(item.alto ?? ""),
        largo: String(item.largo ?? ""),
        peso: String(item.peso ?? ""),
        cantidad: String(item.cantidad ?? ""),
        bodegaId: item.bodegaId ?? null,
      });
    } else {
      setForm({
        id: null,
        categoriaId: null,
        categoriaNombre: "",
        productoNombre: "",
        ancho: "",
        alto: "",
        largo: "",
        peso: "",
        cantidad: "",
        bodegaId: null,
      });
    }
  }, [item]);

  const cantidadInt = form.cantidad ? clampInt(form.cantidad, 1) : 0;
  const volUnit = vol(form.ancho, form.alto, form.largo);
  const volNecesario = volUnit * (cantidadInt || 0);

  const productosDeCategoria =
    PRODUCTOS_POR_CATEGORIA[form.categoriaNombre] || [];

  /* ---------- Selectores ---------- */
  const openCategoryModal = () => {
    if (!CATEGORY_LIST.length)
      return Alert.alert(
        "Categorías",
        "No hay categorías configuradas."
      );
    setCategoryModalVisible(true);
  };

  const selectCategory = (cat) => {
    setForm((prev) => ({
      ...prev,
      categoriaId: cat.id,
      categoriaNombre: cat.nombre,
      productoNombre: "",
    }));
    setCategoryModalVisible(false);
    setProductModalVisible(false);
  };

  const openProductModal = () => {
    if (!form.categoriaNombre)
      return Alert.alert(
        "Producto",
        "Primero selecciona una categoría."
      );
    if (!productosDeCategoria.length)
      return Alert.alert(
        "Producto",
        "No hay productos configurados para esta categoría."
      );
    setProductModalVisible(true);
  };

  const selectProduct = (nombre) => {
    setForm((prev) => ({ ...prev, productoNombre: nombre }));
    setProductModalVisible(false);
  };

  const openBodegaModal = () => {
    if (!bodegas || bodegas.length === 0)
      return Alert.alert("Bodegas", "No hay bodegas registradas.");
    setBodegaModalVisible(true);
  };

  const selectBodega = (b) => {
    setForm((prev) => ({ ...prev, bodegaId: b.id }));
    setBodegaModalVisible(false);
  };

  /* ---------- Guardar ---------- */
  const guardar = async () => {
    if (!form.categoriaId || !form.categoriaNombre)
      return Alert.alert(
        "Falta categoría",
        "Selecciona una categoría."
      );
    if (!form.productoNombre)
      return Alert.alert(
        "Falta producto",
        "Selecciona un producto."
      );
    if (!form.bodegaId)
      return Alert.alert("Falta bodega", "Selecciona una bodega.");

    const b = bodegas.find((x) => x.id === form.bodegaId);
    if (!b)
      return Alert.alert(
        "Bodega",
        "La bodega seleccionada no existe."
      );

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
        cantidad:
          form.cantidad && form.cantidad !== "" ? form.cantidad : "1",
        clase: pesoAClase(form.peso),
      });

      Alert.alert("Ítem guardado", "El ítem se guardó correctamente.");
      irItemsList();
    } catch {
      // saveItem ya lanza Alert en caso de error
    }
  };

  const bodegaNombre =
    form.bodegaId &&
    bodegas.find((b) => b.id === form.bodegaId)?.nombre;
  const bodegaOptionsText =
    bodegas && bodegas.length
      ? "IDs disponibles: " +
        bodegas
          .map((b) => `${b.id} (${b.nombre})`)
          .join(", ")
      : "No hay bodegas definidas.";

  return (
    <View style={st.screen}>
      <View style={st.headerRow}>
        <View>
          <Text style={st.title}>
            {form.id ? "Editar ítem" : "Nuevo ítem"}
          </Text>
          <Text style={st.subtitle}>
            Completa los datos del producto y su ubicación.
          </Text>
        </View>
        <TouchableOpacity onPress={irMenu}>
          <Text style={st.menuLink}>Menú</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Datos del ítem */}
        <View style={st.sectionBox}>
          <Text style={st.sectionTitle}>Datos del ítem</Text>

          <Text style={st.label}>Categoría</Text>
          <TouchableOpacity
            style={st.selectorBtn}
            onPress={openCategoryModal}
          >
            <Text
              style={[
                st.selectorText,
                !form.categoriaNombre && st.placeholderText,
              ]}
            >
              {form.categoriaNombre ||
                "Toca para elegir categoría"}
            </Text>
          </TouchableOpacity>

          <Text style={st.label}>Producto</Text>
          <TouchableOpacity
            style={[
              st.selectorBtn,
              !form.categoriaNombre && { opacity: 0.6 },
            ]}
            onPress={openProductModal}
            disabled={!form.categoriaNombre}
          >
            <Text
              style={[
                st.selectorText,
                !form.productoNombre && st.placeholderText,
              ]}
            >
              {form.productoNombre
                ? form.productoNombre
                : form.categoriaNombre
                ? "Toca para elegir producto"
                : "Primero selecciona categoría"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Medidas y peso */}
        <View style={st.sectionBox}>
          <Text style={st.sectionTitle}>Medidas y peso</Text>

          <Text style={st.label}>Dimensiones (m)</Text>
          <View style={st.row}>
            <View style={st.col}>
              <Text style={st.subLabel}>Ancho</Text>
              <TextInput
                style={st.input}
                placeholder="0.00"
                keyboardType="numeric"
                value={form.ancho}
                onChangeText={(v) =>
                  setForm((f) => ({ ...f, ancho: v }))
                }
              />
            </View>
            <View style={st.col}>
              <Text style={st.subLabel}>Largo</Text>
              <TextInput
                style={st.input}
                placeholder="0.00"
                keyboardType="numeric"
                value={form.largo}
                onChangeText={(v) =>
                  setForm((f) => ({ ...f, largo: v }))
                }
              />
            </View>
            <View style={st.col}>
              <Text style={st.subLabel}>Altura</Text>
              <TextInput
                style={st.input}
                placeholder="0.00"
                keyboardType="numeric"
                value={form.alto}
                onChangeText={(v) =>
                  setForm((f) => ({ ...f, alto: v }))
                }
              />
            </View>
          </View>

          <Text style={st.label}>Peso unitario (kg)</Text>
          <TextInput
            style={st.input}
            placeholder="0.00"
            keyboardType="numeric"
            value={form.peso}
            onChangeText={(v) =>
              setForm((f) => ({ ...f, peso: v }))
            }
          />

          <Text style={st.label}>Cantidad</Text>
          <TextInput
            style={st.input}
            placeholder="1"
            keyboardType="numeric"
            value={String(form.cantidad)}
            onChangeText={(v) => {
              const only = v.replace(/[^0-9]/g, "");
              setForm((f) => ({ ...f, cantidad: only }));
            }}
          />
        </View>

        {/* Bodega */}
        <View style={st.sectionBox}>
          <Text style={st.sectionTitle}>Ubicación en bodega</Text>

          <Text style={st.label}>Bodega</Text>
          <TouchableOpacity
            style={st.selectorBtn}
            onPress={openBodegaModal}
          >
            <Text
              style={[
                st.selectorText,
                !form.bodegaId && st.placeholderText,
              ]}
            >
              {bodegaNombre || "Toca para elegir bodega"}
            </Text>
          </TouchableOpacity>
          <Text style={st.helper}>{bodegaOptionsText}</Text>

          {/* Resumen */}
          <View style={st.calcPanel}>
            <Text style={st.calcTitle}>Resumen rápido</Text>
            <Text style={st.calcLine}>
              Vol/unidad:{" "}
              {isFinite(volUnit)
                ? `${volUnit.toFixed(3)} m³`
                : "0.000 m³"}
            </Text>
            <Text style={st.calcLine}>
              Cantidad total: {cantidadInt || 0}
            </Text>
            <Text style={st.calcLine}>
              Volumen necesario:{" "}
              {isFinite(volNecesario)
                ? `${volNecesario.toFixed(3)} m³`
                : "0.000 m³"}
            </Text>
            <Text style={st.calcLine}>
              Peso (clase):{" "}
              <Text style={{ fontWeight: "700" }}>
                {pesoAClase(form.peso)}
              </Text>
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom bar: Lista / Guardar */}
      <View style={st.bottomBar}>
        <TouchableOpacity
          style={st.bottomBtn}
          onPress={irItemsList}
        >
          <Text style={st.bottomBtnText}>Lista de ítems</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[st.bottomBtn, st.bottomBtnActive]}
          onPress={guardar}
        >
          <Text
            style={[
              st.bottomBtnText,
              st.bottomBtnTextActive,
            ]}
          >
            {form.id ? "Guardar cambios" : "Crear ítem"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Modal categorías */}
      <Modal
        visible={categoryModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCategoryModalVisible(false)}
      >
        <View style={st.modalBackdrop}>
          <View style={st.modalBox}>
            <Text style={st.modalTitle}>Seleccionar categoría</Text>
            <FlatList
              data={CATEGORY_LIST}
              keyExtractor={(c) => String(c.id)}
              style={{ maxHeight: 260 }}
              renderItem={({ item: c }) => (
                <TouchableOpacity
                  style={st.destItem}
                  onPress={() => selectCategory(c)}
                >
                  <Text style={st.destItemText}>{c.nombre}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={[
                st.btn,
                st.btnPrimary,
                { marginTop: 8 },
              ]}
              onPress={() => setCategoryModalVisible(false)}
            >
              <Text style={st.btnTxt}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal productos */}
      <Modal
        visible={productModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setProductModalVisible(false)}
      >
        <View style={st.modalBackdrop}>
          <View style={st.modalBox}>
            <Text style={st.modalTitle}>Seleccionar producto</Text>
            <FlatList
              data={productosDeCategoria}
              keyExtractor={(p, i) => `${i}-${p}`}
              style={{ maxHeight: 260 }}
              renderItem={({ item: p }) => (
                <TouchableOpacity
                  style={st.destItem}
                  onPress={() => selectProduct(p)}
                >
                  <Text style={st.destItemText}>{p}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={[
                st.btn,
                st.btnPrimary,
                { marginTop: 8 },
              ]}
              onPress={() => setProductModalVisible(false)}
            >
              <Text style={st.btnTxt}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal bodegas */}
      <Modal
        visible={bodegaModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setBodegaModalVisible(false)}
      >
        <View style={st.modalBackdrop}>
          <View style={st.modalBox}>
            <Text style={st.modalTitle}>Seleccionar bodega</Text>
            <FlatList
              data={bodegas}
              keyExtractor={(b) => String(b.id)}
              style={{ maxHeight: 260 }}
              renderItem={({ item: b }) => {
                const m = metricsOf(b);
                return (
                  <TouchableOpacity
                    style={st.destItem}
                    onPress={() => selectBodega(b)}
                  >
                    <Text style={st.destItemText}>
                      {b.nombre}
                    </Text>
                    <Text
                      style={{
                        fontSize: 10,
                        color: "#6b7280",
                      }}
                    >
                      Libre: {m.libre.toFixed(2)} m³
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
            <TouchableOpacity
              style={[
                st.btn,
                st.btnPrimary,
                { marginTop: 8 },
              ]}
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
  screen: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 140, // ⬅️ reserva de espacio
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  title: { fontSize: 20, fontWeight: "700", color: "#111827" },
  subtitle: { fontSize: 12, color: "#6b7280" },
  menuLink: {
    fontSize: 11,
    color: "#2563eb",
    fontWeight: "600",
  },
  sectionBox: {
    marginBottom: 14,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
  },
  label: {
    color: "#475569",
    marginTop: 6,
    marginBottom: 4,
    fontSize: 12,
    fontWeight: "600",
  },
  subLabel: { color: "#6b7280", fontSize: 11, marginBottom: 2 },
  row: { flexDirection: "row", gap: 8, marginBottom: 4 },
  col: { flex: 1 },
  input: {
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#fff",
    fontSize: 12,
    marginBottom: 4,
  },
  selectorBtn: {
    borderWidth: 1,
    borderColor: "#d4d4d8",
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#fff",
    marginBottom: 4,
  },
  selectorText: {
    color: "#111827",
    fontWeight: "600",
    fontSize: 12,
  },
  placeholderText: {
    color: "#9ca3af",
    fontWeight: "400",
  },
  calcPanel: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#ffffff",
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
  },
  calcTitle: {
    fontWeight: "700",
    color: "#1e293b",
    fontSize: 12,
  },
  calcLine: { color: "#475569", marginTop: 2, fontSize: 11 },
  helper: { fontSize: 9, color: "#9ca3af", marginTop: 2 },
  btn: {
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 4,
  },
  btnPrimary: { backgroundColor: "#2563eb" },
  btnTxt: { color: "#fff", fontWeight: "700", fontSize: 13 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    width: "88%",
    maxHeight: "70%",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 6,
    color: "#111827",
  },
  destItem: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  destItemText: { fontSize: 13, color: "#111827" },
  bottomBar: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 40, // ⬆️ más alto
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
  bottomBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomBtnActive: { backgroundColor: "#2563eb" },
  bottomBtnText: {
    fontSize: 11,
    color: "#6b7280",
    fontWeight: "500",
  },
  bottomBtnTextActive: {
    color: "#ffffff",
    fontWeight: "600",
  },
});
