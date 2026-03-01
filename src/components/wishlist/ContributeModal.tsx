"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ProgressBar } from "./ProgressBar";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

const schema = z.object({
  amount: z.number().min(1, "Введите сумму"),
  guestName: z.string().optional(),
  guestEmail: z.string().email("Некорректный email").optional().or(z.literal("")),
  message: z.string().max(200).optional(),
});

type FormValues = z.infer<typeof schema>;

interface Contribution {
  amount: number | { toString(): string };
  guestName?: string | null;
  user?: { name?: string | null } | null;
}

interface ContributeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wishlistId: string;
  itemId: string;
  targetAmount: number;
  collected: number;
  currency: string;
  contributions: Contribution[];
  isOwner?: boolean;
  onSuccess?: () => void;
}

export function ContributeModal({
  open,
  onOpenChange,
  wishlistId,
  itemId,
  targetAmount,
  collected,
  currency,
  contributions,
  isOwner,
  onSuccess,
}: ContributeModalProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const isAuth = !!session?.user;
  const minAmount = Math.max(50, targetAmount * 0.01);
  const progress = Math.min(100, (collected / targetAmount) * 100);
  const isFulfilled = collected >= targetAmount;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: minAmount,
      guestName: "",
      guestEmail: "",
      message: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/wishlists/${wishlistId}/items/${itemId}/contribute`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: data.amount,
            guestName: data.guestName || undefined,
            guestEmail: data.guestEmail || undefined,
            message: data.message || undefined,
          }),
        }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Ошибка");

      toast.success("Вклад внесён! Спасибо 🎉");
      onOpenChange(false);
      onSuccess?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>Скинуться на подарок</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted mb-1">
              Собрано {formatCurrency(collected, currency)} из {formatCurrency(targetAmount, currency)}
            </p>
            <ProgressBar value={progress} className="h-3" />
          </div>

          {!isOwner && contributions.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Уже скинулись:</p>
              <ul className="space-y-1 text-sm text-muted">
                {contributions.map((c, i) => (
                  <li key={i}>
                    {c.user?.name || c.guestName || "Участник"} —{" "}
                    {formatCurrency(typeof c.amount === "number" ? c.amount : Number(c.amount), currency)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!isFulfilled && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Моя сумма (мин. {formatCurrency(minAmount, currency)})</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min={minAmount}
                  {...register("amount", { valueAsNumber: true })}
                />
                {errors.amount && (
                  <p className="text-danger text-sm">{errors.amount.message}</p>
                )}
              </div>
              {!isAuth && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="guestName">Имя</Label>
                    <Input id="guestName" {...register("guestName")} placeholder="Твоё имя" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="guestEmail">Email</Label>
                    <Input
                      id="guestEmail"
                      type="email"
                      {...register("guestEmail")}
                      placeholder="email@example.com"
                    />
                  </div>
                </>
              )}
              <div className="space-y-2">
                <Label htmlFor="message">Сообщение</Label>
                <Textarea
                  id="message"
                  {...register("message")}
                  placeholder="До 200 символов"
                  rows={2}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "..." : "Внести вклад"}
              </Button>
            </form>
          )}

          {isFulfilled && (
            <p className="text-center text-success font-medium">
              🎉 Сумма собрана! Спасибо всем участникам
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
