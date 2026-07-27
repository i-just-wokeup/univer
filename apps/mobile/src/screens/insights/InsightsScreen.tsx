import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { ScreenHeader } from "../../components/common/ScreenHeader";
import { StateView } from "../../components/common/StateView";
import { InsightsMetricCard } from "../../components/insights/InsightsMetricCard";
import { InsightsPeriodToggle } from "../../components/insights/InsightsPeriodToggle";
import { useInsights } from "../../features/metrics/useInsights";
import { colors } from "../../lib/theme";

export function InsightsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { period, setPeriod, metrics, isLoading, errorMessage } = useInsights();
  // 일간은 하루뿐이라 추이 차트가 의미 없어 숨긴다.
  const showChart = period !== "day";

  return (
    <View style={styles.root}>
      <SafeAreaView edges={["top"]} style={styles.screen}>
        <ScreenHeader onBack={() => router.back()} title="인사이트" />

        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: styles.content.paddingBottom + insets.bottom },
          ]}
        >
          <InsightsPeriodToggle period={period} onChange={setPeriod} />

          {isLoading ? (
            <StateView
              message="잠시만 기다려주세요."
              title="지표를 불러오는 중"
              type="loading"
            />
          ) : errorMessage ? (
            <StateView
              message={errorMessage}
              title="불러오지 못했습니다"
              type="error"
            />
          ) : (
            <View style={styles.cards}>
              {metrics.map((metric) => (
                <InsightsMetricCard
                  key={metric.type}
                  metric={metric}
                  showChart={showChart}
                />
              ))}
            </View>
          )}

          <Text style={styles.note}>나만 볼 수 있어요.</Text>
        </ScrollView>
      </SafeAreaView>
      {insets.bottom > 0 ? (
        <View
          pointerEvents="none"
          style={[styles.navigationBackground, { height: insets.bottom }]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.navBackground,
  },
  screen: {
    flex: 1,
    backgroundColor: colors.accentSoft,
  },
  navigationBackground: {
    backgroundColor: colors.navBackground,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
    gap: 16,
  },
  cards: {
    gap: 12,
  },
  note: {
    marginTop: 4,
    textAlign: "center",
    color: colors.textFaint,
    fontSize: 12,
    fontWeight: "700",
  },
});
