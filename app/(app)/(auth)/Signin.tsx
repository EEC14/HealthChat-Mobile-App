import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import AntDesign from "@expo/vector-icons/AntDesign";
import { z } from "zod";
import { Link, useRouter } from "expo-router";
import { useAuthContext } from "@/context/AuthContext";
import { MotiView } from "moti";
import Octicons from "@expo/vector-icons/Octicons";
import { Colors } from "@/constants/Colors";
import { Theme, useTheme } from "@/context/ThemeContext";
import { StatusBar } from "expo-status-bar";
import { GoogleAuthButton } from "@/components/GoogleAuthButton";
import { AppleAuthButton } from "@/components/AppleAuthButton";
const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type SignInFormData = z.infer<typeof signInSchema>;
function SignIn() {
  const { theme } = useTheme();
  const currentColors = Colors[theme];
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuthContext();
  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    mode: "onChange",
  });

  const onSubmit: SubmitHandler<SignInFormData> = async (data) => {
    const success = await login(data.email, data.password);
    if (success) {
      clearError();
      router.replace("/Home");
    }
  };

  return (
    <>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="justify-center flex-1 px-4"
        style={{ backgroundColor: currentColors.background }}
      >
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 300 }}
          style={{
            backgroundColor: currentColors.surface,
            borderRadius: 20,
            padding: 20,
            gap: 20,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 20,
            elevation: 10,
          }}
        >
          <View className="items-center gap-2">
            <AntDesign
              name="login"
              size={44}
              color={currentColors.textPrimary}
            />
            <Text
              className="mt-2 text-2xl font-bold"
              style={{ color: currentColors.textPrimary }}
            >
              Welcome Back
            </Text>
            <Text
              className="text-center "
              style={{ color: currentColors.textSecondary }}
            >
              Sign in to continue
            </Text>
          </View>

          {error && (
            <View className="relative flex-row items-center px-4 py-3 mb-4 text-red-700 bg-red-500 border border-red-400 rounded">
              <Text
                className="flex-1 text-red-900 dark:text-red-300"
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {error}
              </Text>
              <TouchableOpacity onPress={() => clearError()} className="mr-2">
                <Octicons
                  name="x"
                  size={20}
                  color={currentColors.textPrimary}
                />
              </TouchableOpacity>
            </View>
          )}

          <View className="gap-6">
            <View>
              <Controller
                name="email"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={{
                      backgroundColor: currentColors.inputBackground,
                      color: currentColors.textPrimary,
                    }}
                    className={`px-6 py-4 rounded-lg focus:border-[1px] border- focus:border-blue-500 ${
                      errors.email ? "border-[1px] border-red-500" : ""
                    }`}
                    placeholder="Email"
                    placeholderTextColor={currentColors.placeholderText}
                    value={value}
                    onChangeText={onChange}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                )}
              />
              {errors.email && (
                <Text className="mt-1 text-sm text-red-500">
                  {errors.email.message?.toString()}
                </Text>
              )}
            </View>

            <View>
              <Controller
                name="password"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={{
                      backgroundColor: currentColors.inputBackground,
                      color: currentColors.textPrimary,
                    }}
                    className={`px-6 py-4 rounded-lg focus:border-[1px] focus:border-blue-500 ${
                      errors.password ? "border-[1px] border-red-500" : ""
                    }`}
                    placeholder="Password"
                    placeholderTextColor="#a1a1aa"
                    secureTextEntry
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />
              {errors.password && (
                <Text className="mt-1 text-sm text-red-500">
                  {errors.password.message?.toString()}
                </Text>
              )}
            </View>

            <TouchableOpacity
              onPress={handleSubmit(onSubmit)}
              disabled={!isValid || isLoading}
              className={`py-4 rounded-lg items-center justify-center bg-[#1E3A8A] ${
                (!isValid || isLoading) && "opacity-35"
              }`}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="font-semibold text-center text-white">
                  Sign In
                </Text>
              )}
            </TouchableOpacity>
          </View>
          <View className="my-4 flex-row items-center">
            <View className="flex-1 h-px bg-gray-300" />
            <Text className="mx-4 text-gray-500">or</Text>
            <View className="flex-1 h-px bg-gray-300" />
          </View>

          <GoogleAuthButton />
          <AppleAuthButton />
          <View>
            <Link href="/SignUp" className="text-center">
              <Text style={{ color: currentColors.textPrimary }}>
                Don't have an account?{" "}
              </Text>
              <Text className="text-center text-blue-600 dark:text-blue-400">
                Sign Up
              </Text>
            </Link>
          </View>
        </MotiView>
      </KeyboardAvoidingView>
    </>
  );
}

export default SignIn;