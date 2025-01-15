import React from 'react';
import { TouchableOpacity, Text, Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { OAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth, createUserProfile, getUserProfile } from '@/firebase';
import { useAuthContext } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import { AntDesign } from '@expo/vector-icons';

export function AppleAuthButton() {
    const { clearError, setUser, setIsAuthenticated } = useAuthContext();
    const router = useRouter();

    const handleSignInWithApple = async () => {
        try {
            const credential = await AppleAuthentication.signInAsync({
                requestedScopes: [
                    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                    AppleAuthentication.AppleAuthenticationScope.EMAIL,
                ],
            });

            // Create OAuthProvider credentials
            const provider = new OAuthProvider('apple.com');
            const oAuthCredential = provider.credential({
                idToken: credential.identityToken!,
                rawNonce: credential.nonce,
            });

            // Sign in with Firebase
            const userCredential = await signInWithCredential(auth, oAuthCredential);
            
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
                    // Use Apple credential full name if available
                    const email = userCredential.user.email || '';
                    await createUserProfile(
                        userCredential.user.uid,
                        email
                    );
                    
                    setUser({
                        email: email,
                        uid: userCredential.user.uid,
                        isPro: false,
                        isDeluxe: false,
                        createdAt: new Date(),
                    });
                    setIsAuthenticated(true);
                    router.replace('/Home');
                }
            }
        } catch (error) {
            console.error('Error signing in with Apple:', error);
        }
    };

    // Only show Apple Sign In on iOS
    if (Platform.OS !== 'ios') {
        return null;
    }

    return (
        <TouchableOpacity 
            onPress={handleSignInWithApple}
            className="flex-row items-center justify-center py-3 bg-black rounded-lg"
        >
            <AntDesign name="apple1" size={24} color="white" style={{ marginRight: 10 }} />
            <Text className="text-white font-medium">Continue with Apple</Text>
        </TouchableOpacity>
    );
}