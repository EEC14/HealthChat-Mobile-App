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

const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type SignInFormData = z.infer<typeof signInSchema>;
export default function SignIn() {
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
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="justify-center flex-1 px-4 "
      style={{}}
    >
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ delay: 300 }}
        style={{
          backgroundColor: "rgba(255,255,255,1)",
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
          <AntDesign name="login" size={44} color="lightblue" />
          <Text className="mt-2 text-2xl font-bold text-gray-800 dark:text-gray-100">
            Welcome Back
          </Text>
          <Text className="text-center text-gray-600 dark:text-gray-300">
            Sign in to continue
          </Text>
        </View>

        {error && (
          <View className="relative px-4 py-3 mb-4 text-red-700 bg-red-100 border border-red-400 rounded">
            <Text className="text-red-100 dark:text-red-300">sad {error}</Text>
          </View>
        )}

        <View className="gap-6">
          <View>
            <Controller
              name="email"
              control={control}
              render={({ field: { onChange, value } }) => (
                <TextInput
                  className={`px-6 py-4 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-800 dark:text-gray-100 ${
                    errors.email ? "border-[1px] border-red-500" : ""
                  }`}
                  placeholder="Email"
                  placeholderTextColor="#a1a1aa"
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
                  // onFocus={}
                  // style={{
                  //   borderStyle: "solid",
                  //   borderWidth: 1,
                  //   borderColor: errors.password ? "red" : "transparent",
                  // }}
                  className={`px-6 py-4 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-800 dark:text-gray-100 ${
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
            className={`py-4 rounded-lg items-center justify-center ${
              isValid && !isLoading
                ? "bg-blue-600 dark:bg-blue-500"
                : "bg-gray-400 dark:bg-gray-600"
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

        <View>
          <Link href="/SignUp" className="text-center">
            <Text>Don't have an account? </Text>
            <Text className="text-center text-blue-600 dark:text-blue-400">
              Sign Up
            </Text>
          </Link>
        </View>
      </MotiView>
    </KeyboardAvoidingView>
  );
}
