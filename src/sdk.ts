import { providers, Contract, BigNumber as BN } from 'ethers';
import { contracts } from './contracts';
import { Token, TokenAmount, StakingPool, PendleMarket, Yt, dummyTokenAmount, ETHToken } from './entities';
import { CurrencyAmount } from './entities/currencyAmount';
import { fetchTokenBalances, fetchValuation } from './fetchers';
import { distributeConstantsByNetwork, getGasLimit } from './helpers';
import { NetworkInfo, StakingPoolType } from './networks';
import { GasInfo, getGasPrice } from './fetchers/gasPriceFetcher';

export class Sdk {
  public readonly signer: providers.JsonRpcSigner;
  public readonly chainId: number | undefined;

  public constructor(signer: providers.JsonRpcSigner, chainId?: number) {
    this.signer = signer;
    this.chainId = chainId;
  }

  public async fetchTokenBalances(
    // should be  in Token.contract
    tokens: Token[],
    userAddress: string
  ): Promise<TokenAmount[]> {
    return await fetchTokenBalances(this.signer.provider, tokens, userAddress);
  }

  public async fetchValuation(amount: TokenAmount, chainId?: number): Promise<CurrencyAmount> {
    return fetchValuation(amount, chainId)
  }

  private constructArgsForClaimYields(
    yts: Token[],
    ots: Token[],
    lps: Token[],
    interestStakingPools: StakingPool[],
    rewardStakingPools: StakingPool[]
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
      ytAddresses,
      otAddresses,
      marketAddresses,
      lmV1sForRewards.map((s: StakingPool) => s.address),
      lmV1sExpiriesForRewards,
      lmV1sForInterest.map((s: StakingPool) => s.address),
      lmV1sExpiriesForInterest,
      lmV2sForRewards.map((s: StakingPool) => s.address),
      lmV2sForInterest.map((s: StakingPool) => s.address)
    ];
    return args;
  }

  public async claimYields(
    yts: Token[],
    ots: Token[],
    lps: Token[],
    interestStakingPools: StakingPool[],
    rewardStakingPools: StakingPool[]
  ): Promise<providers.TransactionResponse> {
    const args: any[] = this.constructArgsForClaimYields(yts, ots, lps, interestStakingPools, rewardStakingPools);

    const networkInfo: NetworkInfo = distributeConstantsByNetwork(this.chainId);
    const redeemProxyContract = new Contract(
      networkInfo.contractAddresses.misc.PendleRedeemProxy,
      contracts.PendleRedeemProxy.abi,
      this.signer.provider
    );
    const gasEstimate = await redeemProxyContract.connect(this.signer).estimateGas.redeem(...args);
    return redeemProxyContract.connect(this.signer).redeem(...args, getGasLimit(gasEstimate));
  }

  public async estimateGasForClaimYields(
    yts: Token[],
    ots: Token[],
    lps: Token[],
    interestStakingPools: StakingPool[],
    rewardStakingPools: StakingPool[]
  ): Promise<GasInfo> {
    const args: any[] = this.constructArgsForClaimYields(yts, ots, lps, interestStakingPools, rewardStakingPools);
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
      )}
  }
}
