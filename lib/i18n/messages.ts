export const messages = {
  en: {
    productName: "Mythra",
    home: "Home",
    settings: "Settings",
    emptyTitle: "Your writing space is ready",
    emptyDescription: "The foundation is active. Story creation begins in the next verified capability.",
    commandPalette: "Command palette",
    theme: "Theme",
    light: "Light",
    dark: "Dark",
    system: "System",
    saveNotApplicable: "No document open",
    signIn: "Continue to Mythra",
    signInDescription: "Use the configured identity provider to enter your workspace."
  }
} as const;

export type Locale = keyof typeof messages;
export function getMessages(locale: string) {
  return messages[locale as Locale] ?? messages.en;
}
