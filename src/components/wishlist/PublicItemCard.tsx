"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PriorityBadge } from "@/components/common/PriorityBadge";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ProgressBar } from "./ProgressBar";
import { ReserveModal } from "./ReserveModal";
import { ContributeModal } from "./ContributeModal";
import { formatCurrency } from "@/lib/utils";
import type { WishlistWithItems } from "@/types";
import type { WishlistItemWithDetails } from "@/types";

interface PublicItemCardProps {
  item: WishlistItemWithDetails;
  wishlist: WishlistWithItems;
  index: number;
  onAction?: () => void;
}

export function PublicItemCard({
  item,
  wishlist,
  index,
  onAction,
}: PublicItemCardProps) {
  const { data: session } = useSession();
  const [reserveOpen, setReserveOpen] = useState(false);
  const [contributeOpen, setContributeOpen] = useState(false);

  const isOwner = session?.user?.id === wishlist.ownerId;
  const collected =
    item.contributions?.reduce((s, c) => s + Number(c.amount), 0) ?? 0;
  const target = item.targetAmount ? Number(item.targetAmount) : 0;
  const progress = target > 0 ? Math.min(100, (collected / target) * 100) : 0;

  const reservationToken =
    typeof window !== "undefined"
      ? localStorage.getItem(`reservation-${item.id}`)
      : null;
  const hasMyReservation =
    (session?.user && item.reservation?.userId === session.user.id) ||
    (item.reservation?.guestToken && reservationToken === item.reservation.guestToken);

  if (item.status === "UNAVAILABLE") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className="rounded-2xl border border-border bg-muted/30 overflow-hidden opacity-75"
      >
        <div className="aspect-video bg-muted flex items-center justify-center">
          <span className="text-4xl font-display text-muted">?</span>
        </div>
        <div className="p-4">
          <h3 className="font-semibold line-clamp-2">{item.title}</h3>
          <p className="text-muted text-sm mt-2">Товар недоступен</p>
        </div>
      </motion.div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className="rounded-2xl border border-border bg-surface overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-0.5"
      >
        <div className="aspect-video bg-border relative overflow-hidden">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary/10">
              <span className="text-4xl font-display font-bold text-primary/50">
                {item.title[0]?.toUpperCase() || "?"}
              </span>
            </div>
          )}
          <div className="absolute top-2 right-2 flex gap-1">
            <PriorityBadge priority={item.priority} />
            {item.status !== "AVAILABLE" && <StatusBadge status={item.status} />}
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-lg line-clamp-2">{item.title}</h3>
          {item.description && (
            <p className="text-muted text-sm mt-1 line-clamp-2">{item.description}</p>
          )}
          {item.price != null && (
            <p className="text-primary font-medium mt-2">
              {formatCurrency(Number(item.price), item.currency)}
            </p>
          )}
          {item.isGroupGift && target > 0 && (
            <div className="mt-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted">
                  Собрано {formatCurrency(collected, item.currency)} из{" "}
                  {formatCurrency(target, item.currency)}
                </span>
              </div>
              <ProgressBar value={progress} />
            </div>
          )}
          <div className="mt-4 flex flex-wrap gap-2 items-center">
            {item.productUrl && (
              <a
                href={item.productUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted hover:text-primary transition-colors p-1"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
            {isOwner ? (
              <Link href={`/wishlist/${wishlist.id}`}>
                <Button size="sm" variant="outline">
                  Редактировать
                </Button>
              </Link>
            ) : item.status === "AVAILABLE" ? (
              <Button size="sm" onClick={() => setReserveOpen(true)}>
                Забронировать
              </Button>
            ) : item.status === "RESERVED" ? (
              <Button size="sm" variant="outline" disabled>
                Уже берут
              </Button>
            ) : item.status === "COLLECTING" || item.status === "FULFILLED" ? (
              item.status === "COLLECTING" ? (
                <Button size="sm" onClick={() => setContributeOpen(true)}>
                  Скинуться
                </Button>
              ) : (
                <span className="text-sm text-muted">Сумма собрана 🎉</span>
              )
            ) : null}
            {hasMyReservation && item.status === "RESERVED" && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setReserveOpen(true)}
              >
                Отменить бронь
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      <ReserveModal
        open={reserveOpen}
        onOpenChange={setReserveOpen}
        wishlistId={wishlist.id}
        itemId={item.id}
        ownerEmail={wishlist.owner?.email}
        hasExistingReservation={!!(hasMyReservation && item.status === "RESERVED")}
        reservationToken={item.reservation?.guestToken ?? reservationToken}
        onSuccess={onAction}
      />

      <ContributeModal
        open={contributeOpen}
        onOpenChange={setContributeOpen}
        wishlistId={wishlist.id}
        itemId={item.id}
        targetAmount={target}
        collected={collected}
        currency={item.currency}
        contributions={item.contributions || []}
        isOwner={isOwner}
        onSuccess={onAction}
      />
    </>
  );
}
