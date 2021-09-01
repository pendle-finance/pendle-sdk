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

  public async fetchTokenBalances( // should be  in Token.contract
    tokens: Token[],
    userAddress: string
  ): Promise<TokenAmount[]> {
    return await fetchTokenBalances(this.provider, tokens, userAddress);
  }

  public async fetchInterestsAndRewards( //TODO: move into Market.contract, StakingPool.contract and YT.contract
    yieldTokens: address[],
    markets: address[],
    pools: StakingPool[],
    userAddress: string
  ): Promise<Object> {



    return {
      yieldTokens: [
        {
          address: '0x12345',
          interests: {
            address: '0xaUSDCaddress',
            value: '345',
          },
        },
      ],
      markets: [
        {
          address: '0x123',
          interests: {
            address: '0xaUSDCaddress',
            value: '123',
          },
        },
        {
          address: '0x123',
          interests: {
            address: '0xcDAIaddress',
            value: '123',
          },
        },
      ],
      pools: [
        {
          address: '0x567',
          interests: {
            address: '0xSUSHI',
            value: '567',
          },
          rewards: new TokenAmount(new Token('0xPENDLE', 18), '14123'),
          accruingRewards: new TokenAmount(new Token('0xPENDLE', 18), '14123'),
        },
      ],
    };
  }
}
