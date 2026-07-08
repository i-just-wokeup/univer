import { Plus, Trash2 } from "lucide-react-native";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { MAX_PROFILE_LINKS } from "../../features/profile/useProfileEdit";
import { colors } from "../../lib/theme";

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

const styles = StyleSheet.create({
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
    color: colors.text,
    fontSize: 13,
    fontWeight: "900",
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    color: colors.text,
    fontSize: 14,
    fontWeight: "800",
  },
  addLinkButton: {
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  addLinkText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: "900",
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
    backgroundColor: colors.white,
  },
  helper: {
    marginTop: 7,
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
  },
  error: {
    color: colors.danger,
  },
  pressed: {
    opacity: 0.72,
  },
  disabled: {
    opacity: 0.45,
  },
});
