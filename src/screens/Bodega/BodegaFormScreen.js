// src/screens/Bodega/BodegaFormScreen.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
} from "react-native";
import { useApp } from "../../store";
import Tablero from "../../components/Tablero/Tablero";

export default function BodegaFormScreen(props) {
  const { route, navigation } = props;
  const { saveBodega } = useApp();

  const editingBodega = route?.params?.bodega || null;
  const isEdit = !!editingBodega;

  const [nombre, setNombre] = useState(editingBodega?.nombre || "");
  const [ciudad, setCiudad] = useState(editingBodega?.ciudad || "");
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

  useEffect(() => {
    if (isEdit) {
      navigation?.setOptions?.({ title: "Editar bodega" });
    } else {
      navigation?.setOptions?.({ title: "Nueva bodega" });
    }
  }, [isEdit, navigation]);

  const goBack = () => {
    if (navigation?.goBack) navigation.goBack();
  };

  const handleSave = async () => {
    if (!nombre.trim()) {
      return Alert.alert("Validación", "Debes ingresar un nombre de bodega.");
    }
    if (!ciudad.trim()) {
      return Alert.alert("Validación", "Debes ingresar la ciudad.");
    }
    if (!direccion.trim()) {
      return Alert.alert("Validación", "Debes ingresar la dirección.");
    }

    const anchoNum = Number(ancho);
    const largoNum = Number(largo);
    const altoNum = Number(alto);

    if (!anchoNum || anchoNum <= 0 || !largoNum || largoNum <= 0) {
      return Alert.alert(
        "Validación",
        'Los campos "Ancho" y "Largo" deben ser números mayores a 0.'
      );
    }
    if (!altoNum || altoNum <= 0) {
      return Alert.alert(
        "Validación",
        'El campo "Altura" debe ser un número mayor a 0.'
      );
    }

    const bodegaPayload = {
      id: editingBodega?.id || null,
      nombre: nombre.trim(),
      ciudad: ciudad.trim(),
      direccion: direccion.trim(),
      ancho: anchoNum,
      largo: largoNum,
      alto: altoNum,
      active,
    };

    try {
      setSaving(true);
      await saveBodega(bodegaPayload);
      Alert.alert(
        "Éxito",
        isEdit
          ? "Bodega actualizada correctamente."
          : "Bodega creada correctamente.",
        [{ text: "OK", onPress: goBack }]
      );
    } catch (err) {
      console.log("[BodegaFormScreen] error save:", err);
      Alert.alert(
        "Error",
        err?.message || "No se pudo guardar la bodega. Intenta nuevamente."
      );
    } finally {
      setSaving(false);
    }
  };

  // números que le pasamos al Tablero
  const anchoTablero =
    Number.isFinite(Number(ancho)) && Number(ancho) > 0 ? Number(ancho) : 0;
  const largoTablero =
    Number.isFinite(Number(largo)) && Number(largo) > 0 ? Number(largo) : 0;

  return (
    <View style={st.screen}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={st.title}>
          {isEdit ? "Editar bodega" : "Nueva bodega"}
        </Text>
        <Text style={st.subtitle}>
          Completa los datos de la bodega y, si quieres, marca el mapa de
          posiciones donde se pueden acomodar ítems.
        </Text>

        {/* Nombre */}
        <Text style={st.label}>Nombre de la bodega</Text>
        <TextInput
          style={st.input}
          value={nombre}
          onChangeText={setNombre}
          placeholder="Ej: Bodega Central"
        />

        {/* Ciudad */}
        <Text style={st.label}>Ciudad</Text>

        {/* Botones para escoger ciudad */}
        <View style={st.cityChipsRow}>
          {["Iquique", "Alto Hospicio"].map((city) => {
            const selected = ciudad === city;
            return (
              <TouchableOpacity
                key={city}
                style={[
                  st.cityChip,
                  selected && st.cityChipSelected,
                ]}
                onPress={() => setCiudad(city)}
              >
                <Text
                  style={[
                    st.cityChipText,
                    selected && st.cityChipTextSelected,
                  ]}
                >
                  {city}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* También puedes escribir otra ciudad si quieres */}
        <TextInput
          style={st.input}
          value={ciudad}
          onChangeText={setCiudad}
          placeholder="Ej: Iquique / Alto Hospicio"
        />

        {/* Dirección */}
        <Text style={st.label}>Dirección</Text>
        <TextInput
          style={st.input}
          value={direccion}
          onChangeText={setDireccion}
          placeholder="Dirección completa"
        />

        {/* Dimensiones */}
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

        {/* Estado activa/inactiva */}
        <View style={[st.row, { alignItems: "center", marginTop: 12 }]}>
          <Text style={[st.label, { marginBottom: 0 }]}>Bodega activa</Text>
          <Switch
            value={active}
            onValueChange={setActive}
            style={{ marginLeft: 12 }}
          />
        </View>

        {/* TABLERO (solo visual) */}
        <View style={{ marginTop: 20 }}>
          <Text style={st.label}>Mapa de posiciones (opcional)</Text>
          <Text style={st.helpText}>
            Marca las posiciones disponibles/bloqueadas. Esto por ahora es solo
            visual; más adelante lo podemos guardar en la base de datos.
          </Text>

          <Tablero ancho={anchoTablero} largo={largoTablero} />
        </View>
      </ScrollView>

      {/* Bottom bar acciones */}
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
          style={[st.bottomBtn, st.bottomBtnPrimary]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={st.bottomBtnText}>
            {saving
              ? "Guardando..."
              : isEdit
              ? "Guardar cambios"
              : "Crear bodega"}
          </Text>
        </TouchableOpacity>
      </View>
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
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  col: {
    flex: 1,
  },
  helpText: {
    fontSize: 11,
    color: "#6b7280",
    marginBottom: 8,
  },
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
  bottomBtnPrimary: {
    backgroundColor: "#2563eb",
  },
  bottomBtnSecondary: {
    backgroundColor: "#e5e7eb",
  },
  bottomBtnText: {
    fontSize: 13,
    color: "#ffffff",
    fontWeight: "600",
  },
  bottomBtnTextSecondary: {
    color: "#111827",
  },

  // estilos para selección de ciudad
  cityChipsRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  cityChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#d4d4d8",
    backgroundColor: "#f9fafb",
    marginRight: 8,
  },
  cityChipSelected: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
  },
  cityChipText: {
    fontSize: 12,
    color: "#374151",
  },
  cityChipTextSelected: {
    color: "#ffffff",
    fontWeight: "600",
  },
});
