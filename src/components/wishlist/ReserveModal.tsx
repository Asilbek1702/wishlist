"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import confetti from "canvas-confetti";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

const schema = z.object({
  guestName: z.string().min(1, "Введите имя").optional(),
  guestEmail: z.string().email("Некорректный email").optional().or(z.literal("")),
  message: z.string().max(200).optional(),
  notifyOnEvent: z.boolean().optional(),
});

type FormValues = z.infer<typeof schema>;

interface ReserveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wishlistId: string;
  itemId: string;
  ownerEmail?: string | null;
  hasExistingReservation?: boolean;
  reservationToken?: string | null;
  onSuccess?: () => void;
}

export function ReserveModal({
  open,
  onOpenChange,
  wishlistId,
  itemId,
  ownerEmail,
  hasExistingReservation,
  reservationToken,
  onSuccess,
}: ReserveModalProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);

  // FIX: используем prop напрямую, не через useState
  const showUnreserve = hasExistingReservation ?? false;
  const isAuth = !!session?.user;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      guestName: session?.user?.name ?? "",
      guestEmail: session?.user?.email ?? "",
      message: "",
      notifyOnEvent: false,
    },
  });

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/wishlists/${wishlistId}/items/${itemId}/reserve`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            guestName: data.guestName,
            guestEmail: data.guestEmail,
            message: data.message,
            notifyOnEvent: data.notifyOnEvent,
          }),
        }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Ошибка");

      if (json.token) {
        localStorage.setItem(`reservation-${itemId}`, json.token);
      }

      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      toast.success("Отлично! Подарок за тобой 🎉");
      reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка при бронировании");
    } finally {
      setLoading(false);
    }
  };

  const onUnreserve = async () => {
    const token =
      reservationToken ?? localStorage.getItem(`reservation-${itemId}`);
    if (!token && !session?.user) {
      toast.info(
        ownerEmail
          ? `Напиши ${ownerEmail} чтобы снять бронь`
          : "Обратись к владельцу вишлиста"
      );
      return;
    }
    setLoading(true);
    try {
      const url = `/api/wishlists/${wishlistId}/items/${itemId}/unreserve${
        token ? `?token=${token}` : ""
      }`;
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) throw new Error();
      if (token) localStorage.removeItem(`reservation-${itemId}`);
      toast.success("Бронь снята");
      onOpenChange(false);
      onSuccess?.();
    } catch {
      toast.error("Не удалось снять бронь");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>
            {showUnreserve ? "Отменить бронь" : "Забронировать подарок"}
          </DialogTitle>
        </DialogHeader>
        {showUnreserve ? (
          <div className="space-y-4">
            <p className="text-muted text-sm">
              Ты уверен, что хочешь снять бронь с этого подарка?
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Отмена
              </Button>
              <Button
                variant="danger"
                onClick={onUnreserve}
                disabled={loading}
              >
                {loading ? "..." : "Снять бронь"}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {!isAuth && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="guestName">Имя *</Label>
                  <Input
                    id="guestName"
                    {...register("guestName")}
                    placeholder="Твоё имя"
                  />
                  {errors.guestName && (
                    <p className="text-danger text-sm">
                      {errors.guestName.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guestEmail">Email (необязательно)</Label>
                  <Input
                    id="guestEmail"
                    type="email"
                    {...register("guestEmail")}
                    placeholder="email@example.com"
                  />
                  {errors.guestEmail && (
                    <p className="text-danger text-sm">
                      {errors.guestEmail.message}
                    </p>
                  )}
                </div>
              </>
            )}
            {isAuth && (
              <p className="text-sm text-muted">
                Бронируешь как{" "}
                <span className="font-medium text-foreground">
                  {session.user.name || session.user.email}
                </span>
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="message">Сообщение (необязательно)</Label>
              <Textarea
                id="message"
                {...register("message")}
                placeholder="До 200 символов"
                rows={2}
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="notifyOnEvent" {...register("notifyOnEvent")} />
              <Label htmlFor="notifyOnEvent" className="cursor-pointer">
                Уведомить на email когда дата события наступит
              </Label>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Отменить
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Бронируем..." : "Забронировать"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
