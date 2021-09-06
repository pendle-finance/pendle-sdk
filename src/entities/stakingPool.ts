import { providers, Contract, BigNumber as BN } from 'ethers';
// import { contractAddresses } from '../constants';
import { getCurrentEpochId, indexRange, populatePoolAccruingRewards, populatePoolYields, populatePoolVestedRewards, distributeConstantsByNetwork, Call_MultiCall, Result_MultiCall, formatOutput } from '../helpers'
import { ZERO, LMEpochDuration, LMStartTime, contracts, VestingEpoches } from '../';
import { Token, TokenAmount } from '../entities'
import { NetworkInfo, LMINFO } from '../networks';

export interface StakingPoolId {
  address: string;
  inputTokenAddress: string;
  contractType: string;
}

export enum YieldType {
  INTEREST = "interest",
  REWARDS = "rewards"
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

export type PoolAccruingRewards = {
  address: string;
  inputToken: Token;
  accruingRewards: FutureEpochRewards[];
};

export type PoolVestedRewards = {
  address: string;
  inputToken: Token;
  vestedRewards: FutureEpochRewards[];
};

export type FutureEpochRewards = {
  epochId: number;
  rewards: TokenAmount[];
};

export enum StakingPoolType {
  LmV1 = 'PendleLiquidityMining',
  LmV2 = 'PendleLiquidityMiningV2',
  PendleSingleSided = 'PendleSingleStaking',
}

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

    const multiCallV2Contract = new Contract(
      networkInfo.contractAddresses.misc.MultiCallV2,
      contracts.MultiCallV2.abi,
      provider.provider
    )

    const decimalsRecord: Record<string, number> = networkInfo.decimalsRecord;

    const Lm1s: any[] = stakingPools.filter((stakingPoolInfo: any) => {
      return stakingPoolInfo.contractType == "PendleLiquidityMining";
    })
    const Lm2s: any[] = stakingPools.filter((stakingPoolInfo: any) => {
      return stakingPoolInfo.contractType == "PendleLiquidityMiningV2";
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

      console.log(returnedData[0].returnData);
      console.log(userLm1Interests);

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
      const Lm2AccruingRewardsCalls: Call_MultiCall[] = await Promise.all(Lm2s.map(async function (LmInfo: LMINFO) {
        return {
          target: liquidityRewardsProxyContract.address,
          callData: (await liquidityRewardsProxyContract.populateTransaction.redeemAndCalculateAccruingV2(LmInfo.address, userAddress)).data!
        }
      }));
      const calls = Lm1AccruingRewardsCalls.concat(Lm2AccruingRewardsCalls);
      const returnedData: Result_MultiCall[] = (await multiCallV2Contract.callStatic.tryBlockAndAggregate(false, calls)).returnData;

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

      const latestBlockNumber = await provider.provider.getBlockNumber();
      const currentTime: number = (await provider.provider.getBlock(latestBlockNumber)).timestamp;
      const currentEpochId = getCurrentEpochId(currentTime, LMStartTime, LMEpochDuration);

      const userLm1AccruingRewardsFormatted = indexRange(0, Lm1s.length).map((i: number) => {
        return populatePoolAccruingRewards(Lm1s[i], userLm1AccruingRewards[i], currentEpochId, VestingEpoches, decimalsRecord);
      });
      const userLm2AccruingRewardsFormatted = indexRange(0, Lm1s.length).map((i: number) => {
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
      const returnedData: Result_MultiCall[] = (await multiCallV2Contract.callStatic.tryBlockAndAggregate(false, calls)).returnData;


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

      // const userLm1VestedRewards = await Promise.all(Lm1s.map((LmInfo: any) => {
      //   return liquidityRewardsProxyContract.callStatic.redeemAndCalculateVested(LmInfo.address, [LmInfo.expiry], userAddress)
      //     .then((d: any) => d.vestedRewards)
      //     .catch(() => Array(VestingEpoches - 1).fill(ZERO));
      // }));
      // const userLm2VestedRewards = await Promise.all(Lm2s.map((LmInfo: any) => {
      //   return liquidityRewardsProxyContract.callStatic.redeemAndCalculateVested(LmInfo.address, userAddress)
      //     .then((d: any) => d.vestedRewards)
      //     .catch(() => Array(VestingEpoches - 1).fill(ZERO));
      // }));

      const latestBlockNumber = await provider.provider.getBlockNumber();
      const currentTime: number = (await provider.provider.getBlock(latestBlockNumber)).timestamp;
      const currentEpochId = getCurrentEpochId(currentTime, LMStartTime, LMEpochDuration);

      const userLm1VestedRewardsFormatted = indexRange(0, Lm1s.length).map((i: number) => {
        return populatePoolVestedRewards(Lm1s[i], userLm1VestedRewards[i], currentEpochId, decimalsRecord);
      });
      const userLm2VestedRewardsFormatted = indexRange(0, Lm1s.length).map((i: number) => {
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
