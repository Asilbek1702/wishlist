import { Wishlist, WishlistItem, Reservation, Contribution } from "@prisma/client";

export type ItemStatus = "AVAILABLE" | "RESERVED" | "COLLECTING" | "FULFILLED" | "UNAVAILABLE";
export type ContribStatus = "ACTIVE" | "REFUNDED" | "CANCELLED";

export interface WishlistWithItems extends Wishlist {
  items: WishlistItemWithDetails[];
  owner: { id: string; name: string | null; image: string | null; email?: string | null };
}

export interface WishlistItemWithDetails extends WishlistItem {
  reservation?: Reservation | null;
  contributions?: Contribution[];
}

export interface ScrapedProduct {
  title?: string;
  description?: string;
  price?: number;
  currency?: string;
  imageUrl?: string;
  originalUrl?: string;
}

export const OCCASIONS = [
  { value: "birthday", label: "День рождения", emoji: "🎂" },
  { value: "newyear", label: "Новый год", emoji: "🎄" },
  { value: "wedding", label: "Свадьба", emoji: "💍" },
  { value: "graduation", label: "Выпускной", emoji: "🎓" },
  { value: "other", label: "Другое", emoji: "✨" },
] as const;

export const PRIORITY_LABELS: Record<number, string> = {
  1: "Было бы неплохо",
  2: "Хочу",
  3: "Очень хочу",
};

export const CURRENCIES = ["RUB", "USD", "EUR"] as const;
