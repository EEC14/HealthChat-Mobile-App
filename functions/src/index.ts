import {defineSecret} from "firebase-functions/params";
import {Request, Response} from "express";
import {onSchedule} from "firebase-functions/v2/scheduler";
import {onRequest} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import OpenAI from "openai";
import {Expo, ExpoPushMessage} from "expo-server-sdk";

const openAiSecret = defineSecret("OPENAI_API_KEY");

admin.initializeApp();

/**
 * Instantiate the Expo SDK client to handle Expo push tokens.
 */
const expo = new Expo();

/**
 * Interface for user data from Firestore
 */
interface UserData {
  id?: string;
  expoPushToken?: string;
  isPro?: boolean;
  isDeluxe?: boolean;
  // Add other user properties as needed
}

/**
 * User subscription tiers
 */
enum SubscriptionTier {
  FREE = "free",
  PRO = "pro",
  DELUXE = "deluxe",
}

/**
 * Notification types that can be sent to users
 */
enum NotificationType {
  HEALTH_TIP = "healthTip",
  REMINDER = "reminder",
  CHALLENGE = "challenge",
  MOTIVATION = "motivation",
}

/**
 * Determines user's subscription tier based on their data
 * @param {UserData} userData - The user data from Firestore
 * @return {SubscriptionTier} The user's subscription tier
 */
function getUserTier(userData: UserData): SubscriptionTier {
  if (userData.isDeluxe) {
    return SubscriptionTier.DELUXE;
  } else if (userData.isPro) {
    return SubscriptionTier.PRO;
  } else {
    return SubscriptionTier.FREE;
  }
}

/**
 * Determines which notification types a user should receive based on tier
 * @param {SubscriptionTier} tier - The user's subscription tier
 * @return {NotificationType[]} Array of notifications the user should receive
 */
function getNotificationTypesForTier(
  tier: SubscriptionTier,
): NotificationType[] {
  switch (tier) {
  case SubscriptionTier.DELUXE:
    return [
      NotificationType.HEALTH_TIP,
      NotificationType.REMINDER,
      NotificationType.CHALLENGE,
      NotificationType.MOTIVATION,
    ];
  case SubscriptionTier.PRO:
    return [
      NotificationType.HEALTH_TIP,
      NotificationType.REMINDER,
    ];
  case SubscriptionTier.FREE:
  default:
    return [NotificationType.HEALTH_TIP];
  }
}

/**
 * Calls the OpenAI API to generate a health tip.
 * @param {string} apiKey - The OpenAI API key.
 * @return {Promise<string>} - The generated health tip.
 */
async function getAIHealthTip(apiKey: string): Promise<string> {
  const openai = new OpenAI({apiKey});
  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: "Generate a concise, actionable daily health tip.",
      },
    ],
    max_tokens: 100,
  });

  return completion.choices[0].message?.content || "Stay healthy!";
}

/**
 * Calls the OpenAI API to generate a reminder message.
 * @param {string} apiKey - The OpenAI API key.
 * @return {Promise<string>} - The generated reminder.
 */
async function getAIReminder(apiKey: string): Promise<string> {
  const openai = new OpenAI({apiKey});
  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: "Generate a friendly reminder to maintain a healthy routine.",
      },
    ],
    max_tokens: 100,
  });

  return completion.choices[0].message?.content ||
    "Remember to maintain your health routine!";
}

/**
 * Calls the OpenAI API to generate a challenge message.
 * @param {string} apiKey - The OpenAI API key.
 * @return {Promise<string>} - The generated challenge.
 */
async function getAIChallenge(apiKey: string): Promise<string> {
  const openai = new OpenAI({apiKey});
  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: "Generate a simple, achievable health challenge for today.",
      },
    ],
    max_tokens: 100,
  });

  return completion.choices[0].message?.content ||
    "Challenge yourself to drink 8 glasses of water today!";
}

/**
 * Calls the OpenAI API to generate a motivational message.
 * @param {string} apiKey - The OpenAI API key.
 * @return {Promise<string>} - The generated motivational message.
 */
async function getAIMotivation(apiKey: string): Promise<string> {
  const openai = new OpenAI({apiKey});
  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: "Generate a short, inspiring motivational health message.",
      },
    ],
    max_tokens: 100,
  });
  return completion.choices[0].message?.content ||
    "You're making progress every day. Keep going!";
}

/**
 * Generates all content for notifications based on notification types
 * @param {string} apiKey - The OpenAI API key
 * @param {NotificationType[]} notificationTypes - Array of notification types
 * @return {Promise<Record<NotificationType, string>>} Object with content
 */
async function generateNotificationContent(
  apiKey: string,
  notificationTypes: NotificationType[],
): Promise<Record<NotificationType, string>> {
  const content: Partial<Record<NotificationType, string>> = {};
  const contentPromises = notificationTypes.map(async (type) => {
    switch (type) {
    case NotificationType.HEALTH_TIP:
      content[type] = await getAIHealthTip(apiKey);
      break;
    case NotificationType.REMINDER:
      content[type] = await getAIReminder(apiKey);
      break;
    case NotificationType.CHALLENGE:
      content[type] = await getAIChallenge(apiKey);
      break;
    case NotificationType.MOTIVATION:
      content[type] = await getAIMotivation(apiKey);
      break;
    }
  });
  await Promise.all(contentPromises);
  return content as Record<NotificationType, string>;
}
/**
 * Creates notification messages for a user based on their tier and expo token
 * @param {string} expoPushToken - The user's Expo push token
 * @param {SubscriptionTier} tier - The user's subscription tier
 * @param {Record<NotificationType, string>} content - Content for notifications
 * @return {ExpoPushMessage[]} Array of Expo push messages to send to the user
 */
function createUserNotifications(
  expoPushToken: string,
  tier: SubscriptionTier,
  content: Record<NotificationType, string>,
): ExpoPushMessage[] {
  const notificationTypes = getNotificationTypesForTier(tier);
  const messages: ExpoPushMessage[] = [];
  const notificationConfig: Record<
    NotificationType,
    {title: string, icon: string}
  > = {
    [NotificationType.HEALTH_TIP]: {
      title: "🌟 Your Daily Health Tip",
      icon: "🌟",
    },
    [NotificationType.REMINDER]: {
      title: "⏰ Health Reminder",
      icon: "⏰",
    },
    [NotificationType.CHALLENGE]: {
      title: "🏆 Daily Health Challenge",
      icon: "🏆",
    },
    [NotificationType.MOTIVATION]: {
      title: "💪 Motivational Boost",
      icon: "💪",
    },
  };
  for (const type of notificationTypes) {
    messages.push({
      to: expoPushToken,
      sound: "default",
      title: notificationConfig[type].title,
      body: content[type],
      data: {
        type: type,
        url: `/health/${type}`,
      },
      // Add a badge number for better notification management
      badge: 1,
    });
  }
  return messages;
}

/**
 * Fetches users from Firestore and sends notifications based on their tier.
 * @param {string} apiKey - The OpenAI API key.
 * @return {Promise<void>} - Resolves when done.
 */
async function sendTieredNotificationsImpl(apiKey: string): Promise<void> {
  // Generate all possible notification content upfront (just once)
  const allNotificationTypes = [
    NotificationType.HEALTH_TIP,
    NotificationType.REMINDER,
    NotificationType.CHALLENGE,
    NotificationType.MOTIVATION,
  ];
  const notificationContent = await generateNotificationContent(
    apiKey,
    allNotificationTypes,
  );
  const db = admin.firestore();
  const usersSnap = await db
    .collection("users")
    .where("expoPushToken", "!=", null)
    .get();
  const allUsers = usersSnap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  } as UserData));
  const allExpoMessages: ExpoPushMessage[] = [];
  for (const userData of allUsers) {
    const expoPushToken = userData.expoPushToken;
    if (!expoPushToken) {
      continue;
    }
    if (!Expo.isExpoPushToken(expoPushToken)) {
      console.warn(
        `Skipping invalid token for user ${userData.id}: ${expoPushToken}`,
      );
      continue;
    }
    const userTier = getUserTier(userData);
    const userNotifications = createUserNotifications(
      expoPushToken,
      userTier,
      notificationContent,
    );
    allExpoMessages.push(...userNotifications);
  }
  console.log(
    `Sending ${allExpoMessages.length}notifications to ${allUsers.length}users`,
  );
  const chunks = expo.chunkPushNotifications(allExpoMessages);
  for (const chunk of chunks) {
    try {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      console.log(`Sent ${ticketChunk.length} notifications`);
      for (let i = 0; i < ticketChunk.length; i++) {
        const ticket = ticketChunk[i];
        if (ticket.status === "error") {
          console.error(`Error sending notification: ${ticket.message}`);
          // Could store these errors in Firestore for later analysis
        }
      }
    } catch (err: unknown) {
      console.error("Error sending Expo push notifications chunk:", err);
    }
  }
}

/**
 * V2 scheduled function to run every day at 10:00 UTC.
 * Attach secrets and memory by placing them in the onSchedule() options object.
 */
export const sendDailyTieredNotifications = onSchedule(
  {
    schedule: "0 10 * * *",
    memory: "512MiB", // Increased for multiple notifications
    secrets: [openAiSecret],
    timeoutSeconds: 300, // Increased timeout for many users
  },
  async () => {
    try {
      // Access the secret only inside the handler
      const apiKey = openAiSecret.value();
      await sendTieredNotificationsImpl(apiKey);
    } catch (error: unknown) {
      console.error("Error in sendDailyTieredNotifications:", error);
      throw error;
    }
  },
);

/**
 * V2 HTTPS function for local/manual testing of tiered notifications.
 * Denies requests in production (NODE_ENV !== "development").
 */
export const sendTestTieredNotification = onRequest(
  {
    secrets: [openAiSecret],
  },
  async (req: Request, res: Response) => {
    if (process.env.NODE_ENV !== "development") {
      res.status(403).send("Forbidden in production");
      return;
    }
    try {
      // Allow testing for a specific user ID via query parameter
      const userId = req.query.userId as string;
      const apiKey = openAiSecret.value();
      if (userId) {
        // Test notification for a specific user
        const db = admin.firestore();
        const userDoc = await db.collection("users").doc(userId).get();
        if (!userDoc.exists) {
          res.status(404).send(`User ${userId} not found`);
          return;
        }
        const userData: UserData = {
          id: userId,
          ...userDoc.data() as UserData,
        };
        const expoPushToken = userData.expoPushToken;
        if (!expoPushToken || !Expo.isExpoPushToken(expoPushToken)) {
          res.status(400).send(`User ${userId} has no valid Expo token`);
          return;
        }
        // Generate all notification types
        const allTypes = [
          NotificationType.HEALTH_TIP,
          NotificationType.REMINDER,
          NotificationType.CHALLENGE,
          NotificationType.MOTIVATION,
        ];
        const content = await generateNotificationContent(apiKey, allTypes);
        const userTier = getUserTier(userData);
        const notifications = createUserNotifications(
          expoPushToken,
          userTier,
          content,
        );
        const chunks = expo.chunkPushNotifications(notifications);
        for (const chunk of chunks) {
          await expo.sendPushNotificationsAsync(chunk);
        }
        res.status(200).send(
          `Test notifications sent to user ${userId} (tier: ${userTier})`,
        );
      } else {
        // Test for all users
        await sendTieredNotificationsImpl(apiKey);
        res.status(200).send("Test tiered notifications sent to all users");
      }
    } catch (error: unknown) {
      console.error("Error in sendTestTieredNotification:", error);
      res.status(500).send(
        `Error: ${error instanceof Error ?
          error.message : "Unknown error occurred"}`,
      );
    }
  },
);
