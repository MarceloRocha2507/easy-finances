import React, { memo, useMemo } from "react";
import { Link } from "react-router-dom";
import { LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NotificationBadge } from "./NotificationBadge";
import { useProfile } from "@/hooks/useProfile";
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
    <div className="p-3 border-t border-border/50">
      <div className="flex items-center justify-between px-2">
        {/* Avatar + Nome clicável para /profile */}
        <Link 
          to="/profile" 
          onClick={onClose}
          className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
        >
          <Avatar className="h-8 w-8 ring-2 ring-primary/20">
            <AvatarImage src={profile?.avatar_url || undefined} alt={userName} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium text-foreground truncate max-w-[90px]">
            {userName}
          </span>
        </Link>
        
        {/* Ícones de ação */}
        <div className="flex items-center gap-1">
          {/* Notificações - isolado para evitar re-renders */}
          <NotificationBadge onClick={onClose} />
          
          {/* Sair */}
          <button 
            onClick={onSignOut}
            className="p-2 rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
});
