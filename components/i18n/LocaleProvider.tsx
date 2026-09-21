"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";
import { directionFor, getMessages, type Locale, type MessageCatalog } from "@/lib/i18n/messages";

const LocaleContext = createContext<{ locale: Locale; direction: "ltr" | "rtl"; messages: MessageCatalog }>({ locale: "en", direction: "ltr", messages: getMessages("en") });

export function LocaleProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const direction = directionFor(locale);
  useEffect(() => {
    // Console trace S15-I18N-001: locale hydration records only locale and direction keys.
    console.log(JSON.stringify({ level: "info", step: "S15-I18N-001", event: "i18n.locale_hydrated", locale, direction }));
  }, [direction, locale]);
  return <LocaleContext.Provider value={{ locale, direction, messages: getMessages(locale) }}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  return useContext(LocaleContext);
}
