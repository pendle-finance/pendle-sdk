import { BigNumber as BN, Bytes, Contract, providers, utils } from 'ethers';
import { mainnetContracts, kovanContracts, avalancheContracts, NetworkInfo, StakingPoolType } from './networks'
import { decimalsRecords, forgeIdsInBytes, gasBuffer, ONE_MINUTE, ONE_DAY, ZERO, LMStartTime, LMEpochDuration, ETHAddress } from './constants'
import { contracts } from "./contracts";
import { JsonRpcProvider } from '@ethersproject/providers';
import { DecimalsPrecision } from './math/marketMath';
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
  // console.log(getFunctionABIByName(abi, name))
  // console.log(returnedData)
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

export const isNativeOrEquivalent = (address: string, chainId?: number): boolean => {
  if (isSameAddress(address, ETHAddress)) return true;
  const WETH = distributeConstantsByNetwork(chainId).contractAddresses.tokens.WETH;
  return isSameAddress(address, WETH);
}

export const areBothNative = (address1: string, address2: string, chainId?: number) => {
  const networkInfo = distributeConstantsByNetwork(chainId);
  const WETH = networkInfo.contractAddresses.tokens.WETH;
  return (isSameAddress(address1, ETHAddress) || isSameAddress(address1, WETH)) 
    && (isSameAddress(address2, ETHAddress) || isSameAddress(address2, WETH)); 
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
    case forgeIdsInBytes.WONDERLAND:
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
      return contracts.PendleGenericLiquidityMiningMulti;

    case StakingPoolType.LmV2Multi:
      return contracts.PendleLiquidityMiningBaseV2Multi;

    case StakingPoolType.PendleSingleSided:
      return contracts.PendleSingleSidedStaking;
  }
}

export const getCurrentTimestamp = async (provider: JsonRpcProvider): Promise<number> => {
  const latestBlockNumber = await provider.getBlockNumber();
  const currentTime: number = (await provider.getBlock(latestBlockNumber)).timestamp;
  return currentTime;
}
export function getCurrentTimestampLocal() {
  let curHour = Math.floor(Date.now() / 1000);
  return curHour;
}

export async function isExpired(expiry: number, provider: JsonRpcProvider): Promise<boolean> {
  const currentTime = await getCurrentTimestamp(provider);
  return currentTime > expiry;
}

export function getLMStartTime (chainId: number | undefined): BN {
  switch (chainId) {
    case 1:
    case undefined:
      return LMStartTime[1];

    case 43114:
    case 42:
      return LMStartTime[chainId];

    default:
      throw Error(`Unknown chainId ${chainId}`);
  }
}

export function getCurrentEpochId (currentTime: number | BN, startTime: number | BN, epochDuration: number | BN): number {
  return BN.from(currentTime).sub(startTime).div(epochDuration).add(1).toNumber();
}

export async function getCurrentEpochEndTime(signer: providers.JsonRpcSigner, chainId: number) {
  const currentTime = await getCurrentTimestamp(signer.provider);
  const epochId = getCurrentEpochId(currentTime, getLMStartTime(chainId), LMEpochDuration)
  return getLMStartTime(chainId).add(LMEpochDuration.mul(epochId)).toString();
}

export function xor (a: boolean, b: boolean){ return a != b;}


export function getGasLimitWithETH (estimate: BN, value: BN) {
  var buffer: number = gasBuffer;
  var bufferedGasLimit: BN = ZERO;
  var cnter = 0;
  while (buffer > 0 && cnter < DecimalsPrecision) {
    bufferedGasLimit = bufferedGasLimit.add(estimate.mul(buffer - (buffer % 1)));
    buffer = 10 * (buffer % 1);
    estimate = estimate.div(10);
    cnter++;
  }
  return { gasLimit: bufferedGasLimit, value: value }
}

export async function getBlocksomeDurationEarlier  (duration: number, chainId: number | undefined, provider: JsonRpcProvider): Promise<number | undefined> {
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
      throw Error(`Unsupported chain ${chainId} in getBlocksomeDurationEarlier`)
  }
  const latestBlockNumber = await provider.getBlockNumber();
  const currentTime: number = (await provider.getBlock(latestBlockNumber)).timestamp;
  const targetTime: number = currentTime - duration;
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

export async function submitTransaction(contract: Contract, signer: providers.JsonRpcSigner, funcName: string, args: any[], value: BN = ZERO): Promise<providers.TransactionResponse> {
  const gasEstimate: BN = await contract.connect(signer).estimateGas[funcName](...args, { value: value });
  return contract.connect(signer)[funcName](...args, getGasLimitWithETH(gasEstimate, value));
}

export async function submitTransactionWithBinarySearchedGasLimit(contract: Contract, isRedeemProxy: boolean, signer: providers.JsonRpcSigner, funcName: string, args: any[], value: BN = ZERO): Promise<providers.TransactionResponse> {
  const gasEstimate: BN = await binarySearchGas(contract, isRedeemProxy, await signer.getAddress(), funcName, args, value);
  return contract.connect(signer)[funcName](...args, {gasLimit: gasEstimate, value: value});
}

export async function estimateGas(contract: Contract, fromAddress: string, funcName: string, args: any[], value: BN = ZERO): Promise<BN> {
  const gasEstimate: BN = await contract.estimateGas[funcName](...args, { from: fromAddress, value: value });
  return BN.from(getGasLimitWithETH(gasEstimate, value).gasLimit);
}

async function isGasLimitSufficient(contract: Contract, fromAddress: string, funcName: string, args: any[], value: BN, gasLimit: BN, isRedeemProxy: boolean): Promise<boolean> {
  console.log(args, gasLimit);
  var isSuccessful = await contract.callStatic[funcName](...args, {from: fromAddress, value: value, gasLimit: gasLimit})
                            .then((res) => {
                              if (!isRedeemProxy) return true;
                              for (const reason of res.lmRewardsFailureReasons) {
                                if (reason !== "") return false;
                              }
                              for (const reason of res.lmInterestsFailureReasons) {
                                if (reason !== "") return false;
                              }
                              return true;
                            })
                            .catch((err: any) => {return false;})
  return isSuccessful;
}

export async function binarySearchGas(contract: Contract, isRedeemProxyOld: boolean, fromAddress: string, funcName: string, args: any[], value: BN = ZERO): Promise<BN> {
  const ethersEstimate: BN = await contract.estimateGas[funcName](...args, { from: fromAddress, value: value });
  var leftBound = ethersEstimate; var rightBound = ethersEstimate.mul(3);

  if (! await isGasLimitSufficient(contract, fromAddress, funcName, args, value, rightBound, isRedeemProxyOld)) throw new Error(`Cannot Estimate Gas`);

  var gasLimitRange = BN.from(100000);
  // Invariant (assumption): rightBound gas limit is always sufficient
  while (true) {
    if (rightBound.sub(leftBound).lt(gasLimitRange)) return rightBound;
    var mid = (leftBound.add(rightBound)).div(2);
    var isSufficient = await isGasLimitSufficient(contract, fromAddress, funcName, args, value, mid, isRedeemProxyOld);
    console.log(`${mid.toString()} gas in ${isSufficient ? "enough" : "not enough"}`);
    if (isSufficient) {
      rightBound = mid;
    } else {
      leftBound = mid;
    }
  }
}

export function getInTokenAddress(path: string[]): string {
  return path[0];
}

export function getOutTokenAddress(path: string[]): string {
  return path[path.length - 1];
}