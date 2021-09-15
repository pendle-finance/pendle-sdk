import { providers, Contract, BigNumber as BN } from 'ethers';
// import { contractAddresses } from '../constants';
import { getCurrentEpochId, indexRange, distributeConstantsByNetwork, isSameAddress } from '../helpers'
import { ZERO, LMEpochDuration, LMStartTime, VestingEpoches } from '../constants';
import { contracts } from '../contracts';
import { Token } from './token';
import { TokenAmount } from './tokenAmount';
import { NetworkInfo, LMINFO, StakingPoolType } from '../networks';

export interface StakingPoolId {
  address: string;
  inputTokenAddress: string;
  contractType: string;
}

export enum YieldType {
	INTEREST="interest",
	REWARDS="rewards"
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
  public readonly contractType?: StakingPoolType;

  constructor(
    address: string,
    inputToken: Token,
    rewardTokens: Token[],
    interestTokens?: Token[],
    contractType?: StakingPoolType
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
      lmInfo.interestTokensAddresses.map((s: string) => {
        return new Token(
          s.toLowerCase(),
          networkInfo.decimalsRecord[s.toLowerCase()]
        )
      }),
      lmInfo.contractType 
    )
}

  public static methods(provider: providers.JsonRpcSigner, chainId?: number): Record<string, any> {

    const networkInfo: NetworkInfo = distributeConstantsByNetwork(chainId);
    const stakingPools: LMINFO[] = networkInfo.contractAddresses.stakingPools;

    const redeemProxyContract = new Contract(
      networkInfo.contractAddresses.misc.PendleRedeemProxy,
      contracts.PendleRedeemProxy.abi,
      provider.provider
    );

    const liquidityRewardsProxyContract = new Contract(
      networkInfo.contractAddresses.misc.PendleLiquidityRewardsProxy,
      contracts.PendleLiquidityRewardsProxy.abi,
      provider.provider
    )

    const decimalsRecord: Record<string, number> = networkInfo.decimalsRecord;

    const Lm1s: any[] = stakingPools.filter((stakingPoolInfo: any) => {
      return stakingPoolInfo.contractType == StakingPoolType.LmV1;
    })
    const Lm2s: any[] = stakingPools.filter((stakingPoolInfo: any) => {
      return stakingPoolInfo.contractType == StakingPoolType.LmV2;
    })

    const fetchClaimableYields = async (
      userAddress: string
    ): Promise<PoolYields[]> => {
      const userLm1Interests = await redeemProxyContract.callStatic.redeemLmInterests(
        Lm1s.map((LmInfo: any) => LmInfo.address),
        Lm1s.map((LmInfo: any) => LmInfo.expiry),
        userAddress
      );
      const userLm1Rewards = await redeemProxyContract.callStatic.redeemLmRewards(
        Lm1s.map((LmInfo: any) => LmInfo.address),
        Lm1s.map((LmInfo: any) => LmInfo.expiry),
        userAddress
      )
      const Lm1InterestsAndRewards = indexRange(0, Lm1s.length).map((i: number) => {
        return populatePoolYields(Lm1s[i], userLm1Interests[i].toString(), userLm1Rewards[i].toString(), decimalsRecord);
      });

      const userLm2Interests = await redeemProxyContract.callStatic.redeemLmV2Interests(
        Lm2s.map((LmInfo: any) => LmInfo.address),
        userAddress
      );
      const userLm2Rewards = await redeemProxyContract.callStatic.redeemLmV2Rewards(
        Lm2s.map((LmInfo: any) => LmInfo.address),
        userAddress
      );
      const Lm2InterestsAndRewards = indexRange(0, Lm2s.length).map((i: number) => {
        return populatePoolYields(Lm2s[i], userLm2Interests[i].toString(), userLm2Rewards[i].toString(), decimalsRecord);
      });

      return Lm1InterestsAndRewards.concat(Lm2InterestsAndRewards);
    };

    const fetchAccruingRewards = async (
      userAddress: string
    ): Promise<PoolAccruingRewards[]> => {

      const userLm1AccruingRewards = await Promise.all(Lm1s.map((LmInfo: any) => {
        return liquidityRewardsProxyContract.callStatic.redeemAndCalculateAccruing(LmInfo.address, LmInfo.expiry, userAddress)
          .then((d: any) => d.userTentativeReward)
          .catch(() => ZERO);
      }));
      const userLm2AccruingRewards = await Promise.all(Lm2s.map((LmInfo: any) => {
        return liquidityRewardsProxyContract.callStatic.redeemAndCalculateAccruingV2(LmInfo.address, userAddress)
          .then((d: any) => d.userTentativeReward)
          .catch(() => ZERO);
      }))

      const latestBlockNumber = await provider.provider.getBlockNumber();
      const currentTime: number = (await provider.provider.getBlock(latestBlockNumber)).timestamp;
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
      const userLm1VestedRewards = await Promise.all(Lm1s.map((LmInfo: any) => {
        return liquidityRewardsProxyContract.callStatic.redeemAndCalculateVested(LmInfo.address, [LmInfo.expiry], userAddress)
          .then((d: any) => d.vestedRewards)
          .catch(() => Array(VestingEpoches - 1).fill(ZERO));
      }));
      const userLm2VestedRewards = await Promise.all(Lm2s.map((LmInfo: any) => {
        return liquidityRewardsProxyContract.callStatic.redeemAndCalculateVestedV2(LmInfo.address, userAddress)
          .then((d: any) => d.vestedRewards)
          .catch(() => Array(VestingEpoches - 1).fill(ZERO));
      }));

      const latestBlockNumber = await provider.provider.getBlockNumber();
      const currentTime: number = (await provider.provider.getBlock(latestBlockNumber)).timestamp;
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
  // sendStake(provider: providers.JsonRpcSigner, amount: string): Promise<Transaction> ; // returns a promise
  // sendUnstake(provider: providers.JsonRpcSigner, amount: string): Promise<any>; // returns a promise
  // callBalanceOf(
  //   provider: providers.JsonRpcSigner,
  //   userAddress: string
  // ): Promise<string>; // returns a promise
}

// export class LiquidityMiningV1Pool implements StakingPool {
//   public readonly address: string;
//   public readonly inputToken: Token;
//   public readonly rewardToken: Token; // Should always be PENDLE
//   public readonly interestToken?: Token; //
//   public readonly type = StakingPoolType.LmV1;
//
//   public constructor(
//     address: string,
//     inputToken: Token,
//     rewardToken: Token,
//     interestToken?: Token
//   ) {
//     this.address = address.toLowerCase();
//     this.inputToken = inputToken;
//     this.rewardToken = rewardToken;
//     this.interestToken = interestToken;
//   }
//
//   public sendStake(
//     provider: providers.JsonRpcSigner,
//     amount: string
//   ): Promise<Transaction> {
//     // returns a promise
//     const lmV1Contract = new Contract(
//       this.address,
//       contracts.PendleLiquidityMiningBase,
//       provider
//     );
//     return lmV1Contract.stake(this.inputToken.expiry, amount);
//   }
//
//   public sendUnstake(
//     provider: providers.JsonRpcSigner,
//     amount: string
//   ): Promise<Transaction> {
//     // returns a promise
//     const lmV1Contract = new Contract(
//       this.address,
//       contracts.PendleLiquidityMiningBase,
//       provider
//     );
//     return lmV1Contract.unstake(this.inputToken.expiry, amount);
//   }
//
//   public callBalanceOf(
//     provider: providers.JsonRpcSigner,
//     userAddress: string
//   ): Promise<string> {
//     const lmV1Contract = new Contract(
//       this.address,
//       contracts.PendleLiquidityMiningBase,
//       provider
//     );
//     return lmV1Contract.getBalances(this.inputToken.expiry, userAddress);
//   }
// }
