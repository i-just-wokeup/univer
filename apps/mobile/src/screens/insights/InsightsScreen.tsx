import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScreenContainer } from "../../components/common/ScreenContainer";
import { FeedbackToast } from "../../components/common/FeedbackToast";
import { ScreenHeader } from "../../components/common/ScreenHeader";
import { StateView } from "../../components/common/StateView";
import { InsightsContentTab } from "../../components/insights/InsightsContentTab";
import {
  InsightsDashboardTabs,
  type InsightsDashboardTab,
} from "../../components/insights/InsightsDashboardTabs";
import { InsightsOverview } from "../../components/insights/InsightsOverview";
import { InsightsPeriodPicker } from "../../components/insights/InsightsPeriodPicker";
import { PromotionCard } from "../../components/insights/PromotionCard";
import { useContentPerformance } from "../../features/metrics/useContentPerformance";
import {
  useInsights,
  type InsightMetricKey,
} from "../../features/metrics/useInsights";
import { usePromotionRequest } from "../../features/promotion/usePromotionRequest";
import { useSession } from "../../lib/session";
import {
  fontSize,
  fontWeight,
  useTheme,
  useThemedStyles,
} from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";
import { useVerifiedUsers } from "../../lib/verifiedUsers";

export function InsightsScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useSession();
  const { getBadge, isBadgeDataReady } = useVerifiedUsers();
  const userId = session?.user.id ?? "";
  const badge = userId ? getBadge(userId) : null;
  const hasFullInsights =
    isBadgeDataReady &&
    badge !== null &&
    (badge.promoted || badge.affiliation !== null);
  const showPromotionCard = isBadgeDataReady && !hasFullInsights;
  const [tab, setTab] = useState<InsightsDashboardTab>("overview");
  const [selectedMetricKey, setSelectedMetricKey] =
    useState<InsightMetricKey>("views");
  const insights = useInsights(hasFullInsights);
  const content = useContentPerformance(hasFullInsights && tab === "content");
  const promotion = usePromotionRequest(showPromotionCard);

  const isContentTab = hasFullInsights && tab === "content";
  const activeMetricKey = insights.metrics.some(
    (metric) => metric.key === selectedMetricKey,
  )
    ? selectedMetricKey
    : (insights.metrics[0]?.key ?? "views");
  const isLoading = isContentTab ? content.isLoading : insights.isLoading;
  const errorMessage = isContentTab
    ? content.errorMessage
    : insights.errorMessage;

  return (
    <ScreenContainer
      contentBackgroundColor={colors.accentSoft}
      style={styles.screen}
    >
      <ScreenHeader onBack={() => router.back()} themed title="인사이트" />
      {hasFullInsights ? (
        <InsightsDashboardTabs onChange={setTab} value={tab} />
      ) : null}

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: styles.content.paddingBottom + insets.bottom },
        ]}
      >
        {!isContentTab ? (
          <>
            <InsightsPeriodPicker
              onChange={insights.setPeriod}
              period={insights.period}
            />
            <Text style={styles.range}>{insights.dateRangeLabel}</Text>
          </>
        ) : null}

        {isLoading ? (
          <StateView
            message="잠시만 기다려주세요."
            title="지표를 불러오는 중"
            type="loading"
          />
        ) : errorMessage ? (
          <StateView
            actionLabel="다시 시도"
            message={errorMessage}
            onAction={isContentTab ? content.reload : insights.reload}
            title="불러오지 못했습니다"
            type="error"
          />
        ) : isContentTab ? (
          <InsightsContentTab
            items={content.items}
            onOpenPost={(postId) => {
              router.push({
                pathname: "/insights/post/[id]",
                params: { id: postId },
              });
            }}
            onSortChange={content.setSort}
            sort={content.sort}
            totals={content.totals}
          />
        ) : (
          <InsightsOverview
            metrics={insights.metrics}
            onSelectMetric={setSelectedMetricKey}
            selectedMetricKey={activeMetricKey}
            viewsByType={insights.viewsByType}
          />
        )}

        {!isContentTab && showPromotionCard ? (
          <PromotionCard
            cooldownDaysRemaining={promotion.cooldownDaysRemaining}
            isLoading={promotion.isLoading}
            isSubmitting={promotion.isSubmitting}
            onRequest={() => {
              void promotion.submit();
            }}
            status={promotion.requestState?.status ?? null}
          />
        ) : null}

        <Text style={styles.note}>나만 볼 수 있어요.</Text>
      </ScrollView>

      <FeedbackToast
        bottom={insets.bottom + 24}
        message={promotion.errorMessage}
        onDismiss={promotion.clearError}
      />
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
    gap: 14,
  },
  range: {
    color: c.textFaint,
    fontSize: fontSize.label,
    fontWeight: fontWeight.semibold,
    textAlign: "center",
  },
  note: {
    marginTop: 2,
    color: c.textFaint,
    fontSize: fontSize.label,
    fontWeight: fontWeight.semibold,
    textAlign: "center",
  },
});
