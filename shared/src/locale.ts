export const LOCALES = ['pl', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

/** The same text in every supported language. */
export type Localized = Record<Locale, string>;
