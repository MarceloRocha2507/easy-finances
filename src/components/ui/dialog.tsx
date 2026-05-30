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
      "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
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
          "0 1px 0 0 rgba(0,0,0,0.04), 0 4px 6px rgba(0,0,0,0.03), 0 24px 56px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,0,0,0.04)",
        padding: 0,
      }}
      {...props}
    >
      <div
        className={cn(
          "overflow-y-auto overflow-x-hidden flex flex-col",
          noPadding ? "p-0 gap-0" : "gap-3 p-4 sm:p-6",
        )}
      >
        {children}
      </div>

      <DialogPrimitive.Close
        className="absolute right-4 top-4 flex items-center justify-center rounded-lg transition-colors focus:outline-none disabled:pointer-events-none"
        style={{
          width: 28,
          height: 28,
          color: "#9590aa",
          background: "rgba(0,0,0,0.05)",
          border: "none",
          zIndex: 10,
        }}
        onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = "rgba(0,0,0,0.09)")}
        onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = "rgba(0,0,0,0.05)")}
      >
        <X style={{ width: 15, height: 15 }} />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col gap-1 text-left -mt-4 -mx-4 sm:-mt-6 sm:-mx-6 px-4 sm:px-6 pt-5 sm:pt-6 pb-4 border-b border-black/[0.06]",
      className,
    )}
    style={{ background: "linear-gradient(160deg, #fafafe 0%, #f3f0ff 100%)" }}
    {...props}
  />
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex justify-end gap-2 mt-2", className)} {...props} />
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
      color: "#1a1625",
      fontSize: 17,
      fontWeight: 700,
      letterSpacing: "-0.025em",
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
    style={{ color: "#9590aa", fontSize: 12, lineHeight: 1.5 }}
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
