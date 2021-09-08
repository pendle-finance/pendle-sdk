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
    // , where: {forgeId: "${forgeId}", expiry: ${expiry}}
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
}
