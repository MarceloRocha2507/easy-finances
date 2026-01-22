import { Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingScreenProps {
  message?: string;
  fullScreen?: boolean;
  className?: string;
}

export function LoadingScreen({ 
  message = "Carregando...", 
  fullScreen = true,
  className 
}: LoadingScreenProps) {
  return (
    <div 
      className={cn(
        "flex items-center justify-center bg-background",
        fullScreen && "min-h-screen",
        className
      )}
    >
      <div className="flex flex-col items-center gap-6 animate-fade-in">
        {/* Logo */}
        <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center">
          <Wallet className="h-8 w-8 text-primary" />
        </div>
        
        {/* Spinner */}
        <div className="relative h-10 w-10">
          <div className="absolute inset-0 rounded-full border-4 border-muted" />
          <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>
        
        {/* Texto */}
        <p className="text-muted-foreground text-sm font-medium animate-pulse">
          {message}
        </p>
      </div>
    </div>
  );
}
