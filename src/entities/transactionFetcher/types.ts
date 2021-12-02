import { TokenAmount } from '../tokenAmount'
import { Address } from '../types'
import { CurrencyAmount } from '../currencyAmount'

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