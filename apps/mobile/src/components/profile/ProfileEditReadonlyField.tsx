import { StyleSheet, Text, View } from "react-native";

import { colors } from "../../lib/theme";

type ProfileEditReadonlyFieldProps = {
  label: string;
  value: string;
};

export function ProfileEditReadonlyField({
  label,
  value,
}: ProfileEditReadonlyFieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.readOnlyText}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    marginTop: 20,
  },
  label: {
    marginBottom: 8,
    color: colors.text,
    fontSize: 13,
    fontWeight: "900",
  },
  readOnlyText: {
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: "rgba(124,58,237,0.06)",
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: colors.muted,
    fontSize: 14,
    fontWeight: "800",
  },
});
