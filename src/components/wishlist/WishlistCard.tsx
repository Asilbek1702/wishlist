"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Calendar, Gift } from "lucide-react";
import { WishlistWithItems } from "@/types";
import { ShareButton } from "./ShareButton";
import { ProgressBar } from "./ProgressBar";

interface WishlistCardProps {
  wishlist: WishlistWithItems;
  index?: number;
}

export function WishlistCard({ wishlist, index = 0 }: WishlistCardProps) {
  const reservedCount = wishlist.items.filter((i) => i.status === "RESERVED" || i.status === "FULFILLED").length;
  const totalItems = wishlist.items.length;
  const progress = totalItems > 0 ? (reservedCount / totalItems) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Link href={`/wishlist/${wishlist.id}`}>
        <div className="group rounded-2xl border border-border bg-surface overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-0.5 cursor-pointer">
          <div
            className="h-32 flex items-center justify-center"
            style={{ backgroundColor: wishlist.coverColor || "#6366f1" }}
          >
            <Gift className="h-16 w-16 text-white/80" />
          </div>
          <div className="p-4">
            <h3 className="font-display font-semibold text-lg truncate">
              {wishlist.title}
            </h3>
            {wishlist.eventDate && (
              <div className="flex items-center gap-2 text-muted text-sm mt-1">
                <Calendar className="h-4 w-4" />
                {new Date(wishlist.eventDate).toLocaleDateString("ru-RU", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </div>
            )}
            <div className="mt-3 flex items-center justify-between">
              <span className="text-sm text-muted">
                {reservedCount} / {totalItems} товаров
              </span>
              <div
                onClick={(e) => e.preventDefault()}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ShareButton wishlist={wishlist} />
              </div>
            </div>
            <ProgressBar value={progress} className="mt-2" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
