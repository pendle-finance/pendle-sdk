import { BigNumber as BN, utils } from 'ethers';

export const forgeIds = {
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
export const LMStartTime = BN.from("1623888000");
export const LMEpochDuration = BN.from("604800");
export const VestingEpoches = 5;

export const decimalsRecords: Record<string, Record<string, number>> = {
  mainnet: {
    "0x808507121b80c02388fad14726482e061b8da827": 18, // PENDLE
    "0xbcca60bb61934080951369a648fb03df4f96263c": 6, // aUSDC
    "0x5d3a536e4d6dbd6114cc1ead35777bab948e3643": 8, // cDAI
    "0x397ff1542f962076d0bfe58ea045ffa2d347aca0": 18, // SLP
    "0x37922c69b08babcceae735a31235c81f1d1e8e43": 18, // SLP
    "0x6b3595068778dd592e39a122f4f5a5cf09c90fe2": 18, // SUSHI
  }
};
