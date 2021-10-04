import { providers } from 'ethers';
import { Token, TokenAmount } from './entities';
import { CurrencyAmount } from './entities/currencyAmount';
import { fetchTokenBalances, fetchValuation } from './fetchers';

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

  public async fetchValuation(amount: TokenAmount, chainId?: number): Promise<CurrencyAmount> {
    return fetchValuation(amount, chainId)
  }
}
