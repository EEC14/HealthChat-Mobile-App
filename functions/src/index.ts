/**
 * ./functions/src/index.ts
 */
import {defineSecret} from "firebase-functions/params";
import {Request, Response} from "express";

// v2 imports for Cloud Functions
import {onSchedule} from "firebase-functions/v2/scheduler";
import {onRequest} from "firebase-functions/v2/https";

import * as admin from "firebase-admin";
import OpenAI from "openai";

// ADDED: Import Expo, ExpoPushMessage from expo-server-sdk
import {Expo, ExpoPushMessage} from "expo-server-sdk"; // CHANGED

// 1) Define your secret reference (name must match what you set via:
//    firebase functions:secrets:set OPENAI_API_KEY)
const openAiSecret = defineSecret("OPENAI_API_KEY");

// 2) Initialize Firebase Admin
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
    .where("isPro", "in", [true, "true"])
    .get();

  const deluxeSnap = await db
    .collection("users")
    .where("expoPushToken", "!=", null)
    .where("isDeluxe", "in", [true, "true"])
    .get();

  // Merge and deduplicate
  const uniqueUsers = new Map<string, FirebaseFirestore.DocumentData>();
  [...usersSnap.docs, ...deluxeSnap.docs].forEach((doc) => {
    uniqueUsers.set(doc.id, doc.data());
  });

  // CHANGED: Instead of sending each notification via admin.messaging(),
  // we'll build an array of ExpoPushMessage objects.
  const expoMessages: ExpoPushMessage[] = []; // CHANGED

  for (const userData of uniqueUsers.values()) {
    const expoPushToken = userData.expoPushToken;
    if (!expoPushToken) {
      continue;
    }

    // CHANGED: Verify it's a valid Expo push token:
    if (!Expo.isExpoPushToken(expoPushToken)) {
      console.warn(`Skipping invalid Expo token: ${expoPushToken}`);
      continue;
    }

    // CHANGED: Build a push message object
    expoMessages.push({
      to: expoPushToken,
      sound: "default",
      title: "🌟 Your Daily Health Tip",
      body: healthTip,
      data: {url: "/health-tips"},
    });
  }

  // CHANGED: Send notifications in chunks via Expo
  const chunks = expo.chunkPushNotifications(expoMessages);
  for (const chunk of chunks) {
    try {
      await expo.sendPushNotificationsAsync(chunk);
      // Optionally handle ticketChunk if you want to track delivery
    } catch (err) {
      console.error("Error sending Expo push notifications:", err);
    }
  }

  console.log(`Sent notifications to ${uniqueUsers.size} user(s).`);
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
  async (event) => {
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
