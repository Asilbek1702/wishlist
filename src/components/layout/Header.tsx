"use client";

import { useSession, signOut } from "next-auth/react";
import { Gift, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileNav } from "./MobileNav";

export function Header() {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/60">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
          <MobileNav />
          <div className="md:hidden">
            <Gift className="h-6 w-6 text-primary" />
          </div>
        </div>

        <div className="flex items-center gap-4">
          {session?.user && (
            <>
              <div className="hidden sm:flex items-center gap-2">
                {session.user.image ? (
                  <img
                    src={session.user.image}
                    alt=""
                    className="h-8 w-8 rounded-full"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-medium">
                    {session.user.name?.[0] || session.user.email?.[0] || "?"}
                  </div>
                )}
                <span className="text-sm font-medium text-foreground">
                  {session.user.name || session.user.email}
                </span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => signOut()}>
                <LogOut className="h-5 w-5" />
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
