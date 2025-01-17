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
import { GoogleAuthButton } from "@/components/GoogleAuthButton";
import { AppleAuthButton } from "@/components/AppleAuthButton";
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
    <>
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
            <AntDesign
              name="user"
              size={44}
              color={currentColors.textPrimary}
            />
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
                    <Text className="text-center text-[10px] text-white">
                      ✓
                    </Text>
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
          <View className="my-4 flex-row items-center">
            <View className="flex-1 h-px bg-gray-300" />
            <Text className="mx-4 text-gray-500">or</Text>
            <View className="flex-1 h-px bg-gray-300" />
          </View>

          <GoogleAuthButton />
          <AppleAuthButton />
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
                ('Terms'). If users do not agree, they must immediately cease
                use of the Service. These Terms are subject to change at any
                time without notice, and continued use of the Service
                constitutes acceptance of the revised Terms. 2. Scope of Service
                The Service provides general information for informational
                purposes only. It is not intended to replace professional
                advice, diagnosis, or treatment. The creators of the Service
                reserve the right to modify, limit, or discontinue the Service
                at any time without prior notice 3. User Responsibilities Users
                agree to: Provide accurate information when interacting with the
                Service. Use the Service in compliance with applicable laws and
                regulations. Accept full responsibility for any actions taken
                based on information provided by the Service. Prohibited
                activities include, but are not limited to: Misuse of the
                Service for unlawful purposes. Interference with the Service's
                functionality. Submission of false, misleading, or harmful
                information. 4. Disclaimer of Liability The Service is provided
                'as-is' and 'as available' without any warranties, express or
                implied. No Warranty: We do not guarantee accuracy, reliability,
                or availability of the Service. Limitation of Liability: To the
                fullest extent permitted by law, we disclaim all liability for
                damages, including but not limited to direct, indirect,
                incidental, or consequential damages arising from the use of the
                Service. User Responsibility: Users acknowledge they use the
                Service at their own risk. 5. Intellectual Proprety All content,
                designs, and intellectual property associated with the Service
                are owned exclusively by ESB Healthcare Ltd or its licensors.
                Users are granted a limited, non-transferable license to access
                and use the Service for personal, non-commercial purposes.
                Unauthorized use or reproduction is strictly prohibited. 6.
                Privacy By using the Service, users consent to the collection
                and use of their data as outlined in the Privacy Policy 7.
                Termination of Access We reserve the right to suspend or
                terminate user access to the Service at any time and for any
                reason, including violations of these Terms or operational
                considerations. 8. Indemnification Users agree to indemnify,
                defend, and hold harmless ESB Healthcare Ltd, its affiliates,
                and partners from any claims, damages, liabilities, or expenses
                arising from their use of the Service or breach of these Terms.
                9. Governing Law and Jurisdiction These Terms are governed by
                the laws of England and Wales. Any disputes arising under these
                Terms shall be subject to the exclusive jurisdiction of the
                courts in London. 10. Changes to These Terms We reserve the
                right to update these Terms at any time without prior notice.
                Users are encouraged to review these Terms periodically to stay
                informed of any updates. 11. Contact Information For questions
                or concerns regarding these Terms, users can contact: Email:
                compliance@esbhealthcare.com Address: 1 Maple Road, Stockport
                SK7 2DH, GB
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
                Privacy Policy  
                    ==============

                    Last updated: January 16, 2025

                    This Privacy Policy describes Our policies and procedures on the collection,
                    use and disclosure of Your information when You use the Service and tells You
                    about Your privacy rights and how the law protects You.

                    We use Your Personal data to provide and improve the Service. By using the
                    Service, You agree to the collection and use of information in accordance with
                    this Privacy Policy.

                    Interpretation and Definitions  
                    ------------------------------

                    Interpretation  
                    ~~~~~~~~~~~~~~

                    The words of which the initial letter is capitalized have meanings defined
                    under the following conditions. The following definitions shall have the same
                    meaning regardless of whether they appear in singular or in plural.

                    Definitions  
                    ~~~~~~~~~~~

                    For the purposes of this Privacy Policy:

                      * Account means a unique account created for You to access our Service or
                        parts of our Service.

                      * Affiliate means an entity that controls, is controlled by or is under
                        common control with a party, where "control" means ownership of 50% or
                        more of the shares, equity interest or other securities entitled to vote
                        for election of directors or other managing authority.

                      * Application refers to HealthChat, the software program provided by the
                        Company.

                      * Business , for the purpose of CCPA/CPRA, refers to the Company as the
                        legal entity that collects Consumers' personal information and determines
                        the purposes and means of the processing of Consumers' personal
                        information, or on behalf of which such information is collected and that
                        alone, or jointly with others, determines the purposes and means of the
                        processing of consumers' personal information, that does business in the
                        State of California.

                      * CCPA and/or CPRA refers to the California Consumer Privacy Act (the
                        "CCPA") as amended by the California Privacy Rights Act of 2020 (the
                        "CPRA").

                      * Company (referred to as either "the Company", "We", "Us" or "Our" in this
                        Agreement) refers to ESB Healthcare Ltd, 1 Maple Road, Stockport SK7 2DH.

                        For the purpose of the GDPR, the Company is the Data Controller.

                      * Consumer , for the purpose of the CCPA/CPRA, means a natural person who is
                        a California resident. A resident, as defined in the law, includes (1)
                        every individual who is in the USA for other than a temporary or
                        transitory purpose, and (2) every individual who is domiciled in the USA
                        who is outside the USA for a temporary or transitory purpose.

                      * Cookies are small files that are placed on Your computer, mobile device or
                        any other device by a website, containing the details of Your browsing
                        history on that website among its many uses.

                      * Country refers to: United Kingdom

                      * Data Controller , for the purposes of the GDPR (General Data Protection
                        Regulation), refers to the Company as the legal person which alone or
                        jointly with others determines the purposes and means of the processing of
                        Personal Data.

                      * Device means any device that can access the Service such as a computer, a
                        cellphone or a digital tablet.

                      * Do Not Track (DNT) is a concept that has been promoted by US regulatory
                        authorities, in particular the U.S. Federal Trade Commission (FTC), for
                        the Internet industry to develop and implement a mechanism for allowing
                        internet users to control the tracking of their online activities across
                        websites.

                      * GDPR refers to EU General Data Protection Regulation.

                      * Personal Data is any information that relates to an identified or
                        identifiable individual.

                        For the purposes of GDPR, Personal Data means any information relating to
                        You such as a name, an identification number, location data, online
                        identifier or to one or more factors specific to the physical,
                        physiological, genetic, mental, economic, cultural or social identity.

                        For the purposes of the CCPA/CPRA, Personal Data means any information
                        that identifies, relates to, describes or is capable of being associated
                        with, or could reasonably be linked, directly or indirectly, with You.

                      * Service refers to the Application or the Website or both.

                      * Service Provider means any natural or legal person who processes the data
                        on behalf of the Company. It refers to third-party companies or
                        individuals employed by the Company to facilitate the Service, to provide
                        the Service on behalf of the Company, to perform services related to the
                        Service or to assist the Company in analyzing how the Service is used. For
                        the purpose of the GDPR, Service Providers are considered Data Processors.

                      * Usage Data refers to data collected automatically, either generated by the
                        use of the Service or from the Service infrastructure itself (for example,
                        the duration of a page visit).

                      * Website refers to HealthChat, accessible from www.healthchat-
                        patient.esbhealthcare.com

                      * You means the individual accessing or using the Service, or the company,
                        or other legal entity on behalf of which such individual is accessing or
                        using the Service, as applicable.

                        Under GDPR, You can be referred to as the Data Subject or as the User as
                        you are the individual using the Service.

                    Collecting and Using Your Personal Data  
                    ---------------------------------------

                    Types of Data Collected  
                    ~~~~~~~~~~~~~~~~~~~~~~~

                    Personal Data  
                    *************

                    While using Our Service, We may ask You to provide Us with certain personally
                    identifiable information that can be used to contact or identify You.
                    Personally identifiable information may include, but is not limited to:

                      * Email address

                      * Usage Data


                    Usage Data  
                    **********

                    Usage Data is collected automatically when using the Service.

                    Usage Data may include information such as Your Device's Internet Protocol
                    address (e.g. IP address), browser type, browser version, the pages of our
                    Service that You visit, the time and date of Your visit, the time spent on
                    those pages, unique device identifiers and other diagnostic data.

                    When You access the Service by or through a mobile device, We may collect
                    certain information automatically, including, but not limited to, the type of
                    mobile device You use, Your mobile device unique ID, the IP address of Your
                    mobile device, Your mobile operating system, the type of mobile Internet
                    browser You use, unique device identifiers and other diagnostic data.

                    We may also collect information that Your browser sends whenever You visit our
                    Service or when You access the Service by or through a mobile device.

                    Tracking Technologies and Cookies  
                    *********************************

                    We use Cookies and similar tracking technologies to track the activity on Our
                    Service and store certain information. Tracking technologies used are beacons,
                    tags, and scripts to collect and track information and to improve and analyze
                    Our Service. The technologies We use may include:

                      * Cookies or Browser Cookies. A cookie is a small file placed on Your
                        Device. You can instruct Your browser to refuse all Cookies or to indicate
                        when a Cookie is being sent. However, if You do not accept Cookies, You
                        may not be able to use some parts of our Service. Unless you have adjusted
                        Your browser setting so that it will refuse Cookies, our Service may use
                        Cookies.
                      * Web Beacons. Certain sections of our Service and our emails may contain
                        small electronic files known as web beacons (also referred to as clear
                        gifs, pixel tags, and single-pixel gifs) that permit the Company, for
                        example, to count users who have visited those pages or opened an email
                        and for other related website statistics (for example, recording the
                        popularity of a certain section and verifying system and server
                        integrity).

                    Cookies can be "Persistent" or "Session" Cookies. Persistent Cookies remain on
                    Your personal computer or mobile device when You go offline, while Session
                    Cookies are deleted as soon as You close Your web browser. Learn more about
                    cookies on the [Privacy Policies
                    website](https://www.privacypolicies.com/blog/privacy-policy-
                    template/#Use_Of_Cookies_Log_Files_And_Tracking) article.

                    We use both Session and Persistent Cookies for the purposes set out below:

                      * Necessary / Essential Cookies

                        Type: Session Cookies

                        Administered by: Us

                        Purpose: These Cookies are essential to provide You with services
                        available through the Website and to enable You to use some of its
                        features. They help to authenticate users and prevent fraudulent use of
                        user accounts. Without these Cookies, the services that You have asked for
                        cannot be provided, and We only use these Cookies to provide You with
                        those services.

                      * Cookies Policy / Notice Acceptance Cookies

                        Type: Persistent Cookies

                        Administered by: Us

                        Purpose: These Cookies identify if users have accepted the use of cookies
                        on the Website.

                      * Functionality Cookies

                        Type: Persistent Cookies

                        Administered by: Us

                        Purpose: These Cookies allow us to remember choices You make when You use
                        the Website, such as remembering your login details or language
                        preference. The purpose of these Cookies is to provide You with a more
                        personal experience and to avoid You having to re-enter your preferences
                        every time You use the Website.

                      * Tracking and Performance Cookies

                        Type: Persistent Cookies

                        Administered by: Third-Parties

                        Purpose: These Cookies are used to track information about traffic to the
                        Website and how users use the Website. The information gathered via these
                        Cookies may directly or indirectly identify you as an individual visitor.
                        This is because the information collected is typically linked to a
                        pseudonymous identifier associated with the device you use to access the
                        Website. We may also use these Cookies to test new pages, features or new
                        functionality of the Website to see how our users react to them.

                    For more information about the cookies we use and your choices regarding
                    cookies, please visit our Cookies Policy or the Cookies section of our Privacy
                    Policy.

                    Use of Your Personal Data  
                    ~~~~~~~~~~~~~~~~~~~~~~~~~

                    The Company may use Personal Data for the following purposes:

                      * To provide and maintain our Service , including to monitor the usage of
                        our Service.

                      * To manage Your Account: to manage Your registration as a user of the
                        Service. The Personal Data You provide can give You access to different
                        functionalities of the Service that are available to You as a registered
                        user.

                      * For the performance of a contract: the development, compliance and
                        undertaking of the purchase contract for the products, items or services
                        You have purchased or of any other contract with Us through the Service.

                      * To contact You: To contact You by email, telephone calls, SMS, or other
                        equivalent forms of electronic communication, such as a mobile
                        application's push notifications regarding updates or informative
                        communications related to the functionalities, products or contracted
                        services, including the security updates, when necessary or reasonable for
                        their implementation.

                      * To provide You with news, special offers and general information about
                        other goods, services and events which we offer that are similar to those
                        that you have already purchased or enquired about unless You have opted
                        not to receive such information.

                      * To manage Your requests: To attend and manage Your requests to Us.

                      * For business transfers: We may use Your information to evaluate or conduct
                        a merger, divestiture, restructuring, reorganization, dissolution, or
                        other sale or transfer of some or all of Our assets, whether as a going
                        concern or as part of bankruptcy, liquidation, or similar proceeding, in
                        which Personal Data held by Us about our Service users is among the assets
                        transferred.

                      * For other purposes : We may use Your information for other purposes, such
                        as data analysis, identifying usage trends, determining the effectiveness
                        of our promotional campaigns and to evaluate and improve our Service,
                        products, services, marketing and your experience.


                    We may share Your personal information in the following situations:

                      * With Service Providers: We may share Your personal information with
                        Service Providers to monitor and analyze the use of our Service, for
                        payment processing, to contact You.
                      * For business transfers: We may share or transfer Your personal information
                        in connection with, or during negotiations of, any merger, sale of Company
                        assets, financing, or acquisition of all or a portion of Our business to
                        another company.
                      * With Affiliates: We may share Your information with Our affiliates, in
                        which case we will require those affiliates to honor this Privacy Policy.
                        Affiliates include Our parent company and any other subsidiaries, joint
                        venture partners or other companies that We control or that are under
                        common control with Us.
                      * With business partners: We may share Your information with Our business
                        partners to offer You certain products, services or promotions.
                      * With other users: when You share personal information or otherwise
                        interact in the public areas with other users, such information may be
                        viewed by all users and may be publicly distributed outside.
                      * With Your consent : We may disclose Your personal information for any
                        other purpose with Your consent.

                    Retention of Your Personal Data  
                    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

                    The Company will retain Your Personal Data only for as long as is necessary
                    for the purposes set out in this Privacy Policy. We will retain and use Your
                    Personal Data to the extent necessary to comply with our legal obligations
                    (for example, if we are required to retain your data to comply with applicable
                    laws), resolve disputes, and enforce our legal agreements and policies.

                    The Company will also retain Usage Data for internal analysis purposes. Usage
                    Data is generally retained for a shorter period of time, except when this data
                    is used to strengthen the security or to improve the functionality of Our
                    Service, or We are legally obligated to retain this data for longer time
                    periods.

                    Transfer of Your Personal Data  
                    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

                    Your information, including Personal Data, is processed at the Company's
                    operating offices and in any other places where the parties involved in the
                    processing are located. It means that this information may be transferred to —
                    and maintained on — computers located outside of Your state, province, country
                    or other governmental jurisdiction where the data protection laws may differ
                    than those from Your jurisdiction.

                    Your consent to this Privacy Policy followed by Your submission of such
                    information represents Your agreement to that transfer.

                    The Company will take all steps reasonably necessary to ensure that Your data
                    is treated securely and in accordance with this Privacy Policy and no transfer
                    of Your Personal Data will take place to an organization or a country unless
                    there are adequate controls in place including the security of Your data and
                    other personal information.

                    Delete Your Personal Data  
                    ~~~~~~~~~~~~~~~~~~~~~~~~~

                    You have the right to delete or request that We assist in deleting the
                    Personal Data that We have collected about You.

                    Our Service may give You the ability to delete certain information about You
                    from within the Service.

                    You may update, amend, or delete Your information at any time by signing in to
                    Your Account, if you have one, and visiting the account settings section that
                    allows you to manage Your personal information. You may also contact Us to
                    request access to, correct, or delete any personal information that You have
                    provided to Us.

                    Please note, however, that We may need to retain certain information when we
                    have a legal obligation or lawful basis to do so.

                    Disclosure of Your Personal Data  
                    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

                    Business Transactions  
                    *********************

                    If the Company is involved in a merger, acquisition or asset sale, Your
                    Personal Data may be transferred. We will provide notice before Your Personal
                    Data is transferred and becomes subject to a different Privacy Policy.

                    Law enforcement  
                    ***************

                    Under certain circumstances, the Company may be required to disclose Your
                    Personal Data if required to do so by law or in response to valid requests by
                    public authorities (e.g. a court or a government agency).

                    Other legal requirements  
                    ************************

                    The Company may disclose Your Personal Data in the good faith belief that such
                    action is necessary to:

                      * Comply with a legal obligation
                      * Protect and defend the rights or property of the Company
                      * Prevent or investigate possible wrongdoing in connection with the Service
                      * Protect the personal safety of Users of the Service or the public
                      * Protect against legal liability

                    Security of Your Personal Data  
                    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

                    The security of Your Personal Data is important to Us, but remember that no
                    method of transmission over the Internet, or method of electronic storage is
                    100% secure. While We strive to use commercially acceptable means to protect
                    Your Personal Data, We cannot guarantee its absolute security.

                    Detailed Information on the Processing of Your Personal Data  
                    ------------------------------------------------------------

                    The Service Providers We use may have access to Your Personal Data. These
                    third-party vendors collect, store, use, process and transfer information
                    about Your activity on Our Service in accordance with their Privacy Policies.

                    Analytics  
                    ~~~~~~~~~

                    We may use third-party Service providers to monitor and analyze the use of our
                    Service.

                      * Google Analytics

                        Google Analytics is a web analytics service offered by Google that tracks
                        and reports website traffic. Google uses the data collected to track and
                        monitor the use of our Service. This data is shared with other Google
                        services. Google may use the collected data to contextualize and
                        personalize the ads of its own advertising network.

                        You can opt-out of having made your activity on the Service available to
                        Google Analytics by installing the Google Analytics opt-out browser add-
                        on. The add-on prevents the Google Analytics JavaScript (ga.js,
                        analytics.js and dc.js) from sharing information with Google Analytics
                        about visits activity.

                        You may opt-out of certain Google Analytics features through your mobile
                        device settings, such as your device advertising settings or by following
                        the instructions provided by Google in their Privacy Policy:
                        policies.google.com/privacy

                        For more information on the privacy practices of Google, please visit the
                        Google Privacy & Terms web page: policies.google.com/privacy

                      * Firebase

                        Firebase is an analytics service provided by Google Inc.

                        You may opt-out of certain Firebase features through your mobile device
                        settings, such as your device advertising settings or by following the
                        instructions provided by Google in their Privacy Policy:
                        policies.google.com/privacy

                        We also encourage you to review the Google's policy for safeguarding your
                        data: support.google.com/analytics/answer/6004245

                        For more information on what type of information Firebase collects, please
                        visit the How Google uses data when you use our partners' sites or apps
                        webpage: policies.google.com/technologies/partner-sites

                    Payments  
                    ~~~~~~~~

                    We may provide paid products and/or services within the Service. In that case,
                    we may use third-party services for payment processing (e.g. payment
                    processors).

                    We will not store or collect Your payment card details. That information is
                    provided directly to Our third-party payment processors whose use of Your
                    personal information is governed by their Privacy Policy. These payment
                    processors adhere to the standards set by PCI-DSS as managed by the PCI
                    Security Standards Council, which is a joint effort of brands like Visa,
                    Mastercard, American Express and Discover. PCI-DSS requirements help ensure
                    the secure handling of payment information.

                      * Apple Store In-App Payments

                        Their Privacy Policy can be viewed at
                        www.apple.com/legal/privacy/en-ww/

                      * Google Play In-App Payments

                        Their Privacy Policy can be viewed at
                        www.google.com/policies/privacy/

                      * Stripe

                        Their Privacy Policy can be viewed at stripe.com/us/privacy

                    GDPR Privacy  
                    ------------

                    Legal Basis for Processing Personal Data under GDPR  
                    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

                    We may process Personal Data under the following conditions:

                      * Consent: You have given Your consent for processing Personal Data for one
                        or more specific purposes.
                      * Performance of a contract: Provision of Personal Data is necessary for the
                        performance of an agreement with You and/or for any pre-contractual
                        obligations thereof.
                      * Legal obligations: Processing Personal Data is necessary for compliance
                        with a legal obligation to which the Company is subject.
                      * Vital interests: Processing Personal Data is necessary in order to protect
                        Your vital interests or of another natural person.
                      * Public interests: Processing Personal Data is related to a task that is
                        carried out in the public interest or in the exercise of official
                        authority vested in the Company.
                      * Legitimate interests: Processing Personal Data is necessary for the
                        purposes of the legitimate interests pursued by the Company.

                    In any case, the Company will gladly help to clarify the specific legal basis
                    that applies to the processing, and in particular whether the provision of
                    Personal Data is a statutory or contractual requirement, or a requirement
                    necessary to enter into a contract.

                    Your Rights under the GDPR  
                    ~~~~~~~~~~~~~~~~~~~~~~~~~~

                    The Company undertakes to respect the confidentiality of Your Personal Data
                    and to guarantee You can exercise Your rights.

                    You have the right under this Privacy Policy, and by law if You are within the
                    EU, to:

                      * Request access to Your Personal Data. The right to access, update or
                        delete the information We have on You. Whenever made possible, you can
                        access, update or request deletion of Your Personal Data directly within
                        Your account settings section. If you are unable to perform these actions
                        yourself, please contact Us to assist You. This also enables You to
                        receive a copy of the Personal Data We hold about You.
                      * Request correction of the Personal Data that We hold about You. You have
                        the right to have any incomplete or inaccurate information We hold about
                        You corrected.
                      * Object to processing of Your Personal Data. This right exists where We are
                        relying on a legitimate interest as the legal basis for Our processing and
                        there is something about Your particular situation, which makes You want
                        to object to our processing of Your Personal Data on this ground. You also
                        have the right to object where We are processing Your Personal Data for
                        direct marketing purposes.
                      * Request erasure of Your Personal Data. You have the right to ask Us to
                        delete or remove Personal Data when there is no good reason for Us to
                        continue processing it.
                      * Request the transfer of Your Personal Data. We will provide to You, or to
                        a third-party You have chosen, Your Personal Data in a structured,
                        commonly used, machine-readable format. Please note that this right only
                        applies to automated information which You initially provided consent for
                        Us to use or where We used the information to perform a contract with You.
                      * Withdraw Your consent. You have the right to withdraw Your consent on
                        using your Personal Data. If You withdraw Your consent, We may not be able
                        to provide You with access to certain specific functionalities of the
                        Service.

                    Exercising of Your GDPR Data Protection Rights  
                    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

                    You may exercise Your rights of access, rectification, cancellation and
                    opposition by contacting Us. Please note that we may ask You to verify Your
                    identity before responding to such requests. If You make a request, We will
                    try our best to respond to You as soon as possible.

                    You have the right to complain to a Data Protection Authority about Our
                    collection and use of Your Personal Data. For more information, if You are in
                    the European Economic Area (EEA), please contact Your local data protection
                    authority in the EEA.

                    CCPA/CPRA Privacy Notice  
                    ------------------------

                    This privacy notice section for California residents supplements the
                    information contained in Our Privacy Policy and it applies solely to all
                    visitors, users, and others who reside in the State of California.

                    Categories of Personal Information Collected  
                    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

                    We collect information that identifies, relates to, describes, references, is
                    capable of being associated with, or could reasonably be linked, directly or
                    indirectly, with a particular Consumer or Device. The following is a list of
                    categories of personal information which we may collect or may have been
                    collected from California residents within the last twelve (12) months.

                    Please note that the categories and examples provided in the list below are
                    those defined in the CCPA/CPRA. This does not mean that all examples of that
                    category of personal information were in fact collected by Us, but reflects
                    our good faith belief to the best of Our knowledge that some of that
                    information from the applicable category may be and may have been collected.
                    For example, certain categories of personal information would only be
                    collected if You provided such personal information directly to Us.

                      * Category A: Identifiers.

                        Examples: A real name, alias, postal address, unique personal identifier,
                        online identifier, Internet Protocol address, email address, account name,
                        driver's license number, passport number, or other similar identifiers.

                        Collected: Yes.

                      * Category B: Personal information categories listed in the California
                        Customer Records statute (Cal. Civ. Code § 1798.80(e)).

                        Examples: A name, signature, Social Security number, physical
                        characteristics or description, address, telephone number, passport
                        number, driver's license or state identification card number, insurance
                        policy number, education, employment, employment history, bank account
                        number, credit card number, debit card number, or any other financial
                        information, medical information, or health insurance information. Some
                        personal information included in this category may overlap with other
                        categories.

                        Collected: Yes.

                      * Category C: Protected classification characteristics under California or
                        federal law.

                        Examples: Age (40 years or older), race, color, ancestry, national origin,
                        citizenship, religion or creed, marital status, medical condition,
                        physical or mental disability, sex (including gender, gender identity,
                        gender expression, pregnancy or childbirth and related medical
                        conditions), sexual orientation, veteran or military status, genetic
                        information (including familial genetic information).

                        Collected: No.

                      * Category D: Commercial information.

                        Examples: Records and history of products or services purchased or
                        considered.

                        Collected: Yes.

                      * Category E: Biometric information.

                        Examples: Genetic, physiological, behavioral, and biological
                        characteristics, or activity patterns used to extract a template or other
                        identifier or identifying information, such as, fingerprints, faceprints,
                        and voiceprints, iris or retina scans, keystroke, gait, or other physical
                        patterns, and sleep, health, or exercise data.

                        Collected: No.

                      * Category F: Internet or other similar network activity.

                        Examples: Interaction with our Service or advertisement.

                        Collected: Yes.

                      * Category G: Geolocation data.

                        Examples: Approximate physical location.

                        Collected: No.

                      * Category H: Sensory data.

                        Examples: Audio, electronic, visual, thermal, olfactory, or similar
                        information.

                        Collected: No.

                      * Category I: Professional or employment-related information.

                        Examples: Current or past job history or performance evaluations.

                        Collected: No.

                      * Category J: Non-public education information (per the Family Educational
                        Rights and Privacy Act (20 U.S.C. Section 1232g, 34 C.F.R. Part 99)).

                        Examples: Education records directly related to a student maintained by an
                        educational institution or party acting on its behalf, such as grades,
                        transcripts, class lists, student schedules, student identification codes,
                        student financial information, or student disciplinary records.

                        Collected: No.

                      * Category K: Inferences drawn from other personal information.

                        Examples: Profile reflecting a person's preferences, characteristics,
                        psychological trends, predispositions, behavior, attitudes, intelligence,
                        abilities, and aptitudes.

                        Collected: No.

                      * Category L: Sensitive personal information.

                        Examples: Account login and password information, geolocation data.

                        Collected: Yes.

                    Under CCPA/CPRA, personal information does not include:

                      * Publicly available information from government records
                      * Deidentified or aggregated consumer information
                      * Information excluded from the CCPA/CPRA's scope, such as:
                        * Health or medical information covered by the Health Insurance
                          Portability and Accountability Act of 1996 (HIPAA) and the California
                          Confidentiality of Medical Information Act (CMIA) or clinical trial data
                        * Personal Information covered by certain sector-specific privacy laws,
                          including the Fair Credit Reporting Act (FRCA), the Gramm-Leach-Bliley
                          Act (GLBA) or California Financial Information Privacy Act (FIPA), and
                          the Driver's Privacy Protection Act of 1994

                    Sources of Personal Information  
                    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

                    We obtain the categories of personal information listed above from the
                    following categories of sources:

                      * Directly from You. For example, from the forms You complete on our
                        Service, preferences You express or provide through our Service, or from
                        Your purchases on our Service.
                      * Indirectly from You. For example, from observing Your activity on our
                        Service.
                      * Automatically from You. For example, through cookies We or our Service
                        Providers set on Your Device as You navigate through our Service.
                      * From Service Providers. For example, third-party vendors to monitor and
                        analyze the use of our Service, third-party vendors for payment
                        processing, or other third-party vendors that We use to provide the
                        Service to You.

                    Use of Personal Information  
                    ~~~~~~~~~~~~~~~~~~~~~~~~~~~

                    We may use or disclose personal information We collect for "business purposes"
                    or "commercial purposes" (as defined under the CCPA/CPRA), which may include
                    the following examples:

                      * To operate our Service and provide You with Our Service.
                      * To provide You with support and to respond to Your inquiries, including to
                        investigate and address Your concerns and monitor and improve our Service.
                      * To fulfill or meet the reason You provided the information. For example,
                        if You share Your contact information to ask a question about our Service,
                        We will use that personal information to respond to Your inquiry. If You
                        provide Your personal information to purchase a product or service, We
                        will use that information to process Your payment and facilitate delivery.
                      * To respond to law enforcement requests and as required by applicable law,
                        court order, or governmental regulations.
                      * As described to You when collecting Your personal information or as
                        otherwise set forth in the CCPA/CPRA.
                      * For internal administrative and auditing purposes.
                      * To detect security incidents and protect against malicious, deceptive,
                        fraudulent or illegal activity, including, when necessary, to prosecute
                        those responsible for such activities.
                      * Other one-time uses.

                    Please note that the examples provided above are illustrative and not intended
                    to be exhaustive. For more details on how we use this information, please
                    refer to the "Use of Your Personal Data" section.

                    If We decide to collect additional categories of personal information or use
                    the personal information We collected for materially different, unrelated, or
                    incompatible purposes We will update this Privacy Policy.

                    Disclosure of Personal Information  
                    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

                    We may use or disclose and may have used or disclosed in the last twelve (12)
                    months the following categories of personal information for business or
                    commercial purposes:

                      * Category A: Identifiers
                      * Category B: Personal information categories listed in the California
                        Customer Records statute (Cal. Civ. Code § 1798.80(e))
                      * Category D: Commercial information
                      * Category F: Internet or other similar network activity

                    Please note that the categories listed above are those defined in the
                    CCPA/CPRA. This does not mean that all examples of that category of personal
                    information were in fact disclosed, but reflects our good faith belief to the
                    best of our knowledge that some of that information from the applicable
                    category may be and may have been disclosed.

                    When We disclose personal information for a business purpose or a commercial
                    purpose, We enter a contract that describes the purpose and requires the
                    recipient to both keep that personal information confidential and not use it
                    for any purpose except performing the contract.

                    Share of Personal Information  
                    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

                    We may share, and have shared in the last twelve (12) months, Your personal
                    information identified in the above categories with the following categories
                    of third parties:

                      * Service Providers
                      * Payment processors
                      * Our affiliates
                      * Our business partners
                      * Third party vendors to whom You or Your agents authorize Us to disclose
                        Your personal information in connection with products or services We
                        provide to You

                    Sale of Personal Information  
                    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~

                    As defined in the CCPA/CPRA, "sell" and "sale" mean selling, renting,
                    releasing, disclosing, disseminating, making available, transferring, or
                    otherwise communicating orally, in writing, or by electronic or other means, a
                    Consumer's personal information by the Business to a third party for valuable
                    consideration. This means that We may have received some kind of benefit in
                    return for sharing personal information, but not necessarily a monetary
                    benefit.

                    We do not sell personal information as the term sell is commonly understood.
                    We do allow Service Providers to use Your personal information for the
                    business purposes described in Our Privacy Policy, for activities such as
                    advertising, marketing, and analytics, and these may be deemed a sale under
                    CCPA/CPRA.

                    We may sell and may have sold in the last twelve (12) months the following
                    categories of personal information:

                      * Category A: Identifiers
                      * Category B: Personal information categories listed in the California
                        Customer Records statute (Cal. Civ. Code § 1798.80(e))
                      * Category D: Commercial information
                      * Category F: Internet or other similar network activity

                    Please note that the categories listed above are those defined in the
                    CCPA/CPRA. This does not mean that all examples of that category of personal
                    information were in fact sold, but reflects our good faith belief to the best
                    of Our knowledge that some of that information from the applicable category
                    may be and may have been shared for value in return.

                    Sale of Personal Information of Minors Under 16 Years of Age  
                    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

                    We do not knowingly collect personal information from minors under the age of
                    16 through our Service, although certain third party websites that we link to
                    may do so. These third-party websites have their own terms of use and privacy
                    policies and We encourage parents and legal guardians to monitor their
                    children's Internet usage and instruct their children to never provide
                    information on other websites without their permission.

                    We do not sell the personal information of Consumers We actually know are less
                    than 16 years of age, unless We receive affirmative authorization (the "right
                    to opt-in") from either the Consumer who is between 13 and 16 years of age, or
                    the parent or guardian of a Consumer less than 13 years of age. Consumers who
                    opt-in to the sale of personal information may opt-out of future sales at any
                    time. To exercise the right to opt-out, You (or Your authorized
                    representative) may submit a request to Us by contacting Us.

                    If You have reason to believe that a child under the age of 13 (or 16) has
                    provided Us with personal information, please contact Us with sufficient
                    detail to enable Us to delete that information.

                    Your Rights under the CCPA/CPRA  
                    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

                    The CCPA/CPRA provides California residents with specific rights regarding
                    their personal information. If You are a resident of California, You have the
                    following rights:

                      * The right to notice. You have the right to be notified which categories of
                        Personal Data are being collected and the purposes for which the Personal
                        Data is being used.
                      * The right to know/access. Under CCPA/CPRA, You have the right to request
                        that We disclose information to You about Our collection, use, sale,
                        disclosure for business purposes and share of personal information. Once
                        We receive and confirm Your request, We will disclose to You:
                        * The categories of personal information We collected about You
                        * The categories of sources for the personal information We collected
                          about You
                        * Our business or commercial purposes for collecting or selling that
                          personal information
                        * The categories of third parties with whom We share that personal
                          information
                        * The specific pieces of personal information We collected about You
                        * If we sold Your personal information or disclosed Your personal
                          information for a business purpose, We will disclose to You:
                          * The categories of personal information categories sold
                          * The categories of personal information categories disclosed
                      * The right to say no to the sale or sharing of Personal Data (opt-out). You
                        have the right to direct Us to not sell Your personal information. To
                        submit an opt-out request, please see the "Do Not Sell My Personal
                        Information" section or contact Us.
                      * The right to correct Personal Data. You have the right to correct or
                        rectify any inaccurate personal information about You that We collected.
                        Once We receive and confirm Your request, We will use commercially
                        reasonable efforts to correct (and direct our Service Providers to
                        correct) Your personal information, unless an exception applies.
                      * The right to limit use and disclosure of sensitive Personal Data. You have
                        the right to request to limit the use or disclosure of certain sensitive
                        personal information We collected about You, unless an exception applies.
                        To submit, please see the "Limit the Use or Disclosure of My Sensitive
                        Personal Information" section or contact Us.
                      * The right to delete Personal Data. You have the right to request the
                        deletion of Your Personal Data under certain circumstances, subject to
                        certain exceptions. Once We receive and confirm Your request, We will
                        delete (and direct Our Service Providers to delete) Your personal
                        information from our records, unless an exception applies. We may deny
                        Your deletion request if retaining the information is necessary for Us or
                        Our Service Providers to:
                        * Complete the transaction for which We collected the personal
                          information, provide a good or service that You requested, take actions
                          reasonably anticipated within the context of our ongoing business
                          relationship with You, or otherwise perform our contract with You.
                        * Detect security incidents, protect against malicious, deceptive,
                          fraudulent, or illegal activity, or prosecute those responsible for such
                          activities.
                        * Debug products to identify and repair errors that impair existing
                          intended functionality.
                        * Exercise free speech, ensure the right of another consumer to exercise
                          their free speech rights, or exercise another right provided for by law.
                        * Comply with the California Electronic Communications Privacy Act (Cal.
                          Penal Code § 1546 et. seq.).
                        * Engage in public or peer-reviewed scientific, historical, or statistical
                          research in the public interest that adheres to all other applicable
                          ethics and privacy laws, when the information's deletion may likely
                          render impossible or seriously impair the research's achievement, if You
                          previously provided informed consent.
                        * Enable solely internal uses that are reasonably aligned with consumer
                          expectations based on Your relationship with Us.
                        * Comply with a legal obligation.
                        * Make other internal and lawful uses of that information that are
                          compatible with the context in which You provided it.
                      * The right not to be discriminated against. You have the right not to be
                        discriminated against for exercising any of Your consumer's rights,
                        including by:
                        * Denying goods or services to You
                        * Charging different prices or rates for goods or services, including the
                          use of discounts or other benefits or imposing penalties
                        * Providing a different level or quality of goods or services to You
                        * Suggesting that You will receive a different price or rate for goods or
                          services or a different level or quality of goods or services

                    Exercising Your CCPA/CPRA Data Protection Rights  
                    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

                    Please see the "Do Not Sell My Personal Information" section and "Limit the
                    Use or Disclosure of My Sensitive Personal Information" section for more
                    information on how to opt out and limit the use of sensitive information
                    collected.

                    Additionally, in order to exercise any of Your rights under the CCPA/CPRA, and
                    if You are a California resident, You can contact Us:

                      * By email: data@esbhealthcare.com

                      * By visiting this page on our website: esbhealthcare.com/data


                    Only You, or a person registered with the California Secretary of State that
                    You authorize to act on Your behalf, may make a verifiable request related to
                    Your personal information.

                    Your request to Us must:

                      * Provide sufficient information that allows Us to reasonably verify You are
                        the person about whom We collected personal information or an authorized
                        representative
                      * Describe Your request with sufficient detail that allows Us to properly
                        understand, evaluate, and respond to it

                    We cannot respond to Your request or provide You with the required information
                    if We cannot:

                      * Verify Your identity or authority to make the request
                      * And confirm that the personal information relates to You

                    We will disclose and deliver the required information free of charge within 45
                    days of receiving Your verifiable request. The time period to provide the
                    required information may be extended once by an additional 45 days when
                    reasonably necessary and with prior notice.

                    Any disclosures We provide will only cover the 12-month period preceding the
                    verifiable request's receipt.

                    For data portability requests, We will select a format to provide Your
                    personal information that is readily usable and should allow You to transmit
                    the information from one entity to another entity without hindrance.

                    Do Not Sell My Personal Information  
                    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

                    As defined in the CCPA/CPRA, "sell" and "sale" mean selling, renting,
                    releasing, disclosing, disseminating, making available, transferring, or
                    otherwise communicating orally, in writing, or by electronic or other means, a
                    Consumer's personal information by the Business to a third party for valuable
                    consideration. This means that We may have received some kind of benefit in
                    return for sharing personal information, but not necessarily a monetary
                    benefit.

                    We do not sell personal information as the term sell is commonly understood.
                    We do allow Service Providers to use Your personal information for the
                    business purposes described in Our Privacy Policy, for activities such as
                    advertising, marketing, and analytics, and these may be deemed a sale under
                    CCPA/CPRA.

                    You have the right to opt-out of the sale of Your personal information. Once
                    We receive and confirm a verifiable consumer request from You, we will stop
                    selling Your personal information. To exercise Your right to opt-out, please
                    contact Us.

                    The Service Providers we partner with (for example, our analytics or
                    advertising partners) may use technology on the Service that sells personal
                    information as defined by the CCPA/CPRA law. If you wish to opt out of the use
                    of Your personal information for interest-based advertising purposes and these
                    potential sales as defined under CCPA/CPRA law, you may do so by following the
                    instructions below.

                    Please note that any opt out is specific to the browser You use. You may need
                    to opt out on every browser that You use.

                    Website  
                    *******

                    If applicable, click "Privacy Preferences", "Update Privacy Preferences" or
                    "Do Not Sell My Personal Information" buttons listed on the Service to review
                    your privacy preferences and opt out of cookies and other technologies that We
                    may use. Please note that You will need to opt out from each browser that You
                    use to access the Service.

                    Additionally, You can opt out of receiving ads that are personalized as served
                    by our Service Providers by following our instructions presented on the
                    Service:

                      * The NAI's opt-out platform: www.networkadvertising.org/choices/
                      * The EDAA's opt-out platform www.youronlinechoices.com/
                      * The DAA's opt-out platform:
                        [http://optout.aboutads.info/?c=2&lang=EN](http://optout.aboutads.info/?c=2&lang=EN)

                    The opt out will place a cookie on Your computer that is unique to the browser
                    You use to opt out. If you change browsers or delete the cookies saved by your
                    browser, You will need to opt out again.

                    Mobile Devices  
                    **************

                    Your mobile device may give You the ability to opt out of the use of
                    information about the apps You use in order to serve You ads that are targeted
                    to Your interests:

                      * "Opt out of Interest-Based Ads" or "Opt out of Ads Personalization" on
                        Android devices
                      * "Limit Ad Tracking" on iOS devices

                    You can also stop the collection of location information from Your mobile
                    device by changing the preferences on Your mobile device.

                    Limit the Use or Disclosure of My Sensitive Personal Information  
                    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

                    If You are a California resident, You have the right to limit the use and
                    disclosure of Your sensitive personal information to that use which is
                    necessary to perform the services or provide the goods reasonably expected by
                    an average Consumer who requests such services or goods.

                    We collect, use and disclose sensitive personal information in ways that are
                    necessary to provide the Service. For more information on how We use Your
                    personal information, please see the "Use of Your Personal Data" section or
                    contact us.

                    "Do Not Track" Policy as Required by California Online Privacy Protection Act
                    (CalOPPA)  
                    ------------------------------------------------------------------------

                    Our Service does not respond to Do Not Track signals.

                    However, some third party websites do keep track of Your browsing activities.
                    If You are visiting such websites, You can set Your preferences in Your web
                    browser to inform websites that You do not want to be tracked. You can enable
                    or disable DNT by visiting the preferences or settings page of Your web
                    browser.

                    Your California Privacy Rights (California's Shine the Light law)  
                    -----------------------------------------------------------------

                    Under California Civil Code Section 1798 (California's Shine the Light law),
                    California residents with an established business relationship with us can
                    request information once a year about sharing their Personal Data with third
                    parties for the third parties' direct marketing purposes.

                    If you'd like to request more information under the California Shine the Light
                    law, and if You are a California resident, You can contact Us using the
                    contact information provided below.

                    California Privacy Rights for Minor Users (California Business and Professions
                    Code Section 22581)  
                    --------------------------------------------------------------------------------------------------

                    California Business and Professions Code Section 22581 allows California
                    residents under the age of 18 who are registered users of online sites,
                    services or applications to request and obtain removal of content or
                    information they have publicly posted.

                    To request removal of such data, and if You are a California resident, You can
                    contact Us using the contact information provided below, and include the email
                    address associated with Your account.

                    Be aware that Your request does not guarantee complete or comprehensive
                    removal of content or information posted online and that the law may not
                    permit or require removal in certain circumstances.

                    Children's Privacy  
                    ------------------

                    Our Service does not address anyone under the age of 13. We do not knowingly
                    collect personally identifiable information from anyone under the age of 13.
                    If You are a parent or guardian and You are aware that Your child has provided
                    Us with Personal Data, please contact Us. If We become aware that We have
                    collected Personal Data from anyone under the age of 13 without verification
                    of parental consent, We take steps to remove that information from Our
                    servers.

                    If We need to rely on consent as a legal basis for processing Your information
                    and Your country requires consent from a parent, We may require Your parent's
                    consent before We collect and use that information.

                    Links to Other Websites  
                    -----------------------

                    Our Service may contain links to other websites that are not operated by Us.
                    If You click on a third party link, You will be directed to that third party's
                    site. We strongly advise You to review the Privacy Policy of every site You
                    visit.

                    We have no control over and assume no responsibility for the content, privacy
                    policies or practices of any third party sites or services.

                    Changes to this Privacy Policy  
                    ------------------------------

                    We may update Our Privacy Policy from time to time. We will notify You of any
                    changes by posting the new Privacy Policy on this page.

                    We will let You know via email and/or a prominent notice on Our Service, prior
                    to the change becoming effective and update the "Last updated" date at the top
                    of this Privacy Policy.

                    You are advised to review this Privacy Policy periodically for any changes.
                    Changes to this Privacy Policy are effective when they are posted on this
                    page.

                    Contact Us  
                    ----------

                    If you have any questions about this Privacy Policy, You can contact us:

                      * By email: data@esbhealthcare.com

                      * By visiting this page on our website: www.esbhealthcare.com/data



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
    </>
  );
}
