import { TokenAmount, Token } from './token';
import { ethers, providers } from 'ethers';
import { contractAddresses } from '../constants';
import { contracts } from '../contracts';
import { YtOrMarketInterest } from './token';

const dummyAddress = '0x6b3595068778dd592e39a122f4f5a5cf09c90fe2'; // SUSHI
const dummyDecimal = 18;

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
    provider: providers.JsonRpcSigner
  ): Record<string, any> {
    return {
      /**
       * name
       */
      async fetchInterests(
        markets: string[],
        userAddress: string
      ): Promise<YtOrMarketInterest[]> {
        const redeemProxyContract = new ethers.Contract(
          contractAddresses.PendleRedeemProxy,
          contracts.PendleRedeemProxy.abi,
          provider.provider
        );
        const userInterests = await redeemProxyContract.callStatic.redeemMarkets(
          markets,
          { from: userAddress }
        );
        const formattedResult: YtOrMarketInterest[] = [];
        for (let i = 0; i < markets.length; i++) {
          const market = markets[i];
          formattedResult.push({
            address: market,
            interest: new TokenAmount(
              new Token(dummyAddress, dummyDecimal),
              userInterests[i].toString()
            ),
          });
        }
        return formattedResult;
      },
    };
  }
}

export class PendleMarket extends Market {
  public ytWeightRaw?: string;
  public baseTokenWeightRaw?: string;

  public constructor(marketAddress: string, tokens: TokenAmount[]) {
    super(marketAddress, [tokens[0].token!, tokens[1].token!]);
  }
}
