"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "default";
  onConfirm: () => void;
  onClose: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
        >
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <Card className="relative z-10 w-full max-w-lg overflow-hidden shadow-2xl dark:bg-bpi-dark-card dark:border-bpi-dark-accent/30">
              <CardHeader className="relative">
                <button
                  onClick={onClose}
                  className="absolute right-4 top-4 rounded-lg p-2 hover:bg-accent dark:hover:bg-bpi-dark-accent/50 transition-colors"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
                <div className="flex items-start gap-3 pr-10">
                  {variant === "danger" && (
                    <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-xl flex-shrink-0">
                      <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                  )}
                  <CardTitle className="text-xl">{title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {description ? (
                  <div className="text-sm text-muted-foreground">{description}</div>
                ) : null}

                <div className="flex items-center justify-end gap-2">
                  <Button variant="outline" onClick={onClose}>
                    {cancelText}
                  </Button>
                  <Button
                    variant={variant === "danger" ? "destructive" : "default"}
                    onClick={() => {
                      onClose();
                      onConfirm();
                    }}
                  >
                    {confirmText}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
