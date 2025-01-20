import React, { useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import Video from "react-native-video";

interface ChatMessageProps {
  message: {
    id: string;
    text: string;
    isBot: boolean;
    videoUrl?: string; // Add this to handle video playback
  };
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <View style={[styles.container, message.isBot ? styles.botMessage : styles.userMessage]}>
      {message.isBot && message.videoUrl ? (
        <View style={styles.videoContainer}>
          {isLoading && <ActivityIndicator size="small" color="#0000ff" />}
          <Video
            source={{ uri: message.videoUrl }}
            style={styles.video}
            resizeMode="contain"
            onLoadStart={() => setIsLoading(true)}
            onLoad={() => setIsLoading(false)}
            controls
          />
        </View>
      ) : (
        <Text style={styles.text}>{message.text}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    borderRadius: 10,
    marginVertical: 5,
    maxWidth: "80%",
  },
  botMessage: {
    backgroundColor: "#e0e0e0",
    alignSelf: "flex-start",
  },
  userMessage: {
    backgroundColor: "#0078fe",
    alignSelf: "flex-end",
    color: "#fff",
  },
  text: {
    fontSize: 16,
  },
  videoContainer: {
    width: "100%",
    height: 200,
  },
  video: {
    width: "100%",
    height: "100%",
  },
});

export default ChatMessage;
