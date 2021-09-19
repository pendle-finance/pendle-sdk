import { providers } from 'ethers';
import { Token, TokenAmount } from './entities';
import { fetchTokenBalances } from './fetchers';

export class Sdk {
  public readonly provider: providers.JsonRpcProvider;

  public constructor(provider: providers.JsonRpcProvider) {
    this.provider = provider;
  }

  public async fetchTokenBalances(
    // should be  in Token.contract
    tokens: Token[],
    userAddress: string
  ): Promise<TokenAmount[]> {
    return await fetchTokenBalances(this.provider, tokens, userAddress);
  }
}
