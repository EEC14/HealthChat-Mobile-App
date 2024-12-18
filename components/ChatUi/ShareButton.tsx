import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Clipboard,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons"; // Icons for the buttons
import { Message } from "@/types";
import { useAuthContext } from "@/context/AuthContext";
import { saveChatToDatabase } from "@/firebase";

const ShareButton = ({ messages }: { messages: Message[] }) => {
  const { user } = useAuthContext();
  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleShare = async () => {
    if (!user) {
      setError("Please log in to share chats");
      return;
    }

    setIsSharing(true);
    setError(null);

    try {
      const chatId = await saveChatToDatabase(user.uid, messages);
      const url = `https://yourapp.com/shared/${chatId}`; // Update with your app's URL
      setShareUrl(url);
    } catch (err) {
      setError("Failed to generate shareable link.");
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopy = () => {
    if (shareUrl) {
      Clipboard.setString(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setShareUrl(null);
    setError(null);
  };

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={handleClose}>
          <Ionicons name="close-circle" size={24} color="red" />
        </TouchableOpacity>
      </View>
    );
  }

  if (shareUrl) {
    return (
      <View style={styles.shareContainer}>
        <TextInput value={shareUrl} editable={false} style={styles.input} />
        <TouchableOpacity onPress={handleCopy} style={styles.iconButton}>
          <Ionicons
            name={copied ? "checkmark-circle" : "copy"}
            size={22}
            color={copied ? "green" : "gray"}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleClose} style={styles.iconButton}>
          <Ionicons name="close" size={22} color="gray" />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <TouchableOpacity
      onPress={handleShare}
      disabled={isSharing || messages.length === 0}
      style={[
        styles.shareButton,
        (isSharing || messages.length === 1) && styles.disabledButton,
      ]}
    >
      {isSharing ? (
        <ActivityIndicator color="white" size={22} />
      ) : (
        <Ionicons name="share-outline" size={22} color="white" />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  shareButton: {
    backgroundColor: "#1e3a8a",
    padding: 10,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  disabledButton: {
    opacity: 0.5,
  },
  shareContainer: {
    width: "100%",
    position: "absolute",
    bottom: 10,
    zIndex: 2,
    backgroundColor: "white",
    padding: 6,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    paddingHorizontal: 10,
    backgroundColor: "#f9f9f9",
    height: 40,
  },
  iconButton: {
    marginLeft: 10,
  },
  errorContainer: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#fee2e2",
    padding: 10,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  errorText: {
    color: "#b91c1c",
    marginRight: 10,
    fontSize: 14,
  },
});

export default ShareButton;
