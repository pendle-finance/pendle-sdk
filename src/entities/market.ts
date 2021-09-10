import { TokenAmount, Token } from './token';
import { Contract, providers } from 'ethers';
import { contracts } from '../contracts';
import { YtOrMarketInterest } from './token';
import { MARKETNFO, NetworkInfo } from '../networks';
import { distributeConstantsByNetwork } from '../helpers';
import {
  dummyCurrencyAmount,
  dummyToken,
  dummyTokenAmount,
  CurrencyAmount,
} from '..';
import { YieldContract } from '.';
import {
  Transaction as SubgraphTransactions,
  PendleAmmQuery,
} from './transactions';

export type TokenReserveDetails = {
  rate: string;
  reserves: TokenAmount;
  weights: string;
};

export type MarketDetails = {
  tokenReserves: TokenReserveDetails[];
  otherDetails: {
    // from subgraph
    dailyVolume: CurrencyAmount; //TODO: to confirm
    volume24hChange: string;
    liquidity: CurrencyAmount;
    liquidity24HChange: string;
    swapFeeApr: string;
    impliedYield: string;
  };
};

export type SwapDetails = {
  inAmount: TokenAmount;
  outAmount: TokenAmount;
  minReceived: TokenAmount;
  priceImpact: string;
  swapFee: TokenAmount;
};

export type AddDualLiquidityDetails = {
  otherTokenAmount: TokenAmount;
  shareOfPool: string;
};

export type AddSingleLiquidityDetails = {
  shareOfPool: string;
  priceImpact: string;
  swapFee: TokenAmount;
};

export type RemoveDualLiquidityDetails = {
  tokenAmounts: TokenAmount[];
};

export type RemoveSingleLiquidityDetails = {
  outAmount: TokenAmount;
  priceImpact?: string;
  swapFee?: TokenAmount;
};

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
}

export class PendleMarket extends Market {
  public ytWeightRaw?: string;
  public baseTokenWeightRaw?: string;

  public constructor(marketAddress: string, tokens: Token[]) {
    super(marketAddress, [tokens[0], tokens[1]]);
  }

  public yieldContract(): YieldContract {
    return new YieldContract('Aave2', dummyToken, 1672272000);
  }

  public static methods(
    provider: providers.JsonRpcSigner,
    chainId?: number
  ): Record<string, any> {
    const networkInfo: NetworkInfo = distributeConstantsByNetwork(chainId);
    const markets: MARKETNFO[] = networkInfo.contractAddresses.markets;

    const redeemProxyContract = new Contract(
      networkInfo.contractAddresses.misc.PendleRedeemProxy,
      contracts.PendleRedeemProxy.abi,
      provider.provider
    );

    const decimalsRecord: Record<string, number> = networkInfo.decimalsRecord;

    const fetchInterests = async (
      userAddress: string
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
            new Token(
              marketInfo.rewardTokenAddresses[0],
              decimalsRecord[marketInfo.rewardTokenAddresses[0]]
            ),
            userInterests[i].toString()
          ),
        });
      }
      return formattedResult;
    };

    const getSwapTransactions = (query: PendleAmmQuery) => {
      return new SubgraphTransactions(networkInfo.chainId).getSwapTransactions(
        query
      );
    };

    const getLiquidityTransactions = (query: PendleAmmQuery) => {
      return new SubgraphTransactions(
        networkInfo.chainId
      ).getLiquidityTransactions(query);
    };
    
    return {
      fetchInterests,
      getSwapTransactions,
      getLiquidityTransactions,
    };
  }

  public methods(
    provider: providers.JsonRpcSigner,
    __?: number
  ): Record<string, any> {
    const readMarketDetails = async (): Promise<MarketDetails> => {
      return {
        tokenReserves: [
          {
            rate: '1',
            reserves: dummyTokenAmount,
            weights: '0.5',
          },
          {
            rate: '1',
            reserves: dummyTokenAmount,
            weights: '0.5',
          },
        ],
        otherDetails: {
          dailyVolume: dummyCurrencyAmount,
          volume24hChange: '0.5',
          liquidity: dummyCurrencyAmount,
          liquidity24HChange: '0.5',
          swapFeeApr: '0.5',
          impliedYield: '0.5',
        },
      };
    };

    const swapExactInDetails = async (
      _: number,
      __: TokenAmount
    ): Promise<SwapDetails> => {
      return {
        inAmount: dummyTokenAmount,
        outAmount: dummyTokenAmount,
        minReceived: dummyTokenAmount,
        priceImpact: '0.01',
        swapFee: dummyTokenAmount,
      };
    };

    const swapExactOutDetails = async (
      _: number,
      __: TokenAmount
    ): Promise<SwapDetails> => {
      return {
        inAmount: dummyTokenAmount,
        outAmount: dummyTokenAmount,
        minReceived: dummyTokenAmount,
        priceImpact: '0.01',
        swapFee: dummyTokenAmount,
      };
    };

    const swapExactIn = async (
      _: number,
      __: TokenAmount
    ): Promise<providers.TransactionResponse> => {
      const USDCContract = new Contract(
        '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        contracts.IERC20.abi
      );
      return await USDCContract.connect(provider).approve(
        '0xABB6f9F596dC2564406bAe7557d34B98bFeBB6b5',
        1
      );
    };

    const swapExactOut = async (
      _: number,
      __: TokenAmount
    ): Promise<providers.TransactionResponse> => {
      const USDCContract = new Contract(
        '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        contracts.IERC20.abi
      );
      return await USDCContract.connect(provider).approve(
        '0xABB6f9F596dC2564406bAe7557d34B98bFeBB6b5',
        1
      );
    };

    const addDualDetails = async (
      _: TokenAmount
    ): Promise<AddDualLiquidityDetails> => {
      return {
        otherTokenAmount: dummyTokenAmount,
        shareOfPool: '0.001',
      };
    };

    const addDual = async (
      _: TokenAmount[],
      __: number | string
    ): Promise<providers.TransactionResponse> => {
      const USDCContract = new Contract(
        '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        contracts.IERC20.abi
      );
      return await USDCContract.connect(provider).approve(
        '0xABB6f9F596dC2564406bAe7557d34B98bFeBB6b5',
        1
      );
    };

    const addSingleDetails = async (
      _: TokenAmount
    ): Promise<AddSingleLiquidityDetails> => {
      return {
        shareOfPool: '0.001',
        priceImpact: '0.001',
        swapFee: dummyTokenAmount,
      };
    };

    const addSingle = async (
      _: TokenAmount,
      __: number | string
    ): Promise<providers.TransactionResponse> => {
      const USDCContract = new Contract(
        '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        contracts.IERC20.abi
      );
      return await USDCContract.connect(provider).approve(
        '0xABB6f9F596dC2564406bAe7557d34B98bFeBB6b5',
        1
      );
    };

    const removeDualDetails = async (
      _: number
    ): Promise<RemoveDualLiquidityDetails> => {
      return {
        tokenAmounts: [dummyTokenAmount, dummyTokenAmount],
      };
    };

    const removeDual = async (
      _: number,
      __: number
    ): Promise<providers.TransactionResponse> => {
      const USDCContract = new Contract(
        '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        contracts.IERC20.abi
      );
      return await USDCContract.connect(provider).approve(
        '0xABB6f9F596dC2564406bAe7557d34B98bFeBB6b5',
        1
      );
    };

    const removeSingleDetails = async (
      _: number,
      __: Token,
      ___: number
    ): Promise<RemoveSingleLiquidityDetails> => {
      return {
        outAmount: dummyTokenAmount,
        priceImpact: '0.001',
        swapFee: dummyTokenAmount,
      };
    };

    const removeSingle = async (
      _: number,
      __: Token,
      ___: number
    ): Promise<providers.TransactionResponse> => {
      const USDCContract = new Contract(
        '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        contracts.IERC20.abi
      );
      return await USDCContract.connect(provider).approve(
        '0xABB6f9F596dC2564406bAe7557d34B98bFeBB6b5',
        1
      );
    };

    return {
      readMarketDetails,
      swapExactInDetails,
      swapExactIn,
      swapExactOutDetails,
      swapExactOut,
      addDualDetails,
      addDual,
      addSingleDetails,
      addSingle,
      removeDualDetails,
      removeDual,
      removeSingleDetails,
      removeSingle,
    };
  }
}
