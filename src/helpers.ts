import { BigNumber as BN } from 'ethers';
import { TokenAmount, Token, PoolInterstAndRewards, PoolAccruingRewards, FutureEpochRewards, PoolVestedRewards } from './entities';

export const decimalFactor = (decimal: number): string => {
  return BN.from(10)
    .pow(decimal)
    .toString();
};

export const indexRange = (start: number, end: number): number[] => {
  const arr = [];
  for (let i = start; i < end; i++) {
    arr.push(i);
  }
  return arr;
};

export const populatePoolInterstAndRewards = (LmInfo: any, interestAmount: string, rewardAmount: string, decimalsRecord: Record<string, number>): PoolInterstAndRewards => {
  return {
    address: LmInfo.address,
    inputToken: LmInfo.inputTokenAddress,
    interest: LmInfo.interestTokensAddresses.length > 0
      ? new TokenAmount(
        new Token(
          LmInfo.interestTokensAddresses[0],
          decimalsRecord[LmInfo.interestTokensAddresses[0]]
        ),
        interestAmount
      )
      : undefined,
    claimableRewards: [
      new TokenAmount(
        new Token(
          LmInfo.rewardTokenAddresses[0],
          decimalsRecord[LmInfo.rewardTokenAddresses[0]]
        ),
        rewardAmount
      )
    ],
  }
}

export const populatePoolAccruingRewards = (LmInfo: any, tentativeReward: BN, currentEpochId: number, vestingEpoches: number, decimalsRecord: Record<string, number>): PoolAccruingRewards => {
  return {
    address: LmInfo.address,
    inputToken: LmInfo.inputTokenAddress,
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

export const populatePoolVestedRewards = (LmInfo: any, vestedRewards: BN[], currentEpochId: number, decimalsRecord: Record<string, number>): PoolVestedRewards => {
  return {
    address: LmInfo.address,
    inputToken: LmInfo.inputTokenAddress,
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

export const getCurrentEpochId = (currentTime: BN, startTime: BN, epochDuration: BN): number => {
  return currentTime.sub(startTime).div(epochDuration).add(1).toNumber();
}
// export const getGlobalEpochId = (): number => {
//   return (currentTime - launchTime) / 7 days + 1
// };
