import BigNumberjs from 'bignumber.js';
import { decimalFactor } from '../helpers';
import { Token, dummyToken } from './token';

export class TokenAmount {
    public readonly token: Token;
    private rawAmnt: string;

    public constructor(token: Token, amount: string, isRaw: boolean = true) {
        if (isRaw) {
            this.rawAmnt = amount;
        } else {
            this.rawAmnt = new BigNumberjs(amount)
                .times(decimalFactor(token.decimals))
                .toString();
        }
        this.token = token;
    }

    public formattedAmount(): string {
        return new BigNumberjs(this.rawAmnt)
            .div(decimalFactor(this.token.decimals))
            .toString();
    }

    public rawAmount(): string {
        return this.rawAmnt;
    }
}

export const dummyTokenAmount: TokenAmount = new TokenAmount(
    dummyToken,
    "1000000000000000"
)
