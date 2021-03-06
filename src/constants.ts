import { BigNumber as BN, utils } from 'ethers';
import { mainnetDecimals, kovanDecimals, avalancheDecimals } from './decimals';

export const dummyAddress: string = "0xDEADbeEfEEeEEEeEEEeEEeeeeeEeEEeeeeEEEEeE";
export const zeroAddress: string = "0x0000000000000000000000000000000000000000";
export const ETHAddress: string = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
export const forgeIdsInBytes = {
  COMPOUND: utils.formatBytes32String('CompoundV2'),
  COMPOUND_UPGRADED: utils.formatBytes32String('CompoundV2Upgraded'),
  AAVE: utils.formatBytes32String('AaveV2'),
  SUSHISWAP_SIMPLE: utils.formatBytes32String('SushiswapSimple'),
  SUSHISWAP_COMPLEX: utils.formatBytes32String('SushiswapComplex'),
  JOE_SIMPLE: utils.formatBytes32String('TraderJoeSimple'),
  JOE_COMPLEX: utils.formatBytes32String('TraderJoeComplex'),
  BENQI: utils.formatBytes32String('BenQi'),
  XJOE: utils.formatBytes32String('xJoe'),
  WONDERLAND: utils.formatBytes32String('Wonderland'),
  REDACTED: utils.formatBytes32String('Redacted')
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
export const EXP_2023 = BN.from('1703721600');
export const EXP_2022 = BN.from("1672272000");
export const EXP_2022JUN = BN.from("1656547200");
export const EXP_2021 = BN.from("1640822400");

export const EXP_WONDERLAND = BN.from("1645660800");
export const EXP_REDACTED = BN.from("1650499200");
export const ONE_DAY = BN.from("86400");
export const ONE_MINUTE = BN.from("60");
export const LMStartTime = {
  1: BN.from("1623888000"),
  42: BN.from("1625241600"),
  43114: BN.from("1636632000")
}
export const LMEpochDuration = BN.from("604800");
export const ALLOCATION_DENOMINATOR = BN.from("1000000000");
export const VestingEpoches = 5;

export const decimalsRecords: Record<string, Record<string, number>> = {
  mainnet: mainnetDecimals,
  kovan: kovanDecimals,
  avalanche: avalancheDecimals
};

export const gasBuffer: number = 1.2;

export const HG = { gasLimit: 100000000 }

export const sushiswapSubgraphApi: string = "https://api.thegraph.com/subgraphs/name/sushiswap/exchange";
export const traderJoeSubgraphApi: string = "https://api.thegraph.com/subgraphs/name/traderjoe-xyz/exchange";

export const PendleSubgraphUrlMapping: Record<number, string> = {
  1: 'https://api.thegraph.com/subgraphs/name/ngfam/pendle',
  42: 'https://api.thegraph.com/subgraphs/name/ngfam/pendle-kovan',
  43114: 'https://api.thegraph.com/subgraphs/name/ngfam/pendle-avalanche'
}