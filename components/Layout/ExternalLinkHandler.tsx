import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  Image,
} from "react-native";
import { WebView } from "react-native-webview";
import { AntDesign } from "@expo/vector-icons";

interface ExternalLinkHandlerProps {
  url: string;
  visible: boolean;
  onClose: () => void;
}

const ExternalLinkHandler: React.FC<ExternalLinkHandlerProps> = ({
  url,
  visible,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <AntDesign name="close" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.title} numberOfLines={1}>
            {url.replace(/^https?:\/\//, "")}
          </Text>
          {loading && (
            <ActivityIndicator style={styles.loader} color="#2575fc" />
          )}
          <View
            style={{
              backgroundColor: "#1E3A8A",
              borderRadius: 8,
              width: 36,
              height: 36,
              justifyContent: "center",
              alignItems: "center",
              marginRight: 8,
            }}
          >
            <Image
              style={{
                width: 26,
                height: 26,
                resizeMode: "contain",
              }}
              source={require("@/assets/images/icon-app.png")}
            />
          </View>
        </View>
        <WebView
          source={{ uri: url }}
          style={styles.webview}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#2575fc" />
            </View>
          )}
        />
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  closeButton: {
    padding: 8,
  },
  title: {
    flex: 1,
    marginHorizontal: 10,
    fontSize: 16,
    color: "#000",
  },
  loader: {
    marginRight: 10,
  },
  webview: {
    flex: 1,
  },
  loaderContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
});

export default ExternalLinkHandler;
