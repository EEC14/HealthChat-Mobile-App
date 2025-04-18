export const Plans = {
  pro: {
    link: "https://buy.stripe.com/3cs28u65A0784RWcMO",
    priceId: "price_1QWgd9GuEHc4ZQvQOh8Q6zzg", // Replace with your actual Stripe Price ID
    name: "Pro",
    price: 2.99,
    features: [
      "Unlimited chatbot access",
      "Daily health tips",
    ],
  },
  deluxe: {
    link: " https://buy.stripe.com/fZe7sOalQ4no5W0dQR",
    priceId:
      "price_1QWgaIGuEHc4ZQvQUozEauwS" /*  "price_1QTmypGuEHc4ZQvQVFmxQ9Ti" */, // Replace with your actual Stripe Price ID
    name: "Deluxe",
    price: 4.99,
    features: [
      "All Pro features",
      "Workout plans generator",
      "Diet plans generator",
      "Meditation plans generator",
      "Text-to-speech",
      "Choose your specialist"
    ],
  },
  ProYearly: {
    link: "https://buy.stripe.com/14k8wSctY6vwbgk3cg",
    priceId: "price_1QfKhvGuEHc4ZQvQQJ9GVK8Q", // Replace with your actual Stripe Price ID
    name: "Pro - Yearly",
    price: 29.99,
    features: [
      "Unlimited chatbot access",
      "Daily health tips",
    ],
  },
  DeluxeYearly: {
    link: " https://buy.stripe.com/28o00m1Pkf22848003",
    priceId:
      "price_1QfKiFGuEHc4ZQvQCfFAmkdn", // Replace with your actual Stripe Price ID
    name: "Deluxe - Yearly",
    price: 49.99,
    features: [
      "All Pro features",
      "Workout plans generator",
      "Diet plans generator",
      "Meditation plans generator",
      "Text-to-speech",
      "Choose your specialist"
    ],
  },
};
