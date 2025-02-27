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
import { Ionicons } from "@expo/vector-icons"; 
import { Message } from "@/types";
import { useAuthContext } from "@/context/AuthContext";
import { saveChatToDatabase } from "@/firebase";
import { useTheme } from "@/context/ThemeContext";
import { Colors } from "@/constants/Colors";

interface ShareMessage extends Omit<Message, 'timestamp'> {
  timestamp?: Date;
}

const ShareButton = ({ messages }: { messages: ShareMessage[] }) => {
  const { user } = useAuthContext();
  const { theme } = useTheme();
  const currentColors = Colors[theme];
  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processedMessages = messages.map(msg => ({
    ...msg,
    timestamp: msg.timestamp || new Date()
  }));

  const handleShare = async () => {
    if (!user) {
      setError("Please log in to share chats");
      return;
    }
    const shareableMessages = processedMessages.filter(m => 
      m.role !== 'system' && m.content.trim().length > 0
    );

    if (shareableMessages.length < 2) {
      setError("Not enough messages to share");
      return;
    }

    setIsSharing(true);
    setError(null);

    try {
      const chatId = await saveChatToDatabase(user.uid, shareableMessages);
      const url = `https://healthchat-patient.esbhealthcare.com/shared/${chatId}`;
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
      <View
        style={[
          styles.shareContainer,
          {
            backgroundColor: currentColors.surface,
            borderColor: currentColors.border,
            borderWidth: 1,
          },
        ]}
      >
        <TextInput
          value={shareUrl}
          editable={false}
          style={[
            styles.input,
            {
              backgroundColor: currentColors.inputBackground,
              color: currentColors.textPrimary,
              borderColor: currentColors.border,
            },
          ]}
        />
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
      disabled={isSharing || messages.length <= 2}
      style={[
        styles.shareButton,
        { backgroundColor: "#1E1E1E" },
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
    padding: 10,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  disabledButton: {
    opacity: 0.6,
  },
  shareContainer: {
    position: 'absolute',
    bottom: 50,
    left: 10,
    width: '90%',
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    zIndex: 9999,
    elevation: 5,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 42,
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
