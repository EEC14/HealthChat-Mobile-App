import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Button, Alert, Dimensions, Platform } from "react-native";
import WebView from 'react-native-webview';
import axios from "axios";

interface Message {
  id: string | number;
  text: string;
  isBot: boolean;
  videoUrl?: string;
}

interface ChatMessageProps {
  message: Message;
  onVideoGenerated?: (videoUrl: string, messageId: string | number) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, onVideoGenerated }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(message.videoUrl || null);
  const [messageText, setMessageText] = useState<string>(message.text);
  const [videoError, setVideoError] = useState<string | null>(null);
  
  const screenWidth = Dimensions.get('window').width;
  const videoWidth = screenWidth * 0.7; // 70% of screen width
  const videoHeight = (videoWidth * 9) / 16; // 16:9 aspect ratio

  useEffect(() => {
    setMessageText(message.text);
    if (message.videoUrl) {
      console.log('Setting video URL:', message.videoUrl);
      setVideoUrl(message.videoUrl);
      setVideoError(null);
    }
  }, [message, message.videoUrl]);

  const generateVideo = async () => {
    setIsGenerating(true);
    setVideoError(null);
    try {
      const API_KEY = "MjQ4Y2YzOTY0YWE3NGY4NmFlMDJjNDk2YTFmYWUxZmItMTczNzM4MDY5NA==";
      const payload = {
        "video_inputs": [
          {
            "character": {
              "type": "avatar",
              "avatar_id": "Darnell_Blue_Shirt_Front",
              "avatar_style": "normal"
            },
            "voice": {
              "type": "text",
              "input_text": messageText,
              "voice_id": "219a23d690fc48c7b3a24ea4a0ac651a",
              "speed": 1.1
            },
          }
        ],
        "dimension": {
          "width": 640,
          "height": 360
        }
      };

      const response = await axios.post("https://api.heygen.com/v2/video/generate", payload, {
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": API_KEY,
        },
      });

      if (response.data?.data?.video_id) {
        const videoId = response.data.data.video_id;
        const generatedVideoUrl = await pollForVideoStatus(videoId);
        
        if (generatedVideoUrl) {
          setVideoUrl(generatedVideoUrl);
          onVideoGenerated?.(generatedVideoUrl, message.id);
        }
      } else {
        throw new Error("Failed to generate video. No video ID returned.");
      }
    } catch (error) {
      console.error("Error generating video:", error);
      setVideoError("Failed to generate video. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const pollForVideoStatus = async (videoId: string): Promise<string> => {
    const POLL_INTERVAL = 5000;
    const MAX_RETRIES = 90;
    let retries = 0;

    while (retries < MAX_RETRIES) {
      try {
        const statusResponse = await axios.get(
          `https://api.heygen.com/v1/video_status.get?video_id=${videoId}`,
          {
            headers: {
              "X-Api-Key": `MjQ4Y2YzOTY0YWE3NGY4NmFlMDJjNDk2YTFmYWUxZmItMTczNzM4MDY5NA==`,
            },
          }
        );

        const { status, video_url, error } = statusResponse.data.data;

        if (status === "completed" && video_url) {
          console.log('Received video URL from API:', video_url);
          return video_url;
        } else if (status === "failed") {
          throw new Error(error || "Video generation failed");
        }
      } catch (error) {
        console.error("Error polling video status:", error);
      }

      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
      retries++;
    }

    throw new Error("Video generation timed out. Please try again later.");
  };

  const renderVideoPlayer = () => {
    if (!videoUrl) return null;

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
              src="${videoUrl}"
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

  return (
    <View style={[
      styles.container,
      message.isBot ? styles.botMessage : styles.userMessage,
      videoUrl && styles.videoMessageContainer
    ]}>
      {!videoUrl && (
        <Text style={[
          styles.text,
          message.isBot ? styles.botText : styles.userText
        ]}>
          {messageText}
        </Text>
      )}
      {message.isBot && !videoUrl && (
        <Button
          title={isGenerating ? "Generating video..." : "Generate Video"}
          onPress={generateVideo}
          disabled={isGenerating}
        />
      )}
      {renderVideoPlayer()}
      {videoError && (
        <Text style={styles.errorText}>{videoError}</Text>
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
  videoMessageContainer: {
    width: "80%",
    padding: 5,
  },
  botMessage: {
    backgroundColor: "#2C2C2E",
    alignSelf: "flex-start",
  },
  userMessage: {
    backgroundColor: "#0A84FF",
    alignSelf: "flex-end",
  },
  text: {
    fontSize: 16,
    marginBottom: 8,
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
  errorText: {
    color: "#FF453A",
    fontSize: 14,
    marginTop: 5,
  }
});

export default ChatMessage;