import AsyncStorage from "@react-native-async-storage/async-storage";

const MONTHLY_CHAT_LIMIT = 5;
const STORAGE_KEY = "healthchat_monthly_messages";

interface MonthlyMessages {
  count: number;
  month: string;
}

export async function getRemainingMessages(
  isPro: boolean,
  isDeluxe: boolean
): Promise<number> {
  if (isPro || isDeluxe) return Infinity;
  const monthly = await getMonthlyMessages();
  return Math.max(0, MONTHLY_CHAT_LIMIT - monthly.count);
}

export async function incrementMessageCount(
  isPro: boolean,
  isDeluxe: boolean
): Promise<void> {
  if (isPro || isDeluxe) return;
  const monthly = await getMonthlyMessages();
  monthly.count += 1;
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(monthly));
}

export async function hasReachedLimit(
  isPro: boolean,
  isDeluxe: boolean
): Promise<boolean> {
  if (isPro || isDeluxe) return false;
  const monthly = await getMonthlyMessages();
  return monthly.count >= MONTHLY_CHAT_LIMIT;
}

async function getMonthlyMessages(): Promise<MonthlyMessages> {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const stored = await AsyncStorage.getItem(STORAGE_KEY);

  if (!stored) {
    const newMonthly = { count: 0, month: currentMonth };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newMonthly));
    return newMonthly;
  }

  const monthly: MonthlyMessages = JSON.parse(stored);

  if (monthly.month !== currentMonth) {
    const resetMonthly = { count: 0, month: currentMonth };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(resetMonthly));
    return resetMonthly;
  }

  return monthly;
}
