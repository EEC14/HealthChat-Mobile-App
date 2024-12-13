import React from "react";
import { ActivityIndicator, Text, View, Image } from "react-native";

function LoadingScreen() {
  return (
    <View className="bg-white flex-1 justify-center items-center">
      {/* App Image */}
      <Image
        source={require("../assets/images/react-logo.png")} //
        style={{ width: 100, height: 100 }}
        className="mb-6"
      />
      <Text className="text-2xl font-bold text-gray-800 mb-4">Health Chat</Text>
      <Text className="text-lg text-gray-400 mb-4">
        Health Chat description
      </Text>
      <ActivityIndicator size="large" color="#4F46E5" />
      <Text className="text-gray-500 mt-4">Loading, please wait...</Text>
    </View>
  );
}

export default LoadingScreen;
