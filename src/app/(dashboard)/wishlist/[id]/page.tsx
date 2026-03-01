"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ItemForm } from "@/components/wishlist/ItemForm";
import { ItemCard } from "@/components/wishlist/ItemCard";
import { ShareButton } from "@/components/wishlist/ShareButton";
import type { WishlistWithItems } from "@/types";

export default function WishlistEditPage() {
  const params = useParams();
  const id = params.id as string;
  const [wishlist, setWishlist] = useState<WishlistWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [showItemForm, setShowItemForm] = useState(false);

  const fetchWishlist = () => {
    fetch(`/api/wishlists/${id}`)
      .then((res) => res.json())
      .then(setWishlist)
      .catch(() => setWishlist(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => fetchWishlist(), [id]);

  const onAddItem = async (data: Record<string, unknown>) => {
    try {
      const res = await fetch(`/api/wishlists/${id}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      fetchWishlist();
      setShowItemForm(false);
    } catch {
      /* toast */
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto animate-pulse space-y-6">
        <div className="h-8 bg-border rounded w-48" />
        <div className="h-32 bg-border rounded-2xl" />
        <div className="grid grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="h-64 bg-border rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!wishlist) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <p className="text-muted">Вишлист не найден</p>
        <Link href="/dashboard">
          <Button className="mt-4">На главную</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Назад
        </Link>
        <div className="flex gap-2">
          <ShareButton wishlist={wishlist} />
          <Link href={`/wishlist/${id}/settings`}>
            <Button variant="outline" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
      <div
        className="h-32 rounded-2xl mb-6 flex items-center justify-center"
        style={{ backgroundColor: wishlist.coverColor }}
      >
        <span className="text-2xl font-display font-bold text-white/90">
          {wishlist.title}
        </span>
      </div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold">{wishlist.title}</h1>
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
            wishlistId={id}
            isOwner
            index={i}
            onUpdate={fetchWishlist}
            onDelete={(itemId) =>
              setWishlist((p) =>
                p ? { ...p, items: p.items.filter((i) => i.id !== itemId) } : null
              )
            }
          />
        ))}
      </div>
    </div>
  );
}
