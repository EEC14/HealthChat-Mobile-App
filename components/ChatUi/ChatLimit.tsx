import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useRouter } from "expo-router";
import React from "react";
import { View, Text, TouchableOpacity } from "react-native";

interface ChatLimitProps {
  remainingMessages: number;
}

export const ChatLimit: React.FC<ChatLimitProps> = ({ remainingMessages }) => {
  const router = useRouter();

  return (
    <TouchableOpacity
      onPress={() => router.replace("/Subscription")}
      style={{
        backgroundColor: "#dbeafe",
        borderWidth: 1,
        borderColor: "#bfdbfe",
        borderRadius: 14,
        padding: 8,
        marginBottom: 6,
        marginHorizontal: 10,
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <View
        style={{
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          padding: 6,
          backgroundColor: "#f9fafb",
          borderRadius: 8,
          gap: 4,
        }}
      >
        <View style={{ flex: 1, marginRight: 0 }}>
          <Text style={{ color: "#1e3a8a", fontSize: 14 }}>
            <Text style={{ fontWeight: "bold" }}>Free Plan Limit: </Text>
            {remainingMessages} messages remaining today
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginTop: 5,
              justifyContent: "space-between",
            }}
          >
            <Text
              style={{
                color: "#2563eb",
                fontSize: 13,
                fontWeight: "500",
              }}
            >
              Upgrade to Pro for unlimited messages
            </Text>
            <FontAwesome6
              name="crown"
              size={20}
              color="gold"
              style={{ marginLeft: 0 }}
            />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};
