import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";

import { defaultLocale, localeCookie, locales, type Locale } from "./config";

// Kiest per request de UI-taal (cookie, anders Nederlands) en laadt de teksten.
export default getRequestConfig(async () => {
  const stored = (await cookies()).get(localeCookie)?.value;
  const locale: Locale = locales.includes(stored as Locale) ? (stored as Locale) : defaultLocale;

  return {
    locale,
    timeZone: "Europe/Amsterdam",
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
