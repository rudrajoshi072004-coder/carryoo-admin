import type { AdminLocale } from "./catalog";

const BCP47: Record<AdminLocale, string> = {
  en: "en-IN",
  hi: "hi-IN",
  mr: "mr-IN",
  gu: "gu-IN",
};

export function intlLocale(language: AdminLocale): string {
  return BCP47[language] ?? "en-IN";
}

function asDate(value: Date | string | number): Date | null {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(
  value: Date | string | number,
  language: AdminLocale,
  options?: Intl.DateTimeFormatOptions,
): string {
  const date = asDate(value);
  if (!date) return "";
  return new Intl.DateTimeFormat(intlLocale(language), options ?? { dateStyle: "medium" }).format(date);
}

export function formatTime(
  value: Date | string | number,
  language: AdminLocale,
  options?: Intl.DateTimeFormatOptions,
): string {
  const date = asDate(value);
  if (!date) return "";
  return new Intl.DateTimeFormat(intlLocale(language), options ?? { timeStyle: "short" }).format(date);
}

export function formatDateTime(value: Date | string | number, language: AdminLocale): string {
  const date = asDate(value);
  if (!date) return "";
  return new Intl.DateTimeFormat(intlLocale(language), { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function formatNumber(
  value: number,
  language: AdminLocale,
  options?: Intl.NumberFormatOptions,
): string {
  if (!Number.isFinite(value)) return "";
  return new Intl.NumberFormat(intlLocale(language), options).format(value);
}

/** Display-only INR. Does not change the numeric amount. */
export function formatInr(value: number, language: AdminLocale): string {
  if (!Number.isFinite(value)) return "";
  return new Intl.NumberFormat(intlLocale(language), {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatRelativeTime(
  value: Date | string | number,
  language: AdminLocale,
  now = new Date(),
): string {
  const date = asDate(value);
  if (!date) return "";
  const diffSec = Math.round((date.getTime() - now.getTime()) / 1000);
  const abs = Math.abs(diffSec);
  const rtf = new Intl.RelativeTimeFormat(intlLocale(language), { numeric: "auto" });
  if (abs < 60) return rtf.format(diffSec, "second");
  if (abs < 3600) return rtf.format(Math.round(diffSec / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diffSec / 3600), "hour");
  if (abs < 86400 * 30) return rtf.format(Math.round(diffSec / 86400), "day");
  return rtf.format(Math.round(diffSec / (86400 * 30)), "month");
}
