import BigNumberjs from 'bignumber.js';
import { decimalFactor } from '../helpers';
// import { providers } from 'ethers'
// import { contractAddresses } from '../constants';

export class Token {
  public readonly address: string;
  public readonly decimals: number;
  public readonly expiry?: number;

  public constructor(address: string, decimals: number, expiry?: number) {
    this.address = address.toLowerCase();
    this.decimals = decimals;
    this.expiry = expiry;
  }
}

// export class YT extends Token { // TODO
//   // public readonly forgeId: string
//   public contract = (provider: any) => {

//   }
// }

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
