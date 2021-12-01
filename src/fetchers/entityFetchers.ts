import { BigNumber as BN, Contract, providers } from 'ethers';
import { contracts } from '../contracts';
import { PendleMarket, Token } from '../entities';

export async function fetchPendleMarketData(
  provider: providers.JsonRpcProvider,
  marketAddress: string
): Promise<PendleMarket> {
  const marketContract = new Contract(marketAddress, contracts.IPendleMarket.abi, provider);
  const ytTokenAddress = await marketContract.xyt();
  const baseTokenAddress = await marketContract.token();
  const ytTokenContract = new Contract(ytTokenAddress, contracts.IERC20.abi, provider);
  const baseTokenContract = new Contract(baseTokenAddress, contracts.IERC20.abi, provider);
  const ytTokenDecimals: BN = await ytTokenContract.decimals();
  const baseTokenDecimals: BN = await baseTokenContract.decimals();

  const market = new PendleMarket(marketAddress.toLowerCase(), [
    new Token(ytTokenAddress, ytTokenDecimals.toNumber()),
    new Token(baseTokenAddress, baseTokenDecimals.toNumber()),
  ]);
  return market;
}
