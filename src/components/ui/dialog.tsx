import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

// ─── Overlay ────────────────────────────────────────────────
const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50",
      "bg-black/85 backdrop-blur-sm",
      "data-[state=open]:animate-in data-[state=closed]:animate-out",
      "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className,
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

// ─── Content ─────────────────────────────────────────────────
const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    noPadding?: boolean;
  }
>(({ className, children, noPadding, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        // posicionamento
        "fixed left-[50%] top-[50%] z-50",
        "w-[calc(100%-1rem)] sm:w-[calc(100%-2rem)] max-w-[440px]",
        "translate-x-[-50%] translate-y-[-50%]",
        // layout
        "flex flex-col",
        "max-h-[90dvh] overflow-hidden",
        // visual dark
        "bg-[#13131a]",
        "border border-white/[0.06]",
        "rounded-[20px]",
        // animações
        "duration-200",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]",
        "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
        className,
      )}
      style={{
        boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 0.5px rgba(255,255,255,0.04)",
      }}
      {...props}
    >
      {/* scroll interno */}
      <div className={cn("overflow-y-auto overflow-x-hidden flex flex-col", noPadding ? "p-0 gap-0" : "gap-0")}>
        {children}
      </div>

      {/* botão fechar */}
      <DialogPrimitive.Close
        className={cn(
          "absolute right-4 top-4 z-10",
          "w-7 h-7 flex items-center justify-center",
          "rounded-lg",
          "bg-white/[0.04] border border-white/[0.06]",
          "text-white/30 hover:text-white/60",
          "hover:bg-white/[0.08]",
          "transition-all duration-150",
          "focus:outline-none",
          "disabled:pointer-events-none",
        )}
      >
        <X className="w-[11px] h-[11px]" />
        <span className="sr-only">Fechar</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

// ─── Header ──────────────────────────────────────────────────
// Uso: seção superior com borda inferior
const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col gap-4", "px-5 pt-5 pb-4", "border-b border-white/[0.06]", className)} {...props} />
);
DialogHeader.displayName = "DialogHeader";

// ─── Body ─────────────────────────────────────────────────────
// Uso: área de conteúdo principal
const DialogBody = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("px-5 py-5 flex flex-col gap-5", className)} {...props} />
);
DialogBody.displayName = "DialogBody";

// ─── Section ─────────────────────────────────────────────────
// Uso: sub-seção com label uppercase
const DialogSection = ({
  label,
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { label?: string }) => (
  <div className={cn("flex flex-col gap-2.5", className)} {...props}>
    {label && <span className="text-[10px] font-medium tracking-[0.1em] uppercase text-white/20">{label}</span>}
    {children}
  </div>
);
DialogSection.displayName = "DialogSection";

// ─── Footer ───────────────────────────────────────────────────
// Uso: rodapé com border-top para ações secundárias/destrutivas
const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex items-center justify-between", "px-5 py-3", "border-t border-white/[0.05]", className)}
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";

// ─── Title ────────────────────────────────────────────────────
const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-[15px] font-medium leading-none tracking-[-0.01em]", "text-white/90", className)}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

// ─── Description ─────────────────────────────────────────────
const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description ref={ref} className={cn("text-[11px] text-white/30", className)} {...props} />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogSection,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
