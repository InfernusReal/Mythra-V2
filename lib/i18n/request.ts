import { headers } from "next/headers";
import { directionFor, getMessages, resolveLocale } from "@/lib/i18n/messages";
import { logger } from "@/lib/observability/logger";

export async function getRequestI18n() {
  const requestHeaders = await headers();
  const locale = resolveLocale(
    requestHeaders.get("x-mythra-locale") ??
      requestHeaders.get("accept-language"),
  );
  const direction = directionFor(locale);
  // Console trace S18-I18N-001: request locale resolution records locale and direction keys only.
  logger.info("i18n.request_catalog_resolved", {
    step: "S18-I18N-001",
    locale,
    direction,
  });
  return { locale, direction, messages: getMessages(locale) } as const;
}
