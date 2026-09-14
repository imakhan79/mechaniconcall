export function formatAED(amount: number | null | undefined) {
  const value = amount ?? 0;
  return `AED ${value.toLocaleString("en-AE", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}
