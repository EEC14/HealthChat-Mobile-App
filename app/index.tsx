import React from "react";
import { ActivityIndicator, Text, View, Image } from "react-native";
import '../i18n/config';
import { I18nextProvider } from 'react-i18next';
function LoadingScreen() {
  return (
    <View className="items-center justify-center flex-1 bg-white">
      <Image
        source={require("@/assets/images/icon-app.png")} //
        style={{ width: 100, height: 100 }}
        className="mb-6"
      />
      <Text className="mb-4 text-2xl font-bold text-gray-800">Health Chat</Text>
      <Text className="mb-4 text-lg text-gray-400">
        HealthChat Your AI Health Assistant
      </Text>
      <ActivityIndicator size="large" color="#4F46E5" />
      <Text className="mt-4 text-gray-500">Loading, please wait...</Text>
    </View>
  );
}

export default LoadingScreen;
