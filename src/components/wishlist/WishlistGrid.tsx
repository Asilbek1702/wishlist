"use client";

import { WishlistWithItems } from "@/types";
import { WishlistCard } from "./WishlistCard";

interface WishlistGridProps {
  wishlists: WishlistWithItems[];
}

export function WishlistGrid({ wishlists }: WishlistGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {wishlists.map((wishlist, index) => (
        <WishlistCard key={wishlist.id} wishlist={wishlist} index={index} />
      ))}
    </div>
  );
}
