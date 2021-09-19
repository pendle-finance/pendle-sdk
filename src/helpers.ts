import { BigNumber as BN, Contract } from 'ethers';
import { mainnetContracts, NetworkInfo } from './networks'
import { decimalsRecords, forgeIdsInBytes, gasBuffer } from './constants'
import { contracts } from "../contracts";
import { JsonRpcProvider } from '@ethersproject/providers';

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
      return contracts.PendleSushiswapSimpleForge;

    case forgeIdsInBytes.SUSHISWAP_COMPLEX:
      return contracts.PendleSushiswapComplexForge;

    default: {
      throw Error("Unsupported Forge Id");
    }
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

export const getDecimal = async (decimalsRecord: Record<string, number>, address: string, provider?: JsonRpcProvider): Promise<number> => {
  address = address.toLowerCase();
  if (decimalsRecord[address] === undefined) {
    if (provider === undefined) {
      throw Error(`Decimals for token ${address} not found, no Provider is provided.`);
    }
    const tokenContract = new Contract(address, contracts.IERC20.abi, provider!);
    const d: BN = await tokenContract.decimals();
    decimalsRecord[address] = d.toNumber();
  }
  return decimalsRecord[address];
}

export const xor = (a: boolean, b: boolean) => a!=b;

export const getGasLimit = (estimate:BN) => { return {gasLimit: Math.trunc(estimate.toNumber() * gasBuffer) }}

// export const getGlobalEpochId = (): number => {
//   return (currentTime - launchTime) / 7 days + 1
// };
