import { TokenAmount, Token } from './token';
import { ethers, providers } from 'ethers';
import { mainnetContracts } from '../deployedContracts/mainnet';
import { contracts } from '../contracts';
import { YtOrMarketInterest } from './token';
import { decimalsRecords } from '../constants'


export class Market {
  public readonly address: string;
  public readonly tokens: Token[];

  public constructor(marketAddress: string, tokens: Token[]) {
    this.address = marketAddress;
    this.tokens = tokens;
  }

  public getToken0PriceInToken1(): string {
    // TODO
    return '1';
  }

  //TODO
  public static methods(
    provider: providers.JsonRpcSigner,
    chainId?: number
  ): Record<string, any> {
    
    let markets: any[], redeemProxy: string, decimalsRecord: Record<string, number>;
    if (chainId === undefined || chainId == 1) {
      markets = mainnetContracts.markets;
      redeemProxy = mainnetContracts.PendleRedeemProxy;
      decimalsRecord = decimalsRecords.mainnet;
    } else {
      throw Error("Unsupported Network");
    }
    const redeemProxyContract = new ethers.Contract(
      redeemProxy,
      contracts.PendleRedeemProxy.abi,
      provider.provider
    );

    const fetchInterests = async (
      userAddress: string,
    ): Promise<YtOrMarketInterest[]> => {
      
      const formattedResult: YtOrMarketInterest[] = [];
      
      const userInterests = await redeemProxyContract.callStatic.redeemMarkets(
        markets.map((marketInfo: any) => marketInfo.address),
        { from: userAddress }
      );
      for (let i = 0; i < markets.length; i++) {
        const marketInfo = markets[i];
        formattedResult.push({
          address: marketInfo.address,
          interest: new TokenAmount(
            new Token(marketInfo.rewardTokenAddresses[0], decimalsRecord[marketInfo.rewardTokenAddresses[0]]),
            userInterests[i].toString()
          ),
        });
      }
      return formattedResult;
    };
    return {
      fetchInterests
    }
  };
}


export class PendleMarket extends Market {
  public ytWeightRaw?: string;
  public baseTokenWeightRaw?: string;

  public constructor(marketAddress: string, tokens: TokenAmount[]) {
    super(marketAddress, [tokens[0].token!, tokens[1].token!]);
  }
}
