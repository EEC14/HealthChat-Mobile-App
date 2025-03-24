import {defineSecret} from "firebase-functions/params";
import {Request, Response} from "express";
import {onSchedule} from "firebase-functions/v2/scheduler";
import {onRequest} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import OpenAI from "openai";
import {Expo, ExpoPushMessage} from "expo-server-sdk"; // CHANGED

const openAiSecret = defineSecret("OPENAI_API_KEY");

admin.initializeApp();

/**
 * ADDED: Instantiate the Expo SDK client to handle Expo push tokens.
 */
const expo = new Expo(); // CHANGED

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
 * Fetches users from Firestore and sends notifications.
 * @param {string} apiKey - The OpenAI API key.
 * @return {Promise<void>} - Resolves when done.
 */
async function sendDailyHealthTipsImpl(apiKey: string): Promise<void> {
  const healthTip = await getAIHealthTip(apiKey);
  const db = admin.firestore();

  const usersSnap = await db
    .collection("users")
    .where("expoPushToken", "!=", null)
    .get();

  // Create an array to hold all users with valid tokens
  const allUsers = usersSnap.docs.map((doc) => doc.data());

  const expoMessages: ExpoPushMessage[] = []; // CHANGED

  for (const userData of allUsers) {
    const expoPushToken = userData.expoPushToken;
    if (!expoPushToken) {
      continue;
    }

    if (!Expo.isExpoPushToken(expoPushToken)) {
      console.warn(`Skipping invalid Expo token: ${expoPushToken}`);
      continue;
    }


    expoMessages.push({
      to: expoPushToken,
      sound: "default",
      title: "🌟 Your Daily Health Tip",
      body: healthTip,
      data: {url: "/health-tips"},
    });
  }


  const chunks = expo.chunkPushNotifications(expoMessages);
  for (const chunk of chunks) {
    try {
      await expo.sendPushNotificationsAsync(chunk);
    } catch (err) {
      console.error("Error sending Expo push notifications:", err);
    }
  }
}

/**
 * V2 scheduled function to run every day at 10:00 UTC.
 * Attach secrets and memory by placing them in the onSchedule() options object.
 */
export const sendDailyHealthTips = onSchedule(
  {
    schedule: "0 10 * * *",
    memory: "256MiB",
    secrets: [openAiSecret],
  },
  async () => {
    try {
      // Access the secret only inside the handler
      const apiKey = openAiSecret.value();
      await sendDailyHealthTipsImpl(apiKey);
    } catch (error) {
      console.error("Error in sendDailyHealthTips:", error);
      throw error;
    }
  }
);

/**
 * V2 HTTPS function for local/manual testing.
 * Denies requests in production (NODE_ENV !== 'development').
 */
export const sendTestNotification = onRequest(
  {
    secrets: [openAiSecret],
  },
  async (req: Request, res: Response) => {
    if (process.env.NODE_ENV !== "development") {
      res.status(403).send("Forbidden in production");
      return;
    }
    try {
      const apiKey = openAiSecret.value();
      await sendDailyHealthTipsImpl(apiKey);
      res.status(200).send("Test notifications sent");
    } catch (error) {
      console.error("Error in sendTestNotification:", error);
      res.status(500).send(error);
    }
  }
);
