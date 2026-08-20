export type PaymentRequest = {
  amount: number;
  currency: "TZS";
  reference: string;
  description: string;
};

export type PaymentResult =
  | { status: "PENDING"; provider: string; checkoutUrl?: string }
  | { status: "SUCCEEDED"; provider: string; transactionId: string }
  | { status: "FAILED"; provider: string; message: string };

export interface PaymentService {
  createCheckout(request: PaymentRequest): Promise<PaymentResult>;
}

export class UnconfiguredPaymentService implements PaymentService {
  async createCheckout(): Promise<PaymentResult> {
    return {
      status: "FAILED",
      provider: "UNCONFIGURED",
      message: "No payment provider is configured yet.",
    };
  }
}

export const paymentService = new UnconfiguredPaymentService();
