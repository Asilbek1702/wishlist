"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ItemForm } from "@/components/wishlist/ItemForm";
import { ItemCard } from "@/components/wishlist/ItemCard";
import { OCCASIONS } from "@/types";
import { toast } from "sonner";
import type { WishlistItemWithDetails } from "@/types";

const wishlistSchema = z.object({
  title: z.string().min(1, "Введите название"),
  description: z.string().optional(),
  occasion: z.string().optional(),
  eventDate: z.string().optional(),
  coverColor: z.string().default("#6366f1"),
});

type WishlistFormValues = z.infer<typeof wishlistSchema>;

const COVER_COLORS = [
  "#6366f1", "#EC4899", "#10B981", "#F59E0B",
  "#8B5CF6", "#06B6D4", "#EF4444",
];

export default function NewWishlistPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [wishlist, setWishlist] = useState<{
    id: string;
    slug: string;
    items: WishlistItemWithDetails[];
  } | null>(null);
  const [showItemForm, setShowItemForm] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<WishlistFormValues>({
    resolver: zodResolver(wishlistSchema),
    defaultValues: {
      title: "",
      description: "",
      occasion: "",
      eventDate: "",
      coverColor: "#6366f1",
    },
  });

  const coverColor = watch("coverColor");

  const onCreateWishlist = async (data: WishlistFormValues) => {
    setLoading(true);
    try {
      const res = await fetch("/api/wishlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          eventDate: data.eventDate || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      const wl = await res.json();
      setWishlist({ id: wl.id, slug: wl.slug, items: wl.items || [] });
      toast.success("Вишлист создан");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка при создании");
    } finally {
      setLoading(false);
    }
  };

  const onAddItem = async (data: Record<string, unknown>) => {
    if (!wishlist) return;
    try {
      const res = await fetch(`/api/wishlists/${wishlist.id}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      const item = await res.json();
      setWishlist((prev) =>
        prev ? { ...prev, items: [...prev.items, item] } : null
      );
      setShowItemForm(false);
      toast.success("Товар добавлен");
    } catch {
      toast.error("Ошибка при добавлении");
    }
  };

  const onFinish = () => {
    if (wishlist) {
      router.push(`/wishlist/${wishlist.id}`);
    }
  };

  if (wishlist) {
    return (
      <div className="max-w-4xl mx-auto">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-muted hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Назад
        </Link>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-display font-bold">Добавьте товары</h1>
          <Button onClick={() => setShowItemForm(!showItemForm)} className="gap-2">
            <Plus className="h-4 w-4" />
            {showItemForm ? "Отмена" : "Добавить товар"}
          </Button>
        </div>
        {showItemForm && (
          <div className="mb-8 rounded-2xl border border-border bg-surface p-6">
            <ItemForm
              onSubmit={onAddItem}
              onCancel={() => setShowItemForm(false)}
            />
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {wishlist.items.map((item, i) => (
            <ItemCard
              key={item.id}
              item={item}
              wishlistId={wishlist.id}
              isOwner
              index={i}
              onUpdate={() => {
                fetch(`/api/wishlists/${wishlist.id}`)
                  .then((r) => r.json())
                  .then((wl) => setWishlist((p) => (p ? { ...p, items: wl.items } : null)));
              }}
              onDelete={(itemId) =>
                setWishlist((p) =>
                  p ? { ...p, items: p.items.filter((i) => i.id !== itemId) } : null
                )
              }
            />
          ))}
        </div>
        <div className="mt-8 flex justify-end">
          <Button onClick={onFinish}>Готово — перейти к вишлисту</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-muted hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Назад
      </Link>
      <h1 className="text-2xl font-display font-bold mb-6">Новый вишлист</h1>
      <form
        onSubmit={handleSubmit(onCreateWishlist)}
        className="space-y-5 rounded-2xl border border-border bg-surface p-6"
      >
        <div className="space-y-2">
          <Label htmlFor="title">Название *</Label>
          <Input id="title" {...register("title")} placeholder="День рождения 2025" />
          {errors.title && (
            <p className="text-danger text-sm">{errors.title.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Описание</Label>
          <Textarea
            id="description"
            {...register("description")}
            placeholder="Расскажи о событии"
            rows={3}
          />
        </div>
        <div className="space-y-2">
          <Label>Тип события</Label>
          <div className="flex flex-wrap gap-2">
            {OCCASIONS.map((occ) => (
              <label
                key={occ.value}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border cursor-pointer transition-colors ${
                  watch("occasion") === occ.value
                    ? "border-primary bg-primary/10"
                    : "border-border hover:bg-background"
                }`}
              >
                <input
                  type="radio"
                  {...register("occasion")}
                  value={occ.value}
                  className="sr-only"
                />
                <span>{occ.emoji}</span>
                <span className="text-sm">{occ.label}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="eventDate">Дата события</Label>
          <Input
            id="eventDate"
            type="date"
            {...register("eventDate")}
          />
        </div>
        <div className="space-y-2">
          <Label>Цвет обложки</Label>
          <div className="flex gap-2 flex-wrap">
            {COVER_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setValue("coverColor", color)}
                className={`w-10 h-10 rounded-xl border-2 transition-transform ${
                  coverColor === color ? "border-foreground scale-110" : "border-transparent"
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? "Создание..." : "Создать и добавить товары"}
        </Button>
      </form>
    </div>
  );
}
