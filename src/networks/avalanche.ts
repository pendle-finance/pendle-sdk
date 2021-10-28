import { NetworkContractAddresses, StakingPoolType } from "./types";
import { EXP_2022, forgeIdsInBytes, marketFactoryIds } from "../constants";
import { MarketProtocols } from "./types";

export const avalancheContracts: NetworkContractAddresses = {
    YTs: [
        {
            address: '0xa136a118e80462d6f3f135b750ef64b820ec018a',
            underlyingAssetAddress: '0xd82b9b055f79d1a244005406988f85ed970797ed',
            rewardTokenAddresses: ['0xd82b9b055f79d1a244005406988f85ed970797ed'],
            forgeIdInBytes: forgeIdsInBytes.JOE_SIMPLE,
            expiry: EXP_2022
        },
        {
            address: '0x154df89ed382089d143eed143964c759147ab111',
            underlyingAssetAddress:'0xa389f9430876455c36478deea9769b7ca4e3ddb1',
            rewardTokenAddresses: ['0xa389f9430876455c36478deea9769b7ca4e3ddb1'],
            forgeIdInBytes: forgeIdsInBytes.JOE_COMPLEX,
            expiry: EXP_2022
        },
        {
            address: '0x1e48d26642858c06eccde4a16d74c1cf9edefa26',
            underlyingAssetAddress: '0xa7d7079b0fead91f3e65f86e8915cb59c1a4c664',
            rewardTokenAddresses: ['0xbeb5d47a3f720ec0a390d04b4d41ed7d9688bc7f'],
            forgeIdInBytes: forgeIdsInBytes.BENQI,
            expiry: EXP_2022
        },
        {
            address: '0xd9b2cc0d8ca646229d1af3877636d09b926d9cca',
            underlyingAssetAddress: '0x6e84a6216ea6dacc71ee8e6b0a5b7322eebc0fdd',
            rewardTokenAddresses: ['0x57319d41f71e81f3c65f2a47ca4e001ebafd4f33'],
            forgeIdInBytes: forgeIdsInBytes.XJOE,
            expiry: EXP_2022
        }
    ],
    OTs: [
        {
            address: '0xe2815b8c82c8ed3f5d33c1ba74b4d3536cb467d1',
            yieldTokenAddress: '0xd82b9b055f79d1a244005406988f85ed970797ed',
            rewardTokenAddresses: [
                '0x6e84a6216ea6dacc71ee8e6b0a5b7322eebc0fdd',
                '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7'
            ],
            forgeIdInBytes: forgeIdsInBytes.JOE_SIMPLE
        },
        {
            address: '0x95cb07e677e685b4d5f4f2f07b9178e15ba95629',
            yieldTokenAddress: '0xa389f9430876455c36478deea9769b7ca4e3ddb1',
            rewardTokenAddresses: [
                '0x6e84a6216ea6dacc71ee8e6b0a5b7322eebc0fdd',
                '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7'
            ],
            forgeIdInBytes: forgeIdsInBytes.JOE_COMPLEX
        },
        {
            address: '0x36a41d95daedc24af2ca156eebd55ef2827d8a11',
            yieldTokenAddress: '0xbeb5d47a3f720ec0a390d04b4d41ed7d9688bc7f',
            rewardTokenAddresses: [
                '0x8729438eb15e2c8b576fcc6aecda6a148776c0f5',
                '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7'
            ],
            forgeIdInBytes: forgeIdsInBytes.BENQI
        }, 
        {
            address: '0xec9f7b3cbbea2ef11c8c1880230f453bd4653992',
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
            address: '0xd0bd9be51f71ca8d863a312a5fa243391e17318c',
            pair: [
                '0xa136a118e80462d6f3f135b750ef64b820ec018a',
                '0x36366298a3b6836e7030a7ff1964a1f0f44638e6'
            ],
            rewardTokenAddresses: [
                '0xd82b9b055f79d1a244005406988f85ed970797ed'
            ],
            marketFactoryId: marketFactoryIds.GENERIC
        },
        {
            address: '0x66e98b6c1653c7f9fb0cd5ee520c0560d2d915d6',
            pair: [
                '0x154df89ed382089d143eed143964c759147ab111',
                '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7'
            ],
            rewardTokenAddresses: [
                '0xa389f9430876455c36478deea9769b7ca4e3ddb1'
            ],
            marketFactoryId: marketFactoryIds.GENERIC
        },
        {
            address: '0x50d3a2991db715e51c55a5ec06488e91522029d2',
            pair: [
                '0x1e48d26642858c06eccde4a16d74c1cf9edefa26',
                '0xa7d7079b0fead91f3e65f86e8915cb59c1a4c664'
            ],
            rewardTokenAddresses: [
                '0xbeb5d47a3f720ec0a390d04b4d41ed7d9688bc7f'
            ],
            marketFactoryId: marketFactoryIds.GENERIC
        },
        {
            address: '0x1dea9a08b8a26a591923e4b593ede6f5d36df7ab',
            pair: [
                '0xd9b2cc0d8ca646229d1af3877636d09b926d9cca',
                '0xa7d7079b0fead91f3e65f86e8915cb59c1a4c664'
            ],
            rewardTokenAddresses: ['0x57319d41f71e81f3c65f2a47ca4e001ebafd4f33'],
            marketFactoryId: marketFactoryIds.GENERIC
        }
    ],
    otherMarkets: [
        {
            address: '0xa7f2794fb9a92069c4aae50e1a72fd49e6e58bb7',
            pair: [
                '0xe2815b8c82c8ed3f5d33c1ba74b4d3536cb467d1',
                '0x36366298a3b6836e7030a7ff1964a1f0f44638e6'
            ],
            platform: MarketProtocols.TraderJoe
        },
        {
            address: '0xe6918c01bed4c61c2b380e0ac2be60f931b18103',
            pair: [
                '0x95cb07e677e685b4d5f4f2f07b9178e15ba95629',
                '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7'
            ],
            platform: MarketProtocols.TraderJoe
        },
        {
            address: '0xd52b859ede52899190c90c209dfaa9f25faffd9a',
            pair: [
                '0x36a41d95daedc24af2ca156eebd55ef2827d8a11',
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
            address: '0x94a587369e15b5eadd0e77d65fbbe4c568bdd9cb',
            pair: [
                '0xec9f7b3cbbea2ef11c8c1880230f453bd4653992',
                '0xa7d7079b0fead91f3e65f86e8915cb59c1a4c664'
            ],
            platform: MarketProtocols.TraderJoe
        },
    ],
    stakingPools: [
        {
            address: '0x40f696a5e1a0b8c1d9dfb9b20af7897275ed8a70',
            inputTokenAddress: '0xd0bd9be51f71ca8d863a312a5fa243391e17318c',
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
            address: '0xe764c85246644181be7666072a7aa78d831eb8d4',
            inputTokenAddress: '0x66e98b6c1653c7f9fb0cd5ee520c0560d2d915d6',
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
            address: '0xcefd5c85e2f00b2d499bc2a6d8dd80d4e752bda2',
            inputTokenAddress: '0x50d3a2991db715e51c55a5ec06488e91522029d2',
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
            address: '0x9980c4b66c27e2ff9da537bb02626924c104496f',
            inputTokenAddress: '0xa7f2794fb9a92069c4aae50e1a72fd49e6e58bb7',
            contractType: StakingPoolType.LmV2Multi,
            rewardTokenAddresses: [
                '0x36366298a3b6836e7030a7ff1964a1f0f44638e6',
                '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7'
            ],
            interestTokensAddresses: [],
            active: true
        },
        {
            address: '0x46505525a4fe5f7adafeddb15182513385326e63',
            inputTokenAddress: '0xe6918c01bed4c61c2b380e0ac2be60f931b18103',
            contractType: StakingPoolType.LmV2Multi,
            rewardTokenAddresses: [
                '0x36366298a3b6836e7030a7ff1964a1f0f44638e6',
                '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7'
            ],
            interestTokensAddresses: [],
            active: true
        },
        {
            address: '0xe743ee8494e754c1913478629cad6ef8abba4366',
            inputTokenAddress: '0xd52b859ede52899190c90c209dfaa9f25faffd9a',
            contractType: StakingPoolType.LmV2Multi,
            rewardTokenAddresses: [
                '0x36366298a3b6836e7030a7ff1964a1f0f44638e6',
                '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7'
            ],
            interestTokensAddresses: [],
            active: true
        },
        {
            address: '0xa031cae8acdb8f7eba639a8f70f53d942f1ec73b',
            inputTokenAddress: '0x1dea9a08b8a26a591923e4b593ede6f5d36df7ab',
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
            address: '0xe3a14f2281176b9ad5b048fbdc4c6ae2c7633907',
            inputTokenAddress: '0x94a587369e15b5eadd0e77d65fbbe4c568bdd9cb',
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
        PendleRedeemProxy: '0x92e5d331642e4e9582392977641a9527a57b3ade',
        PendleLiquidityRewardsProxy: '',
        PendleRouter: '0xd313701e2835ab8fd758e9aa151c8c4200e96658',
        PendleData: '0x010f240e9a5084267d549f1a7edf2a85911250c7',
        MultiCallV2: '0x11b8399bc71e8b67a0f7cca2663612af1ca38536',
        JOE_MASTERCHEFV2: '0xd6a4f121ca35509af06a0be99093d08462f53052'
    },
    tokens: {
        USDC: '0xa7d7079b0fead91f3e65f86e8915cb59c1a4c664',
        JOE: '0x6e84a6216ea6dacc71ee8e6b0a5b7322eebc0fdd',
        WETH: '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7',
        PENDLE: '0x36366298a3b6836e7030a7ff1964a1f0f44638e6',
        qiUSDC: '0xbeb5d47a3f720ec0a390d04b4d41ed7d9688bc7f'
    },
    forges: {
        [forgeIdsInBytes.JOE_SIMPLE]: "0xfccbebda2a67efc6c28c4fa2c4ed9d0fbfe3a5d0",
        [forgeIdsInBytes.JOE_COMPLEX]: "0x8a10cf1b5ba0cbe6505c615e38cfa6927fa6c3e4",
        [forgeIdsInBytes.BENQI]: "0xf9a93aa08049b7fda4236344d562e60e62f22e8a",
        [forgeIdsInBytes.XJOE]: "0x6a8b6c18fc1da1e50a6f47476b8469106e557131"
    }
}