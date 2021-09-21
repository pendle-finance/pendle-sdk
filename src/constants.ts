import { BigNumber as BN, utils } from 'ethers';
import { mainnetDecimals } from './decimals';

export const dummyAddress: string = "0xDEADbeEfEEeEEEeEEEeEEeeeeeEeEEeeeeEEEEeE";
export const ETHAddress: string = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
export const forgeIdsInBytes = {
  COMPOUND: utils.formatBytes32String('CompoundV2'),
  COMPOUND_UPGRADED: utils.formatBytes32String('CompoundV2Upgraded'),
  AAVE: utils.formatBytes32String('AaveV2'),
  SUSHISWAP_SIMPLE: utils.formatBytes32String('SushiswapSimple'),
  SUSHISWAP_COMPLEX: utils.formatBytes32String('SushiswapComplex'),
};

export const marketFactoryIds = {
  COMPOUND: utils.formatBytes32String('Compound'),
  AAVE: utils.formatBytes32String('Aave'),
  GENERIC: utils.formatBytes32String('Generic'),
};

export const RONE = BN.from(2).pow(40);
export const ZERO = BN.from(0);
export const INF = BN.from(2)
  .pow(256)
  .sub(1);
export const EXP_2022 = BN.from("1672272000");
export const EXP_2021 = BN.from("1640822400");
export const ONE_DAY = BN.from("86400");
export const ONE_MINUTE = BN.from("60");
export const LMStartTime = BN.from("1623888000");
export const LMEpochDuration = BN.from("604800");
export const VestingEpoches = 5;

export const decimalsRecords: Record<string, Record<string, number>> = {
  mainnet: mainnetDecimals
};

export const gasBuffer: number = 1.3;