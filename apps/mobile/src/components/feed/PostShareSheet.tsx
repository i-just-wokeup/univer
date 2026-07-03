import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { PostShareTarget } from "../../features/chat/usePostShare";
import { colors } from "../../lib/theme";
import { SearchInput } from "../search/SearchInput";
import { UserInline } from "../common/UserInline";

type PostShareSheetProps = {
  errorMessage: string | null;
  isLoading: boolean;
  isOpen: boolean;
  isSearching: boolean;
  onClose: () => void;
  onQueryChange: (query: string) => void;
  onSelectTarget: (target: PostShareTarget) => void;
  query: string;
  sendingTargetId: string | null;
  targets: PostShareTarget[];
};

function getSourceLabel(source: PostShareTarget["source"]) {
  if (source === "conversation") {
    return "대화";
  }

  if (source === "crew") {
    return "크루";
  }

  return "검색";
}

export function PostShareSheet({
  errorMessage,
  isLoading,
  isOpen,
  isSearching,
  onClose,
  onQueryChange,
  onSelectTarget,
  query,
  sendingTargetId,
  targets,
}: PostShareSheetProps) {
  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      transparent
      visible={isOpen}
    >
      <View style={styles.backdrop}>
        <Pressable
          accessibilityLabel="공유 닫기"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        <SafeAreaView edges={["bottom"]} style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>게시물 공유</Text>
            <Pressable
              accessibilityRole="button"
              onPress={onClose}
              style={({ pressed }) => [
                styles.closeButton,
                pressed ? styles.pressed : null,
              ]}
            >
              <Text style={styles.closeText}>닫기</Text>
            </Pressable>
          </View>

          <View style={styles.searchWrap}>
            <SearchInput
              autoFocus={false}
              onChange={onQueryChange}
              placeholder="닉네임으로 검색"
              value={query}
            />
          </View>

          {errorMessage ? (
            <Text style={styles.stateText}>{errorMessage}</Text>
          ) : isLoading || isSearching ? (
            <Text style={styles.stateText}>
              {isLoading ? "공유 대상을 불러오는 중입니다…" : "검색 중입니다…"}
            </Text>
          ) : targets.length === 0 ? (
            <Text style={styles.stateText}>
              {query.trim()
                ? "검색 결과가 없습니다."
                : "공유할 대화나 크루가 없습니다."}
            </Text>
          ) : (
            <ScrollView
              contentContainerStyle={styles.targetList}
              keyboardShouldPersistTaps="handled"
            >
              {targets.map((target) => {
                const isSending = sendingTargetId === target.id;

                return (
                  <View key={target.id} style={styles.targetRow}>
                    <UserInline
                      avatarSize={44}
                      imageUrl={target.avatar_url}
                      meta={target.department ?? getSourceLabel(target.source)}
                      nickname={target.nickname}
                      style={styles.targetUser}
                    />
                    <Pressable
                      accessibilityRole="button"
                      disabled={Boolean(sendingTargetId)}
                      onPress={() => onSelectTarget(target)}
                      style={({ pressed }) => [
                        styles.sendButton,
                        pressed && !sendingTargetId ? styles.pressed : null,
                        sendingTargetId ? styles.disabled : null,
                      ]}
                    >
                      <Text style={styles.sendText}>
                        {isSending ? "전송 중" : "보내기"}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </ScrollView>
          )}
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.28)",
  },
  sheet: {
    maxHeight: "78%",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    backgroundColor: colors.card,
  },
  handle: {
    alignSelf: "center",
    width: 58,
    height: 5,
    marginTop: 10,
    borderRadius: 999,
    backgroundColor: "#DDD6FE",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
  },
  closeButton: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  closeText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "900",
  },
  searchWrap: {
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  stateText: {
    paddingHorizontal: 18,
    paddingVertical: 34,
    color: colors.muted,
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
  },
  targetList: {
    paddingHorizontal: 10,
    paddingBottom: 16,
  },
  targetRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 18,
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  targetUser: {
    flex: 1,
  },
  sendButton: {
    borderRadius: 999,
    backgroundColor: colors.accent,
    paddingHorizontal: 15,
    paddingVertical: 9,
  },
  sendText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "900",
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.7,
  },
});
