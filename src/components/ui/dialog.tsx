import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/45 backdrop-blur-[8px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className,
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { noPadding?: boolean }
>(({ className, children, noPadding, style: styleProp, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 flex flex-col w-[calc(100%-1rem)] sm:w-[calc(100%-2rem)] max-w-lg translate-x-[-50%] translate-y-[-50%] bg-white border-0 duration-200 max-h-[90dvh] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
        className,
      )}
      style={{
        ...styleProp,
        borderRadius: 24,
        boxShadow:
          "0 0 0 1px rgba(0,0,0,0.04), 0 2px 4px rgba(0,0,0,0.04), 0 12px 32px rgba(0,0,0,0.10), 0 32px 64px rgba(26,22,37,0.08)",
        padding: 0,
        overflow: "hidden",
      }}
      {...props}
    >
      {/* Faixa de acento gradiente no topo */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: "linear-gradient(90deg, #111827 0%, #a855f7 45%, #111827 100%)",
          borderRadius: "24px 24px 0 0",
          zIndex: 20,
          pointerEvents: "none",
        }}
      />

      <div
        className={cn(
          "overflow-y-auto overflow-x-hidden flex flex-col",
          noPadding ? "p-0 gap-0" : "gap-3 p-4 sm:p-6",
        )}
      >
        {children}
      </div>

      <DialogPrimitive.Close
        className="absolute right-4 top-4 flex items-center justify-center rounded-full transition-all duration-200 hover:scale-110 active:scale-95 focus:outline-none disabled:pointer-events-none bg-black/[0.05] hover:bg-black/[0.09] text-[#6B7280] hover:text-[#6B7280]"
        style={{
          width: 30,
          height: 30,
          border: "none",
          zIndex: 30,
        }}
      >
        <X style={{ width: 14, height: 14 }} />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col gap-1.5 text-left -mt-4 -mx-4 sm:-mt-6 sm:-mx-6 px-5 sm:px-6 pt-6 sm:pt-7 pb-4 sm:pb-5",
      className,
    )}
    style={{
      background: "linear-gradient(155deg, #f7f5ff 0%, #ede8ff 55%, #e8e0ff 100%)",
      borderBottom: "1px solid rgba(124, 58, 237, 0.1)",
    }}
    {...props}
  />
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex justify-end gap-2 mt-1 pt-3", className)}
    style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("leading-none", className)}
    style={{
      color: "#111827",
      fontSize: 18,
      fontWeight: 700,
      letterSpacing: "-0.03em",
      fontFamily: "var(--font-display)",
    }}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("", className)}
    style={{ color: "#7c778e", fontSize: 12.5, lineHeight: 1.55 }}
    {...props}
  />
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
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
