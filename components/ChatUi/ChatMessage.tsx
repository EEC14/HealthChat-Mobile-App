import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Image, Dimensions } from "react-native";

interface Message {
  id: string | number;
  text: string;
  isBot: boolean;
  botCharacter?: string; 
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