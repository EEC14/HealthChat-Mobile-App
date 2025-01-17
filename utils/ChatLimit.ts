import AsyncStorage from "@react-native-async-storage/async-storage";

const DAILY_CHAT_LIMIT = 5;
const STORAGE_KEY = "healthchat_daily_messages";

interface DailyMessages {
  count: number;
  date: string;
}

export async function getRemainingMessages(
  isPro: boolean,
  isDeluxe: boolean
): Promise<number> {
  if (isPro || isDeluxe) return Infinity;
  const daily = await getDailyMessages();
  return Math.max(0, DAILY_CHAT_LIMIT - daily.count);
}

export async function incrementMessageCount(
  isPro: boolean,
  isDeluxe: boolean
): Promise<void> {
  if (isPro || isDeluxe) return;
  const daily = await getDailyMessages();
  daily.count += 1;
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(daily));
}

export async function hasReachedLimit(
  isPro: boolean,
  isDeluxe: boolean
): Promise<boolean> {
  if (isPro || isDeluxe) return false;
  const daily = await getDailyMessages();
  return daily.count >= DAILY_CHAT_LIMIT;
}

async function getDailyMessages(): Promise<DailyMessages> {
  const today = new Date().toDateString();
  const stored = await AsyncStorage.getItem(STORAGE_KEY);

  if (!stored) {
    const newDaily = { count: 0, date: today };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newDaily));
    return newDaily;
  }

  const daily: DailyMessages = JSON.parse(stored);

  if (daily.date !== today) {
    const resetDaily = { count: 0, date: today };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(resetDaily));
    return resetDaily;
  }

  return daily;
}
