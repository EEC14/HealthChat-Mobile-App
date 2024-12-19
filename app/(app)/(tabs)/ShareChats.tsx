import React, { useState, useEffect } from "react";

import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Animated,
  RefreshControl,
} from "react-native";

import { db } from "@/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

import { Link } from "expo-router";

import { useAuthContext } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { Colors } from "@/constants/Colors";
import { Chat } from "@/types";

import AntDesign from "@expo/vector-icons/AntDesign";
import Feather from "@expo/vector-icons/Feather";
import { FontAwesome } from "@expo/vector-icons";

const SkeletonItem = ({ theme }: { theme: "light" | "dark" }) => {
  const fadeAnim = React.useRef(new Animated.Value(0.5)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0.5,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [fadeAnim]);

  const currentColors = Colors[theme];

  return (
    <Animated.View
      style={[
        styles.skeletonItem,
        {
          opacity: fadeAnim,
          backgroundColor: currentColors.surface,
        },
      ]}
    >
      <View style={styles.skeletonHeader}>
        <View
          style={[
            styles.skeletonTitle,
            { backgroundColor: currentColors.border },
          ]}
        />
        <View
          style={[
            styles.skeletonVotes,
            { backgroundColor: currentColors.border },
          ]}
        />
      </View>
      <View
        style={[
          styles.skeletonButton,
          { backgroundColor: currentColors.border },
        ]}
      />
    </Animated.View>
  );
};

const SharedChatsList = () => {
  const { theme } = useTheme();
  const currentColors = Colors[theme];

  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuthContext();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statistics, setStatistics] = useState({
    totalChats: 0,
    totalUpvotes: 0,
    totalDownvotes: 0,
    upvotePercentage: 0,
  });

  const fetchChats = async () => {
    if (!user) {
      setError("User not authenticated");
      setLoading(false);
      return;
    }

    try {
      const chatsQuery = query(
        collection(db, "ChatsCollection"),
        where("shared", "==", true),
        where("userId", "==", user.uid)
      );

      const querySnapshot = await getDocs(chatsQuery);
      const sharedChats = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId as string,
          messages: data.messages,
          createdAt: data.createdAt,
          shared: data.shared,
          upvotes: data.upvotes || 0,
          downvotes: data.downvotes || 0,
        };
      });

      const totalChats = sharedChats.length;
      const totalUpvotes = sharedChats.reduce(
        (sum, chat) => sum + chat.upvotes,
        0
      );
      const totalDownvotes = sharedChats.reduce(
        (sum, chat) => sum + chat.downvotes,
        0
      );
      const upvotePercentage = totalChats
        ? ((totalUpvotes / (totalUpvotes + totalDownvotes)) * 100).toFixed(2)
        : 0;

      setStatistics({
        totalChats,
        totalUpvotes,
        totalDownvotes,
        upvotePercentage: Number(upvotePercentage) || 0,
      });

      setChats(sharedChats);
    } catch (err) {
      console.error("Error fetching chats:", err);
      setError("Failed to fetch chats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
  }, [user]);

  if (loading) {
    return (
      <FlatList
        data={[1, 2, 3, 4]}
        keyExtractor={(item) => item.toString()}
        ListHeaderComponent={
          <View
            style={[
              styles.statsContainer,
              { backgroundColor: currentColors.background },
            ]}
          >
            {[1, 2, 3].map((_, index) => (
              <View
                key={index}
                style={[
                  styles.skeletonStatCard,
                  { backgroundColor: currentColors.surface },
                ]}
              >
                <Animated.View
                  style={[
                    styles.skeletonIcon,
                    {
                      opacity: new Animated.Value(0.5),
                      backgroundColor: currentColors.border,
                    },
                  ]}
                />
                <Animated.View
                  style={[
                    styles.skeletonStatValue,
                    {
                      opacity: new Animated.Value(0.5),
                      backgroundColor: currentColors.border,
                    },
                  ]}
                />
                <Animated.View
                  style={[
                    styles.skeletonStatLabel,
                    {
                      opacity: new Animated.Value(0.5),
                      backgroundColor: currentColors.border,
                    },
                  ]}
                />
              </View>
            ))}
          </View>
        }
        renderItem={() => <SkeletonItem theme={theme} />}
        contentContainerStyle={[
          styles.listContainer,
          { backgroundColor: currentColors.background },
        ]}
      />
    );
  }

  if (error) {
    return (
      <View
        style={[
          styles.errorContainer,
          { backgroundColor: currentColors.background },
        ]}
      >
        <Text style={[styles.errorText, { color: currentColors.textPrimary }]}>
          {error}
        </Text>
        <Text
          style={[styles.errorSubtext, { color: currentColors.textSecondary }]}
        >
          Please try again later
        </Text>
      </View>
    );
  }

  const renderHeader = () => (
    <View
      style={[
        styles.statsContainer,
        { backgroundColor: currentColors.background },
      ]}
    >
      <View
        style={[
          styles.statCard,
          {
            backgroundColor: currentColors.surface,
            borderColor: currentColors.border,
          },
        ]}
      >
        <Feather name="pie-chart" size={24} color={"gray"} />
        <Text style={[styles.statValue, { color: currentColors.textPrimary }]}>
          {statistics.totalChats}
        </Text>
        <Text
          style={[styles.statLabel, { color: currentColors.textSecondary }]}
        >
          Total Shared Chats
        </Text>
      </View>
      <View
        style={[
          styles.statCard,
          {
            backgroundColor: currentColors.surface,
            borderColor: currentColors.border,
          },
        ]}
      >
        <AntDesign name="like2" size={24} color={"green"} />
        <Text style={[styles.statValue, { color: currentColors.textPrimary }]}>
          {statistics.totalUpvotes}
        </Text>
        <Text
          style={[styles.statLabel, { color: currentColors.textSecondary }]}
        >
          Total Upvotes
        </Text>
      </View>
      <View
        style={[
          styles.statCard,
          {
            backgroundColor: currentColors.surface,
            borderColor: currentColors.border,
          },
        ]}
      >
        <AntDesign name="like2" size={24} color={"green"} />
        <Text style={[styles.statValue, { color: currentColors.textPrimary }]}>
          {statistics.upvotePercentage}%
        </Text>
        <Text
          style={[styles.statLabel, { color: currentColors.textSecondary }]}
        >
          Upvote Percentage
        </Text>
      </View>
    </View>
  );

  const renderChatItem = ({ item }: { item: Chat }) => (
    <View
      style={[
        styles.chatItem,
        {
          backgroundColor: currentColors.surface,
          borderColor: currentColors.border,
        },
      ]}
    >
      <View style={styles.chatHeader}>
        <View style={styles.chatTitleContainer}>
          <Text
            style={[styles.chatTitle, { color: currentColors.textPrimary }]}
          >
            Shared Chat
          </Text>
          <Text
            style={[
              styles.chatSubtitle,
              { color: currentColors.textSecondary },
            ]}
          >
            Created on {new Date(item.createdAt?.toDate()).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.voteSection}>
          <View style={styles.voteInfo}>
            <AntDesign name="like2" size={16} color={"green"} />
            <Text
              style={[styles.voteCount, { color: currentColors.textSecondary }]}
            >
              {item.upvotes}
            </Text>
          </View>
          <View style={styles.voteInfo}>
            <AntDesign name="dislike2" size={16} color={"red"} />
            <Text
              style={[styles.voteCount, { color: currentColors.textSecondary }]}
            >
              {item.downvotes}
            </Text>
          </View>
        </View>
      </View>
      <Link
        href={`https://curious-cranachan-ab9992.netlify.app/shared/${item.id}`}
      >
        <View
          style={[
            styles.viewChatButton,
            { backgroundColor: currentColors.primary },
          ]}
        >
          <Text
            style={[styles.viewChatText, { color: currentColors.secondary }]}
          >
            View Full Chat
          </Text>
          <FontAwesome
            name="external-link"
            size={24}
            color={currentColors.secondary}
          />
        </View>
      </Link>
    </View>
  );

  const onRefresh = async () => {
    setRefreshing(true);
    setLoading(true);
    try {
      fetchChats();
    } catch (error) {
      console.error("Error refreshing user details:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  return (
    <FlatList
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[currentColors.primary]}
          tintColor={currentColors.primary}
        />
      }
      data={chats}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={renderHeader}
      renderItem={renderChatItem}
      contentContainerStyle={[
        styles.listContainer,
        { backgroundColor: currentColors.background },
      ]}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={
        <View style={styles.emptyStateContainer}>
          <Text
            style={[
              styles.emptyStateTitle,
              { color: currentColors.textPrimary },
            ]}
          >
            No Shared Chats Yet
          </Text>
          <Text
            style={[
              styles.emptyStateSubtitle,
              { color: currentColors.textSecondary },
            ]}
          >
            Share your interesting conversations to see them here
          </Text>
        </View>
      }
    />
  );
};

const styles = StyleSheet.create({
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 12,
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    padding: 15,
    borderRadius: 12,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 13,
    marginTop: 4,
  },
  chatItem: {
    backgroundColor: "white",
    gap: 10,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
  },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  chatTitleContainer: {
    flex: 1,
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  chatSubtitle: {
    fontSize: 12,
    marginTop: 4,
  },
  voteSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  voteInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 12,
  },
  voteCount: {
    marginLeft: 4,
    fontSize: 14,
  },
  viewChatButton: {
    flexDirection: "row",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: "center",
    width: "100%",
    justifyContent: "space-between",
  },
  viewChatText: {
    fontWeight: "600",
    marginRight: 8,
  },
  listContainer: {
    paddingBottom: 64,
    flex: 1,
    paddingHorizontal: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 22,
    fontWeight: "600",
    color: "red",
    textAlign: "center",
  },
  errorSubtext: {
    fontSize: 16,
    marginTop: 8,
    textAlign: "center",
  },
  emptyStateContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    textAlign: "center",
  },
  // Skeleton Styles
  skeletonItem: {
    backgroundColor: "white",
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
  },
  skeletonHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  skeletonTitle: {
    height: 20,
    width: "50%",
    borderRadius: 4,
  },
  skeletonVotes: {
    height: 20,
    width: "30%",
    borderRadius: 4,
  },
  skeletonButton: {
    height: 48,
    marginTop: 12,
    borderRadius: 10,
  },
  skeletonStatCard: {
    flex: 1,
    alignItems: "center",
    padding: 15,
    borderRadius: 12,
    gap: 8,
  },
  skeletonIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
  },
  skeletonStatValue: {
    width: 50,
    height: 22,
    marginTop: 8,
    borderRadius: 4,
  },
  skeletonStatLabel: {
    width: 100,
    height: 16,
    marginTop: 4,
    borderRadius: 4,
  },
});

export default SharedChatsList;
