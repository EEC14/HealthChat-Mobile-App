import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
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
import { useTheme } from "@/context/ThemeContext";
const signUpSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(
      /[!@#$%^&*()]/,
      "Password must contain at least one special character"
    ),
});

type SignUpFormData = z.infer<typeof signUpSchema>;

export default function SignUp() {
  const { theme } = useTheme();
  const currentColors = Colors[theme];
  const { register, isLoading, error, clearError } = useAuthContext();
  const [termsModalVisible, setTermsModalVisible] = useState(false);
  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const router = useRouter();

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    mode: "onChange",
  });

  const onSubmit: SubmitHandler<SignUpFormData> = async (data) => {
    if (!termsAccepted) {
      Alert.alert("Error", "Please accept the terms and conditions");
      return;
    }

    const success = await register(data.email, data.password);
    if (success) {
      clearError();
      router.replace("/Home");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ backgroundColor: currentColors.background }}
      className="justify-center flex-1 px-4"
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
        // className="w-full max-w-md gap-6 shadow-lg dark:bg-gray-800 rounded-xl"
      >
        <View className="items-center gap-2">
          <AntDesign name="user" size={44} color={currentColors.textPrimary} />
          <Text
            className="mt-2 text-2xl font-bold"
            style={{ color: currentColors.textPrimary }}
          >
            Create Account
          </Text>
          <Text
            style={{ color: currentColors.textSecondary }}
            className="text-center"
          >
            Sign up to start using the app
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
              <Octicons name="x" size={20} color={currentColors.textPrimary} />
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
                  className={`px-6 py-4 rounded-lg focus:border-[1px] focus:border-blue-500 ${
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

          {/* Terms of Service Checkbox */}

          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              onPress={() => setTermsAccepted(!termsAccepted)}
              style={{
                width: 18,
                height: 18,
                borderWidth: 1,
                borderColor: "gray",
                borderRadius: 2,
              }}
            >
              <View
                className={`w-full h-full border-[1px] ${
                  termsAccepted
                    ? "bg-blue-600 border-blue-600"
                    : "border-gray-300 bg-white"
                }`}
              >
                {termsAccepted && (
                  <Text className="text-center text-[10px] text-white">✓</Text>
                )}
              </View>
            </TouchableOpacity>
            <View className="flex-row items-center">
              <Text className="text-sm text-gray-600 dark:text-gray-400">
                I agree to the
              </Text>
              <TouchableOpacity onPress={() => setTermsModalVisible(true)}>
                <Text className="ml-1 text-sm text-blue-600 dark:text-blue-400">
                  Terms of Service
                </Text>
              </TouchableOpacity>
              <Text className="text-sm text-gray-600 dark:text-gray-400">
                {" "}
                and{" "}
              </Text>
              <TouchableOpacity onPress={() => setPrivacyModalVisible(true)}>
                <Text className="ml-1 text-sm text-blue-600 dark:text-blue-400">
                  Privacy Policy
                </Text>
              </TouchableOpacity>
            </View>
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
                Sign Up
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View className="mt-4">
          <Link href="/Signin" className="text-center">
            <Text className="text-center text-blue-600 dark:text-blue-400">
              Already have an account? Sign In
            </Text>
          </Link>
        </View>
      </MotiView>

      {/* Terms of Service Modal */}
      <Modal
        visible={termsModalVisible}
        onRequestClose={() => setTermsModalVisible(false)}
        animationType="slide"
      >
        <View className="items-center justify-center flex-1 p-10 bg-gray-200 bg-opacity-50">
          <Text className="mb-4 text-2xl font-semibold text-gray-800 dark:text-gray-100">
            Terms of Service
          </Text>
          <ScrollView className="max-h-100">
            <Text className="text-gray-600 dark:text-gray-400">
              1. Acceptance of Terms By accessing or using HealthChat (the
              'Service'), users agree to be bound by these Terms of Service
              ('Terms'). If users do not agree, they must immediately cease use
              of the Service. These Terms are subject to change at any time
              without notice, and continued use of the Service constitutes
              acceptance of the revised Terms. 2. Scope of Service The Service
              provides general information for informational purposes only. It
              is not intended to replace professional advice, diagnosis, or
              treatment. The creators of the Service reserve the right to
              modify, limit, or discontinue the Service at any time without
              prior notice 3. User Responsibilities Users agree to: Provide
              accurate information when interacting with the Service. Use the
              Service in compliance with applicable laws and regulations. Accept
              full responsibility for any actions taken based on information
              provided by the Service. Prohibited activities include, but are
              not limited to: Misuse of the Service for unlawful purposes.
              Interference with the Service's functionality. Submission of
              false, misleading, or harmful information. 4. Disclaimer of
              Liability The Service is provided 'as-is' and 'as available'
              without any warranties, express or implied. No Warranty: We do not
              guarantee accuracy, reliability, or availability of the Service.
              Limitation of Liability: To the fullest extent permitted by law,
              we disclaim all liability for damages, including but not limited
              to direct, indirect, incidental, or consequential damages arising
              from the use of the Service. User Responsibility: Users
              acknowledge they use the Service at their own risk. 5.
              Intellectual Proprety All content, designs, and intellectual
              property associated with the Service are owned exclusively by ESB
              Healthcare Ltd or its licensors. Users are granted a limited,
              non-transferable license to access and use the Service for
              personal, non-commercial purposes. Unauthorized use or
              reproduction is strictly prohibited. 6. Privacy By using the
              Service, users consent to the collection and use of their data as
              outlined in the Privacy Policy 7. Termination of Access We reserve
              the right to suspend or terminate user access to the Service at
              any time and for any reason, including violations of these Terms
              or operational considerations. 8. Indemnification Users agree to
              indemnify, defend, and hold harmless ESB Healthcare Ltd, its
              affiliates, and partners from any claims, damages, liabilities, or
              expenses arising from their use of the Service or breach of these
              Terms. 9. Governing Law and Jurisdiction These Terms are governed
              by the laws of England and Wales. Any disputes arising under these
              Terms shall be subject to the exclusive jurisdiction of the courts
              in London. 10. Changes to These Terms We reserve the right to
              update these Terms at any time without prior notice. Users are
              encouraged to review these Terms periodically to stay informed of
              any updates. 11. Contact Information For questions or concerns
              regarding these Terms, users can contact: Email:
              compliance@esbhealthcare.com Address: 1 Maple Road, Stockport SK7
              2DH, GB
            </Text>
          </ScrollView>
          <TouchableOpacity
            onPress={() => setTermsModalVisible(false)}
            className="self-stretch py-2 mt-4 bg-blue-600 rounded-lg dark:bg-blue-500 "
          >
            <Text className="text-center text-white">Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Privacy Policy Modal */}
      <Modal
        visible={privacyModalVisible}
        onRequestClose={() => setPrivacyModalVisible(false)}
        animationType="slide"
      >
        <View className="items-center justify-center flex-1 bg-gray-700 bg-opacity-50">
          <View className="items-center justify-center flex-1 p-10 bg-gray-200 bg-opacity-50">
            <Text className="mb-4 text-2xl font-semibold text-gray-800 dark:text-gray-100">
              Privacy Policy
            </Text>
            <ScrollView className="max-h-100">
              <Text className="text-gray-600 dark:text-gray-400">
                1. Introduction This Privacy Policy outlines the practices and
                principles regarding the collection, processing, and storage of
                data when interacting with HealthChat (the “Service”). By using
                the Service, users agree to the processing of their data as
                outlined in this policy. 2. Data Collection We may collect the
                following types of data: User Data: Includes, but is not limited
                to, identifying information such as names, contact details, and
                other information submitted during use. Interaction Data:
                Includes all data entered into the chatbot, including sensitive
                or non-sensitive data. Technical Data: Device identifiers, IP
                addresses, browsing behaviors, cookies, and other metadata. 3.
                Purpose of Data Use The data collected may be used for purposes
                including, but not limited to: Enhancing the Service’s
                functionality and user experience. Developing and
                commercializing insights derived from user interactions.
                Ensuring compliance with applicable laws and regulations.
                Marketing and advertising, subject to applicable permissions. 4.
                Legal Basis for Processing The legal basis for processing data
                is determined on a case-by-case basis and may include user
                consent, performance of a contract, compliance with legal
                obligations, or legitimate interests pursued by the business. 5.
                Data Sharing and Transfers We may share or transfer data to:
                Third-party service providers, vendors, or contractors for
                operational purposes. Affiliates, business partners, and
                advertisers. Governmental authorities as required by law Buyers
                or successors in the event of a business sale, merger, or
                acquisition. Where data is transferred outside the EEA,
                appropriate safeguards such as Standard Contractual Clauses may
                apply. 6. Retention of Data Data will be retained for as long as
                necessary to fulfill the purposes for which it was collected or
                for longer periods where legally required or operationally
                advantageous. 7. Cookies and Tracking Technologies We may use
                cookies, web beacons, and other tracking technologies to collect
                data about user behavior and preferences. Users can manage or
                restrict cookies via their browser settings. 8. User Rights
                Users may have rights under applicable law, such as: Accessing
                their data. Requesting rectification or deletion of data (where
                feasible). Objecting to or restricting certain processing
                activities. Requests must be submitted via e-mail, and we
                reserve the right to deny requests where legally permissible. 9.
                Data Security While we implement standard security measures, no
                system is completely secure. Users acknowledge and accept that
                the provision of data is at their own risk. 10. Changes to This
                Policy We reserve the right to update or modify this policy at
                any time without prior notice. The latest version will be
                published on the website or Service. Continued use of the
                Service constitutes acceptance of the updated terms. 11. Contact
                Information For inquiries regarding this Privacy Policy,
                contact: Email: compliance@esbhealthcare.com Address: 1 Maple
                Road, Stockport SK7 2DH, GB
              </Text>
            </ScrollView>
            <TouchableOpacity
              onPress={() => setPrivacyModalVisible(false)}
              className="self-stretch py-2 mt-4 bg-blue-600 rounded-lg dark:bg-blue-500 "
            >
              <Text className="text-center text-white">Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
