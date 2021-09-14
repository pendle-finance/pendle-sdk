import BigNumberjs from 'bignumber.js';
import { decimalFactor, distributeConstantsByNetwork, getDecimal, isSameAddress } from '../helpers';
import { providers, Contract } from 'ethers';
import { NetworkInfo, YTINFO } from '../networks';
import { contracts } from '../contracts';
import { dummyAddress } from "../constants";

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

const YT_NOT_EXIST = new Error("No YT is found at the given address");

export class Yt extends Token {
  public static find(address: string, chainId?: number):Yt {
    const networkInfo: NetworkInfo = distributeConstantsByNetwork(chainId);
    const ytInfo: YTINFO | undefined = networkInfo.contractAddresses.YTs.find((y: YTINFO) => {
      return isSameAddress(address, y.address);
    })
    if (ytInfo === undefined) {
      throw YT_NOT_EXIST;
    }
    return new Yt(
      address.toLowerCase(),
      networkInfo.decimalsRecord[address.toLowerCase()],
      ytInfo.expiry.toNumber()
    )
  }

  public static methods(
    signer: providers.JsonRpcSigner,
    chainId?: number
  ): Record<string, any> {

    const networkInfo: NetworkInfo = distributeConstantsByNetwork(chainId);
    const redeemProxyContract = new Contract(
      networkInfo.contractAddresses.misc.PendleRedeemProxy,
      contracts.PendleRedeemProxy.abi,
      signer.provider
    );

    const YTs: YTINFO[] = networkInfo.contractAddresses.YTs;
    const decimalsRecord: Record<string, number> = networkInfo.decimalsRecord;

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
            new Token(YTInfo.rewardTokenAddresses[0], await getDecimal(decimalsRecord, YTInfo.rewardTokenAddresses[0], signer.provider)),
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

export const dummyToken: Token = new Token(
  dummyAddress,
  18
);

export const dummyTokenAmount: TokenAmount = new TokenAmount(
  dummyToken,
  "1000000000000000"
)
