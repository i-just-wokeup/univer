import { StyleSheet, Text, TextInput, View } from "react-native";

import { colors } from "../../lib/theme";

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

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    backgroundColor: colors.card,
    padding: 16,
  },
  sectionTitle: {
    marginBottom: 12,
    color: colors.text,
    fontSize: 15,
    fontWeight: "900",
  },
  textInput: {
    minHeight: 132,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: colors.white,
    color: colors.text,
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 23,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
});
