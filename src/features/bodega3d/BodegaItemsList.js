// cubicajeMobile-master/src/features/bodega3d/BodegaItemsList.js
import React from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

export default function BodegaItemsList({
  items,
  selectedItemName,
  onSelectItem,
  prioritySelection = {},
  onTogglePriority,
  onApplyRecubicaje,
  loadingReorden,
}) {
  // si quieres debug, deja estos logs; si no, puedes borrarlos
  console.log("[BodegaItemsList] items:", items);
  console.log("[BodegaItemsList] prioritySelection:", prioritySelection);

  const renderPriorityLabel = (id_item) => {
    const prio = prioritySelection[id_item] ?? 0;
    let text = "Sin prio";
    let style = styles.prioNone;

    if (prio === 3) {
      text = "Prio 3 (alta)";
      style = styles.prioHigh;
    } else if (prio === 2) {
      text = "Prio 2 (media)";
      style = styles.prioMedium;
    } else if (prio === 1) {
      text = "Prio 1 (baja)";
      style = styles.prioLow;
    }

    return (
      <TouchableOpacity
        onPress={() => {
          onTogglePriority && onTogglePriority(id_item);
        }}
        style={[styles.prioBadge, style]}
      >
        <Text style={styles.prioBadgeText}>{text}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.listContainer}>
      <Text style={styles.listTitle}>Ítems en esta bodega</Text>

      <FlatList
        data={items}
        keyExtractor={(item, index) => `${item.id_item}-${index}`}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const isSelected = item.nombre === selectedItemName;
          return (
            <View style={styles.itemWrapper}>
              {/* chip de selección (resalta en 3D) */}
              <TouchableOpacity
                onPress={() => onSelectItem && onSelectItem(item.nombre)}
                style={[
                  styles.itemChip,
                  isSelected && styles.itemChipSelected,
                ]}
              >
                <Text style={styles.itemChipText}>{item.nombre}</Text>
                <Text style={styles.itemChipQty}>x{item.cantidad}</Text>
              </TouchableOpacity>

              {/* badge de prioridad */}
              {renderPriorityLabel(item.id_item)}
            </View>
          );
        }}
      />

      {/* Botón para aplicar recubicaje por prioridad */}
      <View style={styles.footer}>
        <TouchableOpacity
          onPress={onApplyRecubicaje}
          disabled={loadingReorden}
          style={[
            styles.recubicBtn,
            loadingReorden && styles.recubicBtnDisabled,
          ]}
        >
          <Text style={styles.recubicBtnText}>
            {loadingReorden ? "Reubicando..." : "Recubicar por prioridad"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  listContainer: {
    paddingTop: 8,
    paddingBottom: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#1f2937",
    backgroundColor: "#020817",
  },
  listTitle: {
    color: "#e5e7eb",
    fontSize: 12,
    marginLeft: 12,
    marginBottom: 4,
  },
  listContent: {
    paddingHorizontal: 8,
    paddingBottom: 4,
  },
  itemWrapper: {
    alignItems: "center",
    marginHorizontal: 4,
  },
  itemChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#374151",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#020617",
  },
  itemChipSelected: {
    borderColor: "#facc15",
    backgroundColor: "#1f2937",
  },
  itemChipText: {
    color: "#e5e7eb",
    fontSize: 12,
    marginRight: 6,
  },
  itemChipQty: {
    color: "#9ca3af",
    fontSize: 11,
  },

  // prioridad
  prioBadge: {
    marginTop: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  prioBadgeText: {
    fontSize: 10,
    color: "#e5e7eb",
  },
  prioNone: {
    backgroundColor: "#111827",
  },
  prioHigh: {
    backgroundColor: "#b91c1c",
  },
  prioMedium: {
    backgroundColor: "#ca8a04",
  },
  prioLow: {
    backgroundColor: "#15803d",
  },

  // botón recubicaje
  footer: {
    marginTop: 8,
    paddingHorizontal: 16,
  },
  recubicBtn: {
    borderRadius: 999,
    paddingVertical: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#22c55e",
  },
  recubicBtnDisabled: {
    opacity: 0.6,
  },
  recubicBtnText: {
    fontSize: 13,
    color: "#022c22",
    fontWeight: "600",
  },
});
