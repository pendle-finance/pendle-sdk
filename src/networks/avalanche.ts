import { NetworkContractAddresses, StakingPoolType } from "./types";
import { EXP_2022, EXP_2023, forgeIdsInBytes, marketFactoryIds } from "../constants";
import { MarketProtocols } from "./types";

export const avalancheContracts: NetworkContractAddresses = {
    YTs: [
        {
            address: '0x41e8e841f3c9fe666921eda128ca8e2b143eb136',
            underlyingAssetAddress: '0xa7d7079b0fead91f3e65f86e8915cb59c1a4c664x',
            rewardTokenAddresses: ['0xbeb5d47a3f720ec0a390d04b4d41ed7d9688bc7f'],
            forgeIdInBytes: forgeIdsInBytes.BENQI,
            expiry: EXP_2023
        },
        {
            address: '0x30a6f8949d4ce66918f393318d5f9d3bd1304461',
            underlyingAssetAddress: '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7',
            rewardTokenAddresses: ['0x5c0401e81bc07ca70fad469b451682c0d747ef1c'],
            forgeIdInBytes: forgeIdsInBytes.BENQI,
            expiry: EXP_2023
        },
        {
            address: '0xf35fc7fcc1d64b7e97caaafd7186f860b64e74e9',
            underlyingAssetAddress: '0xd82b9b055f79d1a244005406988f85ed970797ed',
            rewardTokenAddresses: ['0xd82b9b055f79d1a244005406988f85ed970797ed'],
            forgeIdInBytes: forgeIdsInBytes.JOE_SIMPLE,
            expiry: EXP_2023
        },
        {
            address: '0x958dfbd0e1574788ed1d0a34cbc445a5dcce968b',
            underlyingAssetAddress: '0x6e84a6216ea6dacc71ee8e6b0a5b7322eebc0fdd',
            rewardTokenAddresses: ['0x57319d41f71e81f3c65f2a47ca4e001ebafd4f33'],
            forgeIdInBytes: forgeIdsInBytes.XJOE,
            expiry: EXP_2023
        }
    ],
    OTs: [
        {
            address: '0xfffe5fc3e511ce11df20684aec435a3e2b7d8136',
            yieldTokenAddress: '0xbeb5d47a3f720ec0a390d04b4d41ed7d9688bc7f',
            rewardTokenAddresses: [],
            forgeIdInBytes: forgeIdsInBytes.BENQI
        },
        {
            address: '0x589774bc6a491f4dde5e13cbafe11d906940a492',
            yieldTokenAddress: '0xa389f9430876455c36478deea9769b7ca4e3ddb1',
            rewardTokenAddresses: [
                '0x6e84a6216ea6dacc71ee8e6b0a5b7322eebc0fdd',
                '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7'
            ],
            forgeIdInBytes: forgeIdsInBytes.JOE_COMPLEX
        },
        {
            address: '0xe294a273fea5975675a67b09cb5213a7985addca',
            yieldTokenAddress: '0xbeb5d47a3f720ec0a390d04b4d41ed7d9688bc7f',
            rewardTokenAddresses: [
                '0x8729438eb15e2c8b576fcc6aecda6a148776c0f5',
                '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7'
            ],
            forgeIdInBytes: forgeIdsInBytes.BENQI
        },
        {
            address: '0x85c31fd5ef62b591c65646b671cdb2b561791bec',
            yieldTokenAddress: '0x57319d41f71e81f3c65f2a47ca4e001ebafd4f33',
            rewardTokenAddresses: [
                '0x6e84a6216ea6dacc71ee8e6b0a5b7322eebc0fdd',
                '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7'
            ],
            forgeIdInBytes: forgeIdsInBytes.XJOE
        }
    ],
    pendleMarkets: [
        {
            address: '0x027dfe08d7a3ce2562ce17a6f6f4b78d26f360bd',
            pair: [
                '0x365f42f1ac4b6c04e13f5bf001cb60196a12f43b',
                '0x36366298a3b6836e7030a7ff1964a1f0f44638e6'
            ],
            rewardTokenAddresses: [
                '0xd82b9b055f79d1a244005406988f85ed970797ed'
            ],
            marketFactoryId: marketFactoryIds.GENERIC
        },
        {
            address: '0x414e36e93d055f1912d05fbd446e9c70899293fb',
            pair: [
                '0x323a8a76eaf2e3ea8b2c5908763252e01c0d6beb',
                '0xa7d7079b0fead91f3e65f86e8915cb59c1a4c664'
            ],
            rewardTokenAddresses: [
                '0xa389f9430876455c36478deea9769b7ca4e3ddb1'
            ],
            marketFactoryId: marketFactoryIds.GENERIC
        },
        {
            address: '0x574d9626f0bfde8b48cb762154dabf052812ccc6',
            pair: [
                '0xe853ff88b9679b2341abe1a5a77a711ec860bb02',
                '0xa7d7079b0fead91f3e65f86e8915cb59c1a4c664'
            ],
            rewardTokenAddresses: [
                '0xbeb5d47a3f720ec0a390d04b4d41ed7d9688bc7f'
            ],
            marketFactoryId: marketFactoryIds.GENERIC
        },
        {
            address: '0xcf5f662b388302836c1c2899446e2267b081c690',
            pair: [
                '0x7d5e215406d29a4c5b848aaab473a6a02bd1fb74',
                '0xa7d7079b0fead91f3e65f86e8915cb59c1a4c664'
            ],
            rewardTokenAddresses: ['0x57319d41f71e81f3c65f2a47ca4e001ebafd4f33'],
            marketFactoryId: marketFactoryIds.GENERIC
        }
    ],
    otherMarkets: [
        {
            address: '0xc84a9413dea74f4bdcb6bd68a6609927b1ffa733',
            pair: [
                '0x095933f3c6dcdd666f8b65b032a2fc6f529fd074',
                '0x36366298a3b6836e7030a7ff1964a1f0f44638e6'
            ],
            platform: MarketProtocols.TraderJoe
        },
        {
            address: '0xeeeaeb7a1d7f18e3ea61046a1d21d7b97c82db1a',
            pair: [
                '0x589774bc6a491f4dde5e13cbafe11d906940a492',
                '0xa7d7079b0fead91f3e65f86e8915cb59c1a4c664'
            ],
            platform: MarketProtocols.TraderJoe
        },
        {
            address: '0xd21695dc5b202907e2bc376c8f4802e5fd6a6752',
            pair: [
                '0xe294a273fea5975675a67b09cb5213a7985addca',
                '0xa7d7079b0fead91f3e65f86e8915cb59c1a4c664'
            ],
            platform: MarketProtocols.TraderJoe
        },
        {
            address: '0xd82b9b055f79d1a244005406988f85ed970797ed',
            pair: [
                '0x36366298a3b6836e7030a7ff1964a1f0f44638e6',
                '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7'
            ],
            platform: MarketProtocols.TraderJoe
        },
        {
            address: '0xa389f9430876455c36478deea9769b7ca4e3ddb1',
            pair: [
                '0xa7d7079b0fead91f3e65f86e8915cb59c1a4c664',
                '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7'
            ],
            platform: MarketProtocols.TraderJoe
        },
        {
            address: '0x5354828916e53597608adc46d1b0c835f0a13f57',
            pair: [
                '0x85c31fd5ef62b591c65646b671cdb2b561791bec',
                '0xa7d7079b0fead91f3e65f86e8915cb59c1a4c664'
            ],
            platform: MarketProtocols.TraderJoe
        },
    ],
    stakingPools: [
        {
            address: '0xa90db3286122355309cd161c3aec2ddb28021b6a',
            inputTokenAddress: '0x027dfe08d7a3ce2562ce17a6f6f4b78d26f360bd',
            contractType: StakingPoolType.LmV1Multi,
            rewardTokenAddresses: [
                '0x36366298a3b6836e7030a7ff1964a1f0f44638e6',
                '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7'
            ],
            interestTokensAddresses: [
                '0xd82b9b055f79d1a244005406988f85ed970797ed'
            ],
            expiry: EXP_2022,
            active: true
        },
        {
            address: '0x10688f2bb9ff5881d88c41aafc1c28b630339a1c',
            inputTokenAddress: '0x414e36e93d055f1912d05fbd446e9c70899293fb',
            contractType: StakingPoolType.LmV1Multi,
            rewardTokenAddresses: [
                '0x36366298a3b6836e7030a7ff1964a1f0f44638e6',
                '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7'
            ],
            interestTokensAddresses: [
                '0xa389f9430876455c36478deea9769b7ca4e3ddb1'
            ],
            expiry: EXP_2022,
            active: true
        },
        {
            address: '0x072b28b1b3b7f5f34af8b32c6fd74b64a92e4c3d',
            inputTokenAddress: '0x574d9626f0bfde8b48cb762154dabf052812ccc6',
            contractType: StakingPoolType.LmV1Multi,
            rewardTokenAddresses: [
                '0x36366298a3b6836e7030a7ff1964a1f0f44638e6',
                '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7'
            ],
            interestTokensAddresses: [
                '0xbeb5d47a3f720ec0a390d04b4d41ed7d9688bc7f'
            ],
            expiry: EXP_2022,
            active: true
        },
        {
            address: '0xc623caf18efab2c47f419e9529dedf0bdbcd560c',
            inputTokenAddress: '0xCf5F662B388302836c1c2899446e2267b081c690',
            contractType: StakingPoolType.LmV1Multi,
            rewardTokenAddresses: [
                '0x36366298a3b6836e7030a7ff1964a1f0f44638e6',
                '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7'
            ],
            interestTokensAddresses: [
                '0x57319d41f71e81f3c65f2a47ca4e001ebafd4f33'
            ],
            expiry: EXP_2022,
            active: true
        },
         {
            address: '0xe0b01396bf708694d63da97a87eb455d2da84e01',
            inputTokenAddress: '0xc84a9413dea74f4bdcb6bd68a6609927b1ffa733',
            contractType: StakingPoolType.LmV2Multi,
            rewardTokenAddresses: [
                '0x36366298a3b6836e7030a7ff1964a1f0f44638e6',
                '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7'
            ],
            interestTokensAddresses: [],
            active: true
        },
        {
            address: '0x576faae4b090c2e6693cbd7d54cdb7e8bbe579a6',
            inputTokenAddress: '0xeeeaeb7a1d7f18e3ea61046a1d21d7b97c82db1a',
            contractType: StakingPoolType.LmV2Multi,
            rewardTokenAddresses: [
                '0x36366298a3b6836e7030a7ff1964a1f0f44638e6',
                '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7'
            ],
            interestTokensAddresses: [],
            active: true
        },
        {
            address: '0xe1adfb340ebe1e6b7f6f8ef7264d701195a80f92',
            inputTokenAddress: '0xd21695dc5b202907e2bc376c8f4802e5fd6a6752',
            contractType: StakingPoolType.LmV2Multi,
            rewardTokenAddresses: [
                '0x36366298a3b6836e7030a7ff1964a1f0f44638e6',
                '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7'
            ],
            interestTokensAddresses: [],
            active: true
        },
        {
            address: '0xc6e29d73181867ad924e162b717ee7a6b2c35906',
            inputTokenAddress: '0x5354828916e53597608adc46d1b0c835f0a13f57',
            contractType: StakingPoolType.LmV2Multi,
            rewardTokenAddresses: [
                '0x36366298a3b6836e7030a7ff1964a1f0f44638e6',
                '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7'
            ],
            interestTokensAddresses: [],
            active: true
        }
    ],
    misc: {
        PendleRedeemProxy: '0x4e3df0e67c15380df6ee109af3555f33101276d7',
        PendleLiquidityRewardsProxy: '0x6a5377f50f37103acfc63e328dca652e08240ea7',
        PendleRouter: '0x3d4c5db1081d7e5a8877c29123ad77fdf0536ecc',
        PendleData: '0x9e0d260ab16a55956fa72be7c5aa9c657d1bc6e4',
        MultiCallV2: '0x11b8399bc71e8b67a0f7cca2663612af1ca38536',
        JOE_MASTERCHEFV2: '0xd6a4f121ca35509af06a0be99093d08462f53052',
        PendleWrapper: '0xc4aef72f0f42ed47e216f8dcb3699a39276cbf5f'
    },
    tokens: {
        USDC: '0xa7d7079b0fead91f3e65f86e8915cb59c1a4c664',
        JOE: '0x6e84a6216ea6dacc71ee8e6b0a5b7322eebc0fdd',
        WETH: '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7',
        PENDLE: '0x36366298a3b6836e7030a7ff1964a1f0f44638e6',
        qiUSDC: '0xbeb5d47a3f720ec0a390d04b4d41ed7d9688bc7f',
        xJOE: '0x57319d41f71e81f3c65f2a47ca4e001ebafd4f33'
    },
    forges: {
        [forgeIdsInBytes.JOE_SIMPLE]: "0xda5b2b02fa1575b078655523d23092164e1e7c9f",
        [forgeIdsInBytes.JOE_COMPLEX]: "0x04957580ccbc5ad958097540b1b4bf09ab8923fa",
        [forgeIdsInBytes.BENQI]: "0xb2ec9156f65c8fb07d2f8dd7a6a555e5a975aa1f",
        [forgeIdsInBytes.XJOE]: "0x86d406dde2dba598308dcbd35781383fbf42c931"
    }
}