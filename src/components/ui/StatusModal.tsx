"use client";

import { CheckCircle2, XCircle, Loader2, AlertCircle } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type StatusType = "loading" | "success" | "error" | "confirm" | null;

interface StatusModalProps {
  type: StatusType;
  title?: string;
  message?: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
}

export function StatusModal({
  type,
  title,
  message,
  isOpen,
  onClose,
  onConfirm,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
}: StatusModalProps) {
  if (!type) return null;

  const config = {
    loading: {
      icon: <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />,
      color: "text-blue-600",
      defaultTitle: "Processing...",
    },
    success: {
      icon: <CheckCircle2 className="w-12 h-12 text-emerald-500" />,
      color: "text-emerald-700",
      defaultTitle: "Success!",
    },
    error: {
      icon: <XCircle className="w-12 h-12 text-rose-500" />,
      color: "text-rose-700",
      defaultTitle: "Something went wrong",
    },
    confirm: {
      icon: <AlertCircle className="w-12 h-12 text-amber-500" />,
      color: "text-slate-900",
      defaultTitle: "Are you sure?",
    },
  }[type];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && type !== "loading" && onClose()}>
      <DialogContent showCloseButton={type !== "loading"} className="sm:max-w-[400px] border-none shadow-2xl overflow-hidden p-0">
         <div className="p-8 flex flex-col items-center text-center">
            <div className={cn("mb-6 p-4 rounded-full bg-slate-50 dark:bg-slate-900/50", type === "loading" && "animate-pulse")}>
                {config.icon}
            </div>
            
            <DialogHeader className="flex flex-col items-center text-center">
                <DialogTitle className={cn("text-2xl font-bold mb-2", config.color)}>
                    {title || config.defaultTitle}
                </DialogTitle>
                <DialogDescription className="text-slate-500 dark:text-slate-400 text-md">
                    {message}
                </DialogDescription>
            </DialogHeader>

            {type !== "loading" && (
                <DialogFooter className="w-full mt-8 flex flex-col gap-2 sm:flex-col items-center">
                    {type === "confirm" ? (
                        <div className="flex w-full gap-3">
                            <Button variant="outline" className="flex-1 rounded-xl py-6" onClick={onClose}>
                                {cancelLabel}
                            </Button>
                            <Button className="flex-1 rounded-xl py-6 bg-slate-900 text-white" onClick={() => {
                                onConfirm?.();
                                onClose();
                            }}>
                                {confirmLabel}
                            </Button>
                        </div>
                    ) : (
                        <Button className="w-full rounded-xl py-6 bg-slate-900 text-white" onClick={onClose}>
                            Close
                        </Button>
                    )}
                </DialogFooter>
            )}
         </div>
         {type === "loading" && (
            <div className="h-1.5 w-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-blue-600 animate-progress" style={{ width: '40%' }}></div>
            </div>
         )}
      </DialogContent>
    </Dialog>
  );
}
