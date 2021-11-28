import { providers, } from 'ethers';
import { Token, TokenAmount, StakingPool } from './entities';
import { CurrencyAmount } from './entities/currencyAmount';
import { fetchValuation } from './fetchers';
import { indexRange } from './helpers';
import { GasInfo } from './fetchers/gasPriceFetcher';
import { RedeemProxy } from './entities/redeemProxy';
import { ChainSpecifics } from './entities/types';

export class Sdk {
  public readonly signer?: providers.JsonRpcSigner;
  public readonly provider: providers.JsonRpcProvider;
  public readonly chainId: number;

  public constructor({signer, provider, chainId}: ChainSpecifics) {
    this.signer = signer;
    this.provider = provider;
    this.chainId = chainId;
  }

  public async fetchValuations(amounts: TokenAmount[], chainId: number): Promise<CurrencyAmount[]> {
    const response: CurrencyAmount[] = new Array<CurrencyAmount>(amounts.length);
    const promises = indexRange(0, amounts.length).map(async (i: number) => {
      await fetchValuation(amounts[i], this.provider, chainId).then((r: CurrencyAmount) => response[i] = r);
    })
    await Promise.all(promises);
    return response;
  }

  public async claimYields({
    yts = [],
    ots = [],
    lps = [],
    interestStakingPools = [],
    rewardStakingPools = [],
    tokensToDistribute = []
  }: {
    yts?: Token[],
    ots?: Token[],
    lps?: Token[],
    interestStakingPools?: StakingPool[],
    rewardStakingPools?: StakingPool[],
    tokensToDistribute?: Token[]
  }): Promise<providers.TransactionResponse> {
    return RedeemProxy.methods({signer: this.signer, provider: this.provider ,chainId: this.chainId}).claimYields({yts, ots, lps, interestStakingPools, rewardStakingPools, tokensToDistribute});
  }

  public async estimateGasForClaimYields({
    yts = [],
    ots = [],
    lps = [],
    interestStakingPools = [],
    rewardStakingPools = [],
    tokensToDistribute = []
  }: {
    yts?: Token[],
    ots?: Token[],
    lps?: Token[],
    interestStakingPools?: StakingPool[],
    rewardStakingPools?: StakingPool[],
    tokensToDistribute?: Token[]
  }): Promise<GasInfo> {
    return RedeemProxy.methods({signer: this.signer, provider: this.provider ,chainId: this.chainId}).estimateGasForClaimYields({yts, ots, lps, interestStakingPools, rewardStakingPools, tokensToDistribute})
  }
}
