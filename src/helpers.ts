import { BigNumber as BN, Contract, Bytes, utils, providers } from 'ethers';
import { mainnetContracts, kovanContracts, avalancheContracts, NetworkInfo, StakingPoolType } from './networks'
import { decimalsRecords, forgeIdsInBytes, gasBuffer, ONE_MINUTE, ONE_DAY } from './constants'
import { contracts } from "./contracts";
import { JsonRpcProvider } from '@ethersproject/providers';

export type Call_MultiCall = {
  target: string,
  callData: string
}

export type Result_MultiCall = {
  success: boolean,
  returnData: Bytes;
}

export function getFunctionABIByName(abi: any[], name: string): any {
  return abi.find((f: any) => f.name == name);
}

export function formatOutput(returnedData: any, abi: any, name: string) {
  return utils.defaultAbiCoder.decode(getFunctionABIByName(abi, name).outputs.map((f: any) => f.type), returnedData);
}


export const decimalFactor = (decimal: number): string => {
  return BN.from(10)
    .pow(decimal)
    .toString();
};

export const isSameAddress = (address1: string, address2: string): boolean => {
  return address1.toLowerCase() == address2.toLowerCase()
}

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
  } else if (chainId == 42) {
    return {
      chainId: 42,
      contractAddresses: kovanContracts,
      decimalsRecord: decimalsRecords.kovan
    }
  } else if (chainId == 43114) {
    return {
      chainId: 43114,
      contractAddresses: avalancheContracts,
      decimalsRecord: decimalsRecords.avalanche
    }
  } else {
    throw Error("Unsupported Network");
  }
}

export function getABIByForgeId(forgeIdInBytes: string): any {
  switch (forgeIdInBytes) {
    case forgeIdsInBytes.AAVE:
      return contracts.PendleAaveV2Forge;

    case forgeIdsInBytes.COMPOUND:
      return contracts.PendleCompoundForge;

    case forgeIdsInBytes.SUSHISWAP_SIMPLE:
    case forgeIdsInBytes.JOE_SIMPLE:
      return contracts.PendleSushiswapSimpleForge;

    case forgeIdsInBytes.SUSHISWAP_COMPLEX:
      return contracts.PendleSushiswapComplexForge;

    case forgeIdsInBytes.BENQI:
    case forgeIdsInBytes.COMPOUND_UPGRADED:
      return contracts.PendleCompoundV2Forge; 

    case forgeIdsInBytes.JOE_COMPLEX:
      return contracts.PendleSushiswapSimpleForge; // To-do

    case forgeIdsInBytes.XJOE:
      return contracts.PendleSushiswapSimpleForge; // To-do

    default: {
      throw Error("Unsupported Forge Id");
    }
  }
}

export function getABIByStakingPoolType(type: StakingPoolType): any {
  switch (type) {
    case StakingPoolType.LmV1:
      return contracts.PendleLiquidityMiningBase;

    case StakingPoolType.LmV2:
      return contracts.PendleLiquidityMiningV2Base;

    case StakingPoolType.LmV1Multi:
      return contracts.PendleLiquidityMiningBase; // To-do

    case StakingPoolType.LmV2Multi:
      return contracts.PendleLiquidityMiningV2Base; // To-do

    case StakingPoolType.PendleSingleSided:
      return contracts.PendleSingleSidedStaking;
  }
}

export const getCurrentTimestamp = async (provider: JsonRpcProvider): Promise<number> => {
  const latestBlockNumber = await provider.getBlockNumber();
  const currentTime: number = (await provider.getBlock(latestBlockNumber)).timestamp;
  return currentTime;
}

export const getCurrentEpochId = (currentTime: number | BN, startTime: number | BN, epochDuration: number | BN): number => {
  return BN.from(currentTime).sub(startTime).div(epochDuration).add(1).toNumber();
}

export const xor = (a: boolean, b: boolean) => a != b;

export const getGasLimit = (estimate: BN) => { return { gasLimit: Math.trunc(estimate.toNumber() * gasBuffer) } }

export const getGasLimitWithETH = (estimate: BN, value: BN) => { return { gasLimit: Math.trunc(estimate.toNumber() * gasBuffer), value: value } }

export const getBlockOneDayEarlier = async (chainId: number | undefined, provider: JsonRpcProvider): Promise<number | undefined> => {
  const margin: number = 30;
  var scanInterval: BN;
  switch (chainId) {
    case undefined:
    case 1:
      scanInterval = ONE_DAY.div(7);
      break
    
    case 42:
      scanInterval = ONE_DAY.div(5);
      break;

    case 43114:
      scanInterval = ONE_DAY;
      break

    default:
      throw Error(`Unsupported chain ${chainId} in getBlockOneDayEarlier`)
  }
  const latestBlockNumber = await provider.getBlockNumber();
  const currentTime: number = (await provider.getBlock(latestBlockNumber)).timestamp;
  const targetTime: number = currentTime - ONE_DAY.toNumber();
  var rightBound: BN = BN.from(await provider.getBlockNumber());
  var leftBound: BN = rightBound;
  while (true) {
    const block = await provider.getBlock(rightBound.sub(scanInterval).toNumber());
    if (block.timestamp >= targetTime - ONE_MINUTE.mul(margin).toNumber() && block.timestamp <= targetTime + ONE_MINUTE.mul(margin).toNumber()) {
      return rightBound.sub(scanInterval).toNumber();
    }
    if (block.timestamp < targetTime - ONE_MINUTE.mul(margin).toNumber()) {
      leftBound = rightBound.sub(scanInterval);
      break;
    }
    rightBound = rightBound.sub(scanInterval);
  }
  var l: number = leftBound.toNumber();
  var r: number = rightBound.toNumber();
  while (l < r) {
    var mid: number = Math.trunc((l + r) / 2);
    const block = await provider.getBlock(mid);
    if (block.timestamp >= targetTime - ONE_MINUTE.mul(margin).toNumber() && block.timestamp <= targetTime + ONE_MINUTE.mul(margin).toNumber()) {
      return mid;
    }
    if (block.timestamp > targetTime) {
      r = mid - 1;
    } else if (block.timestamp < targetTime) {
      l = mid + 1;
    }
  }
  return undefined;
}

// export const getGlobalEpochId = (): number => {
//   return (currentTime - launchTime) / 7 days + 1
// };
