import{ Address, TokenAmount } from '../'

export type CurrencyAmount = {
    currency: 'USD',
    amount: string
}

export type TRANSACTION = {
    action: 'Mint' | 'Redeem' | 'Swap',
	hash: Address,
	user: Address,
    amount: CurrencyAmount,
    paid: [TokenAmount, TokenAmount],
    received: [TokenAmount, TokenAmount],
	network: 'mainnet' //TBD,
    timestamp?: number
}