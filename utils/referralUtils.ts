// utils/referralUtils.ts

/**
 * Generate a random referral code
 * Creates a 6-character alphanumeric code
 */
export const generateReferralCode = (): string => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed similar looking characters like 0,O,1,I
    let result = '';
    
    // Generate a 6-character code
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
  };
  
  /**
   * Validate a referral code format
   */
  export const validateReferralCodeFormat = (code: string): boolean => {
    // Check if code is 6 alphanumeric characters
    const regex = /^[A-Z0-9]{6}$/;
    return regex.test(code);
  };
  
  /**
   * Format points for display
   */
  export const formatPoints = (points: number): string => {
    return points.toLocaleString();
  };