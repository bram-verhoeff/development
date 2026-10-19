// Ondersteunde UI-talen. Een taal toevoegen = code hier + messages/<code>.json.
export const locales = ["nl"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "nl";
export const localeCookie = "locale";
