"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Link2, ArrowDownCircle, ArrowUpCircle, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PRIORITY_LABELS, CURRENCIES } from "@/types";

const itemSchema = z.object({
  title: z.string().min(1, "Введите название"),
  description: z.string().optional(),
  price: z.number().optional().nullable(),
  currency: z.string().default("RUB"),
  imageUrl: z.string().url().optional().or(z.literal("")),
  productUrl: z.string().url().optional().or(z.literal("")),
  priority: z.number().min(1).max(3).default(1),
  isGroupGift: z.boolean().default(false),
  targetAmount: z.number().optional().nullable(),
});

type ItemFormValues = z.infer<typeof itemSchema>;

type ItemFormPayload = Omit<ItemFormValues, "imageUrl" | "productUrl" | "price" | "targetAmount"> & {
  imageUrl?: string | null;
  productUrl?: string | null;
  price?: number | null;
  targetAmount?: number | null;
};

interface ItemFormProps {
  onSubmit: (data: ItemFormPayload) => Promise<void>;
  onCancel?: () => void;
  defaultValues?: Partial<ItemFormValues>;
}

export function ItemForm({
  onSubmit,
  onCancel,
  defaultValues,
}: ItemFormProps) {
  const [scraping, setScraping] = useState(false);
  const [urlInput, setUrlInput] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ItemFormValues>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      title: "",
      description: "",
      price: null,
      currency: "RUB",
      imageUrl: "",
      productUrl: "",
      priority: 1,
      isGroupGift: false,
      targetAmount: null,
      ...defaultValues,
    },
  });

  const isGroupGift = watch("isGroupGift");
  const priority = watch("priority");

  const handleScrape = async () => {
    if (!urlInput.trim()) return;
    setScraping(true);
    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlInput.trim() }),
      });
      const data = await res.json();
      if (data.title) setValue("title", data.title);
      if (data.description) setValue("description", data.description);
      if (data.price != null) setValue("price", data.price);
      if (data.currency) setValue("currency", data.currency);
      if (data.imageUrl) setValue("imageUrl", data.imageUrl);
      setValue("productUrl", urlInput.trim());
    } catch {
      /* ignore */
    } finally {
      setScraping(false);
    }
  };

  const onFormSubmit = async (data: ItemFormValues) => {
    const payload = {
      ...data,
      imageUrl: (data.imageUrl || null) as string | null,
      productUrl: (data.productUrl || null) as string | null,
      price: data.price ?? null,
      targetAmount: data.isGroupGift ? (data.targetAmount ?? null) : null,
    };
    await onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-5">
      <div className="space-y-2">
        <Label>Вставь ссылку на товар</Label>
        <div className="flex gap-2">
          <Input
            placeholder="https://..."
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            disabled={scraping}
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleScrape}
            disabled={scraping}
          >
            {scraping ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Link2 className="h-4 w-4 mr-2" />
                Заполнить
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Название *</Label>
        <Input id="title" {...register("title")} placeholder="Название товара" />
        {errors.title && (
          <p className="text-danger text-sm">{errors.title.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Описание</Label>
        <Textarea
          id="description"
          {...register("description")}
          placeholder="Описание подарка"
          rows={2}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price">Цена</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            placeholder="0"
            {...register("price", { valueAsNumber: true })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="currency">Валюта</Label>
          <select
            id="currency"
            {...register("currency")}
            className="flex h-11 w-full rounded-xl border border-border bg-surface px-4 py-2 text-sm"
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="productUrl">Ссылка на товар</Label>
        <Input
          id="productUrl"
          type="url"
          {...register("productUrl")}
          placeholder="https://..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="imageUrl">URL картинки</Label>
        <Input
          id="imageUrl"
          type="url"
          {...register("imageUrl")}
          placeholder="https://..."
        />
      </div>

      <div className="space-y-2">
        <Label>Приоритет</Label>
        <div className="flex gap-2">
          {([1, 2, 3] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setValue("priority", p)}
              className={`flex items-center gap-1 px-4 py-2 rounded-xl border text-sm font-medium transition-colors ${
                priority === p
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:bg-background"
              }`}
            >
              {p === 1 && <Minus className="h-4 w-4" />}
              {p === 2 && <ArrowDownCircle className="h-4 w-4" />}
              {p === 3 && <ArrowUpCircle className="h-4 w-4" />}
              {PRIORITY_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isGroupGift"
          {...register("isGroupGift")}
          className="rounded border-border"
        />
        <Label htmlFor="isGroupGift">Групповой подарок (скинуться)</Label>
      </div>

      {isGroupGift && (
        <div className="space-y-2">
          <Label htmlFor="targetAmount">Целевая сумма</Label>
          <Input
            id="targetAmount"
            type="number"
            step="0.01"
            {...register("targetAmount", { valueAsNumber: true })}
            placeholder="Сумма для сбора"
          />
        </div>
      )}

      <div className="flex gap-3 justify-end pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Отмена
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Сохранение..." : "Сохранить"}
        </Button>
      </div>
    </form>
  );
}
