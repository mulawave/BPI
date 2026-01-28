"use client";

import { Wallet, Gift, DollarSign, Coins, Heart, Home, BookOpen, Utensils, Shield, Users } from "lucide-react";
import { Card } from "./ui/card";
import { useCurrency } from "@/contexts/CurrencyContext";

interface WalletData {
  // Main wallets
  wallet: number;
  palliative: number;
  cashback: number;
  bpiTokenWallet: number;
  
  // Welfare wallets
  shelter: number;
  health: number;
  meal: number;
  security: number;
  education: number;
  
  // Community & Special
  community: number;
  spendable: number;
}

interface MultiWalletDisplayProps {
  wallets: WalletData;
  showAll?: boolean;
}

export default function MultiWalletDisplay({ wallets, showAll = false }: MultiWalletDisplayProps) {
  const { formatAmount } = useCurrency();
  
  const mainWallets = [
    {
      name: "Main Wallet",
      balance: wallets.wallet,
      icon: Wallet,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-900/20",
      description: "Available for withdrawal",
      displayValue: undefined,
    },
    {
      name: "BPI Token (BPT)",
      balance: wallets.bpiTokenWallet,
      icon: Coins,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
      description: "50% of BPT rewards (5 per BPT value)",
      displayValue: `${wallets.bpiTokenWallet.toFixed(2)} BPT (${formatAmount(wallets.bpiTokenWallet * 5)})`,
    },
    {
      name: "Palliative Wallet",
      balance: wallets.palliative,
      icon: Heart,
      color: "text-pink-600",
      bgColor: "bg-pink-50 dark:bg-pink-900/20",
      description: "Welfare support funds",
      displayValue: undefined,
    },
    {
      name: "Cashback Wallet",
      balance: wallets.cashback,
      icon: Gift,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
      description: "Referral cashback rewards",
      displayValue: undefined,
    },
  ];

  const welfareWallets = [
    {
      name: "Shelter Wallet",
      balance: wallets.shelter,
      icon: Home,
      color: "text-gray-600",
      bgColor: "bg-gray-50 dark:bg-green-900/20",
      description: "Housing support (Gold/Platinum L1-L10)",
      displayValue: undefined,
    },
    {
      name: "Health Wallet",
      balance: wallets.health,
      icon: Heart,
      color: "text-red-600",
      bgColor: "bg-red-50 dark:bg-red-900/20",
      description: "Healthcare benefits (renewal)",
      displayValue: undefined,
    },
    {
      name: "Meal Wallet",
      balance: wallets.meal,
      icon: Utensils,
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-900/20",
      description: "Meal support (renewal)",
      displayValue: undefined,
    },
    {
      name: "Security Wallet",
      balance: wallets.security,
      icon: Shield,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50 dark:bg-indigo-900/20",
      description: "Security benefits (renewal)",
      displayValue: undefined,
    },
    {
      name: "Education Wallet",
      balance: wallets.education,
      icon: BookOpen,
      color: "text-teal-600",
      bgColor: "bg-teal-50 dark:bg-teal-900/20",
      description: "Education/skill funds (empowerment)",
      displayValue: undefined,
    },
  ];

  const specialWallets = [
    {
      name: "Community Wallet",
      balance: wallets.community,
      icon: Users,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
      description: "Community support (restricted)",
      displayValue: undefined,
    },
    {
      name: "Spendable",
      balance: wallets.spendable,
      icon: DollarSign,
      color: "text-gray-600",
      bgColor: "bg-gray-50 dark:bg-green-900/10",
      description: "Available for spending",
      displayValue: undefined,
    },
  ];

  const walletsToShow = showAll 
    ? [...mainWallets, ...welfareWallets, ...specialWallets]
    : mainWallets;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {walletsToShow.map((wallet) => {
          const Icon = wallet.icon;
          return (
            <Card key={wallet.name} className="p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`p-2 rounded-lg ${wallet.bgColor}`}>
                      <Icon className={`w-5 h-5 ${wallet.color}`} />
                    </div>
                  </div>
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    {wallet.name}
                  </h3>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {wallet.displayValue || formatAmount(wallet.balance)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {wallet.description}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {!showAll && (
        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing main wallets only. Welfare and special wallets have zero balance or are hidden.
          </p>
        </div>
      )}

      {showAll && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
          <h4 className="font-semibold text-emerald-900 dark:text-emerald-100 mb-2">💡 Wallet Information</h4>
          <ul className="text-sm text-emerald-800 dark:text-emerald-200 space-y-1">
            <li><strong>Main Wallet:</strong> Fully withdrawable cash balance</li>
            <li><strong>BPI Token (BPT):</strong> 50% of your token rewards (5 per BPT value). Other 50% goes to buy-back wallet</li>
            <li><strong>Palliative:</strong> Welfare support from referral activations</li>
            <li><strong>Cashback:</strong> Available for Gold Plus, Platinum Plus, and Travel packages</li>
            <li><strong>Shelter:</strong> Housing support for Gold/Platinum packages (10 referral levels)</li>
            <li><strong>Health/Meal/Security:</strong> Renewal benefits only (not available on initial activation)</li>
            <li><strong>Education:</strong> Empowerment package funds (restricted to education/skills)</li>
            <li><strong>Community:</strong> Funds restricted to community support activities</li>
          </ul>
        </div>
      )}
    </div>
  );
}
