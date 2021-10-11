import { providers, Contract, BigNumber as BN } from 'ethers';
import { contracts } from './contracts';
import { Token, TokenAmount, StakingPool, PendleMarket, Yt, ETHToken } from './entities';
import { CurrencyAmount } from './entities/currencyAmount';
import { fetchValuation } from './fetchers';
import { distributeConstantsByNetwork, getGasLimit, indexRange } from './helpers';
import { NetworkInfo, StakingPoolType } from './networks';
import { GasInfo, getGasPrice } from './fetchers/gasPriceFetcher';

export class Sdk {
  public readonly signer: providers.JsonRpcSigner;
  public readonly chainId: number | undefined;

  public constructor(signer: providers.JsonRpcSigner, chainId?: number) {
    this.signer = signer;
    this.chainId = chainId;
  }

  public async fetchValuations(amounts: TokenAmount[], chainId?: number): Promise<CurrencyAmount[]> {
    const response: CurrencyAmount[] = new Array<CurrencyAmount>(amounts.length);
    const promises = indexRange(0, amounts.length).map(async (i: number) => {
      await fetchValuation(amounts[i], this.signer, chainId).then((r: CurrencyAmount) => response[i] = r);
    })
    await Promise.all(promises);
    return response;
  }

  private constructArgsForClaimYields(
    yts: Token[],
    ots: Token[],
    lps: Token[],
    interestStakingPools: StakingPool[],
    rewardStakingPools: StakingPool[],
    userAddress: string
  ): any[] {
    const ytAddresses: string[] = yts.map((t: Token) => t.address);
    const otAddresses: string[] = ots.map((t: Token) => t.address);
    const marketAddresses: string[] = lps.map((t: Token) => t.address);
    const lmV1sForInterest: StakingPool[] = interestStakingPools.filter((s: StakingPool) => s.contractType == StakingPoolType.LmV1);
    const lmV1sExpiriesForInterest: number[] = lmV1sForInterest.map((s: StakingPool) => {
      const market: PendleMarket = PendleMarket.find(s.inputToken.address, this.chainId);
      const yt: Yt = Yt.find(market.tokens[0].address, this.chainId);
      return yt.expiry!;
    })
    const lmV2sForInterest: StakingPool[] = interestStakingPools.filter((s: StakingPool) => s.contractType == StakingPoolType.LmV2);
    const lmV1sForRewards: StakingPool[] = rewardStakingPools.filter((s: StakingPool) => s.contractType == StakingPoolType.LmV1);
    const lmV1sExpiriesForRewards: number[] = lmV1sForRewards.map((s: StakingPool) => {
      const market: PendleMarket = PendleMarket.find(s.inputToken.address, this.chainId);
      const yt: Yt = Yt.find(market.tokens[0].address, this.chainId);
      return yt.expiry!;
    })
    const lmV2sForRewards: StakingPool[] = rewardStakingPools.filter((s: StakingPool) => s.contractType == StakingPoolType.LmV2);

    const args: any[] = [
      {
        xyts: ytAddresses,
        ots: otAddresses,
        markets: marketAddresses,
        lmContractsForRewards: lmV1sForRewards.map((s: StakingPool) => s.address),
        expiriesForRewards: lmV1sExpiriesForRewards,
        lmContractsForInterests: lmV1sForInterest.map((s: StakingPool) => s.address),
        expiriesForInterests: lmV1sExpiriesForInterest,
        lmV2ContractsForRewards: lmV2sForRewards.map((s: StakingPool) => s.address),
        lmV2ContractsForInterests: lmV2sForInterest.map((s: StakingPool) => s.address)
      },
      userAddress
    ];
    return args;
  }

  public async claimYields({
    yts = [],
    ots = [],
    lps = [],
    interestStakingPools = [],
    rewardStakingPools = []
  }: {
    yts: Token[],
    ots: Token[],
    lps: Token[],
    interestStakingPools: StakingPool[],
    rewardStakingPools: StakingPool[]
  }): Promise<providers.TransactionResponse> {
    const userAddress: string = await this.signer.getAddress();
    const args: any[] = this.constructArgsForClaimYields(yts, ots, lps, interestStakingPools, rewardStakingPools, userAddress);

    const networkInfo: NetworkInfo = distributeConstantsByNetwork(this.chainId);
    const redeemProxyContract = new Contract(
      networkInfo.contractAddresses.misc.PendleRedeemProxy,
      contracts.PendleRedeemProxy.abi,
      this.signer.provider
    );
    const gasEstimate = await redeemProxyContract.connect(this.signer).estimateGas.redeem(...args);
    return redeemProxyContract.connect(this.signer).redeem(...args, getGasLimit(gasEstimate));
  }

  public async estimateGasForClaimYields({
    yts = [],
    ots = [],
    lps = [],
    interestStakingPools = [],
    rewardStakingPools = []
  }: {
    yts?: Token[],
    ots?: Token[],
    lps?: Token[],
    interestStakingPools?: StakingPool[],
    rewardStakingPools?: StakingPool[]
  }): Promise<GasInfo> {
    console.log(yts);
    const userAddress: string = await this.signer.getAddress();
    const args: any[] = this.constructArgsForClaimYields(yts, ots, lps, interestStakingPools, rewardStakingPools, userAddress);
    const networkInfo: NetworkInfo = distributeConstantsByNetwork(this.chainId);
    const redeemProxyContract = new Contract(
      networkInfo.contractAddresses.misc.PendleRedeemProxy,
      contracts.PendleRedeemProxy.abi,
      this.signer.provider
    );
    const gasEstimate: BN = await redeemProxyContract.connect(this.signer).estimateGas.redeem(...args);
    const gasLimit: BN = BN.from(getGasLimit(gasEstimate).gasLimit);
    const gasPrice: BN = await getGasPrice(this.chainId);

    return {
      gasCost: new TokenAmount(
        ETHToken,
        gasLimit.mul(gasPrice).toString(),
      ),
      gasLimit: gasLimit.toString(),
      gasPrice: new TokenAmount(
        ETHToken,
        gasPrice.toString(),
      )
    }
  }
}
