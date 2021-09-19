import { Contract } from "ethers"

export enum Mode {
    AAVE_V2 = 1,
    COMPOUND,
    SUSHISWAP_COMPLEX,
    SUSHISWAP_SIMPLE,
}

export type StakeingPoolSpec = {
    address: string,
    inputTokenAddress: string
}

export interface TestEnv {
    chainId: number;
    router: Contract;
    forge: Contract;
    data: Contract;
    YTs: string[],
    markets: string[],
    stakingPools: StakeingPoolSpec[],
    user: string,
}

// mintYt: (string, Contract) => string, // mintYt(userAddress, router) => YtAddress
// mintBaseToken: (string) => string, // mintBaseToken(userAddress) => BaseTokenAddress