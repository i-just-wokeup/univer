import { StyleSheet, Text, View } from "react-native";

import { useThemedStyles, fontSize, fontWeight } from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";

type ProfileEditReadonlyFieldProps = {
  label: string;
  value: string;
};

export function ProfileEditReadonlyField({
  label,
  value,
}: ProfileEditReadonlyFieldProps) {
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.readOnlyText}>{value}</Text>
    </View>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  field: {
    marginTop: 20,
  },
  label: {
    marginBottom: 8,
    color: c.text,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.heavy,
  },
  readOnlyText: {
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: c.accentTintBg,
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: c.muted,
    fontSize: fontSize.bodySmall,
    fontWeight: fontWeight.bold,
  },
});
