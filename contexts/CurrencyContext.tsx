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
  convertToNGN: (amountInSelected: number) => number;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  // Read localStorage synchronously on mount to avoid flash of wrong currency
  const [selectedCurrencyId, setSelectedCurrencyIdState] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('bpi:selectedCurrency') || '';
    }
    return '';
  });
  const { data: currencies = [] } = api.currency.getAll.useQuery();
  const { data: defaultCurrency } = api.currency.getDefault.useQuery();
  const utils = api.useUtils();

  // Set default currency if no selection exists (no localStorage value)
  useEffect(() => {
    if (defaultCurrency && !selectedCurrencyId) {
      setSelectedCurrencyIdState(defaultCurrency.id);
    }
  }, [defaultCurrency, selectedCurrencyId]);

  // Wrapper to save to localStorage when currency changes
  const setSelectedCurrencyId = (id: string) => {
    setSelectedCurrencyIdState(id);
    if (typeof window !== 'undefined') {
      localStorage.setItem('bpi:selectedCurrency', id);
      // Also save symbol for robust fallback matching
      const currency = currencies.find(c => c.id === id);
      if (currency) {
        localStorage.setItem('bpi:selectedCurrencySymbol', currency.symbol);
      }
    }
    // Invalidate dashboard and wallet queries so components re-render with new currency
    utils.dashboard.getOverview.invalidate();
    utils.wallet.getUsdWithdrawalConfig.invalidate();
  };

  // Resolve selected currency with fallback to symbol-based match
  const savedSymbol = typeof window !== 'undefined' ? localStorage.getItem('bpi:selectedCurrencySymbol') : null;
  const selectedCurrency = currencies.find(c => c.id === selectedCurrencyId)
    || (savedSymbol ? currencies.find(c => c.symbol === savedSymbol) : null)
    || defaultCurrency
    || null;

  // Currency conversion helper — matches server-side: (amount / fromRate) * toRate
  const convertAmount = (amountInNGN: number): number => {
    if (amountInNGN === null || amountInNGN === undefined || isNaN(amountInNGN)) return 0;
    if (!selectedCurrency || selectedCurrency.symbol === 'NGN') return amountInNGN;
    // Use actual NGN rate from DB instead of hardcoded 1.0
    const ngnCurrency = currencies.find(c => c.symbol === 'NGN');
    const ngnRate = ngnCurrency?.rate || 1;
    return (amountInNGN / ngnRate) * (selectedCurrency.rate || 1);
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

  // Reverse conversion: from selected currency back to NGN
  const convertToNGN = (amountInSelected: number): number => {
    if (amountInSelected === null || amountInSelected === undefined || isNaN(amountInSelected)) return 0;
    if (!selectedCurrency || selectedCurrency.symbol === 'NGN') return amountInSelected;
    const ngnCurrency = currencies.find(c => c.symbol === 'NGN');
    const ngnRate = ngnCurrency?.rate || 1;
    const selectedRate = selectedCurrency.rate || 1;
    return selectedRate !== 0 ? (amountInSelected / selectedRate) * ngnRate : amountInSelected;
  };

  return (
    <CurrencyContext.Provider
      value={{
        selectedCurrency: selectedCurrency as Currency | null,
        currencies: currencies as Currency[],
        setSelectedCurrencyId,
        formatAmount,
        convertAmount,
        convertToNGN,
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
