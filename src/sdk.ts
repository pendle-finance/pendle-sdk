import { providers } from 'ethers';
import { PendleMarket } from './entities';
import { Token, TokenAmount } from './entities';
import { fetchPendleMarketData, fetchTokenBalances } from './fetchers';

export class Sdk {
  public readonly provider: providers.JsonRpcProvider;

  public constructor(provider: providers.JsonRpcProvider) {
    this.provider = provider;
  }

  public async fetchPendleMarketData(
    marketAddress: string
  ): Promise<PendleMarket> {
    return await fetchPendleMarketData(this.provider, marketAddress);
  }

  public async fetchTokenBalances(
    // should be  in Token.contract
    tokens: Token[],
    userAddress: string
  ): Promise<TokenAmount[]> {
    return await fetchTokenBalances(this.provider, tokens, userAddress);
  }
}
