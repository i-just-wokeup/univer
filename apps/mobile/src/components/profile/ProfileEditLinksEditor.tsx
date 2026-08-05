import { Plus, Trash2 } from "lucide-react-native";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { MAX_PROFILE_LINKS } from "../../features/profile/useProfileEdit";
import { noAutofillTextInputProps } from "../../lib/textInput";
import { useTheme, useThemedStyles, fontSize, fontWeight } from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";

type ProfileEditLinksEditorProps = {
  hasInvalidLink: boolean;
  links: string[];
  onAddLink: () => void;
  onChangeLink: (index: number, value: string) => void;
  onRemoveLink: (index: number) => void;
};

export function ProfileEditLinksEditor({
  hasInvalidLink,
  links,
  onAddLink,
  onChangeLink,
  onRemoveLink,
}: ProfileEditLinksEditorProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const canAdd = links.length < MAX_PROFILE_LINKS;

  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>대표 링크</Text>
        <Pressable
          accessibilityRole="button"
          disabled={!canAdd}
          onPress={onAddLink}
          style={({ pressed }) => [
            styles.addLinkButton,
            pressed ? styles.pressed : null,
            !canAdd ? styles.disabled : null,
          ]}
        >
          <Plus color={colors.accent} size={16} strokeWidth={2.6} />
          <Text style={styles.addLinkText}>추가</Text>
        </Pressable>
      </View>

      {links.map((link, index) => (
        <View key={index} style={styles.linkRow}>
          <TextInput
            {...noAutofillTextInputProps}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            onChangeText={(value) => onChangeLink(index, value)}
            placeholder="https://example.com"
            placeholderTextColor={colors.textFaint}
            style={[styles.input, styles.linkInput]}
            value={link}
          />
          <Pressable
            accessibilityRole="button"
            onPress={() => onRemoveLink(index)}
            style={({ pressed }) => [
              styles.removeLinkButton,
              pressed ? styles.pressed : null,
            ]}
          >
            <Trash2 color={colors.textFaint} size={17} strokeWidth={2.4} />
          </Pressable>
        </View>
      ))}

      {hasInvalidLink ? (
        <Text style={[styles.helper, styles.error]}>
          올바른 링크를 입력해주세요.
        </Text>
      ) : null}
    </View>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  field: {
    marginTop: 20,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  label: {
    marginBottom: 8,
    color: c.text,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.heavy,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 16,
    backgroundColor: c.navBackground,
    paddingHorizontal: 14,
    color: c.text,
    fontSize: fontSize.bodySmall,
    fontWeight: fontWeight.bold,
  },
  addLinkButton: {
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  addLinkText: {
    color: c.accent,
    fontSize: fontSize.label,
    fontWeight: fontWeight.heavy,
  },
  linkRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  linkInput: {
    flex: 1,
  },
  removeLinkButton: {
    height: 42,
    width: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: c.navBackground,
  },
  helper: {
    marginTop: 7,
    color: c.muted,
    fontSize: fontSize.label,
    fontWeight: fontWeight.bold,
  },
  error: {
    color: c.danger,
  },
  pressed: {
    opacity: 0.72,
  },
  disabled: {
    opacity: 0.45,
  },
});
