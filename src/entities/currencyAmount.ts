export type CurrencyAmount = {
    currency: string,
    amount: number
};
export const dummyCurrencyAmount: CurrencyAmount = {
    currency: "USD",
    amount: 10000
};

export const ZeroCurrencyAmount: CurrencyAmount = {
    currency: "USD",
    amount: 0
};