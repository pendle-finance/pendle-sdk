import { BigNumber as BN, providers } from 'ethers';

export type Address = string;

export type ChainSpecifics = {
  signer?: providers.JsonRpcSigner;
  provider: providers.JsonRpcProvider;
  chainId: number;
};
export type AprInfo = {
  origin: string;
  apr: string;
};

export type PairTokens = {
  tokenA: string;
  tokenB: string;
  _confirmNoDuplication: boolean;
};

export type PairUints = {
  uintA: BN;
  uintB: BN;
};
