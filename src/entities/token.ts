import BigNumberjs from 'bignumber.js';
import { decimalFactor, indexRange } from '../helpers';
import { providers, Contract } from 'ethers';
import { contractAddresses } from '../constants';
import { contracts } from '../contracts';

const dummyAddress = '0x6b3595068778dd592e39a122f4f5a5cf09c90fe2'; // SUSHI
const dummyDecimal = 18;

export type YtOrMarketInterest = {
  address: string;
  interest: TokenAmount;
};

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

export class Yt extends Token {
  public static methods(
    provider: providers.JsonRpcSigner
  ): Record<string, any> {
    const fetchInterests = async (
      yts: string[],
      userAddress: string
    ): Promise<YtOrMarketInterest[]> => {
      const redeemProxyContract = new Contract(
        contractAddresses.PendleRedeemProxy,
        contracts.PendleRedeemProxy.abi,
        provider.provider
      );
      const userInterests = await redeemProxyContract.callStatic.redeemXyts(
        yts,
        { from: userAddress }
      );
      return await Promise.all(
        indexRange(0, yts.length).map(async i => {
          return {
            address: yts[i],
            interest: new TokenAmount(
              new Token(dummyAddress, dummyDecimal),
              userInterests[i].toString()
            ),
          };
        })
      );
    };
    return {
      fetchInterests,
    };
  }
}

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
