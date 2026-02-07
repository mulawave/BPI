// Payment Gateway Factory
// Creates appropriate gateway instance based on gateway type

import {
  IPaymentGateway,
  GatewayConfig,
  PaymentGateway,
} from "./types";
import { MockDevGateway } from "./MockDevGateway";
import { WalletGateway } from "./WalletGateway";
import { FlutterwaveGateway } from "./FlutterwaveGateway";
import { PaystackGateway } from "./PaystackGateway";
// Future imports:
// import { PaystackGateway } from "./PaystackGateway";
// import { BankTransferGateway } from "./BankTransferGateway";
// import { CryptoGateway } from "./CryptoGateway";
// import { UtilityTokenGateway } from "./UtilityTokenGateway";

export class PaymentGatewayFactory {
  private static instances: Map<PaymentGateway, IPaymentGateway> = new Map();

  /**
   * Get or create a payment gateway instance
   */
  static async getGateway(
    gatewayType: PaymentGateway,
    config: GatewayConfig
  ): Promise<IPaymentGateway> {
    // Check if gateway is enabled
    if (!config.enabled) {
      throw new Error(`${gatewayType} gateway is currently disabled`);
    }

    // Return existing instance if available
    if (this.instances.has(gatewayType)) {
      const instance = this.instances.get(gatewayType)!;
      return instance;
    }

    // Create new instance based on type
    let gateway: IPaymentGateway;

    switch (gatewayType) {
      case PaymentGateway.MOCK_DEV:
        gateway = new MockDevGateway();
        break;

      case PaymentGateway.WALLET:
        gateway = new WalletGateway();
        break;

      case PaymentGateway.FLUTTERWAVE:
        gateway = new FlutterwaveGateway();
        break;

      case PaymentGateway.PAYSTACK:
        gateway = new PaystackGateway();
        break;

      // TODO: Implement these gateways

      // case PaymentGateway.BANK_TRANSFER:
      //   gateway = new BankTransferGateway();
      //   break;

      // case PaymentGateway.CRYPTO:
      //   gateway = new CryptoGateway();
      //   break;

      // case PaymentGateway.UTILITY_TOKEN:
      //   gateway = new UtilityTokenGateway();
      //   break;

      default:
        throw new Error(`Payment gateway ${gatewayType} is not yet implemented`);
    }

    // Initialize the gateway (gateways have initialize method, not required by interface)
    if ('initialize' in gateway && typeof gateway.initialize === 'function') {
      await gateway.initialize(config);
    }

    // Cache the instance
    this.instances.set(gatewayType, gateway);

    return gateway;
  }

  /**
   * Clear cached gateway instances
   */
  static clearCache() {
    this.instances.clear();
  }

  /**
   * Remove specific gateway from cache
   */
  static clearGateway(gatewayType: PaymentGateway) {
    this.instances.delete(gatewayType);
  }
}
