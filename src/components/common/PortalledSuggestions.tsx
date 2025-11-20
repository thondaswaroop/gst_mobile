// src/components/common/PortalledSuggestions.tsx
import React from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Platform } from "react-native";

type SuggestionItem = { id: string; description: string; meta?: any };

type Props = {
  items: SuggestionItem[];
  visible: boolean;
  onSelect: (id: string, description?: string, meta?: any) => void;
  style?: any;
};

/**
 * Simple RN suggestions list (inline). Use in modals or below inputs.
 * Kept minimal — does not try to portal to document.body (web-only).
 */
export default function PortalledSuggestions({ items, visible, onSelect, style }: Props) {
  if (!visible) return null;

  return (
    <View style={[styles.container, style]}>
      <FlatList
        data={items}
        keyExtractor={(it) => it.id}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>No results</Text></View>}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.row} onPress={() => onSelect(item.id, item.description, item.meta)}>
            <Text style={styles.text}>{item.description}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Platform.OS === "android" ? "#fff" : "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    maxHeight: 260,
    overflow: "hidden",
  },
  row: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  text: { fontSize: 14, color: "#111827" },
  empty: { padding: 12, alignItems: "center" },
  emptyText: { color: "#6B7280" },
});
