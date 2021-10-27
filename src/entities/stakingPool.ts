import { providers, Contract, BigNumber as BN } from 'ethers';
// import { contractAddresses } from '../constants';
import { getCurrentEpochId, indexRange, distributeConstantsByNetwork, isSameAddress, getCurrentTimestamp, getABIByStakingPoolType, getGasLimit, getBlockOneDayEarlier, Call_MultiCall, Result_MultiCall, formatOutput } from '../helpers'
import { ZERO, LMEpochDuration, LMStartTime, VestingEpoches, ALLOCATION_DENOMINATOR, dummyAddress, HG } from '../constants';
import { contracts } from '../contracts';
import { Token } from './token';
import { TokenAmount } from './tokenAmount';
import { NetworkInfo, LMINFO, StakingPoolType } from '../networks';
import { CurrencyAmount } from './currencyAmount';
import { PendleMarket } from './market';
import { Yt } from './yt';
import BigNumber from 'bignumber.js';
import { fetchTokenPrice } from '../fetchers/priceFetcher';
import { calcLMRewardApr, calcValuation, DecimalsPrecision } from '../math/marketMath';
import { AprInfo } from './types';
import { MasterChef } from './masterChef';
import { PairTokens, PairUints } from './types';

export interface StakingPoolId {
  address: string;
  inputTokenAddress: string;
  contractType: string;
}

export enum YieldType {
  INTEREST = "interest",
  REWARDS = "reward"
}

export type YieldInfo = {
  yield: TokenAmount,
  yieldType: YieldType
}

export type PoolYields = {
  address: string; // pool
  inputToken: Token;
  yields: YieldInfo[];
};

export type StakedAmount = {
  amount: TokenAmount;
  valuation: CurrencyAmount;
}

export const populatePoolYields = (LmInfo: LMINFO, interestAmount: string, rewardAmount: string, decimalsRecord: Record<string, number>): PoolYields => {
  const yields: YieldInfo[] = [
    {
      yield: new TokenAmount(
        new Token(
          LmInfo.rewardTokenAddresses[0],
          decimalsRecord[LmInfo.rewardTokenAddresses[0]]
        ),
        rewardAmount
      ),
      yieldType: YieldType.REWARDS
    }
  ];
  if (LmInfo.interestTokensAddresses.length > 0) {
    yields.push({
      yield: new TokenAmount(
        new Token(
          LmInfo.interestTokensAddresses[0],
          decimalsRecord[LmInfo.interestTokensAddresses[0]]
        ),
        interestAmount
      ),
      yieldType: YieldType.INTEREST
    })
  }
  return {
    address: LmInfo.address,
    inputToken: new Token(
      LmInfo.inputTokenAddress,
      decimalsRecord[LmInfo.inputTokenAddress]
    ),
    yields: yields
  }
}

export type PoolAccruingRewards = {
  address: string;
  inputToken: Token;
  accruingRewards: FutureEpochRewards[];
};

export const populatePoolAccruingRewards = (LmInfo: LMINFO, tentativeReward: BN, currentEpochId: number, vestingEpoches: number, decimalsRecord: Record<string, number>): PoolAccruingRewards => {
  return {
    address: LmInfo.address,
    inputToken: new Token(
      LmInfo.inputTokenAddress,
      decimalsRecord[LmInfo.inputTokenAddress]
    ),
    accruingRewards: indexRange(0, vestingEpoches).map((i: number): FutureEpochRewards => {
      return {
        epochId: i + currentEpochId,
        rewards: [
          new TokenAmount(
            new Token(
              LmInfo.rewardTokenAddresses[0],
              decimalsRecord[LmInfo.rewardTokenAddresses[0]],
            ),
            tentativeReward.div(vestingEpoches).toString()
          )
        ]
      }
    })
  }
}

export type PoolVestedRewards = {
  address: string;
  inputToken: Token;
  vestedRewards: FutureEpochRewards[];
};

export const populatePoolVestedRewards = (LmInfo: LMINFO, vestedRewards: BN[], currentEpochId: number, decimalsRecord: Record<string, number>): PoolVestedRewards => {
  return {
    address: LmInfo.address,
    inputToken: new Token(
      LmInfo.inputTokenAddress,
      decimalsRecord[LmInfo.inputTokenAddress]
    ),
    vestedRewards: indexRange(0, vestedRewards.length).map((i: number): FutureEpochRewards => {
      return {
        epochId: i + currentEpochId,
        rewards: [
          new TokenAmount(
            new Token(
              LmInfo.rewardTokenAddresses[0],
              decimalsRecord[LmInfo.rewardTokenAddresses[0]],
            ),
            vestedRewards[i].toString()
          )
        ]
      }
    })
  }
}

export type FutureEpochRewards = {
  epochId: number;
  rewards: TokenAmount[];
};


const STAKINGPOOL_NOT_EXIST = new Error("No Staking pool is found at the given address and input token.")

export class StakingPool {
  public readonly address: string;
  public readonly inputToken: Token;
  public readonly rewardTokens: Token[]; // Should always be PENDLE
  public readonly interestTokens?: Token[]; //
  public readonly contractType: StakingPoolType;

  constructor(
    address: string,
    inputToken: Token,
    rewardTokens: Token[],
    contractType: StakingPoolType,
    interestTokens?: Token[],
  ) {
    this.address = address;
    this.inputToken = inputToken;
    this.rewardTokens = rewardTokens;
    this.interestTokens = interestTokens;
    this.contractType = contractType;
  }

  public static find(address: string, inputTokenAddress: string, chainId?: number): StakingPool {
    const networkInfo: NetworkInfo = distributeConstantsByNetwork(chainId);
    const lmInfo: LMINFO | undefined = networkInfo.contractAddresses.stakingPools.find((s: LMINFO) => {
      return isSameAddress(s.address, address) && isSameAddress(s.inputTokenAddress, inputTokenAddress);
    })
    if (lmInfo === undefined) {
      throw STAKINGPOOL_NOT_EXIST;
    }
    return new StakingPool(
      address.toLowerCase(),
      new Token(
        inputTokenAddress.toLowerCase(),
        networkInfo.decimalsRecord[inputTokenAddress.toLowerCase()]
      ),
      lmInfo.rewardTokenAddresses.map((s: string) => {
        return new Token(
          s.toLowerCase(),
          networkInfo.decimalsRecord[s.toLowerCase()]
        )
      }),
      lmInfo.contractType,
      lmInfo.interestTokensAddresses.map((s: string) => {
        return new Token(
          s.toLowerCase(),
          networkInfo.decimalsRecord[s.toLowerCase()]
        )
      })
    )
  }

  public static methods(signer: providers.JsonRpcSigner, chainId?: number): Record<string, any> {

    const networkInfo: NetworkInfo = distributeConstantsByNetwork(chainId);
    const stakingPools: LMINFO[] = networkInfo.contractAddresses.stakingPools;

    const redeemProxyContract = new Contract(
      networkInfo.contractAddresses.misc.PendleRedeemProxy,
      contracts.PendleRedeemProxy.abi,
      signer.provider
    );

    const liquidityRewardsProxyContract = new Contract(
      networkInfo.contractAddresses.misc.PendleLiquidityRewardsProxy,
      contracts.PendleLiquidityRewardsProxy.abi,
      signer.provider
    )

    const multiCallV2Contract = new Contract(
      networkInfo.contractAddresses.misc.MultiCallV2,
      contracts.MultiCallV2.abi,
      signer.provider
    )

    const decimalsRecord: Record<string, number> = networkInfo.decimalsRecord;

    const Lm1s: any[] = stakingPools.filter((stakingPoolInfo: LMINFO) => {
      return stakingPoolInfo.contractType == StakingPoolType.LmV1;
    })
    const Lm2s: any[] = stakingPools.filter((stakingPoolInfo: LMINFO) => {
      return stakingPoolInfo.contractType == StakingPoolType.LmV2;
    })

    const fetchClaimableYields = async (
      userAddress: string
    ): Promise<PoolYields[]> => {
      const calls: Call_MultiCall[] = [];
      const lm1sInterestsCallData: string = (await redeemProxyContract.populateTransaction.redeemLmInterests(
        Lm1s.map((LmInfo: any) => LmInfo.address),
        Lm1s.map((LmInfo: any) => LmInfo.expiry),
        userAddress
      )).data!;
      calls.push({ target: redeemProxyContract.address, callData: lm1sInterestsCallData })
      const lm1sRewardsCallData: string = (await redeemProxyContract.populateTransaction.redeemLmRewards(
        Lm1s.map((LmInfo: any) => LmInfo.address),
        Lm1s.map((LmInfo: any) => LmInfo.expiry),
        userAddress
      )).data!;
      calls.push({target: redeemProxyContract.address, callData: lm1sRewardsCallData});

      const lm2sInterestsCallData: string = (await redeemProxyContract.populateTransaction.redeemLmV2Interests(
        Lm2s.map((LmInfo: any) => LmInfo.address),
        userAddress
      )).data!;
      calls.push({target: redeemProxyContract.address, callData: lm2sInterestsCallData});
      const lm2sRewardsCallData: string = (await redeemProxyContract.populateTransaction.redeemLmV2Rewards(
        Lm2s.map((LmInfo: any) => LmInfo.address),
        userAddress
      )).data!;
      calls.push({target: redeemProxyContract.address, callData: lm2sRewardsCallData});

      const returnedData: Result_MultiCall[] = (await multiCallV2Contract.callStatic.tryBlockAndAggregate(false, calls)).returnData;

      const userLm1Interests: BN[] = formatOutput(returnedData[0].returnData, contracts.PendleRedeemProxy.abi, "redeemLmInterests")[0];
      const userLm1Rewards: BN[] = formatOutput(returnedData[1].returnData, contracts.PendleRedeemProxy.abi, "redeemLmRewards")[0];
      const userLm2Interests: BN[] = formatOutput(returnedData[2].returnData, contracts.PendleRedeemProxy.abi, "redeemLmV2Interests")[0];
      const userLm2Rewards: BN[] = formatOutput(returnedData[3].returnData, contracts.PendleRedeemProxy.abi, "redeemLmV2Rewards")[0];

      const Lm1InterestsAndRewards = indexRange(0, Lm1s.length).map((i: number) => {
        return populatePoolYields(Lm1s[i], userLm1Interests[i].toString(), userLm1Rewards[i].toString(), decimalsRecord);
      });

      const Lm2InterestsAndRewards = indexRange(0, Lm2s.length).map((i: number) => {
        return populatePoolYields(Lm2s[i], userLm2Interests[i].toString(), userLm2Rewards[i].toString(), decimalsRecord);
      });

      return Lm1InterestsAndRewards.concat(Lm2InterestsAndRewards);
    };

    const fetchAccruingRewards = async (
      userAddress: string
    ): Promise<PoolAccruingRewards[]> => {

      const Lm1AccruingRewardsCalls: Call_MultiCall[] = await Promise.all(Lm1s.map(async function (LmInfo: LMINFO) {
        return {
          target: liquidityRewardsProxyContract.address,
          callData: (await liquidityRewardsProxyContract.populateTransaction.redeemAndCalculateAccruing(LmInfo.address, LmInfo.expiry, userAddress)).data!
        }
      }));
      const Lm2AccruingRewardsCalls: Call_MultiCall[] = await Promise.all(Lm2s.slice(0,).map(async function (LmInfo: LMINFO) {
        return {
          target: liquidityRewardsProxyContract.address,
          callData: (await liquidityRewardsProxyContract.populateTransaction.redeemAndCalculateAccruingV2(LmInfo.address, userAddress)).data!
        }
      }));
      const calls = Lm1AccruingRewardsCalls.concat(Lm2AccruingRewardsCalls);
      var returnedData: Result_MultiCall[] = [];
      const batchSize: number = 5;
      for (var i: number = 0; true; i ++) {
        var leftInd: number = i * batchSize;
        var rightInd: number = Math.min(calls.length, (i+1)*batchSize);
        returnedData = returnedData.concat((await multiCallV2Contract.callStatic.tryBlockAndAggregate(false, calls.slice(leftInd,rightInd), HG)).returnData);
        if (rightInd == calls.length) break;
      }

      const userLm1AccruingRewards: BN[] = indexRange(0, Lm1s.length).map((i: number) => {
        if (returnedData[i].success) {
          return formatOutput(returnedData[i].returnData, contracts.PendleLiquidityRewardsProxy.abi, "redeemAndCalculateAccruing")[4];
        } else {
          return ZERO;
        }
      })

      const userLm2AccruingRewards: BN[] = indexRange(Lm1s.length, Lm1s.length + Lm2s.length).map((i: number) => {
        if (returnedData[i].success) {
          return formatOutput(returnedData[i].returnData, contracts.PendleLiquidityRewardsProxy.abi, "redeemAndCalculateAccruingV2")[4];
        } else {
          return ZERO;
        }
      })

      const currentTime: number = await getCurrentTimestamp(signer.provider);
      const currentEpochId = getCurrentEpochId(currentTime, LMStartTime, LMEpochDuration);

      const userLm1AccruingRewardsFormatted = indexRange(0, Lm1s.length).map((i: number) => {
        return populatePoolAccruingRewards(Lm1s[i], userLm1AccruingRewards[i], currentEpochId, VestingEpoches, decimalsRecord);
      });
      const userLm2AccruingRewardsFormatted = indexRange(0, Lm2s.length).map((i: number) => {
        return populatePoolAccruingRewards(Lm2s[i], userLm2AccruingRewards[i], currentEpochId, VestingEpoches, decimalsRecord);
      });
      return userLm1AccruingRewardsFormatted.concat(userLm2AccruingRewardsFormatted);
    };

    const fetchVestedRewards = async (
      userAddress: string
    ): Promise<PoolVestedRewards[]> => {
      const Lm1VestedRewardsCalls: Call_MultiCall[] = await Promise.all(Lm1s.map(async function (LmInfo: LMINFO) {
        return {
          target: liquidityRewardsProxyContract.address,
          callData: (await liquidityRewardsProxyContract.populateTransaction.redeemAndCalculateVested(LmInfo.address, [LmInfo.expiry], userAddress)).data!
        }
      }));
      const Lm2VestedRewardsCalls: Call_MultiCall[] = await Promise.all(Lm2s.map(async function (LmInfo: LMINFO) {
        return {
          target: liquidityRewardsProxyContract.address,
          callData: (await liquidityRewardsProxyContract.populateTransaction.redeemAndCalculateVestedV2(LmInfo.address, userAddress)).data!
        }
      }));
      const calls = Lm1VestedRewardsCalls.concat(Lm2VestedRewardsCalls);
      var returnedData: Result_MultiCall[] = [];
      const batchSize: number = 5;
      for (var i: number = 0; true; i ++) {
        var leftInd: number = i * batchSize;
        var rightInd: number = Math.min(calls.length, (i+1)*batchSize);
        returnedData = returnedData.concat((await multiCallV2Contract.callStatic.tryBlockAndAggregate(false, calls.slice(leftInd,rightInd), HG)).returnData);
        if (rightInd == calls.length) break;
      }

      const userLm1VestedRewards: BN[][] = indexRange(0, Lm1s.length).map((i: number) => {
        if (returnedData[i].success) {
          return formatOutput(returnedData[i].returnData, contracts.PendleLiquidityRewardsProxy.abi, "redeemAndCalculateVested")[1];
        } else {
          return Array(VestingEpoches - 1).fill(ZERO);
        }
      })
      const userLm2VestedRewards: BN[][] = indexRange(Lm1s.length, Lm1s.length + Lm2s.length).map((i: number) => {
        if (returnedData[i].success) {
          return formatOutput(returnedData[i].returnData, contracts.PendleLiquidityRewardsProxy.abi, "redeemAndCalculateVestedV2")[1];
        } else {
          return Array(VestingEpoches - 1).fill(ZERO);
        }
      })

      const currentTime: number = await getCurrentTimestamp(signer.provider);
      const currentEpochId = getCurrentEpochId(currentTime, LMStartTime, LMEpochDuration);

      const userLm1VestedRewardsFormatted = indexRange(0, Lm1s.length).map((i: number) => {
        return populatePoolVestedRewards(Lm1s[i], userLm1VestedRewards[i], currentEpochId, decimalsRecord);
      });
      const userLm2VestedRewardsFormatted = indexRange(0, Lm2s.length).map((i: number) => {
        return populatePoolVestedRewards(Lm2s[i], userLm2VestedRewards[i], currentEpochId, decimalsRecord);
      });
      return userLm1VestedRewardsFormatted.concat(userLm2VestedRewardsFormatted);
    };

    return {
      fetchClaimableYields,
      fetchAccruingRewards,
      fetchVestedRewards,
    };
  }

  public methods(signer: providers.JsonRpcSigner, chainId?: number): Record<string, any> {

    const UNSUPPORTED_TYPE: string = `Unsupported Staking Pool Type ${this.contractType}`;

    const networkInfo: NetworkInfo = distributeConstantsByNetwork(chainId);
    const stakingPoolContract: Contract = new Contract(this.address, getABIByStakingPoolType(this.contractType).abi, signer.provider)
    let expiry: number = 0, market: PendleMarket;
    if (this.contractType == StakingPoolType.LmV1) {
      market = PendleMarket.find(this.inputToken.address, chainId);
      const yt: Yt = Yt.find(market.tokens[0].address, chainId);
      expiry = yt.expiry!;
    }

    const stake = async(amount: TokenAmount): Promise<providers.TransactionResponse> => {
      if (this.contractType == StakingPoolType.LmV1) {
        const args: any[] = [
          expiry,
          BN.from(amount.rawAmount())
        ]
        const gasEstimate: BN = await stakingPoolContract.connect(signer).estimateGas.stake(...args);
        return stakingPoolContract.connect(signer).stake(...args, getGasLimit(gasEstimate));
      } else if (this.contractType == StakingPoolType.LmV2 || this.contractType == StakingPoolType.LmV2Multi) {
        const args: any[] = [
          await signer.getAddress(),
          BN.from(amount.rawAmount())
        ];
        const gasEstimate: BN = await stakingPoolContract.connect(signer).estimateGas.stake(...args);
        return stakingPoolContract.connect(signer).stake(...args, getGasLimit(gasEstimate));
      } else if (this.contractType == StakingPoolType.PendleSingleSided) {
        const args: any[] = [
          BN.from(amount.rawAmount())
        ]
        const gasEstimate: BN = await stakingPoolContract.connect(signer).estimateGas.enter(...args);
        return stakingPoolContract.connect(signer).enter(...args, getGasLimit(gasEstimate));
      } else if (this.contractType == StakingPoolType.LmV1Multi) {
        const args: any[] = [
          await signer.getAddress(),
          expiry,
          BN.from(amount.rawAmount())
        ];
        const gasEstimate: BN = await stakingPoolContract.connect(signer).estimateGas.stake(...args);
        return stakingPoolContract.connect(signer).stake(...args, getGasLimit(gasEstimate));
      } else{
        throw Error(UNSUPPORTED_TYPE)
      }
    }

    const unstake = async(amount: TokenAmount): Promise<providers.TransactionResponse> => {
      if (this.contractType == StakingPoolType.LmV1) {
        const args: any[] = [
          expiry,
          BN.from(amount.rawAmount())
        ];
        const gasEstimate: BN = await stakingPoolContract.connect(signer).estimateGas.withdraw(...args);
        return stakingPoolContract.connect(signer).withdraw(...args, getGasLimit(gasEstimate));
      } else if (this.contractType == StakingPoolType.LmV2 || this.contractType == StakingPoolType.LmV2Multi) {
        const args: any[] = [
          await signer.getAddress(),
          BN.from(amount.rawAmount())
        ];
        const gasEstimate: BN = await stakingPoolContract.connect(signer).estimateGas.withdraw(...args);
        return stakingPoolContract.connect(signer).withdraw(...args, getGasLimit(gasEstimate));
      } else if (this.contractType == StakingPoolType.PendleSingleSided) {
        const userAddress: string = await signer.getAddress();
        const userPendleBalance: BN = BN.from((await balanceOf(userAddress)).amount.rawAmount());
        const userShareBalance: BN = await stakingPoolContract.balances(userAddress);
        const shareToRedeem: BN = BN.from(amount.rawAmount()).mul(userShareBalance).div(userPendleBalance);

        const args: any[] = [
          shareToRedeem
        ];
        const gasEstimate: BN = await stakingPoolContract.connect(signer).leave(...args);
        return stakingPoolContract.connect(signer).leave(...args, getGasLimit(gasEstimate));
      } else if (this.contractType == StakingPoolType.LmV1Multi) {
        const args: any[] = [
          await signer.getAddress(),
          expiry,
          BN.from(amount.rawAmount())
        ];
        const gasEstimate: BN = await stakingPoolContract.connect(signer).estimateGas.withdraw(...args);
        return stakingPoolContract.connect(signer).withdraw(...args, getGasLimit(gasEstimate));
      } else {
        throw Error(UNSUPPORTED_TYPE);
      }
    }

    const getTotalStaked = async (): Promise<StakedAmount> => {
      if (this.contractType == StakingPoolType.LmV1 || this.contractType == StakingPoolType.LmV1Multi) {
        const totalStakeLP: BN = (await stakingPoolContract.readExpiryData(expiry)).totalStakeLP;
        const marketLPPrice: BigNumber = await market.methods(signer, chainId).getLPPriceBigNumber();
        return populateStakedAmount(totalStakeLP, marketLPPrice);
      } else if (this.contractType == StakingPoolType.LmV2 || this.contractType == StakingPoolType.LmV2Multi) {
        const totalStakeLP: BN = await stakingPoolContract.totalStake();
        const marketLPPrice: BigNumber = await fetchTokenPrice({address: this.inputToken.address, signer, chainId});
        return populateStakedAmount(totalStakeLP, marketLPPrice);
      } else if (this.contractType == StakingPoolType.PendleSingleSided) {
        const PENDLEContract: Contract = new Contract(this.inputToken.address, contracts.IERC20.abi, signer.provider);
        const totalStake: BN = await PENDLEContract.balanceOf(this.address);
        const PENDLEPrice: BigNumber = await fetchTokenPrice({address: this.inputToken.address, signer, chainId});
        return populateStakedAmount(totalStake, PENDLEPrice);
      } else {
        throw Error(UNSUPPORTED_TYPE);
      }
    }

    const balanceOf = async(address: string): Promise<StakedAmount> => {
      if (this.contractType == StakingPoolType.LmV1 || this.contractType == StakingPoolType.LmV1Multi) {
        const stakedLP: BN = (await stakingPoolContract.readUserSpecificExpiryData(expiry, address)).balances;
        const marketLPPrice: BigNumber = await market.methods(signer, chainId).getLPPriceBigNumber();
        return populateStakedAmount(stakedLP, marketLPPrice);
      } else if (this.contractType == StakingPoolType.LmV2 || this.contractType == StakingPoolType.LmV2Multi) {
        const stakedLP: BN = await stakingPoolContract.balances(address);
        const marketLPPrice: BigNumber = await fetchTokenPrice({address: this.inputToken.address, signer, chainId});
        return populateStakedAmount(stakedLP, marketLPPrice);
      } else if (this.contractType == StakingPoolType.PendleSingleSided) {
        const userShareBalance: BN = await stakingPoolContract.balances(address);
        const userPendleBalance: BN = await stakingPoolContract.callStatic.leave(userShareBalance, {from: address});
        const PENDLEPrice: BigNumber = await fetchTokenPrice({address: this.inputToken.address, signer, chainId});
        return populateStakedAmount(userPendleBalance, PENDLEPrice);
      } else {
        throw Error(UNSUPPORTED_TYPE);
      }
    }

    const getTotalRewardForOneEpoch = async(epochData: any, allocPoint: BN = ALLOCATION_DENOMINATOR): Promise<TokenAmount[]> => {
      if (this.contractType == StakingPoolType.LmV1 || this.contractType == StakingPoolType.LmV2) {
        const rewardToken: Token = this.rewardTokens[0];
        return [
          new TokenAmount(
            rewardToken,
            epochData.totalRewards.mul(allocPoint).div(ALLOCATION_DENOMINATOR)
          )
        ]
      } else if (this.contractType == StakingPoolType.LmV1Multi || this.contractType == StakingPoolType.LmV2Multi) {
        const rewardTokens: PairTokens = await stakingPoolContract.rewardTokens();
        const totalRewards: PairUints = epochData.totalRewards;
        return [
          new TokenAmount(
            this.rewardTokens.find((t:Token) => isSameAddress(t.address, rewardTokens.tokenA))!,
            totalRewards.uintA.mul(allocPoint).div(ALLOCATION_DENOMINATOR).toString()
          ),
          new TokenAmount(
            this.rewardTokens.find((t:Token) => isSameAddress(t.address, rewardTokens.tokenB))!,
            totalRewards.uintB.mul(allocPoint).div(ALLOCATION_DENOMINATOR).toString()
          )
        ]
      } else {
        throw Error("Not supported staking pool type")
      }
    }

    const rewardAprs = async(): Promise<AprInfo[]> => {
      if (this.contractType == StakingPoolType.LmV1 || this.contractType == StakingPoolType.LmV1Multi) {
        const stakedUSDValue: BigNumber = new BigNumber((await getTotalStaked()).valuation.amount);
        const startTime: BN = await stakingPoolContract.startTime();
        const curTime: number = await getCurrentTimestamp(signer.provider);
        const currentEpochId: number = getCurrentEpochId(curTime, startTime, LMEpochDuration);
        const latestSetting: any = await stakingPoolContract.latestSetting();
        const epochData: any = await stakingPoolContract.readEpochData(currentEpochId);

        const settingId = currentEpochId >= latestSetting.firstEpochToApply
            ? latestSetting.id
            : epochData.settingId;

        const allocPoint: BN = await stakingPoolContract.allocationSettings(settingId, expiry);
        const rewardsForThisExpiry: TokenAmount[] = await getTotalRewardForOneEpoch(epochData, allocPoint)

        const rewardsValue: BigNumber[] = await Promise.all(rewardsForThisExpiry.map(async (t: TokenAmount): Promise<BigNumber> => {
          return await calcValuation(await fetchTokenPrice({address: t.token.address, signer, chainId}), BN.from(t.rawAmount()), networkInfo.decimalsRecord[t.token.address]);
        }));
        const rewardApr: BigNumber = calcLMRewardApr(rewardsValue.reduce((p: BigNumber, c: BigNumber) => p.plus(c), new BigNumber(0)), stakedUSDValue, 52);
        return [{
          origin: 'Pendle',
          apr: rewardApr.toFixed(DecimalsPrecision)
        }]
      } else if (this.contractType == StakingPoolType.LmV2 || this.contractType == StakingPoolType.LmV2Multi) {
        const stakedUSDValue: BigNumber = new BigNumber((await getTotalStaked()).valuation.amount);
        const startTime: BN = await stakingPoolContract.startTime();
        const curTime: number = await getCurrentTimestamp(signer.provider);
        const currentEpochId: number = getCurrentEpochId(curTime, startTime, LMEpochDuration);
        const epochData: any = await stakingPoolContract.readEpochData(currentEpochId, dummyAddress);

        var aprInfos: AprInfo[] = [];
        const rewards: TokenAmount[] = await getTotalRewardForOneEpoch(epochData);
        const rewardsValue: BigNumber[] = await Promise.all(rewards.map(async (t: TokenAmount): Promise<BigNumber> => {
          return await calcValuation(await fetchTokenPrice({address: t.token.address, signer, chainId}), BN.from(t.rawAmount()), networkInfo.decimalsRecord[t.token.address]);
        }));
        aprInfos.push({
          origin: 'Pendle',
          apr: calcLMRewardApr(rewardsValue.reduce((p: BigNumber, c:BigNumber) => p.plus(c), new BigNumber(0)), stakedUSDValue, 52).toFixed(DecimalsPrecision)
        });
        if (this.interestTokens !== undefined && this.interestTokens?.length > 0) {
          const SLPLiquidityMiningContract: Contract = new Contract(this.address, contracts.PendleSLPLiquidityMining.abi, signer.provider);
          const pid: BN = await SLPLiquidityMiningContract.pid();
          aprInfos = aprInfos.concat(await MasterChef.methods(signer, chainId).getRewardsAprs(pid));
        }
        return aprInfos;
      } else if (this.contractType == StakingPoolType.PendleSingleSided) {
        const singleStakingManager: Contract = new Contract(networkInfo.contractAddresses.misc.PendleSingleStakingManager, contracts.PendleSingleStakingManager.abi, signer.provider);
        const rewardPerBlock: BN = await singleStakingManager.rewardPerBlock();
        const blockNumber: number = await signer.provider.getBlockNumber();
        const blockNumberOneDayAgo: number = (await getBlockOneDayEarlier(chainId, signer.provider))!;
        const blockPerDay: number = blockNumber - blockNumberOneDayAgo;
        const PENDLEContract: Contract = new Contract(this.inputToken.address, contracts.IERC20.abi, signer.provider);
        const PendleStaked: BN = await PENDLEContract.balanceOf(this.address); 
        return [{
          origin: 'Pendle',
          apr: calcLMRewardApr(new BigNumber(rewardPerBlock.mul(blockPerDay).toString()), new BigNumber(PendleStaked.toString()), 365).toFixed(DecimalsPrecision)
        }]     
      } else {
        throw Error(UNSUPPORTED_TYPE);
      }
    }

    const populateStakedAmount = (rawAmount: BN, price: BigNumber): StakedAmount => {
      return {
        amount: new TokenAmount(
          this.inputToken,
          rawAmount.toString()
        ),
        valuation: {
          currency: 'USD',
          amount: calcValuation(price, rawAmount, networkInfo.decimalsRecord[this.inputToken.address]).toNumber()
        }
      }
    }

    return {
      stake,
      unstake,
      getTotalStaked,
      balanceOf,
      rewardAprs
    }
  }
}
