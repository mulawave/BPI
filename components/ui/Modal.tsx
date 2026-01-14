"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full';
}

export function Modal({ isOpen, title, children, onClose, maxWidth = 'md' }: ModalProps) {
  if (!isOpen) {
    return null;
  }

  const widthClasses = {
    'sm': 'max-w-sm',
    'md': 'max-w-md',
    'lg': 'max-w-lg',
    'xl': 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
    'full': 'max-w-[80vw]',
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <Card className={`w-full ${widthClasses[maxWidth]} relative my-8`}>
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors z-10"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        {title && (
          <CardHeader>
            <CardTitle className="text-center text-2xl pr-8">{title}</CardTitle>
          </CardHeader>
        )}
        <CardContent className={title ? "" : "pt-6"}>
          {children}
        </CardContent>
      </Card>
    </div>
  );
}
