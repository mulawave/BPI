"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '@/client/trpc';

interface Currency {
  id: string;
  name: string;
  symbol: string;
  sign: string | null;
  rate: number;
  default: number | null;
  country?: string | null;
}

interface CurrencyContextType {
  selectedCurrency: Currency | null;
  currencies: Currency[];
  setSelectedCurrencyId: (id: string) => void;
  formatAmount: (amount: number, decimals?: number) => string;
  convertAmount: (amount: number) => number;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [selectedCurrencyId, setSelectedCurrencyIdState] = useState("");
  const { data: currencies = [] } = api.currency.getAll.useQuery();
  const { data: defaultCurrency } = api.currency.getDefault.useQuery();

  // Load saved currency from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCurrencyId = localStorage.getItem('bpi:selectedCurrency');
      if (savedCurrencyId) {
        setSelectedCurrencyIdState(savedCurrencyId);
      }
    }
  }, []);

  // Set default currency if no selection exists
  useEffect(() => {
    if (defaultCurrency && !selectedCurrencyId) {
      const savedCurrencyId = typeof window !== 'undefined' 
        ? localStorage.getItem('bpi:selectedCurrency') 
        : null;
      
      if (!savedCurrencyId) {
        setSelectedCurrencyIdState(defaultCurrency.id);
      }
    }
  }, [defaultCurrency, selectedCurrencyId]);

  // Wrapper to save to localStorage when currency changes
  const setSelectedCurrencyId = (id: string) => {
    setSelectedCurrencyIdState(id);
    if (typeof window !== 'undefined') {
      localStorage.setItem('bpi:selectedCurrency', id);
    }
  };

  const selectedCurrency = currencies.find(c => c.id === selectedCurrencyId) || defaultCurrency || null;

  // Currency conversion helper
  const convertAmount = (amountInNGN: number): number => {
    if (amountInNGN === null || amountInNGN === undefined || isNaN(amountInNGN)) return 0;
    if (!selectedCurrency || selectedCurrency.symbol === 'NGN') return amountInNGN;
    return (amountInNGN / 1.0) * (selectedCurrency.rate || 1);
  };

  const formatAmount = (amountInNGN: number, decimals?: number): string => {
    if (amountInNGN === null || amountInNGN === undefined || isNaN(amountInNGN)) {
      return `${selectedCurrency?.sign || '₦'}0.00`;
    }
    const converted = convertAmount(amountInNGN);
    const decimalPlaces = decimals ?? 2;
    const formatted = converted.toLocaleString('en-US', {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    });
    return `${selectedCurrency?.sign || '₦'}${formatted}`;
  };

  return (
    <CurrencyContext.Provider
      value={{
        selectedCurrency: selectedCurrency as Currency | null,
        currencies: currencies as Currency[],
        setSelectedCurrencyId,
        formatAmount,
        convertAmount,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
