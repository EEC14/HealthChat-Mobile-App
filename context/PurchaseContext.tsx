import React, { createContext, useContext, useEffect, useState } from "react";
import Purchases, {
  PurchasesOffering,
  PurchasesPackage,
  CustomerInfo,
} from "react-native-purchases";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

interface PurchaseContextType {
  isLoading: boolean;
  currentOffering: { [key: string]: PurchasesOffering } | null;
  customerInfo: CustomerInfo | null;
  handlePurchase: (packageToPurchase: PurchasesPackage) => Promise<void>;
  restorePurchases: () => Promise<void>;
}

const PurchaseContext = createContext<PurchaseContextType | undefined>(
  undefined
);

export const PurchaseProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [currentOffering, setCurrentOffering] = useState<{
    [key: string]: PurchasesOffering;
  } | null>(null);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);

  useEffect(() => {
    const initPurchases = async () => {
      if (Platform.OS === "android") {
        console.log("Configuring RevenueCat for Android");
        console.log(process.env.EXPO_PUBLIC_RC_ANDROID);
        await Purchases.configure({
          apiKey: process.env.EXPO_PUBLIC_RC_ANDROID!,
        });
      } else {
        await Purchases.configure({
          apiKey: process.env.EXPO_PUBLIC_RC_IOS!,
        });
      }
      try {
        const offerings = await Purchases.getOfferings();
        setCurrentOffering(offerings.all);
        const customerInfo = await Purchases.getCustomerInfo();
        updatePurchaseStatus(customerInfo);
      } catch (error) {
        console.error("Error initializing purchases:", error);
      } finally {
        setIsLoading(false);
      }
    };
    initPurchases();

    Purchases.addCustomerInfoUpdateListener((info) => {
      updatePurchaseStatus(info);
      handlePurchaseNotification(info);
    });
  }, []);

  const updatePurchaseStatus = (customerInfo: CustomerInfo) => {
    setCustomerInfo(customerInfo);
    if (customerInfo.entitlements.active["pro"] !== undefined) {
      console.log("Purchase successful:", customerInfo);
    }
    if (customerInfo.entitlements.active["delxce"] === undefined) {
      console.log("Purchase failed:", customerInfo);
    }
  };

  const handlePurchaseNotification = async (info: CustomerInfo) => {
    const previousEntitlements = customerInfo?.entitlements.active || {};
    const newEntitlements = info.entitlements.active;
    for (const entitlement in newEntitlements) {
      if (!previousEntitlements[entitlement]) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Purchase Successful!",
            body: `Thank you for purchasing ${entitlement}! Enjoy your premium features.`,
          },
          trigger: null,
        });
      }
    }

    // Check for expired subscriptions
    for (const entitlement in previousEntitlements) {
      if (!newEntitlements[entitlement]) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Subscription Expired",
            body: `Your ${entitlement} subscription has expired. Renew to continue enjoying premium features.`,
          },
          trigger: null,
        });
      }
    }
  };

  const handlePurchase = async (packageToPurchase: PurchasesPackage) => {
    try {
      setIsLoading(true);
      const { customerInfo } = await Purchases.purchasePackage(
        packageToPurchase
      );
      console.log("Purchase successful:", customerInfo);
      updatePurchaseStatus(customerInfo);
    } catch (error: any) {
      if (!error.userCancelled) {
        console.error("Purchase error:", error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const restorePurchases = async () => {
    try {
      setIsLoading(true);
      const customerInfo = await Purchases.restorePurchases();
      updatePurchaseStatus(customerInfo);
    } catch (error) {
      console.error("Restore error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PurchaseContext.Provider
      value={{
        isLoading,
        currentOffering,
        customerInfo,
        handlePurchase,
        restorePurchases,
      }}
    >
      {children}
    </PurchaseContext.Provider>
  );
};

// Custom hook
export const usePurchases = () => {
  const context = useContext(PurchaseContext);
  if (context === undefined) {
    throw new Error("usePurchases must be used within a PurchaseProvider");
  }
  return context;
};
