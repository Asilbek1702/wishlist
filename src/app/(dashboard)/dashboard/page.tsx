"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Gift, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WishlistGrid } from "@/components/wishlist/WishlistGrid";
import { WishlistWithItems } from "@/types";

export default function DashboardPage() {
  const { data: session } = useSession();
  const [wishlists, setWishlists] = useState<WishlistWithItems[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/wishlists")
      .then((res) => res.json())
      .then((data) => {
        setWishlists(Array.isArray(data) ? data : []);
      })
      .catch(() => setWishlists([]))
      .finally(() => setLoading(false));
  }, []);

  const firstName = session?.user?.name?.split(" ")[0] || "Друг";

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-display font-bold">
          Привет, {firstName}!
        </h1>
        <p className="text-muted mt-1">
          Управляй своими вишлистами и делись с друзьями
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-border bg-surface overflow-hidden animate-pulse"
            >
              <div className="h-32 bg-border" />
              <div className="p-4 space-y-3">
                <div className="h-5 bg-border rounded w-3/4" />
                <div className="h-4 bg-border rounded w-1/2" />
                <div className="h-2 bg-border rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : wishlists.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-16 px-4 text-center"
        >
          <div className="rounded-full bg-primary/10 p-6 mb-6">
            <Gift className="h-16 w-16 text-primary" />
          </div>
          <h2 className="text-xl font-display font-semibold mb-2">
            Создай первый вишлист
          </h2>
          <p className="text-muted max-w-md mb-8">
            Поделись с друзьями — они сами выберут что подарить. Без лишних вопросов и неловкости.
          </p>
          <Link href="/wishlist/new">
            <Button size="lg" className="gap-2">
              <Plus className="h-5 w-5" />
              Создать вишлист
            </Button>
          </Link>
        </motion.div>
      ) : (
        <>
          <div className="mb-6 flex justify-end">
            <Link href="/wishlist/new">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Создать вишлист
              </Button>
            </Link>
          </div>
          <WishlistGrid wishlists={wishlists} />
        </>
      )}
    </div>
  );
}
