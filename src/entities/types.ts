import { BigNumber as BN } from "ethers";
export type Address = string;

export type AprInfo = {
	origin: string,
	apr: string
}

export type PairTokens = { 
	tokenA: string, 
	tokenB: string,
	_confirmNoDuplication: boolean 
};

export type PairUints = {
	uintA: BN,
	uintB: BN
}