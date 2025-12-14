/* cubicajeMobile-master/src/features/bodega3d/BodegaItemsList.js */

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  FlatList,
} from "react-native";

function PriorityBadge({ value }) {
  const label = value ? `Prio ${value}` : "Sin prio";
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{label}</Text>
    </View>
  );
}

function ItemRow({ item, selected, priority, onSelect, onTogglePriority }) {
  return (
    <Pressable
      onPress={() => onSelect(item.nombre)}
      style={[styles.row, selected && styles.rowSelected]}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>
          {item.nombre} <Text style={styles.muted}>x{item.cantidad}</Text>
        </Text>

        <Text style={styles.sub}>
          {item.w}×{item.l}×{item.h} m • {item.clase || "N/D"} • Cat{" "}
          {item.categoriaId ?? "-"}
        </Text>
      </View>

      <Pressable onPress={() => onTogglePriority(item.id_item)} style={styles.prioBtn}>
        <PriorityBadge value={priority} />
      </Pressable>
    </Pressable>
  );
}

export default function BodegaItemsList({
  items,
  selectedItemName,
  onSelectItem,
  prioritySelection,
  onTogglePriority,
  onApplyRecubicaje,
  loadingReorden,

  // ✅ Parte 12
  onPreviewCompactacion,
  onEjecutarCompactacion,
  movsPreview,
  loadingTetris,
}) {
  const preview = Array.isArray(movsPreview) ? movsPreview : [];

  const disabled = !!(loadingReorden || loadingTetris);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Ítems en esta bodega</Text>

      <View style={styles.listContainer}>
        <FlatList
          data={items}
          keyExtractor={(it) => String(it.id_item)}
          renderItem={({ item }) => (
            <ItemRow
              item={item}
              selected={selectedItemName === item.nombre}
              priority={prioritySelection?.[item.id_item] ?? 0}
              onSelect={onSelectItem}
              onTogglePriority={onTogglePriority}
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          ListEmptyComponent={
            <Text style={styles.empty}>No hay ítems en esta bodega.</Text>
          }
        />
      </View>

      <Pressable
        onPress={onApplyRecubicaje}
        disabled={disabled}
        style={[styles.actionBtn, disabled && styles.actionBtnDisabled]}
      >
        {disabled ? (
          <ActivityIndicator />
        ) : (
          <Text style={styles.actionText}>Recubicar por prioridad</Text>
        )}
      </Pressable>

      {/* Compactación tetris */}
      <View style={styles.actionsRow}>
        <Pressable
          onPress={onPreviewCompactacion}
          disabled={disabled}
          style={[styles.secondaryBtn, disabled && styles.actionBtnDisabled, { display: "none" }]}
        >
          {loadingTetris ? (
            <ActivityIndicator />
          ) : (
            <Text style={styles.secondaryText}>Preview compactación</Text>
          )}
        </Pressable>


        <Pressable
          onPress={onEjecutarCompactacion}
          disabled={disabled}
          style={[styles.dangerBtn, disabled && styles.actionBtnDisabled]}
        >
          {loadingTetris ? (
            <ActivityIndicator />
          ) : (
            <Text style={styles.dangerText}>Ejecutar compactación</Text>
          )}
        </Pressable>
      </View>

      {preview.length > 0 && (
        <View style={styles.previewBox}>
          <Text style={styles.previewTitle}>
            Movimientos (preview): {preview.length}
          </Text>

          {preview.slice(0, 10).map((m, idx) => (
            <Text key={idx} style={styles.previewLine}>
              item {m.id_item}: {m.from_ubicacion} → {m.to_ubicacion} (qty {m.qty})
            </Text>
          ))}

          {preview.length > 10 && (
            <Text style={styles.previewMore}>... mostrando 10</Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#020817",
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  header: { color: "#e5e7eb", fontSize: 14, marginBottom: 8, fontWeight: "600" },

  listContainer: {
    maxHeight: 170,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "rgba(15,23,42,0.6)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  rowSelected: {
    backgroundColor: "rgba(250,250,250,0.06)",
  },

  title: { color: "#e5e7eb", fontSize: 13, fontWeight: "600" },
  sub: { color: "rgba(229,231,235,0.75)", fontSize: 11, marginTop: 2 },
  muted: { color: "rgba(229,231,235,0.65)" },

  sep: { height: 1, backgroundColor: "rgba(255,255,255,0.06)" },

  empty: { color: "rgba(229,231,235,0.75)", padding: 12, fontSize: 12 },

  prioBtn: { marginLeft: 10 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  badgeText: { color: "#e5e7eb", fontSize: 11, fontWeight: "600" },

  actionBtn: {
    marginTop: 10,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#22c55e",
  },
  actionBtnDisabled: { opacity: 0.7 },
  actionText: { color: "#0b1220", fontWeight: "800" },

  // Parte 12
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  secondaryBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#3b82f6",
  },
  secondaryText: { color: "#0b1220", fontWeight: "800" },

  dangerBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#f59e0b",
  },
  dangerText: { color: "#0b1220", fontWeight: "800" },

  previewBox: {
    marginTop: 10,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(15,23,42,0.6)",
  },
  previewTitle: {
    color: "#e5e7eb",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 6,
  },
  previewLine: { color: "rgba(229,231,235,0.85)", fontSize: 11, marginBottom: 2 },
  previewMore: { color: "rgba(229,231,235,0.65)", fontSize: 11, marginTop: 4 },
});
