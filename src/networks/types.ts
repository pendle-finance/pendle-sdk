import { BigNumber as BN } from 'ethers';

export enum MarketProtocols {
  Sushiswap = 1,
  TraderJoe,
  Pendle,
}

export type NetworkInfo = {
  chainId: number;
  contractAddresses: NetworkContractAddresses;
  decimalsRecord: Record<string, number>;
};
export type NetworkContractAddresses = {
  stakingPools: LMINFO[];
  YTs: YTINFO[];
  OTs: OTINFO[];
  pendleMarkets: PENDLEMARKETNFO[];
  otherMarkets?: MARKETINFO[];
  misc: Record<string, string>;
  tokens: Record<string, string>;
  forges: Record<string, string>;
};
export type LMINFO = {
  address: string;
  inputTokenAddress: string;
  contractType: StakingPoolType;
  rewardTokenAddresses: string[];
  interestTokensAddresses: string[];
  expiry?: BN;
  active: boolean;
};
export type YTINFO = {
  address: string;
  rewardTokenAddresses: string[];
  underlyingAssetAddress: string;
  forgeIdInBytes: string;
  expiry: BN;
};
export type MARKETINFO = {
  address: string;
  pair: string[];
  platform: MarketProtocols;
};
export type PENDLEMARKETNFO = {
  address: string;
  pair: string[];
  rewardTokenAddresses: string[];
  marketFactoryId: string;
};
export type OTINFO = {
  address: string;
  yieldTokenAddress: string;
  forgeIdInBytes: string;
  rewardTokenAddresses?: string[];
  expiry: BN;
  underlyingAssetAddress: string;
};

export enum StakingPoolType {
  LmV1 = 'PendleLiquidityMining',
  LmV2 = 'PendleLiquidityMiningV2',
  PendleSingleSided = 'PendleSingleStaking',
  LmV1Multi = 'PendleLiquidityMiningMulti',
  LmV2Multi = 'PendleLiquidityMiningMultiV2',
}
