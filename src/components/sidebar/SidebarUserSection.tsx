import React, { memo, useMemo } from "react";
import { Link } from "react-router-dom";
import { LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NotificationBadge } from "./NotificationBadge";
import { useProfile } from "@/hooks/useProfile";
import { APP_VERSION_DISPLAY } from "@/lib/version";
import type { User } from "@supabase/supabase-js";

interface SidebarUserSectionProps {
  user: User | null;
  onClose?: () => void;
  onSignOut: () => void;
}

export const SidebarUserSection = memo(function SidebarUserSection({ 
  user, 
  onClose, 
  onSignOut 
}: SidebarUserSectionProps) {
  const { data: profile } = useProfile();

  const userInitials = useMemo(() => {
    const fullName = user?.user_metadata?.full_name || user?.email || "";
    if (fullName.includes("@")) {
      return fullName.substring(0, 2).toUpperCase();
    }
    const names = fullName.split(" ");
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return fullName.substring(0, 2).toUpperCase();
  }, [user?.user_metadata?.full_name, user?.email]);

  const userName = useMemo(() => {
    return user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Usuário";
  }, [user?.user_metadata?.full_name, user?.email]);

  return (
    <div className="py-4 px-3 border-t border-border/50">
      <div className="flex items-center justify-between px-2">
        {/* Avatar + Nome clicável para /profile */}
        <Link
          to="/profile"
          onClick={onClose}
          className="flex items-center gap-2.5 hover:opacity-80 transition-opacity min-w-0"
        >
          <Avatar className="h-9 w-9 rounded-xl shrink-0">
            <AvatarImage src={profile?.avatar_url || undefined} alt={userName} className="rounded-xl" />
            <AvatarFallback className="bg-foreground text-background text-xs font-semibold rounded-xl">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <span className="font-display font-semibold text-sm text-foreground truncate max-w-[110px]">
            {userName}
          </span>
        </Link>

        {/* Ícones de ação */}
        <div className="flex items-center gap-1 shrink-0">
          <NotificationBadge onClick={onClose} />
          <button
            onClick={onSignOut}
            className="p-2 rounded-lg transition-colors text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
      <Link
        to="/changelog"
        onClick={onClose}
        className="block text-center text-[10px] text-muted-foreground/50 hover:text-muted-foreground transition-colors pt-2"
      >
        {APP_VERSION_DISPLAY}
      </Link>
    </div>
  );
});
