"use client";

export interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  icon: string;
  enabled: boolean;
}

interface PaymentMethodSelectorProps {
  methods: PaymentMethod[];
  selectedMethod?: string;
  onSelect: (methodId: string) => void;
}

export function PaymentMethodSelector({
  methods,
  selectedMethod,
  onSelect,
}: PaymentMethodSelectorProps) {
  return (
    <div className="space-y-3">
      {methods.map((method) => (
        <button
          key={method.id}
          onClick={() => onSelect(method.id)}
          disabled={!method.enabled}
          className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
            selectedMethod === method.id
              ? "border-green-600 bg-green-50"
              : "border-gray-200 hover:border-green-300"
          } ${!method.enabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">{method.icon}</span>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">{method.name}</h4>
              <p className="text-sm text-gray-600">{method.description}</p>
            </div>
            {selectedMethod === method.id && (
              <span className="text-green-600">✓</span>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
