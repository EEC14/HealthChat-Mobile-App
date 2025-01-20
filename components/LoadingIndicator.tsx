import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';

interface LoadingIndicatorProps {
  status: string;
  attempt: number;
  maxAttempts: number;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ status, attempt, maxAttempts }) => {
  const getStatusMessage = (status: string) => {
    switch (status.toLowerCase()) {
      case 'created': return 'Initializing';
      case 'started': return 'Started';
      case 'processing': return 'Processing';
      default: return 'Preparing';
    }
  };

  return (
    <View className="w-12 h-12 bg-blue-900 rounded-lg flex items-center justify-center p-1">
      <ActivityIndicator size="small" color="#ffffff" />
      <Text className="text-white text-[8px] mt-1 text-center">
        {getStatusMessage(status)}
      </Text>
      <Text className="text-white text-[8px] text-center">
        {Math.round((attempt / maxAttempts) * 100)}%
      </Text>
    </View>
  );
};

export default LoadingIndicator;