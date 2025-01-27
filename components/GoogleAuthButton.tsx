import React from 'react';
import { TouchableOpacity, Text, Image, View } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth, createUserProfile, getUserProfile } from '@/firebase';
import { useAuthContext } from '@/context/AuthContext';
import { useRouter } from 'expo-router';

WebBrowser.maybeCompleteAuthSession();

export function GoogleAuthButton() {
    const { clearError, setUser, setIsAuthenticated } = useAuthContext();
    const router = useRouter();
  
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: '703134724815-49j2l06g01m5ijuhgamlga8mmeg518um.apps.googleusercontent.com',
    iosClientId: '703134724815-he6bcu5nm6jlfpatdrv2aofse4ocqlhq.apps.googleusercontent.com',
    //expoClientId: '703134724815-kqjfjgdm7mravn9et36ptqt9tgjvn6rm.apps.googleusercontent.com',
  });

  React.useEffect(() => {
    handleSignInWithGoogle();
  }, [response]);

  const handleSignInWithGoogle = async () => {
    try {
      if (response?.type === 'success') {
        const { id_token } = response.params;
        const credential = GoogleAuthProvider.credential(id_token);
        const userCredential = await signInWithCredential(auth, credential);
        
        if (userCredential.user) {
          clearError();
          
          // Try to get existing profile first
          try {
            const existingProfile = await getUserProfile(userCredential.user.uid);
            setUser(existingProfile);
            setIsAuthenticated(true);
            router.replace('/Home');
          } catch (error) {
            // If profile doesn't exist, create new one
            await createUserProfile(userCredential.user.uid, userCredential.user.email || '');
            setUser({
              email: userCredential.user.email!,
              uid: userCredential.user.uid,
              isPro: false,
              isDeluxe: false,
              createdAt: new Date(),
            });
            setIsAuthenticated(true);
            router.replace('/Home');
          }
        }
      }
    } catch (error) {
      console.error('Error signing in with Google:', error);
    }
  };


  return (
    <TouchableOpacity 
      onPress={() => promptAsync()} 
      className="flex-row items-center justify-center py-3 bg-white rounded-lg shadow-sm"
      style={{ borderWidth: 1, borderColor: '#ddd' }}
    >
      <Image
        source={require('@/assets/images/google-icon.png')}
        style={{ width: 24, height: 24, marginRight: 10 }}
      />
      <Text className="text-gray-700 font-medium">Continue with Google</Text>
    </TouchableOpacity>
  );
}