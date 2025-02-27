import * as Notifications from "expo-notifications";
export async function sendPushNotification(expoPushToken: string) {
  const message = {
    to: expoPushToken,
    sound: "default",
    title: "Original Title",
    body: "And here is the body!",
    data: { someData: "goes here", url: "/(app)/(tabs)/Subscription" },
  };

  await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Accept-encoding": "gzip, deflate",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(message),
  });
}
export async function scheduledNotifications() {
  try {
    await Notifications.setNotificationChannelAsync("new_emails", {
      name: "E-mail notifications",
      importance: Notifications.AndroidImportance.HIGH,
      sound: "@/assets/sounds/notification1.wav",
    });
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: "You've got scheduleNotificationAsync mail!",
        sound: "@/assets/sounds/notification1.wav",
        body: "Here is the notification body",
        data: { data: "goes here" },
      },
      trigger: null,
    });
  } catch (error) {
    console.error("Error scheduling notification:", error);
  }
}
