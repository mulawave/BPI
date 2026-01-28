"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full' | 'screen';
}

export function Modal({ isOpen, title, children, onClose, maxWidth = 'md' }: ModalProps) {
  if (!isOpen) {
    return null;
  }

  const widthClasses = {
    'sm': 'sm:max-w-sm',
    'md': 'sm:max-w-md',
    'lg': 'sm:max-w-lg',
    'xl': 'sm:max-w-xl',
    '2xl': 'sm:max-w-2xl',
    '3xl': 'sm:max-w-3xl',
    '4xl': 'sm:max-w-4xl',
    '5xl': 'sm:max-w-5xl',
    '6xl': 'sm:max-w-6xl',
    '7xl': 'sm:max-w-7xl',
    'full': 'sm:max-w-[80vw]',
    'screen': 'sm:max-w-[98vw]',
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto">
      <Card className={`w-full max-w-md sm:max-w-lg md:max-w-xl ${widthClasses[maxWidth]} relative my-8`}>
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
