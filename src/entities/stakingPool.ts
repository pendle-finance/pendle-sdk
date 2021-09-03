import { providers, Contract, BigNumber as BN } from 'ethers';
// import { contractAddresses } from '../constants';
import { getCurrentEpochId, indexRange, populatePoolAccruingRewards, populatePoolInterstAndRewards, populatePoolVestedRewards, distributeConstantsByNetwork } from '../helpers'
import { ZERO, LMEpochDuration, LMStartTime, contracts, VestingEpoches } from '../';
import { Token, TokenAmount } from '../entities'
import { NetworkInfo, LMINFO } from '../networks';

export interface StakingPoolId {
  address: string;
  inputTokenAddress: string;
  contractType: string;
}

export type PoolInterstAndRewards = {
  address: string;
  inputToken: Token;
  interest?: TokenAmount;
  claimableRewards: TokenAmount[];
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

    const decimalsRecord: Record<string, number> = networkInfo.decimalsRecord;

    const Lm1s: any[] = stakingPools.filter((stakingPoolInfo: any) => {
      return stakingPoolInfo.contractType == "PendleLiquidityMining";
    })
    const Lm2s: any[] = stakingPools.filter((stakingPoolInfo: any) => {
      return stakingPoolInfo.contractType == "PendleLiquidityMiningV2";
    })

    const fetchInterestsAndRewards = async (
      userAddress: string
    ): Promise<PoolInterstAndRewards[]> => {

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
        return populatePoolInterstAndRewards(Lm1s[i], userLm1Interests[i].toString(), userLm1Rewards[i].toString(), decimalsRecord);
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
        return populatePoolInterstAndRewards(Lm2s[i], userLm2Interests[i].toString(), userLm2Rewards[i].toString(), decimalsRecord);
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

      const currentTime: BN = BN.from(Date.now()).div(BN.from(1000));
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
      const userLm1VestedRewards = await Promise.all(Lm1s.map((LmInfo: any) => {
        return liquidityRewardsProxyContract.callStatic.redeemAndCalculateVested(LmInfo.address, [LmInfo.expiry], userAddress)
          .then((d: any) => d.vestedRewards)
          .catch(() => Array(VestingEpoches - 1).fill(ZERO));
      }));
      const userLm2VestedRewards = await Promise.all(Lm2s.map((LmInfo: any) => {
        return liquidityRewardsProxyContract.callStatic.redeemAndCalculateVested(LmInfo.address, userAddress)
          .then((d: any) => d.vestedRewards)
          .catch(() => Array(VestingEpoches - 1).fill(ZERO));
      }));

      const currentTime: BN = BN.from(Date.now()).div(BN.from(1000));
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
      fetchInterestsAndRewards,
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
