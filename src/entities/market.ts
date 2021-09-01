import { TokenAmount, Token } from './token';
import { RONE } from '../constants';

export class Market {
  public readonly address: string;
  public readonly tokens: Token[];
  // public token0Amount?: string[]; //TODO: make it an array of amounts
  // public token1Amount?: string;
  // public token0WeightRaw?: string;
  // public token1WeightRaw?: string;

  public constructor(
    marketAddress: string,
    tokens: Token[],
  ) {
    this.address = marketAddress;
    this.tokens = tokens
  }

  public getToken0PriceInToken1(): string {
    // TODO
    return '1';
  }

  //TODO
  public static contract(provider: providers.JsonRpcSigner) => { function1, function2 }
  MarketContract object that handles all contract interactions
  {
    // public getToken1PriceInToken0(): string {
    //   // TODO
    //   return '1';
    // }
    //
    // public fetchReserveData()
    // public getLiquidity(): string {
    //
    // }
    //
    // public getSwapExactInData(provider: providers.JsonRpcSigner, inAmount: TokenAmount, slippage: number, ) {
    //   returns price impact, exact out, ...
    // }
    
  }
}

export class PendleMarket extends Market {
  public ytWeightRaw?: string;
  public baseTokenWeightRaw?: string;

  public constructor(
    marketAddress: string,
    yt?: TokenAmount,
    baseToken?: TokenAmount,
    ytWeightRaw?: string,
    baseTokenWeightRaw?: string
  ) {
    super(marketAddress, yt, baseToken, ytWeightRaw, baseTokenWeightRaw);
  }
}
