"use client";

import { useEffect, useRef } from "react";
import Pusher from "pusher-js";
import { PUSHER_EVENTS } from "@/lib/pusher";

const WISHLIST_CHANNEL = (slug: string) => `wishlist-${slug}`;

export function usePusherWishlist(
  slug: string,
  onEvent: (event: string, data: Record<string, unknown>) => void
) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "eu";
    if (!key) return;

    const pusher = new Pusher(key, {
      cluster,
      authEndpoint: "/api/pusher/auth",
    });

    const channelName = WISHLIST_CHANNEL(slug);
    const channel = pusher.subscribe(channelName);

    const events = [
      PUSHER_EVENTS.ITEM_RESERVED,
      PUSHER_EVENTS.ITEM_UNRESERVED,
      PUSHER_EVENTS.CONTRIBUTION_ADDED,
      PUSHER_EVENTS.ITEM_UPDATED,
      PUSHER_EVENTS.ITEM_DELETED,
      PUSHER_EVENTS.ITEM_STATUS_CHANGED,
    ];

    events.forEach((event) => {
      channel.bind(event, (data: Record<string, unknown>) => {
        onEventRef.current(event, data);
      });
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(channelName);
    };
  }, [slug]);
}
