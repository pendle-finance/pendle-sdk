import { BigNumber as BN } from 'ethers';
import { TokenAmount, Token, PoolYields, YieldInfo, PoolAccruingRewards, FutureEpochRewards, PoolVestedRewards, YieldType } from './entities';
import { LMINFO, mainnetContracts, NetworkInfo } from './networks'
import { decimalsRecords, forgeIds } from './constants'
import { contracts } from "./contracts";

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

export const distributeConstantsByNetwork = (chainId?: number): NetworkInfo => {
  if (chainId === undefined || chainId == 1) { // Default to mainnet
    return {
      chainId: 1,
      contractAddresses: mainnetContracts,
      decimalsRecord: decimalsRecords.mainnet
    }
  } else {
    throw Error("Unsupported Network");
  }
}

export function getABIByForgeId(id: string): any {
  switch (id) {
    case forgeIds.AAVE:
      return contracts.PendleAaveV2Forge;

    case forgeIds.COMPOUND:
      return contracts.PendleCompoundForge;

    case forgeIds.SUSHISWAP_SIMPLE:
      return contracts.PendleSushiswapSimpleForge;

    case forgeIds.SUSHISWAP_COMPLEX:
      return contracts.PendleSushiswapComplexForge;

    default: {
      throw Error("Unsupported Forge Id");
    }
  }
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

export const getCurrentEpochId = (currentTime: number | BN, startTime: number | BN, epochDuration: number | BN): number => {
  return BN.from(currentTime).sub(startTime).div(epochDuration).add(1).toNumber();
}
// export const getGlobalEpochId = (): number => {
//   return (currentTime - launchTime) / 7 days + 1
// };
