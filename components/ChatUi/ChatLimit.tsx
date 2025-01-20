import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useRouter } from "expo-router";
import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useTranslation } from 'react-i18next';
interface ChatLimitProps {
  remainingMessages: number;
}

export const ChatLimit: React.FC<ChatLimitProps> = ({ remainingMessages }) => {
  const router = useRouter();
  const { t } = useTranslation();
  return (
    <TouchableOpacity
      onPress={() => router.replace("/Subscription")}
      style={{
        marginTop: 6,
        backgroundColor: "#dbeafe",
        borderWidth: 1,
        borderColor: "#bfdbfe",
        borderRadius: 14,
        padding: 8,
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
            <Text style={{ fontWeight: "bold" }}>{t('chat.limit.freeLimit')}</Text>
            {remainingMessages} {t('chat.limit.remaining')}
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
              {t('chat.limit.upgrade')}
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
