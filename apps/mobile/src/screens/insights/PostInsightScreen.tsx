import { useRouter } from "expo-router";
import { ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScreenContainer } from "../../components/common/ScreenContainer";
import { ScreenHeader } from "../../components/common/ScreenHeader";
import { StateView } from "../../components/common/StateView";
import { PostInsightOverview } from "../../components/insights/PostInsightOverview";
import { PostInsightPreview } from "../../components/insights/PostInsightPreview";
import { PostInsightVideoSection } from "../../components/insights/PostInsightVideoSection";
import { usePostInsight } from "../../features/metrics/usePostInsight";
import { useTheme, useThemedStyles } from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";

export function PostInsightScreen({ postId }: { postId: string }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { errorMessage, insight, isLoading, reload, retention } =
    usePostInsight(postId);

  return (
    <ScreenContainer
      contentBackgroundColor={colors.accentSoft}
      style={styles.screen}
    >
      <ScreenHeader onBack={() => router.back()} themed title="게시물 인사이트" />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: styles.content.paddingBottom + insets.bottom },
        ]}
      >
        {isLoading ? (
          <StateView
            message="잠시만 기다려주세요."
            title="인사이트를 불러오는 중"
            type="loading"
          />
        ) : errorMessage ? (
          <StateView
            actionLabel="다시 시도"
            message={errorMessage}
            onAction={reload}
            title="불러오지 못했습니다"
            type="error"
          />
        ) : insight ? (
          <>
            <PostInsightPreview insight={insight} />
            <PostInsightOverview insight={insight} />
            {insight.isVideo ? (
              <PostInsightVideoSection
                insight={insight}
                retention={retention}
              />
            ) : null}
          </>
        ) : (
          <StateView
            message="삭제됐거나 내 게시물이 아닙니다."
            title="인사이트를 볼 수 없습니다"
          />
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: c.accentSoft,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 40,
    gap: 16,
  },
});
