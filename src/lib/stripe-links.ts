export const STRIPE_PAYMENT_LINKS = {
  doctor: {
    starter: {
      monthly: "https://buy.stripe.com/eVq9AV2AD8g4fT0fas7wA0r", // Inferred pattern
      annual: "https://buy.stripe.com/6oUeVfb798g40Y6d2k7wA0s", // Confirmed (A0s)
    },
    growth: {
      monthly: "https://buy.stripe.com/7sYfZj5MP8g4gX4fas7wA0p", // Confirmed (A0p)
      annual: "https://buy.stripe.com/4gM14p3EHeEs8qyfas7wA0q", // Inferred pattern
    },
    pro: {
      monthly: "https://buy.stripe.com/eVq9AV2AD8g4fT0fas7wA0r", // Confirmed (A0r)
      annual: "https://buy.stripe.com/aFa28t6QT9k836ee6o7wA0t", // Inferred pattern
    },
  },
  student: {
    foundation: {
      monthly: "https://buy.stripe.com/7sYeVfejlaocdKS5zS7wA0v", // Confirmed (A0v)
      annual: "https://buy.stripe.com/cNi9AVgrt9k8eOW5zS7wA0A", // Confirmed (A0A)
    },
    professional: {
      monthly: "https://buy.stripe.com/9B6eVf4IL53S4aid2k7wA0w", // Confirmed (A0w)
      annual: "https://buy.stripe.com/aFa9AV8Z1cwk36e8M47wA0z", // Confirmed (A0z)
    },
    accelerator: {
      monthly: "https://buy.stripe.com/5kQ9AV8Z18g46iqbYg7wA0x", // Confirmed (A0x)
      annual: "https://buy.stripe.com/4gM4gBcbd67WdKS7I07wA0y", // Confirmed (A0y)
    },
  },
  vendor: {
    basic: {
      monthly: "https://buy.stripe.com/00wcN72AD2VKfT0aUc7wA0B", // Confirmed (A0B)
      annual: "https://buy.stripe.com/eVqfZja35aoc22a7I07wA0D", // Confirmed (A0D)
    },
    partner: {
      one_time: "https://buy.stripe.com/eVqbJ3dfh1RGbCKbYg7wA0C", // Confirmed (A0C)
    }
  },
};
