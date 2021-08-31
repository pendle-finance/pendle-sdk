import { TokenAmount } from './token';
import { RONE } from '../constants';

export class Market {
  public readonly address: string;
  public token0Amount?: TokenAmount;
  public token1Amount?: TokenAmount;
  public token0WeightRaw?: string;
  public token1WeightRaw?: string;

  public constructor(
    marketAddress: string,
    token0Amount?: TokenAmount,
    token1Amount?: TokenAmount,
    token0WeightRaw?: string,
    token1WeightRaw?: string
  ) {
    this.address = marketAddress;
    this.token0Amount = token0Amount;
    this.token1Amount = token1Amount;
    const half = RONE.div(2).toString();
    this.token0WeightRaw = token0WeightRaw || half;
    this.token1WeightRaw = token1WeightRaw || half;
  }

  public getToken0PriceInToken1(): string {
    // TODO
    return '1';
  }

  public getToken1PriceInToken0(): string {
    // TODO
    return '1';
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
