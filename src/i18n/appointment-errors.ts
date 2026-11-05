import type { Locale } from "./config";

const FRENCH: Record<string, string> = {
  "Too many requests. Try again later.": "Trop de demandes. Réessayez dans un moment.",
  "Failed to send request": "L'envoi n'a pas abouti. Réessayez, ou appelez le cabinet.",
  "Missing doctor.": "Praticien introuvable.",
  "Please enter your name.": "Indiquez votre nom.",
  "A phone number or email is required.": "Un téléphone ou un e-mail est nécessaire.",
  "Something went wrong. Please try again.": "Un souci est survenu. Réessayez.",
  "Doctor not found.": "Praticien introuvable.",
  "Something went wrong.": "Un souci est survenu.",
};

/** English API errors stay word for word. French visitors see a French sentence. */
export function translateAppointmentError(message: string, locale: Locale): string {
  if (locale !== "fr") return message;
  return FRENCH[message] || "Un souci est survenu. Réessayez, ou appelez le cabinet.";
}
