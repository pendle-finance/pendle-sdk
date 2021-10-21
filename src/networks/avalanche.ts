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
        }
    ],
    OTs: [
        {
            address: '0xe2815b8c82c8ed3f5d33c1ba74b4d3536cb467d1',
            yieldTokenAddress: '0xd82b9b055f79d1a244005406988f85ed970797ed',
            rewardTokenAddresses: [
                '0x6e84a6216ea6dacc71ee8e6b0a5b7322eebc0fdd',
                '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7'
            ]
        },
        {
            address: '0x95cb07e677e685b4d5f4f2f07b9178e15ba95629',
            yieldTokenAddress: '0xa389f9430876455c36478deea9769b7ca4e3ddb1',
            rewardTokenAddresses: [
                '0x6e84a6216ea6dacc71ee8e6b0a5b7322eebc0fdd',
                '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7'
            ]
        },
        {
            address: '0x36a41d95daedc24af2ca156eebd55ef2827d8a11',
            yieldTokenAddress: '0xbeb5d47a3f720ec0a390d04b4d41ed7d9688bc7f',
            rewardTokenAddresses: [
                '0x8729438eb15e2c8b576fcc6aecda6a148776c0f5',
                '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7'
            ]
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
        }
    ],
    stakingPools: [
        {
            address: '0xc2954ccee039df003c1f7eba82ef7bde7c36a79b',
            inputTokenAddress: '0xd0bd9be51f71ca8d863a312a5fa243391e17318c',
            contractType: StakingPoolType.LmV1,
            rewardTokenAddresses: [
                '0x36366298a3b6836e7030a7ff1964a1f0f44638e6',
                '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7'
            ],
            interestTokensAddresses: [
                '0xd82b9b055f79d1a244005406988f85ed970797ed'
            ],
            active: true
        },
        {
            address: '0xd86c2da4b6b3f077137641f5f7f0271688c1f8b2',
            inputTokenAddress: '0x66e98b6c1653c7f9fb0cd5ee520c0560d2d915d6',
            contractType: StakingPoolType.LmV1,
            rewardTokenAddresses: [
                '0x36366298a3b6836e7030a7ff1964a1f0f44638e6',
                '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7'
            ],
            interestTokensAddresses: [
                '0xa389f9430876455c36478deea9769b7ca4e3ddb1'
            ],
            active: true
        },
        {
            address: '0xcdce8b6789079abed0ab75d44dfadcba293775a4',
            inputTokenAddress: '0x50d3a2991db715e51c55a5ec06488e91522029d2',
            contractType: StakingPoolType.LmV1,
            rewardTokenAddresses: [
                '0x36366298a3b6836e7030a7ff1964a1f0f44638e6',
                '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7'
            ],
            interestTokensAddresses: [
                '0xbeb5d47a3f720ec0a390d04b4d41ed7d9688bc7f'
            ],
            active: true
        },
        {
            address: '0x857d0c4acda7b0906dc37546b7fcc6db1a224a16',
            inputTokenAddress: '0xa7f2794fb9a92069c4aae50e1a72fd49e6e58bb7',
            contractType: StakingPoolType.LmV2,
            rewardTokenAddresses: [
                '0x36366298a3b6836e7030a7ff1964a1f0f44638e6',
                '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7'
            ],
            interestTokensAddresses: [],
            active: true
        },
        {
            address: '0x5a79af8dafbd1761daf489a7a5129f98883a08f6',
            inputTokenAddress: '0xe6918c01bed4c61c2b380e0ac2be60f931b18103',
            contractType: StakingPoolType.LmV2,
            rewardTokenAddresses: [
                '0x36366298a3b6836e7030a7ff1964a1f0f44638e6',
                '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7'
            ],
            interestTokensAddresses: [],
            active: true
        },
        {
            address: '0xf60dad272f8366cf65eb9f6653cb80db7d387c10',
            inputTokenAddress: '0xd52b859ede52899190c90c209dfaa9f25faffd9a',
            contractType: StakingPoolType.LmV2,
            rewardTokenAddresses: [
                '0x36366298a3b6836e7030a7ff1964a1f0f44638e6',
                '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7'
            ],
            interestTokensAddresses: [],
            active: true
        }
    ],
    misc: {
        PendleRedeemProxy: '0xf1c056b317055cfb5d3178498e011e3c5b0bc5a4',
        PendleLiquidityRewardsProxy: '',
        PendleRouter: '0x8d5a41254618b2d662699c50848718ee26fffd12',
        PendleData: '0x4aB7d436c18877C76c1f82703178E8cf9Ef401A0',
        MultiCallV2: '0x5ba1e12693dc8f9c48aad8770482f4739beed696',
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
    }
}