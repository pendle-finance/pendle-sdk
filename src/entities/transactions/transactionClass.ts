import { request, gql } from 'graphql-request';
import { PendleSubgraphUrlMapping, TokenAmount, Token } from '../';
import { TRANSACTION } from './types';

type SubgraphQuery = {
  page: number;
  limit: number;
};

export class Transaction {
  private network = 1;

  constructor(_network: number | string = 1) {
    const networkMapping: Record<string | number, number> = {
      1: 1,
      mainnet: 1,
      42: 42,
      kovan: 42,
    };

    this.network = networkMapping[_network];
  }

  public currentNetwork(): number {
    return this.network;
  }

  public setNetwork(_network: number): void {
    this.network = _network;
  }

  public async getMintTransactions(
    queryObj: SubgraphQuery
  ): Promise<TRANSACTION[]> {
    // TODO
    // , where: {forgeId: "${forgeId}", expiry: ${expiry}} underlying yield
    const query = gql`{
            mintYieldTokens(first: ${queryObj.limit}, orderBy: timestamp, orderDirection: desc) {
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
      amount: { currency: 'USD', amount: mintObj.mintedValueUSD },
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
      network: 'mainnet',
    }));
  }

  public async getRedeemTransactions(queryObj: SubgraphQuery) {
    const query = gql`{
      redeemYieldTokens(first: ${queryObj.limit}, orderBy: timestamp, orderDirection: desc) {
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
      amount: { currency: 'USD', amount: redeemObj.redeemedValueUSD },
      paid: [
        new TokenAmount(
          new Token(redeemObj.xytAsset.id, redeemObj.xytAsset.decimals),
          redeemObj.amountRedeemed
        ),
        new TokenAmount(
          new Token(redeemObj.otAsset.id, redeemObj.otAsset.decimals),
          redeemObj.amountRedeemed
        ),
      ],
      received: [
        new TokenAmount(
          new Token(
            redeemObj.yieldBearingAsset.id,
            redeemObj.yieldBearingAsset.decimals
          ),
          redeemObj.amountToRedeem
        ),
      ],
      network: 'mainnet',
    }));
  }

  public async getSwapTransactions(queryObj: SubgraphQuery) {
    const query = gql`{
      swaps(first: ${queryObj.limit}, orderBy: timestamp, orderDirection: desc) {
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
      amount: { currency: 'USD', amount: swapObj.amountUSD },
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
      network: 'mainnet',
    }));
  }

  public async getLiquidityTransactions(
    queryObj: SubgraphQuery
  ): Promise<TRANSACTION[]> {
    // TODO
    // , where: {forgeId: "${forgeId}", expiry: ${expiry}} underlying yield
    const query = gql`{
            liquidityPools(first: ${queryObj.limit}, orderBy: timestamp, orderDirection: desc) {
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

    return response.liquidityPools.map((liquidityObj: any) => ({
      action: liquidityObj.type,
      hash: liquidityObj.id,
      amount: { currency: 'USD', amount: liquidityObj.amountUSD },
      paid: [
        new TokenAmount(
          new Token(liquidityObj.inToken0.id, liquidityObj.inToken0.decimals),
          liquidityObj.inAmount0
        ),
        new TokenAmount(
          new Token(liquidityObj.inToken1.id, liquidityObj.inToken1.decimals),
          liquidityObj.inAmount1
        ),
      ],
      received: [
        // new TokenAmount(
        //   new Token(mintObj.xytAsset.id, mintObj.xytAsset.decimals),
        //   mintObj.amountMinted
        // ),
        // new TokenAmount(
        //   new Token(mintObj.otAsset.id, mintObj.otAsset.decimals),
        //   mintObj.amountMinted
        // ),
      ],
      network: 'mainnet',
    }));
  }
}
