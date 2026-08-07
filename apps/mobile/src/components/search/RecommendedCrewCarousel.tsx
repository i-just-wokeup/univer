import { FlatList, StyleSheet, Text, View } from "react-native";

import type { FriendRecommendation } from "../../features/profile/api";
import { useThemedStyles, fontSize, fontWeight } from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";
import { RecommendedCrewCard } from "./RecommendedCrewCard";

type RecommendedCrewCarouselProps = {
  onDismiss: (userId: string) => void;
  onPressUser: (recommendation: FriendRecommendation) => void;
  onRequest: (recommendation: FriendRecommendation) => void;
  recommendations: FriendRecommendation[];
};

export function RecommendedCrewCarousel({
  onDismiss,
  onPressUser,
  onRequest,
  recommendations,
}: RecommendedCrewCarouselProps) {
  const styles = useThemedStyles(makeStyles);

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <Text style={styles.title}>추천 크루</Text>
      <FlatList
        contentContainerStyle={styles.listContent}
        data={recommendations}
        horizontal
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        keyExtractor={(item) => item.userId}
        renderItem={({ item }) => (
          <RecommendedCrewCard
            onDismiss={onDismiss}
            onPress={onPressUser}
            onRequest={onRequest}
            recommendation={item}
          />
        )}
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  section: {
    gap: 10,
  },
  title: {
    color: c.text,
    fontSize: fontSize.bodySmall,
    fontWeight: fontWeight.heavy,
  },
  listContent: {
    paddingRight: 4,
  },
  separator: {
    width: 10,
  },
});
