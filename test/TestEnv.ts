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
    YTs: string[],
    markets: string[],
    stakingPools: StakeingPoolSpec[],
    user: string,
    mintYt: (string) => string,
    mintBaseToken: (string) => string,
}