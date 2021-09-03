
import { BigNumber as BN } from 'ethers';
export type NetworkInfo = {
    chainId: number,
    contractAddresses: NetworkContractAddresses,
    decimalsRecord: Record<string, number>
}
export type NetworkContractAddresses = {
    stakingPools: LMINFO[],
    YTs: YTINFO[],
    markets: MARKETNFO[],
    misc: Record<string, string> 
}
export type LMINFO = {
    address: string,
    inputTokenAddress: string,
    contractType: string,
    rewardTokenAddresses: string[],
    interestTokensAddresses: string[],
    expiry?: BN
};
export type YTINFO = {
    address: string,
    rewardTokenAddresses: string[]
};
export type MARKETNFO = {
    address: string,
    pair: string[],
    rewardTokenAddresses: string[]
};

export * from './mainnet';