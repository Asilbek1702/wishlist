"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { OCCASIONS } from "@/types";
import { toast } from "sonner";

const schema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  occasion: z.string().optional(),
  eventDate: z.string().optional(),
  coverColor: z.string(),
});

type FormValues = z.infer<typeof schema>;

const COVER_COLORS = [
  "#6366f1", "#EC4899", "#10B981", "#F59E0B",
  "#8B5CF6", "#06B6D4", "#EF4444",
];

export default function WishlistSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    fetch(`/api/wishlists/${id}`)
      .then((r) => r.json())
      .then((w) => {
        setValue("title", w.title);
        setValue("description", w.description ?? "");
        setValue("occasion", w.occasion ?? "");
        setValue(
          "eventDate",
          w.eventDate ? new Date(w.eventDate).toISOString().slice(0, 10) : ""
        );
        setValue("coverColor", w.coverColor ?? "#6366f1");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id, setValue]);

  const onSubmit = async (data: FormValues) => {
    try {
      const res = await fetch(`/api/wishlists/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          eventDate: data.eventDate || null,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Настройки сохранены");
      router.push(`/wishlist/${id}`);
    } catch {
      toast.error("Ошибка при сохранении");
    }
  };

  if (loading) return <div className="animate-pulse h-96 bg-border rounded-2xl" />;

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href={`/wishlist/${id}`}
        className="inline-flex items-center gap-2 text-muted hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Назад
      </Link>
      <h1 className="text-2xl font-display font-bold mb-6">Настройки вишлиста</h1>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5 rounded-2xl border border-border bg-surface p-6"
      >
        <div className="space-y-2">
          <Label htmlFor="title">Название *</Label>
          <Input id="title" {...register("title")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Описание</Label>
          <Textarea id="description" {...register("description")} rows={3} />
        </div>
        <div className="space-y-2">
          <Label>Тип события</Label>
          <div className="flex flex-wrap gap-2">
            {OCCASIONS.map((occ) => (
              <label
                key={occ.value}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border cursor-pointer ${
                  watch("occasion") === occ.value ? "border-primary bg-primary/10" : "border-border"
                }`}
              >
                <input type="radio" {...register("occasion")} value={occ.value} className="sr-only" />
                {occ.emoji} {occ.label}
              </label>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="eventDate">Дата события</Label>
          <Input id="eventDate" type="date" {...register("eventDate")} />
        </div>
        <div className="space-y-2">
          <Label>Цвет обложки</Label>
          <div className="flex gap-2 flex-wrap">
            {COVER_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setValue("coverColor", color)}
                className={`w-10 h-10 rounded-xl border-2 ${
                  watch("coverColor") === color ? "border-foreground scale-110" : "border-transparent"
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Сохранение..." : "Сохранить"}
        </Button>
      </form>
    </div>
  );
}
