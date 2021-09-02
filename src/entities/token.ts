import BigNumberjs from 'bignumber.js';
import { decimalFactor } from '../helpers';
import { providers, Contract } from 'ethers';
import { mainnetContracts } from '../deployedContracts/mainnet';
import { contracts } from '../contracts';
import { decimalsRecords } from '../constants'

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
    provider: providers.JsonRpcSigner,
    chainId?: number
  ): Record<string, any> {
    let YTs: any[], redeemProxy: string, decimalsRecord: Record<string, number>;
    if (chainId === undefined || chainId == 1) { // Default to mainnet
      YTs = mainnetContracts.YTs;
      redeemProxy = mainnetContracts.PendleRedeemProxy;
      decimalsRecord = decimalsRecords.mainnet;
    } else {
      throw Error("Unsupported Network");
    }
    const redeemProxyContract = new Contract(
      redeemProxy,
      contracts.PendleRedeemProxy.abi,
      provider.provider
    );

    const fetchInterests = async (
      userAddress: string,
    ): Promise<YtOrMarketInterest[]> => {

      const formattedResult: YtOrMarketInterest[] = [];

      const userInterests = await redeemProxyContract.callStatic.redeemXyts(
        YTs.map((YTInfo: any) => YTInfo.address),
        { from: userAddress }
      );
      for (let i = 0; i < YTs.length; i++) {
        const YTInfo = YTs[i];
        formattedResult.push({
          address: YTInfo.address,
          interest: new TokenAmount(
            new Token(YTInfo.rewardTokenAddresses[0], decimalsRecord[YTInfo.rewardTokenAddresses[0]]),
            userInterests[i].toString()
          ),
        });
      }
      return formattedResult;
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
