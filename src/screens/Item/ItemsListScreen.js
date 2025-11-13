// src/screens/Item/ItemsListScreen.js
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert,
  Modal,
  StyleSheet,
} from "react-native";
import { useApp, clampInt, SIZE_CLASSES } from "../../store";

export default function ItemsListScreen(props) {
  const {
    goToMenu,
    goToItemFormNew,
    goToItemFormEdit,
    navigation,
  } = props;

  const { bodegas, items, deleteItem, moveItemPartial, saveItem } = useApp();

  const [filterBodegaId, setFilterBodegaId] = useState(null);
  const [locationFilter, setLocationFilter] = useState("all");
  const [filterClass, setFilterClass] = useState(null);

  const [filterModalVisible, setFilterModalVisible] = useState(false);

  const [moveDialog, setMoveDialog] = useState({
    visible: false,
    item: null,
    fromBodegaId: null,
    toBodegaId: null,
    cantidad: "",
  });

  const [removeDialog, setRemoveDialog] = useState({
    visible: false,
    item: null,
    cantidad: "",
  });

  // ---- helpers navegación, funcionan con props o con navigation ----
  const irMenu = () => {
    if (typeof goToMenu === "function") return goToMenu();
    if (navigation?.navigate) return navigation.navigate("Menu");
  };

  const irItemFormNew = () => {
    if (typeof goToItemFormNew === "function") return goToItemFormNew();
    if (navigation?.navigate)
      return navigation.navigate("ItemForm", { mode: "new" });
  };

  const irItemFormEdit = (item) => {
    if (typeof goToItemFormEdit === "function")
      return goToItemFormEdit(item);
    if (navigation?.navigate)
      return navigation.navigate("ItemForm", { item });
  };

  const filtered = useMemo(() => {
    let list = items.slice();

    if (filterBodegaId) {
      list = list.filter((it) => it.bodegaId === filterBodegaId);
    } else {
      if (locationFilter === "with") {
        list = list.filter((it) => !!it.bodegaId);
      } else if (locationFilter === "without") {
        list = list.filter((it) => !it.bodegaId);
      }
    }

    if (filterClass) {
      list = list.filter(
        (it) => (it.clase || "N/D") === filterClass
      );
    }

    list.sort((a, b) =>
      (a.nombre || "").localeCompare(b.nombre || "")
    );
    return list;
  }, [items, filterBodegaId, locationFilter, filterClass]);

  const openMoveDialog = (it) => {
    const disponibles = clampInt(it.cantidad, 1);
    setMoveDialog({
      visible: true,
      item: it,
      fromBodegaId: it.bodegaId ?? null,
      toBodegaId: null,
      cantidad: disponibles > 0 ? "1" : "",
    });
  };

  const confirmMove = async () => {
    const { item, fromBodegaId, toBodegaId, cantidad } = moveDialog;
    if (!item) {
      setMoveDialog({
        visible: false,
        item: null,
        fromBodegaId: null,
        toBodegaId: null,
        cantidad: "",
      });
      return;
    }

    const total = clampInt(item.cantidad, 1);
    const cant = parseInt(
      (cantidad || "").replace(/[^0-9]/g, "") || "0",
      10
    );

    if (!cant || cant <= 0) {
      return Alert.alert(
        "Cantidad inválida",
        "Ingresa una cantidad mayor o igual a 1."
      );
    }
    if (cant > total) {
      return Alert.alert(
        "Cantidad inválida",
        `Solo hay ${total} unidades disponibles.`
      );
    }
    if (!toBodegaId) {
      return Alert.alert(
        "Falta destino",
        "Selecciona la bodega destino."
      );
    }

    try {
      await moveItemPartial({
        id: item.id,
        fromBodegaId,
        toBodegaId,
        cantidad: cant,
      });
    } catch {}

    setMoveDialog({
      visible: false,
      item: null,
      fromBodegaId: null,
      toBodegaId: null,
      cantidad: "",
    });
  };

  const openRemoveDialog = (it) => {
    setRemoveDialog({
      visible: true,
      item: it,
      cantidad: "",
    });
  };

  const confirmRemove = async () => {
    const { item, cantidad } = removeDialog;
    if (!item) {
      setRemoveDialog({
        visible: false,
        item: null,
        cantidad: "",
      });
      return;
    }

    const total = clampInt(item.cantidad, 1);
    const cant = parseInt(
      (cantidad || "").replace(/[^0-9]/g, "") || "0",
      10
    );

    if (!cant || cant <= 0) {
      return Alert.alert(
        "Cantidad inválida",
        "Ingresa una cantidad mayor o igual a 1."
      );
    }

    if (cant >= total) {
      await deleteItem(item.id);
    } else {
      await saveItem({
        ...item,
        cantidad: total - cant,
      });
    }

    setRemoveDialog({
      visible: false,
      item: null,
      cantidad: "",
    });
  };

  const renderCard = ({ item: it }) => {
    const b = bodegas.find((x) => x.id === it.bodegaId);
    const cant = clampInt(it.cantidad, 1);
    const esSuelto = !it.bodegaId;

    const pesoUnit = Number(it.peso) || 0;
    const pesoTotal = pesoUnit * cant;

    return (
      <View style={st.card}>
        <View style={st.cardTitleRow}>
          <Text
            style={st.cardTitle}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {it.nombre}
          </Text>
          <Text style={st.badge}>{it.clase || "N/D"}</Text>
          {esSuelto && (
            <Text style={[st.badge, { color: "#b45309" }]}>
              {" "}
              Sin bodega
            </Text>
          )}
        </View>

        <Text style={st.cardLine}>Cantidad: {cant} uds</Text>
        <Text style={st.cardLine}>
          Bodega: {b ? b.nombre : "(sin asignar)"}
        </Text>
        <Text style={st.cardLine}>
          Peso unitario:{" "}
          {isFinite(pesoUnit)
            ? pesoUnit.toFixed(2)
            : "0.00"}{" "}
          kg · Peso total:{" "}
          {isFinite(pesoTotal)
            ? pesoTotal.toFixed(2)
            : "0.00"}{" "}
          kg
        </Text>

        <View style={st.section}>
          <Text style={st.sectionLabel}>Dimensiones (m)</Text>
          <Text style={st.cardLine}>Ancho: {it.ancho}</Text>
          <Text style={st.cardLine}>Largo: {it.largo}</Text>
          <Text style={st.cardLine}>Altura: {it.alto}</Text>
        </View>

        <View style={[st.row, { gap: 8, marginTop: 8 }]}>
          <TouchableOpacity
            style={[st.btn, st.btnPrimaryOutline]}
            onPress={() => irItemFormEdit(it)}
          >
            <Text style={st.btnPrimaryOutlineTxt}>Editar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[st.btn, st.btnPrimary]}
            onPress={() => openMoveDialog(it)}
          >
            <Text style={st.btnTxt}>
              {esSuelto ? "Asignar bodega" : "Mover"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[st.btn, st.btnDanger]}
            onPress={() => openRemoveDialog(it)}
          >
            <Text style={st.btnTxt}>Sacar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const currentFilterLabel = () => {
    if (filterBodegaId) {
      const b = bodegas.find((x) => x.id === filterBodegaId);
      return b ? `Bodega: ${b.nombre}` : "Bodega (desconocida)";
    }
    if (locationFilter === "with") return "Items con bodega";
    if (locationFilter === "without")
      return "Items sin bodega";
    return "Todas las bodegas";
  };

  return (
    <View style={st.screen}>
      <View style={st.headerRow}>
        <View>
          <Text style={st.title}>Ítems</Text>
          <Text style={st.subtitle}>
            Lista, filtros y movimientos de inventario.
          </Text>
        </View>
      </View>

      <View style={[st.row, { gap: 8 }]}>
        <TouchableOpacity
          style={[st.selectorBtn, { flex: 1 }]}
          onPress={() => setFilterModalVisible(true)}
        >
          <Text style={st.selectorText}>
            {currentFilterLabel()}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={st.clearFilterBtn}
          onPress={() => {
            setFilterBodegaId(null);
            setLocationFilter("all");
            setFilterClass(null);
          }}
        >
          <Text style={st.clearFilterText}>X</Text>
        </TouchableOpacity>
      </View>

      <View
        style={[
          st.row,
          { flexWrap: "wrap", gap: 8, marginVertical: 4 },
        ]}
      >
        {[null, ...SIZE_CLASSES.map((c) => c.key)].map((k) => {
          const active =
            (k === null && filterClass === null) ||
            filterClass === k;
          const label = k || "Todas las clases";
          return (
            <TouchableOpacity
              key={String(k)}
              style={[st.pill, active && st.pillA]}
              onPress={() => setFilterClass(k)}
            >
              <Text style={{ fontWeight: "700" }}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(it) =>
          String(it.id) + "-" + String(it.bodegaId ?? "x")
        }
        renderItem={renderCard}
        ListEmptyComponent={
          <Text
            style={{
              textAlign: "center",
              color: "#64748b",
              marginTop: 20,
            }}
          >
            No hay ítems para los filtros.
          </Text>
        }
        contentContainerStyle={{ paddingBottom: 140 }}
      />

      {/* BARRA INFERIOR */}
      <View style={st.bottomBar}>
        <TouchableOpacity
          style={st.bottomBtn}
          onPress={irMenu}
        >
          <Text style={st.bottomBtnText}>Menú principal</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[st.bottomBtn, st.bottomBtnActive]}
          disabled
        >
          <Text
            style={[
              st.bottomBtnText,
              st.bottomBtnTextActive,
            ]}
          >
            Lista de ítems
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={st.bottomBtn}
          onPress={irItemFormNew}
        >
          <Text style={st.bottomBtnText}>Agregar ítem</Text>
        </TouchableOpacity>
      </View>

      {/* --- Modales --- */}
      {/* MODAL FILTRO BODEGA */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setFilterModalVisible(false)
        }
      >
        <View style={st.modalBackdrop}>
          <View style={st.modalBox}>
            <Text style={st.modalTitle}>
              Filtrar por bodega
            </Text>

            <FlatList
              style={{ marginTop: 8, maxHeight: 260 }}
              data={[
                {
                  type: "option",
                  key: "all",
                  label:
                    "Todas las bodegas (todos los ítems)",
                },
                {
                  type: "option",
                  key: "with",
                  label: "Items con bodega",
                },
                {
                  type: "option",
                  key: "without",
                  label: "Items sin bodega",
                },
                ...bodegas.map((b) => ({
                  type: "bodega",
                  key: `b-${b.id}`,
                  id: b.id,
                  label: b.nombre,
                })),
              ]}
              keyExtractor={(item) => item.key}
              renderItem={({ item }) => {
                if (item.type === "option") {
                  return (
                    <TouchableOpacity
                      style={st.destItem}
                      onPress={() => {
                        if (item.key === "all") {
                          setFilterBodegaId(null);
                          setLocationFilter("all");
                        } else if (
                          item.key === "with"
                        ) {
                          setFilterBodegaId(null);
                          setLocationFilter("with");
                        } else if (
                          item.key === "without"
                        ) {
                          setFilterBodegaId(null);
                          setLocationFilter("without");
                        }
                        setFilterModalVisible(false);
                      }}
                    >
                      <Text style={st.destItemText}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                }

                return (
                  <TouchableOpacity
                    style={st.destItem}
                    onPress={() => {
                      setFilterBodegaId(item.id);
                      setLocationFilter("all");
                      setFilterModalVisible(false);
                    }}
                  >
                    <Text style={st.destItemText}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />

            <View
              style={[st.row, { marginTop: 12 }]}
            >
              <TouchableOpacity
                style={[st.btn, st.btnDanger]}
                onPress={() =>
                  setFilterModalVisible(false)
                }
              >
                <Text style={st.btnTxt}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL MOVER */}
      <Modal
        visible={moveDialog.visible}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setMoveDialog({
            visible: false,
            item: null,
            fromBodegaId: null,
            toBodegaId: null,
            cantidad: "",
          })
        }
      >
        <View style={st.modalBackdrop}>
          <View style={st.modalBox}>
            <Text style={st.modalTitle}>Mover ítem</Text>
            {moveDialog.item && (
              <>
                <Text style={st.modalText}>
                  {moveDialog.item.nombre}
                </Text>
                <Text style={st.modalText}>
                  Origen:{" "}
                  {moveDialog.fromBodegaId
                    ? bodegas.find(
                        (b) =>
                          b.id ===
                          moveDialog.fromBodegaId
                      )?.nombre
                    : "Sin bodega"}
                </Text>
                <Text style={st.modalText}>
                  Disponible:{" "}
                  {clampInt(
                    moveDialog.item.cantidad,
                    1
                  )}{" "}
                  uds
                </Text>

                <Text
                  style={[
                    st.label,
                    { marginTop: 8 },
                  ]}
                >
                  Cantidad a mover
                </Text>
                <TextInput
                  style={st.input}
                  keyboardType="numeric"
                  placeholder="Ej: 5"
                  value={moveDialog.cantidad}
                  onChangeText={(v) => {
                    const only = v.replace(
                      /[^0-9]/g,
                      ""
                    );
                    setMoveDialog((prev) => ({
                      ...prev,
                      cantidad: only,
                    }));
                  }}
                />

                <Text
                  style={[
                    st.label,
                    {
                      marginTop: 10,
                      marginBottom: 4,
                    },
                  ]}
                >
                  Bodega destino
                </Text>

                <View
                  style={{
                    maxHeight: 180,
                    borderWidth: 1,
                    borderColor: "#e5e7eb",
                    borderRadius: 10,
                    overflow: "hidden",
                  }}
                >
                  <FlatList
                    data={bodegas.filter(
                      (b) =>
                        b.id !==
                        moveDialog.fromBodegaId
                    )}
                    keyExtractor={(b) =>
                      String(b.id)
                    }
                    renderItem={({ item: b }) => {
                      const selected =
                        moveDialog.toBodegaId === b.id;
                      return (
                        <TouchableOpacity
                          style={[
                            st.destItem,
                            selected &&
                              st.destItemSelected,
                          ]}
                          onPress={() =>
                            setMoveDialog(
                              (prev) => ({
                                ...prev,
                                toBodegaId: b.id,
                              })
                            )
                          }
                        >
                          <Text
                            style={[
                              st.destItemText,
                              selected &&
                                st.destItemTextSelected,
                            ]}
                          >
                            {b.nombre}
                          </Text>
                        </TouchableOpacity>
                      );
                    }}
                    ListEmptyComponent={
                      <Text
                        style={{
                          padding: 10,
                          fontSize: 12,
                          color: "#6b7280",
                        }}
                      >
                        No hay bodegas
                        disponibles como
                        destino.
                      </Text>
                    }
                  />
                </View>
              </>
            )}

            <View
              style={[
                st.row,
                { marginTop: 12, gap: 8 },
              ]}
            >
              <TouchableOpacity
                style={[st.btn, st.btnDanger]}
                onPress={() =>
                  setMoveDialog({
                    visible: false,
                    item: null,
                    fromBodegaId: null,
                    toBodegaId: null,
                    cantidad: "",
                  })
                }
              >
                <Text style={st.btnTxt}>
                  Cancelar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[st.btn, st.btnPrimary]}
                onPress={confirmMove}
              >
                <Text style={st.btnTxt}>
                  Confirmar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL SACAR */}
      <Modal
        visible={removeDialog.visible}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setRemoveDialog({
            visible: false,
            item: null,
            cantidad: "",
          })
        }
      >
        <View style={st.modalBackdrop}>
          <View style={st.modalBox}>
            <Text style={st.modalTitle}>
              Sacar unidades
            </Text>
            {removeDialog.item && (
              <>
                <Text style={st.modalText}>
                  {removeDialog.item.nombre}
                </Text>
                <Text style={st.modalText}>
                  Cantidad disponible:{" "}
                  {clampInt(
                    removeDialog.item.cantidad,
                    1
                  )}{" "}
                  uds
                </Text>
                <Text
                  style={[
                    st.label,
                    { marginTop: 8 },
                  ]}
                >
                  Cantidad a sacar
                </Text>
                <TextInput
                  style={st.input}
                  keyboardType="numeric"
                  placeholder="Ej: 3"
                  value={removeDialog.cantidad}
                  onChangeText={(v) => {
                    const only = v.replace(
                      /[^0-9]/g,
                      ""
                    );
                    setRemoveDialog((prev) => ({
                      ...prev,
                      cantidad: only,
                    }));
                  }}
                />
              </>
            )}

            <View
              style={[
                st.row,
                { marginTop: 12, gap: 8 },
              ]}
            >
              <TouchableOpacity
                style={[st.btn, st.btnDanger]}
                onPress={() =>
                  setRemoveDialog({
                    visible: false,
                    item: null,
                    cantidad: "",
                  })
                }
              >
                <Text style={st.btnTxt}>
                  Cancelar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[st.btn, st.btnPrimary]}
                onPress={confirmRemove}
              >
                <Text style={st.btnTxt}>
                  Confirmar
                </Text>
              </TouchableOpacity>
            </View>
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
    paddingBottom: 140,
  },
  headerRow: { marginBottom: 8 },
  title: { fontSize: 20, fontWeight: "700", color: "#111827" },
  subtitle: { fontSize: 12, color: "#6b7280" },
  card: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  cardTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: "#1e293b",
  },
  cardLine: { fontSize: 13, color: "#64748b", marginTop: 4 },
  badge: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: "600",
  },
  section: { marginTop: 6 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  btn: {
    flex: 1,
    padding: 9,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  btnPrimary: { backgroundColor: "#2563eb" },
  btnPrimaryOutline: {
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#2563eb",
  },
  btnPrimaryOutlineTxt: {
    color: "#2563eb",
    fontWeight: "700",
    fontSize: 11,
  },
  btnDanger: { backgroundColor: "#dc2626" },
  btnTxt: { color: "#fff", fontWeight: "700", fontSize: 11 },
  selectorBtn: {
    borderWidth: 1,
    borderColor: "#d4d4d8",
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#fff",
    marginBottom: 4,
  },
  selectorText: {
    color: "#111827",
    fontWeight: "600",
    fontSize: 12,
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
    marginBottom: 4,
  },
  clearFilterText: { color: "#fff", fontWeight: "800" },
  label: { color: "#475569", fontSize: 12, marginTop: 2 },
  input: {
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 10,
    padding: 8,
    backgroundColor: "#fff",
    marginTop: 4,
    fontSize: 12,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    width: "88%",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
    color: "#111827",
  },
  modalText: { fontSize: 13, color: "#4b5563", marginTop: 2 },
  destItem: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  destItemSelected: { backgroundColor: "#e0f2fe" },
  destItemText: { fontSize: 13, color: "#111827" },
  destItemTextSelected: {
    fontWeight: "700",
    color: "#0369a1",
  },
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
  bottomBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomBtnActive: { backgroundColor: "#2563eb" },
  bottomBtnText: {
    fontSize: 10.5,
    color: "#6b7280",
    fontWeight: "500",
  },
  bottomBtnTextActive: {
    color: "#ffffff",
    fontWeight: "600",
  },
});
