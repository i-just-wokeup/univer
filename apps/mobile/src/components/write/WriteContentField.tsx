import { StyleSheet, Text, TextInput, View } from "react-native";

import { useTheme, useThemedStyles, fontSize, fontWeight } from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";

type WriteContentFieldProps = {
  content: string;
  disabled: boolean;
  onChangeContent: (value: string) => void;
};

export function WriteContentField({
  content,
  disabled,
  onChangeContent,
}: WriteContentFieldProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>내용</Text>
      <TextInput
        editable={!disabled}
        multiline
        onChangeText={onChangeContent}
        placeholder="지금 무슨 일이 있었나요?"
        placeholderTextColor={colors.textFaint}
        style={styles.textInput}
        textAlignVertical="top"
        value={content}
      />
    </View>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  card: {
    borderRadius: 22,
    backgroundColor: c.card,
    padding: 16,
  },
  sectionTitle: {
    marginBottom: 12,
    color: c.text,
    fontSize: fontSize.body,
    fontWeight: fontWeight.heavy,
  },
  textInput: {
    minHeight: 132,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 18,
    backgroundColor: c.navBackground,
    color: c.text,
    fontSize: fontSize.bodyLarge,
    fontWeight: fontWeight.medium,
    lineHeight: 23,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
});
