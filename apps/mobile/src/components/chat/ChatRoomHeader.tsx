import { ChevronLeft } from "lucide-react-native";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { UserInline } from "../common/UserInline";
import { colors } from "../../lib/theme";

type ChatRoomHeaderProps = {
  avatarUrl: string | null;
  nickname: string;
  onBack: () => void;
  onPressProfile?: (nickname: string) => void;
  right?: ReactNode;
};

// 채팅방 상단 헤더: 뒤로 | 상대 아바타+이름(탭하면 프로필) | 우측 슬롯(메뉴).
export function ChatRoomHeader({
  avatarUrl,
  nickname,
  onBack,
  onPressProfile,
  right,
}: ChatRoomHeaderProps) {
  return (
    <View style={styles.header}>
      <Pressable
        accessibilityLabel="뒤로"
        accessibilityRole="button"
        onPress={onBack}
        style={styles.headerButton}
      >
        <ChevronLeft color={colors.text} size={22} strokeWidth={2.4} />
      </Pressable>

      <UserInline
        avatarSize={34}
        imageUrl={avatarUrl}
        nickname={nickname}
        nicknameSize={16}
        onPress={onPressProfile}
        style={styles.user}
      />

      {right ? (
        <View style={styles.rightSlot}>{right}</View>
      ) : (
        <View style={styles.headerSpacer} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 6,
  },
  headerButton: {
    height: 40,
    width: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: colors.white,
  },
  user: {
    flex: 1,
    marginHorizontal: 8,
  },
  headerSpacer: {
    height: 40,
    width: 40,
  },
  rightSlot: {
    minWidth: 40,
    height: 40,
    alignItems: "flex-end",
    justifyContent: "center",
  },
});
