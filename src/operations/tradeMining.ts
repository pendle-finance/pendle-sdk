import { providers } from 'ethers';
import { PendleTradeMiningQuerySet } from '@pendle/subgraph-sdk';
import { NetworkInfo } from '../networks';
import { distributeConstantsByNetwork } from '../helpers';
import { TokenAmount } from '../entities/tokenAmount';
import { Token } from '../entities/token';

export type Valuation = {
  currency: String; // 'USD'
  amount: String | Number; // '10.43'
};

export type TradeMiningUser = {
  wallet: String; // wallet address
  tradedVolume: Valuation;
};

type DefaultTradeMiningQUery = {
  house: string;
  phase: string;
};

type TradeMiningQuery = {
  house: string;
  phase: string;
  numberOfTraders: number;
};

type GetUserRankQuery = {
  house: string;
  phase: string;
  walletAddress: string;
};

type GetUserRankResponse = {
  rank: number;
  tradedVolume: Valuation;
};

export class TradeMining {
  public methods(
    _: providers.JsonRpcSigner,
    chainId?: number
  ): Record<string, any> {
    const networkInfo: NetworkInfo = distributeConstantsByNetwork(
      chainId || 43114
    );
    const pendleSubgraphSdk = new PendleTradeMiningQuerySet(chainId || 43114);

    const getTopTraders = async ({
      phase,
      house,
      numberOfTraders = 10,
    }: TradeMiningQuery): Promise<TradeMiningUser[]> => {
      const topTraders = await pendleSubgraphSdk.getTopTraders(
        phase,
        house,
        numberOfTraders
      );

      return topTraders.tradeMiningUsers.map((res: any) => {
        return {
          wallet: res.userAddress,
          tradedVolume: {
            currency: 'USD',
            amount: parseFloat(res.volumeUSD).toFixed(2),
          },
        };
      });
    };

    const getUserRank = async (
      query: GetUserRankQuery
    ): Promise<GetUserRankResponse> => {
      const topTraders = await getTopTraders({
        house: query.house,
        phase: query.phase,
        numberOfTraders: 1000,
      });
      let user = await pendleSubgraphSdk.getUserRank(
        query.phase,
        query.house,
        query.walletAddress.toLowerCase()
      );

      if (user.tradeMiningUsers.length === 0)
        return {
          rank: -1,
          tradedVolume: {
            currency: 'USD',
            amount: '0',
          },
        };

      user = user.tradeMiningUsers[0];

      let rank = 0;
      const trader = topTraders.find((trader, index) => {
        rank = index + 1;
        return trader.wallet === user.userAddress;
      });

      if (!trader)
        return {
          rank: -1,
          tradedVolume: {
            currency: 'USD',
            amount: parseFloat(user.volumeUSD).toFixed(2),
          },
        };

      return {
        rank,
        tradedVolume: trader.tradedVolume,
      };
    };

    const getTotalTradedVolume = async (
      query: DefaultTradeMiningQUery
    ): Promise<Valuation> => {
      const res = await pendleSubgraphSdk.getTotalTradedVolume(
        query.phase,
        query.house
      );

      if (res.tradeMiningHouses.length === 0) {
        return { currency: 'USD', amount: '0' };
      }

      const tradeMiningHouse = res.tradeMiningHouses[0];

      return {
        currency: 'USD',
        amount: parseFloat(tradeMiningHouse.volumeUSD).toFixed(2),
      };
    };

    const getPhaseRewards = (_: DefaultTradeMiningQUery): TokenAmount => {
      const pendleToken = new Token(
        networkInfo.contractAddresses.tokens.PENDLE,
        networkInfo.decimalsRecord[networkInfo.contractAddresses.tokens.PENDLE]
      );
      const phaseRewards = new TokenAmount(
        pendleToken,
        '75000000000000000000000'
      );

      return phaseRewards;
    };

    return {
      getTopTraders,
      getUserRank,
      getTotalTradedVolume,
      getPhaseRewards,
    };
  }
}
