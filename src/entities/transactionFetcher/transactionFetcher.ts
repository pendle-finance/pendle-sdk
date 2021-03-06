import { request, gql } from 'graphql-request';
import { PendleSubgraphUrlMapping } from "../../constants"
import { TokenAmount } from '../tokenAmount';
import { Token } from '../token';
import { Address } from '../types';
import { TRANSACTION } from './types';

type SubgraphQuery = {
  page: number;
  limit: number;
};
export interface ForgeQuery extends SubgraphQuery {
  forgeId: string;
  expiry: number;
  underlyingTokenAddress: Address;
}

export interface PendleAmmQuery extends SubgraphQuery {
  marketAddress: Address;
}

const networkMapping: Record<string | number, number> = {
  1: 1,
  mainnet: 1,
  42: 42,
  kovan: 42,
  43114: 43114,
  avalanche: 43114
};

const chainIdToNetworkMapping: Record<number, string> = {
  1: 'mainnet',
  42: 'kovan',
  43114: 'avalanche'
};

export class TransactionFetcher {
  private network = 1;

  constructor(_network: number | string = 1) {
    this.network = networkMapping[_network];
  }

  private getSkipAmount(page: number, limit: number) {
    return page * limit - limit;
  }

  public currentNetwork(): number {
    return this.network;
  }

  public setNetwork(_network: number): void {
    this.network = _network;
  }

  public async getMintTransactions(
    queryObj: ForgeQuery
  ): Promise<TRANSACTION[]> {
    const query = gql`
    {
        mintYieldTokens
        (
          first: ${queryObj.limit}, 
          skip: ${this.getSkipAmount(queryObj.page, queryObj.limit)}, 
          orderBy: timestamp, 
          orderDirection: desc, 
          where: {
            forgeId: "${queryObj.forgeId}", 
            expiry: ${queryObj.expiry}, 
            underlyingAsset: "${queryObj.underlyingTokenAddress}"
          }
        ) 
      {   
          id
          timestamp
          mintedValueUSD
          amountToTokenize
          amountMinted
          expiry
          xytAsset {
              id
              decimals
          }
          otAsset {
              id
              decimals
          }
          yieldBearingAsset {
              id
              symbol
              decimals
          }
          from
      }
    }`;

    const response = await request(
      PendleSubgraphUrlMapping[this.network],
      query
    );

    return response.mintYieldTokens.map((mintObj: any) => ({
      action: 'Mint',
      hash: mintObj.id,
      amount: { currency: 'USD', amount: parseFloat(mintObj.mintedValueUSD) },
      paid: [
        new TokenAmount(
          new Token(
            mintObj.yieldBearingAsset.id,
            mintObj.yieldBearingAsset.decimals
          ),
          mintObj.amountToTokenize
        ),
      ],
      received: [
        new TokenAmount(
          new Token(mintObj.xytAsset.id, mintObj.xytAsset.decimals),
          mintObj.amountMinted
        ),
        new TokenAmount(
          new Token(mintObj.otAsset.id, mintObj.otAsset.decimals),
          mintObj.amountMinted
        ),
      ],
      network: chainIdToNetworkMapping[this.network],
      chainId: this.network,
      timestamp: mintObj.timestamp,
    }));
  }

  public async getRedeemTransactions(queryObj: ForgeQuery) {
    const query = gql`
    {
      redeemYieldTokens
      (
        first: ${queryObj.limit},             
        skip: ${this.getSkipAmount(queryObj.page, queryObj.limit)}, 
        orderBy: timestamp, 
        orderDirection: desc, 
        where: {
          forgeId: "${queryObj.forgeId}", 
          expiry: ${queryObj.expiry}, 
          underlyingAsset: "${queryObj.underlyingTokenAddress}"
        }
      ) 
      {
        id
        timestamp
        redeemedValueUSD
        amountToRedeem
        amountRedeemed
        expiry
        xytAsset {
            id
            decimals
        }
        otAsset {
            id
            decimals
        }
        yieldBearingAsset {
            id
            symbol
            decimals
        }
        from
      }
    }`;

    const response = await request(
      PendleSubgraphUrlMapping[this.network],
      query
    );

    return response.redeemYieldTokens.map((redeemObj: any) => ({
      action: 'Redeem',
      hash: redeemObj.id,
      amount: { currency: 'USD', amount: parseFloat(redeemObj.redeemedValueUSD) },
      paid: [
        new TokenAmount(
          new Token(redeemObj.xytAsset.id, redeemObj.xytAsset.decimals),
          redeemObj.amountToRedeem
        ),
        new TokenAmount(
          new Token(redeemObj.otAsset.id, redeemObj.otAsset.decimals),
          redeemObj.amountToRedeem
        ),
      ],
      received: [
        new TokenAmount(
          new Token(
            redeemObj.yieldBearingAsset.id,
            redeemObj.yieldBearingAsset.decimals
          ),
          redeemObj.amountRedeemed
        ),
      ],
      network: chainIdToNetworkMapping[this.network],
      chainId: this.network,
      timestamp: redeemObj.timestamp,
    }));
  }

  public async getSwapTransactions(queryObj: PendleAmmQuery): Promise<TRANSACTION[]> {
    const query = gql`
    {
      swaps
      (
        first: ${queryObj.limit},         
        skip: ${this.getSkipAmount(queryObj.page, queryObj.limit)}, 
        orderBy: timestamp,
        orderDirection: desc, 
        where : {
          pair: "${queryObj.marketAddress}"
        }
      )
      {
        id
        timestamp
        amountUSD
        inAmount
        outAmount
        inToken {
            id
            decimals
            symbol
        }
        outToken {
            id
            decimals
            symbol
        }
        from
      }
    }`;

    const response = await request(
      PendleSubgraphUrlMapping[this.network],
      query
    );

    return response.swaps.map((swapObj: any) => ({
      action: 'Swap',
      hash: swapObj.id,
      amount: { currency: 'USD', amount: parseFloat(swapObj.amountUSD) },
      paid: [
        new TokenAmount(
          new Token(swapObj.inToken.id, swapObj.inToken.decimals),
          swapObj.inAmount
        ),
      ],
      received: [
        new TokenAmount(
          new Token(swapObj.outToken.id, swapObj.outToken.decimals),
          swapObj.outAmount
        ),
      ],
      timestamp: swapObj.timestamp,
      network: chainIdToNetworkMapping[this.network],
      chainId: this.network,
    }));
  }

  public async getLiquidityTransactions(
    queryObj: PendleAmmQuery
  ): Promise<TRANSACTION[]> {
    const query = gql`
    {
      liquidityPools
      (
        first: ${queryObj.limit},        
        skip: ${this.getSkipAmount(queryObj.page, queryObj.limit)},  
        orderBy: timestamp, 
        orderDirection: desc, 
        where : {pair: "${queryObj.marketAddress}"}
      ) 
      {
          id
          timestamp
          inAmount0
          inAmount1
          inToken0 {
            id
            symbol
            decimals
          }
          inToken1 {
            id
            symbol
            decimals
          }
          type
          amountUSD
          from
      }
        
    }`;

    const response = await request(
      PendleSubgraphUrlMapping[this.network],
      query
    );
    
    return response.liquidityPools.map((liquidityObj: any) => {
      const transferredTokens = [
        new TokenAmount(
          new Token(liquidityObj.inToken0.id, liquidityObj.inToken0.decimals),
          liquidityObj.inAmount0
        ),
        new TokenAmount(
          new Token(liquidityObj.inToken1.id, liquidityObj.inToken1.decimals),
          liquidityObj.inAmount1
        ),
      ];
      const isAddLiquidity = liquidityObj.type == "Join";
      return {
        action: liquidityObj.type,
        hash: liquidityObj.id,
        amount: { currency: 'USD', amount: parseFloat(liquidityObj.amountUSD) },
        paid: isAddLiquidity ? transferredTokens: [],
        received: isAddLiquidity ? [] : transferredTokens,
        network: chainIdToNetworkMapping[this.network],
        chainId: this.network,
        timestamp: liquidityObj.timestamp,
      }
    })
  };
}
