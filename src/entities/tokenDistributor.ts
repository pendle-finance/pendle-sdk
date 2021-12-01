import { ChainSpecifics } from './types';
import { TokenAmount } from './tokenAmount';
import { Token } from './token';
import { RedeemProxy } from './redeemProxy';

export class TokenDistributor {
  public static methods({ signer, provider, chainId }: ChainSpecifics): Record<string, any> {
    const fetchClaimableRewards = async ({
      tokens,
      userAddress,
    }: {
      tokens: Token[];
      userAddress: string;
    }): Promise<TokenAmount[]> => {
      return RedeemProxy.methods({ signer, provider, chainId }).callStatic.redeemTokenDist(
        tokens.map((t: Token) => t.address),
        userAddress
      );
    };
    return {
      fetchClaimableRewards,
    };
  }
}
