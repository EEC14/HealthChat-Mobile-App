import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Image, Dimensions } from "react-native";
import WebView from 'react-native-webview';

interface Message {
  id: string | number;
  text: string;
  isBot: boolean;
  botCharacter?: string; // Added to identify the bot's character
  videoUrl?: string;
}

interface ChatMessageProps {
  message: Message;
}

const profilePictures: Record<string, any> = {
  "Dr. Dave": require("../../assets/images/dr_dave.png"),
  "Ortho Oscar": require("../../assets/images/ortho_oscar.png"),
  "Physio Pete": require("../../assets/images/physio_pete.png"),
  "Psychology Paula": require("../../assets/images/psychology_paula.png"),
  "Cardiology Carl": require("../../assets/images/cardiology_carl.png"),
  "Dermatology Debrah": require("../../assets/images/dermatology_debrah.png"),
  "user": require("../../assets/images/user_default.png")
};

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const screenWidth = Dimensions.get('window').width;
  const videoWidth = screenWidth * 0.7; // 70% of screen width
  const videoHeight = (videoWidth * 9) / 16; // 16:9 aspect ratio

  const renderVideoPlayer = () => {
    if (!message.videoUrl) return null;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
          <style>
            body { margin: 0; padding: 0; background-color: black; }
            .video-container {
              position: relative;
              width: 100%;
              height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            video {
              max-width: 100%;
              max-height: 100%;
              object-fit: contain;
            }
          </style>
        </head>
        <body>
          <div class="video-container">
            <video
              controls
              playsinline
              autoplay
              src="${message.videoUrl}"
              type="video/mp4"
              style="background: black;"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        </body>
      </html>
    `;

    return (
      <View style={[styles.videoContainer, { width: videoWidth, height: videoHeight }]}>
        <WebView
          source={{ html: htmlContent }}
          style={styles.video}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          scrollEnabled={false}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.warn('WebView error:', nativeEvent);
          }}
        />
      </View>
    );
  };

  const getProfilePicture = () => {
    if (message.isBot) {
      return profilePictures[message.botCharacter || "Dr. Dave"];
    }
    return profilePictures["user"];
  };

  return (
    <View style={[
      styles.messageContainer,
      message.isBot ? styles.botMessage : styles.userMessage
    ]}>
      <Image 
        source={getProfilePicture()} 
        style={styles.profilePicture} 
      />
      <View style={styles.textContainer}>
        {!message.videoUrl && (
          <Text style={[
            styles.text,
            message.isBot ? styles.botText : styles.userText
          ]}>
            {message.text}
          </Text>
        )}
        {renderVideoPlayer()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  messageContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginVertical: 5,
  },
  botMessage: {
    alignSelf: "flex-start",
  },
  userMessage: {
    alignSelf: "flex-end",
    flexDirection: "row-reverse",
  },
  profilePicture: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginHorizontal: 10,
  },
  textContainer: {
    maxWidth: "80%",
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#2C2C2E",
  },
  text: {
    fontSize: 16,
  },
  botText: {
    color: "#FFFFFF",
  },
  userText: {
    color: "#FFFFFF",
  },
  videoContainer: {
    backgroundColor: "#000000",
    borderRadius: 8,
    overflow: "hidden",
    marginTop: 5,
  },
  video: {
    width: "100%",
    height: "100%",
    backgroundColor: "#000000",
  },
});

export default ChatMessage;