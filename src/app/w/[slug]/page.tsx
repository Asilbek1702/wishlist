"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Calendar, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicItemCard } from "@/components/wishlist/PublicItemCard";
import { usePusherWishlist } from "@/hooks/usePusher";
import type { WishlistWithItems } from "@/types";

export default function PublicWishlistPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [wishlist, setWishlist] = useState<WishlistWithItems | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchWishlist = () => {
    fetch(`/api/w/${slug}`)
      .then((res) => res.json())
      .then(setWishlist)
      .catch(() => setWishlist(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => fetchWishlist(), [slug]);

  usePusherWishlist(slug, () => {
    fetchWishlist();
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto p-6 animate-pulse space-y-6">
          <div className="h-12 bg-border rounded w-2/3" />
          <div className="h-48 bg-border rounded-2xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-64 bg-border rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!wishlist) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-display font-bold">Вишлист не найден</h1>
          <p className="text-muted mt-2">Возможно ссылка устарела</p>
        </div>
      </div>
    );
  }

  const eventDate = wishlist.eventDate ? new Date(wishlist.eventDate) : null;
  const isPast = eventDate && eventDate < new Date();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <Gift className="h-6 w-6 text-primary" />
              <span className="font-display font-bold">Вишлист</span>
            </Link>
          </div>
          <Link href="/register">
            <Button variant="outline" size="sm">
              Создать свой вишлист
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl md:text-3xl font-display font-bold">
              {wishlist.title}
            </h1>
            {isPast && (
              <span className="rounded-lg bg-muted/50 px-2 py-0.5 text-xs text-muted">
                Событие прошло
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-muted text-sm">
            {wishlist.owner?.image ? (
              <img
                src={wishlist.owner.image}
                alt=""
                className="h-8 w-8 rounded-full"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-medium">
                {wishlist.owner?.name?.[0] || "?"}
              </div>
            )}
            <span>{wishlist.owner?.name || "Владелец"}</span>
            {eventDate && (
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {eventDate.toLocaleDateString("ru-RU", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {wishlist.items.map((item, index) => (
            <PublicItemCard
              key={item.id}
              item={item}
              wishlist={wishlist}
              index={index}
              onAction={fetchWishlist}
            />
          ))}
        </motion.div>
      </main>
    </div>
  );
}
