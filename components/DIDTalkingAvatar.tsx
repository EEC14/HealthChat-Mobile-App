import React, { useState } from "react";
import { View, Button, ActivityIndicator, Alert } from "react-native";
import axios from "axios";

interface HeyGenIntegrationProps {
  message: {
    id: string;
    text: string;
    isBot: boolean;
    videoUrl?: string;
  };
}

const HeyGenIntegration: React.FC<HeyGenIntegrationProps> = ({ message }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | undefined>(message.videoUrl);

  const generateVideo = async () => {
    if (videoUrl) {
      Alert.alert("Video already generated", "This message already has a video.");
      return;
    }

    setIsLoading(true);

    try {
      const API_KEY = "MjQ4Y2YzOTY0YWE3NGY4NmFlMDJjNDk2YTFmYWUxZmItMTczNzM4MDY5NA==" // Replace with your HeyGen API key
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
              "input_text": message.text,
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
      console.log("Generating video with payload:", payload);
      const response = await axios.post("https://api.heygen.com/v2/video/generate", payload, {
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": `MjQ4Y2YzOTY0YWE3NGY4NmFlMDJjNDk2YTFmYWUxZmItMTczNzM4MDY5NA==`,
        },
      });
      console.log("Video generation response:", response.data);
      if (response.data && response.data.data && response.data.data.video_id) {
        const videoId = response.data.data.video_id;
        console.log("Video ID:", videoId);

        // Poll for video status
        await pollForVideoStatus(videoId);
      } else {
        throw new Error("Failed to generate video. No video ID returned.");
      }
    } catch (error: any) {
      console.error("Error generating video:", error.response?.data || error.message);
      Alert.alert(
        "Error",
        error.response?.data?.description || "An error occurred while generating the video."
      );
    } finally {
      setIsLoading(false);
    }
  };

const pollForVideoStatus = async (videoId: string) => {
    const POLL_INTERVAL = 5000; // 5 seconds
    const MAX_RETRIES = 45; // 1 minute

    let retries = 0;

    while (retries < MAX_RETRIES) {
      try {
        const statusResponse = await axios.get(`https://api.heygen.com/v1/video_status.get?video_id=${videoId}`, {
          headers: {
            "X-Api-Key": `MjQ4Y2YzOTY0YWE3NGY4NmFlMDJjNDk2YTFmYWUxZmItMTczNzM4MDY5NA==`,
          },
        });
        console.log("Video status response:", statusResponse.data);
        if (statusResponse.data && statusResponse.data.data) {
          const { status, video_url } = statusResponse.data.data;

          if (status === "completed" && video_url) {
            setVideoUrl(video_url); // Save the generated video URL
            Alert.alert("Success", "Video generated successfully!");
            console.log("Video URL:", video_url);
            return;
          } else if (status === "failed") {
            throw new Error("Video generation failed.");
          }
        }

        // Wait before polling again
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
        retries++;
      } catch (error: any) {
        console.error("Error polling video status:", error.response?.data || error.message);
        throw new Error("Failed to retrieve video status.");
      }
    }

    throw new Error("Video generation timed out. Please try again later.");
  };

  if (videoUrl) {
    return null; // Do not display the button if the video is already generated
  }

  return (
    <View style={{ marginTop: 8 }}>
      {isLoading ? (
        <ActivityIndicator size="small" />
      ) : (
        <Button title="Generate Video" onPress={generateVideo} />
      )}
    </View>
  );
};

export default HeyGenIntegration;
