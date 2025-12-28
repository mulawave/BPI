"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './card';

interface ModalProps {
  isOpen: boolean;
  title: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, title, children }: ModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">{title}</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          {children}
        </CardContent>
      </Card>
    </div>
  );
}
