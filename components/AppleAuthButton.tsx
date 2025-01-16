import React, { useEffect} from 'react';
import { TouchableOpacity, Text, Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { OAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth, createUserProfile, getUserProfile } from '@/firebase';
import { useAuthContext } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import { AntDesign } from '@expo/vector-icons';
import * as Crypto from 'expo-crypto';


export function AppleAuthButton() {
    const { clearError, setUser, setIsAuthenticated } = useAuthContext();
    const router = useRouter();

    const generateNonce = async (): Promise<string> => {
        const charset = '0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._';
        const result = await Crypto.getRandomBytesAsync(32);
        const resultArray = Array.from(result);
        return resultArray.map(x => charset[x % charset.length]).join('');
    };

    const handleSignInWithApple = async () => {
        try {
            const nonce = await generateNonce();
            const credential = await AppleAuthentication.signInAsync({
                requestedScopes: [
                    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                    AppleAuthentication.AppleAuthenticationScope.EMAIL,
                ],
                state: nonce, // Using state instead of nonce
            });

            // Create OAuthProvider credentials
            const provider = new OAuthProvider('apple.com');
            const oAuthCredential = provider.credential({
                idToken: credential.identityToken!,
                rawNonce: nonce, // Use the generated nonce
            });

            // Sign in with Firebase
            const userCredential = await signInWithCredential(auth, oAuthCredential);
            
            if (userCredential.user) {
                clearError();
                
                try {
                    const existingProfile = await getUserProfile(userCredential.user.uid);
                    setUser(existingProfile);
                    setIsAuthenticated(true);
                    useEffect(() => {
                          router.replace('/Home');
                      }, []);
                } catch (error) {
                    // If profile doesn't exist, create new one
                    const email = userCredential.user.email || '';
                    await createUserProfile(
                        userCredential.user.uid,
                        email,
                        credential.fullName ? `${credential.fullName.givenName} ${credential.fullName.familyName}` : undefined
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
            if (error instanceof Error) {
                // Type narrow to Error to access error.code
                const err = error as { code?: string; message: string };
                
                if (err.code === 'ERR_CANCELED') {
                    console.log('User cancelled Apple sign in');
                    return;
                } else {
                    console.error('Sign in error:', err.message);
                }
            } else {
                console.error('An unknown error occurred');
            }
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