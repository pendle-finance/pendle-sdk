
import { BigNumber as BN } from 'ethers';
export type NetworkInfo = {
    chainId: number,
    contractAddresses: NetworkContractAddresses,
    decimalsRecord: Record<string, number>
}
export type NetworkContractAddresses = {
    stakingPools: LMINFO[],
    YTs: YTINFO[],
    OTs: OTINFO[],
    markets: MARKETNFO[],
    misc: Record<string, string> ,
    forges: Record<string, string>
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
    rewardTokenAddresses: string[],
    forgeId: string
};
export type MARKETNFO = {
    address: string,
    pair: string[],
    rewardTokenAddresses: string[],
    marketFactoryId: string
};
export type OTINFO = {
    address: string,
    yieldTokenAddress: string
}

export * from './mainnet';