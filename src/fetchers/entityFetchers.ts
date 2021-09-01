import { Contract, providers } from 'ethers';
import { contracts } from '../contracts';
import { Token, TokenAmount, PendleMarket } from '../entities';

export async function fetchPendleMarketData(
  provider: providers.JsonRpcProvider,
  marketAddress: string
): Promise<PendleMarket> {
  const marketContract = new Contract(
    marketAddress,
    contracts.IPendleMarket.abi,
    provider
  );
  const reserves = await marketContract.getReserves();
  const ytTokenAddress = await marketContract.xyt();
  const baseTokenAddress = await marketContract.token();
  const ytTokenContract = new Contract(
    ytTokenAddress,
    contracts.IERC20.abi,
    provider
  );
  const baseTokenContract = new Contract(
    baseTokenAddress,
    contracts.IERC20.abi,
    provider
  );
  const ytTokenDecimals = await ytTokenContract.decimals();
  const baseTokenDecimals = await baseTokenContract.decimals();

  const market = new PendleMarket(
    marketAddress.toLowerCase(),
    new TokenAmount(
      new Token(ytTokenAddress, ytTokenDecimals.toNumber()),
      reserves.xytBalance.toString()
    ),
    new TokenAmount(
      new Token(baseTokenAddress, baseTokenDecimals.toNumber()),
      reserves.tokenBalance.toString()
    ),
    reserves.xytWeight.toString(),
    reserves.tokenWeight.toString()
  );
  return market;
}
