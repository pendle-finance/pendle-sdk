import BigNumberjs from 'bignumber.js';
import { decimalFactor } from '../helpers';

export class Token {
  public readonly address: string;
  public readonly decimals: number;

  public constructor(address: string, decimals: number) {
    this.address = address.toLowerCase();
    this.decimals = decimals;
  }
}

export class TokenAmount {
  public readonly token: Token;
  private rawAmountPrivate: string;

  public constructor(token: Token, amount: string, isRaw: boolean = true) {
    if (isRaw) {
      this.rawAmountPrivate = amount;
    } else {
      this.rawAmountPrivate = new BigNumberjs(amount)
        .times(decimalFactor(token.decimals))
        .toString();
    }
    this.token = token;
  }

  public formattedAmount(): string {
    return new BigNumberjs(this.rawAmountPrivate)
      .div(decimalFactor(this.token.decimals))
      .toString();
  }

  public rawAmount(): string {
    return this.rawAmountPrivate;
  }
}
