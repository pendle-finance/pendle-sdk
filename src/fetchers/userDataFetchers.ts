import { Contract, providers } from 'ethers';
import { contracts } from '../../contracts';
import { Token, TokenAmount } from '../entities';

export async function fetchTokenBalances(
  provider: providers.JsonRpcProvider,
  tokens: Token[],
  userAddress: string
): Promise<TokenAmount[]> {
  //TODO: Use multicall
  return Promise.all(
    tokens.map(async token => {
      const tokenContract = new Contract(
        token.address,
        contracts.IERC20.abi,
        provider
      );
      const tokenAmountRaw = await tokenContract.balanceOf(userAddress);
      return new TokenAmount(token, tokenAmountRaw.toString());
    })
  );
}
