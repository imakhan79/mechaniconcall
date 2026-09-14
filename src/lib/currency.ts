export function formatAED(amount: number | null | undefined) {
  const value = amount ?? 0;
  return `AED ${value.toLocaleString("en-AE", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  apple_pay: "Apple Pay",
  payit: "PayIt by FAB",
  careem_pay: "Careem Pay",
  e_and_money: "e& money",
  cash: "Cash",
  card: "Card",
  bank: "Bank Transfer",
  online: "Online",
  jazzcash: "JazzCash",
  easypaisa: "Easypaisa",
};

export function formatPaymentMethod(method: string) {
  return PAYMENT_METHOD_LABELS[method] ?? method;
}
