// src/screens/Bodega/BodegaFormScreen.js
import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Modal,
  Pressable,
  useFocusEffect
} from "react-native";
import { useApp } from "../../store";
import {getCiudades} from "../../features/api"

export default function BodegaFormScreen(props) {
  const { route, navigation } = props;

  const { bodegas, saveBodega } = useApp();

  const editingBodega = route?.params?.bodega || null;
  const isEdit = !!editingBodega;

  const bodegaIdParam = route?.params?.bodegaId ?? null;
  const currentBodegaId = editingBodega?.id ?? bodegaIdParam;

  const bodega = useMemo(
    () => bodegas.find((b) => b.id === currentBodegaId) || editingBodega || null,
    [bodegas, currentBodegaId, editingBodega]
  );

  console.log("\n\n\n\n", editingBodega)

  const [nombre, setNombre] = useState(editingBodega?.nombre || "");
  const [ciudad, setCiudad] = useState(() => {
  if (!editingBodega) return { id_ciudad: null, nombre: "" };
  return {
    id_ciudad: editingBodega?.id_ciudad != null ? String(editingBodega.id_ciudad) : null,
    nombre: editingBodega?.ciudad ?? "",
    };
  });

  const [direccion, setDireccion] = useState(editingBodega?.direccion || "");
  const [ancho, setAncho] = useState(
    editingBodega?.ancho != null ? String(editingBodega.ancho) : ""
  );
  const [largo, setLargo] = useState(
    editingBodega?.largo != null ? String(editingBodega.largo) : ""
  );
  const [alto, setAlto] = useState(
    editingBodega?.alto != null ? String(editingBodega.alto) : ""
  );
  const [active, setActive] = useState(
    editingBodega?.active !== undefined ? !!editingBodega.active : true
  );

  const [saving, setSaving] = useState(false);

  // ✅ Modal selector de ciudad
  const [cityModalVisible, setCityModalVisible] = useState(false);
  const [ciudades, setCiudades] = useState([])
  const [ciudadesLoading, setCiudadesLoading] = useState(false)

  const normalize = (s) => (s ?? "").trim().toLowerCase();

  useEffect(() => {
  if (!isEdit) return;
  if (!ciudades || ciudades.length === 0) return;

  // Puede venir string ("Vitacura") o eventualmente un objeto
  const rawCity = bodega?.ciudad ?? editingBodega?.ciudad;

  // Si ya viene como objeto con id, listo
  if (rawCity && typeof rawCity === "object" && rawCity.id_ciudad) {
    setCiudad(rawCity);
    return;
  }

  // Si viene como string, buscamos por nombre (case-insensitive)
  if (typeof rawCity === "string") {
    const match = ciudades.find((c) => normalize(c.nombre) === normalize(rawCity));
    if (match) setCiudad(match);
    else setCiudad({ id_ciudad: null, nombre: rawCity }); // muestra el nombre, pero obligará a re-seleccionar
  }
}, [isEdit, ciudades, bodega, editingBodega]);

  useEffect(() => {
    navigation?.setOptions?.({
      title: isEdit ? "Editar bodega" : "Nueva bodega",
    });
  }, [isEdit, navigation]);

  const getCities = async() => {
    setCiudadesLoading(true);
    try {
      const resp = await getCiudades();
      setCiudades(resp.ciudades);
    } catch (error) {
      console.log(error)
      setCiudades([])
    }
    finally{
      setCiudadesLoading(false);
    }
  }

  useEffect(() => {
    getCities()
  }, [])
  const goBack = () => navigation?.goBack?.();

  const buildPayloadOrAlert = () => {
    if (!nombre.trim())
      return Alert.alert("Validación", "Debes ingresar un nombre de bodega.");
    if (!ciudad.id_ciudad)
      return Alert.alert("Validación", "Debes ingresar la ciudad.");
    if (!direccion.trim())
      return Alert.alert("Validación", "Debes ingresar la dirección.");

    const anchoNum = Number(ancho);
    const largoNum = Number(largo);
    const altoNum = Number(alto);

    if (!anchoNum || anchoNum <= 0 || !largoNum || largoNum <= 0) {
      Alert.alert(
        "Validación",
        'Los campos "Ancho" y "Largo" deben ser números mayores a 0.'
      );
      return null;
    }
    if (!altoNum || altoNum <= 0) {
      Alert.alert(
        "Validación",
        'El campo "Altura" debe ser un número mayor a 0.'
      );
      return null;
    }

    // 🚫 NO tocamos layout aquí (para no sobreescribir el mapa existente)
    const keepLayout = bodega?.layout ?? editingBodega?.layout ?? null;
    return {
      id: editingBodega?.id || null,
      nombre: nombre.trim(),
      id_ciudad: ciudad.id_ciudad,
      direccion: direccion.trim(),
      ancho: anchoNum,
      largo: largoNum,
      alto: altoNum,
      active,
      layout: keepLayout,
    };
  };

  const handleSaveOnly = async () => {
    const payload = buildPayloadOrAlert();
    if (!payload) return;

    try {
      setSaving(true);
      await saveBodega(payload);
      Alert.alert(
        "Éxito",
        isEdit
          ? "Bodega actualizada correctamente."
          : "Bodega creada correctamente.",
        [{ text: "OK", onPress: goBack }]
      );
    } catch (err) {
      Alert.alert("Error", err?.message || "No se pudo guardar la bodega.");
    } finally {
      setSaving(false);
    }
  };

  // ✅ AHORA: no guarda, solo navega al Paso 2
  const handleNextMap = () => {
    const payload = buildPayloadOrAlert();
    if (!payload) return;

    // Si ya existe (editar), usamos el id
    if (payload.id) {
      navigation.navigate("BodegaMap", { bodegaId: payload.id });
      return;
    }

    // Si es nueva, pasamos un borrador sin guardar aún
    navigation.navigate("BodegaMap", { draftBodega: payload });
  };

  const handleSelectCity = (city) => {
    console.log(city)
    setCiudad(city);
    setCityModalVisible(false);
  };

  return (
    <View style={st.screen}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={st.title}>{isEdit ? "Editar bodega" : "Nueva bodega"}</Text>
        <Text style={st.subtitle}>
          Paso 1: completa los datos. Luego en el Paso 2 podrás mapear el
          tablero.
        </Text>

        <Text style={st.label}>Nombre de la bodega</Text>
        <TextInput
          style={st.input}
          value={nombre}
          onChangeText={setNombre}
          placeholder="Ej: Bodega Central"
        />

        {/* ✅ CIUDAD: ahora se elige en un modal (pantalla saliendo) */}
        <Text style={st.label}>Ciudad</Text>
        <TouchableOpacity
          style={st.input}
          activeOpacity={0.8}
          onPress={() => setCityModalVisible(true)}
          disabled={saving}
        >
          <Text style={[st.cityFieldText, !ciudad?.id_ciudad && st.cityFieldPlaceholder]}>
            {ciudad.nombre ? ciudad.nombre : "Selecciona una ciudad"}
          </Text>
        </TouchableOpacity>

        <Text style={st.label}>Dirección</Text>
        <TextInput
          style={st.input}
          value={direccion}
          onChangeText={setDireccion}
          placeholder="Dirección completa"
        />

        <View style={st.row}>
          <View style={st.col}>
            <Text style={st.label}>Ancho (m)</Text>
            <TextInput
              style={st.input}
              value={ancho}
              onChangeText={setAncho}
              keyboardType="numeric"
              placeholder="Ej: 10"
            />
          </View>
          <View style={st.col}>
            <Text style={st.label}>Largo (m)</Text>
            <TextInput
              style={st.input}
              value={largo}
              onChangeText={setLargo}
              keyboardType="numeric"
              placeholder="Ej: 20"
            />
          </View>
        </View>

        <Text style={st.label}>Altura (m)</Text>
        <TextInput
          style={st.input}
          value={alto}
          onChangeText={setAlto}
          keyboardType="numeric"
          placeholder="Ej: 4"
        />

        <View style={[st.row, { alignItems: "center", marginTop: 12 }]}>
          <Text style={[st.label, { marginBottom: 0 }]}>Bodega activa</Text>
          <Switch
            value={active}
            onValueChange={setActive}
            style={{ marginLeft: 12 }}
          />
        </View>

        <View style={{ marginTop: 16 }}>
          <Text style={st.helpText}>
            ✅ El mapeo del tablero se hace en el{" "}
            <Text style={{ fontWeight: "800" }}>Paso 2</Text> para que esta
            pantalla no quede apretada.
          </Text>
        </View>
      </ScrollView>

      <View style={st.bottomBar}>
        <TouchableOpacity
          style={[st.bottomBtn, st.bottomBtnSecondary]}
          onPress={goBack}
          disabled={saving}
        >
          <Text style={[st.bottomBtnText, st.bottomBtnTextSecondary]}>
            Cancelar
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[st.bottomBtn, { backgroundColor: "#6366f1" }]}
          onPress={handleNextMap}
          disabled={saving}
        >
          <Text style={st.bottomBtnText}>Siguiente: Mapear</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[st.bottomBtn, st.bottomBtnPrimary]}
          onPress={handleSaveOnly}
          disabled={saving}
        >
          <Text style={st.bottomBtnText}>
            {saving ? "Guardando..." : isEdit ? "Guardar" : "Crear"}
          </Text>
        </TouchableOpacity>
      </View>
      {
        !ciudadesLoading && (
        <Modal
          visible={cityModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setCityModalVisible(false)}
        >

          <Pressable
            style={st.modalBackdrop}
            onPress={() => setCityModalVisible(false)}
          >
            <Pressable style={st.modalSheet} onPress={() => {}}>
              <View style={st.modalHeader}>
                <Text style={st.modalTitle}>Seleccionar ciudad</Text>
                <TouchableOpacity
                  onPress={() => setCityModalVisible(false)}
                  style={st.modalCloseBtn}
                >
                  <Text style={st.modalCloseText}>Cerrar</Text>
                </TouchableOpacity>
              </View>

              <View style={st.modalListBox}>
                <ScrollView
                  nestedScrollEnabled
                  keyboardShouldPersistTaps="handled"
                >
                  {ciudades.map((city) => {
                    const selected = ciudad?.id_ciudad === city.id_ciudad;
                    return (
                      <TouchableOpacity
                        key={city.id_ciudad}
                        style={[
                          st.modalOption,
                          selected && st.modalOptionSelected,
                        ]}
                        onPress={() => handleSelectCity(city)}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            st.modalOptionText,
                            selected && st.modalOptionTextSelected,
                          ]}
                        >
                          {city.nombre}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              <TouchableOpacity
                style={[st.bottomBtn, st.bottomBtnSecondary, { marginTop: 12 }]}
                onPress={() => setCityModalVisible(false)}
              >
                <Text style={[st.bottomBtnText, st.bottomBtnTextSecondary]}>
                  Cancelar
                </Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>
        )
      }

        
    </View>
  );
}

const st = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 16,
    paddingTop: 18,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 4,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#f9fafb",
    fontSize: 13,
    justifyContent: "center",
  },
  row: { flexDirection: "row", gap: 10 },
  col: { flex: 1 },
  helpText: { fontSize: 12, color: "#6b7280" },

  bottomBar: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 30,
    flexDirection: "row",
    gap: 8,
  },
  bottomBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomBtnPrimary: { backgroundColor: "#2563eb" },
  bottomBtnSecondary: { backgroundColor: "#e5e7eb" },
  bottomBtnText: {
    fontSize: 13,
    color: "#ffffff",
    fontWeight: "600",
  },
  bottomBtnTextSecondary: { color: "#111827" },

  cityChipsRow: { flexDirection: "row", marginBottom: 8 },
  cityChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#d4d4d8",
    backgroundColor: "#f9fafb",
    marginRight: 8,
  },
  cityChipSelected: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
  cityChipText: { fontSize: 12, color: "#374151" },
  cityChipTextSelected: { color: "#ffffff", fontWeight: "600" },

  // Texto del “input” de ciudad (que abre modal)
  cityFieldText: { fontSize: 13, color: "#111827" },
  cityFieldPlaceholder: { color: "#6b7280" },

  // ✅ Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 14,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  modalCloseBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#f3f4f6",
  },
  modalCloseText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111827",
  },
  modalListBox: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    overflow: "hidden",
    maxHeight: 220, // scroll (subir/bajar)
    backgroundColor: "#ffffff",
  },
  modalOption: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  modalOptionSelected: {
    backgroundColor: "#2563eb",
  },
  modalOptionText: {
    fontSize: 13,
    color: "#111827",
  },
  modalOptionTextSelected: {
    color: "#ffffff",
    fontWeight: "700",
  },
});
