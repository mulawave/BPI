"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onClose: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <Card className="relative z-10 w-full max-w-lg overflow-hidden">
        <CardHeader className="relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-lg p-2 hover:bg-accent"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          <CardTitle className="pr-10 text-xl">{title}</CardTitle>
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
    </div>,
    document.body
  );
}
