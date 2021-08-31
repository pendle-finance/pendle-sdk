import { Contract, providers } from 'ethers';
import { PendleMarket } from './entities';
import { contracts } from './contracts';
import { Token, TokenAmount } from './entities';

export class Sdk {
  public readonly provider: providers.JsonRpcProvider;

  public constructor(provider: providers.JsonRpcProvider) {
    this.provider = provider;
  }

  public async fetchPendleMarketData(
    marketAddress: string
  ): Promise<PendleMarket> {
    const marketContract = new Contract(
      marketAddress,
      contracts.IPendleMarket.abi,
      this.provider
    );
    const reserves = await marketContract.getReserves();
    const ytTokenAddress = await marketContract.xyt();
    const baseTokenAddress = await marketContract.token();
    const ytTokenContract = new Contract(
      ytTokenAddress,
      contracts.IERC20.abi,
      this.provider
    );
    const baseTokenContract = new Contract(
      baseTokenAddress,
      contracts.IERC20.abi,
      this.provider
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
}
