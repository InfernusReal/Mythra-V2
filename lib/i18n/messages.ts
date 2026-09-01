const englishMessages = {
  productName: "Mythra", home: "Home", projects: "Projects", settings: "Settings", navigation: "Navigation", returnAction: "Return",
  emptyTitle: "Your writing space is ready", emptyDescription: "The foundation is active. Story creation begins in the next verified capability.",
  commandPalette: "Command palette", theme: "Theme", light: "Light", dark: "Dark", cream: "Cream", system: "System",
  saveNotApplicable: "No document open", signIn: "Continue to Mythra", signInTitle: "Enter your writing workspace", signInDescription: "Use the configured identity provider to enter your workspace.", oidcRequired: "OIDC sign-in must be initiated by the configured deployment identity gateway."
} as const;

export type MessageKey = keyof typeof englishMessages;
export type MessageCatalog = Readonly<Record<MessageKey, string>>;
export const messages: Readonly<Record<"en" | "ar", MessageCatalog>> = Object.freeze({
  en: englishMessages,
  ar: Object.freeze({
    productName: "ميثرا", home: "الرئيسية", projects: "المشروعات الكتابية", settings: "الإعدادات وإدارة مساحة العمل", navigation: "التنقل بين أقسام مساحة الكتابة", returnAction: "العودة إلى الكتابة",
    emptyTitle: "مساحة الكتابة جاهزة", emptyDescription: "الأساس نشط، ويمكن متابعة بناء القصة من القدرة التي تم التحقق منها.",
    commandPalette: "لوحة الأوامر والبحث في المشروع", theme: "المظهر", light: "فاتح", dark: "داكن", cream: "كريمي", system: "إعداد النظام",
    saveNotApplicable: "لا يوجد مستند مفتوح", signIn: "المتابعة إلى ميثرا", signInTitle: "الدخول إلى مساحة العمل الكتابية", signInDescription: "استخدم موفر الهوية المكوّن للدخول إلى مساحة العمل.", oidcRequired: "يجب بدء تسجيل الدخول الموحّد من بوابة الهوية المكوّنة لبيئة النشر."
  })
});

export type Locale = keyof typeof messages;
export type TextDirection = "ltr" | "rtl";
export function resolveLocale(acceptLanguage: string | null | undefined): Locale {
  const candidates = (acceptLanguage ?? "").toLocaleLowerCase().split(",").map((candidate) => candidate.trim().split(";")[0] ?? "");
  return candidates.some((candidate) => candidate === "ar" || candidate.startsWith("ar-")) ? "ar" : "en";
}
export function directionFor(locale: Locale): TextDirection { return locale === "ar" ? "rtl" : "ltr"; }
export function getMessages(locale: string): MessageCatalog { return messages[locale as Locale] ?? messages.en; }
