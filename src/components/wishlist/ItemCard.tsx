"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ExternalLink, Pencil, Trash2 } from "lucide-react";
import { WishlistItemWithDetails } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PriorityBadge } from "@/components/common/PriorityBadge";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ProgressBar } from "./ProgressBar";
import { ItemForm } from "./ItemForm";
import { toast } from "sonner";

interface ItemCardProps {
  item: WishlistItemWithDetails;
  wishlistId: string;
  isOwner: boolean;
  onUpdate: () => void;
  onDelete: (itemId: string) => void;
  index?: number;
}

export function ItemCard({
  item,
  wishlistId,
  isOwner,
  onUpdate,
  onDelete,
  index = 0,
}: ItemCardProps) {
  const [editing, setEditing] = useState(false);

  const collected = item.contributions?.reduce(
    (sum, c) => sum + Number(c.amount),
    0
  ) ?? 0;
  const target = item.targetAmount ? Number(item.targetAmount) : 0;
  const progress = target > 0 ? Math.min(100, (collected / target) * 100) : 0;

  const handleUpdate = async (data: Record<string, unknown>) => {
    try {
      const res = await fetch(
        `/api/wishlists/${wishlistId}/items/${item.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );
      if (!res.ok) throw new Error();
      toast.success("Товар обновлён");
      setEditing(false);
      onUpdate();
    } catch {
      toast.error("Ошибка при обновлении");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Удалить товар?")) return;
    try {
      const res = await fetch(
        `/api/wishlists/${wishlistId}/items/${item.id}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error();
      toast.success("Товар удалён");
      onDelete(item.id);
    } catch {
      toast.error("Ошибка при удалении");
    }
  };

  if (editing) {
    return (
      <motion.div
        layout
        className="rounded-2xl border border-border bg-surface p-6"
      >
        <ItemForm
          defaultValues={{
            title: item.title,
            description: item.description ?? "",
            price: item.price ? Number(item.price) : null,
            currency: item.currency,
            imageUrl: item.imageUrl ?? "",
            productUrl: item.productUrl ?? "",
            priority: item.priority,
            isGroupGift: item.isGroupGift,
            targetAmount: item.targetAmount ? Number(item.targetAmount) : null,
          }}
          onSubmit={handleUpdate}
          onCancel={() => setEditing(false)}
        />
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group rounded-2xl border border-border bg-surface overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-0.5"
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
                Собрано {formatCurrency(collected, item.currency)} из {formatCurrency(target, item.currency)}
              </span>
            </div>
            <ProgressBar value={progress} />
          </div>
        )}
        <div className="mt-4 flex gap-2">
          {item.productUrl && (
            <a
              href={item.productUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted hover:text-primary transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
          {isOwner && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditing(true)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="text-danger hover:text-danger"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
