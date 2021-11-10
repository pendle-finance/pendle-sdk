import { NetworkContractAddresses, StakingPoolType } from "./types";
import { EXP_2023, forgeIdsInBytes, marketFactoryIds } from "../constants";
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
            rewardTokenAddresses: [
                '0x8729438eb15e2c8b576fcc6aecda6a148776c0f5',
                '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7'
            ],
            forgeIdInBytes: forgeIdsInBytes.BENQI
        },
        {
            address: '0xecc5748b1ff6b23f284ec81e8bf034409961d8dc',
            yieldTokenAddress: '0x5c0401e81bc07ca70fad469b451682c0d747ef1c',
            rewardTokenAddresses: [
                '0x8729438eb15e2c8b576fcc6aecda6a148776c0f5',
                '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7'
            ],
            forgeIdInBytes: forgeIdsInBytes.BENQI
        },
        {
            address: '0x505294ad0d1012e2fe17be079f53b0088523c680',
            yieldTokenAddress: '0xd82b9b055f79d1a244005406988f85ed970797ed',
            rewardTokenAddresses: [
                '0x6e84a6216ea6dacc71ee8e6b0a5b7322eebc0fdd',
                '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7'
            ],
            forgeIdInBytes: forgeIdsInBytes.JOE_SIMPLE
        },
        {
            address: '0x06247ec1b3fa001ddbcf817c65e026d77ae5cc10',
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
            address: '0x7552f903e33db53a86167c1e74f0e082bd0740d5',
            pair: [
                '0x41e8e841f3c9fe666921eda128ca8e2b143eb136',
                '0xa7d7079b0fead91f3e65f86e8915cb59c1a4c664x'
            ],
            rewardTokenAddresses: [
                '0xbeb5d47a3f720ec0a390d04b4d41ed7d9688bc7f'
            ],
            marketFactoryId: marketFactoryIds.GENERIC
        },
        {
            address: '0x80aae49b1142e2f135033829a1b647b1636c1506',
            pair: [
                '0x30a6f8949d4ce66918f393318d5f9d3bd1304461',
                '0xa7d7079b0fead91f3e65f86e8915cb59c1a4c664'
            ],
            rewardTokenAddresses: [
                '0x5c0401e81bc07ca70fad469b451682c0d747ef1c'
            ],
            marketFactoryId: marketFactoryIds.GENERIC
        },
        {
            address: '0x2fea644f2a6fbe995ff8cfdea276644708336c2e',
            pair: [
                '0xf35fc7fcc1d64b7e97caaafd7186f860b64e74e9',
                '0xfb98b335551a418cd0737375a2ea0ded62ea213b'
            ],
            rewardTokenAddresses: [
                '0xd82b9b055f79d1a244005406988f85ed970797ed'
            ],
            marketFactoryId: marketFactoryIds.GENERIC
        },
        {
            address: '0x6b2d9699dd33bb8a844d429b3da2a2b00a20527a',
            pair: [
                '0x958dfbd0e1574788ed1d0a34cbc445a5dcce968b',
                '0xa7d7079b0fead91f3e65f86e8915cb59c1a4c664'
            ],
            rewardTokenAddresses: ['0x57319d41f71e81f3c65f2a47ca4e001ebafd4f33'],
            marketFactoryId: marketFactoryIds.GENERIC
        }
    ],
    otherMarkets: [
        {
            address: '0xd82b9b055f79d1a244005406988f85ed970797ed',
            pair: [
                '0x36366298a3b6836e7030a7ff1964a1f0f44638e6',
                '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7'
            ],
            platform: MarketProtocols.TraderJoe
        }
    ],
    stakingPools: [
        {
            address: '0x3ffd8ecffb03626bd7dee699ce1921cc62185dea',
            inputTokenAddress: '0x7552f903e33db53a86167c1e74f0e082bd0740d5',
            contractType: StakingPoolType.LmV1Multi,
            rewardTokenAddresses: [
                '0xfb98b335551a418cd0737375a2ea0ded62ea213b',
                '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7'
            ],
            interestTokensAddresses: [
                '0xbeb5d47a3f720ec0a390d04b4d41ed7d9688bc7f'
            ],
            expiry: EXP_2023,
            active: true
        },
        {
            address: '0x1305434fbe1c14a8c6c1d30bbf92f5baee506381',
            inputTokenAddress: '0x80aae49b1142e2f135033829a1b647b1636c1506',
            contractType: StakingPoolType.LmV1Multi,
            rewardTokenAddresses: [
                '0xfb98b335551a418cd0737375a2ea0ded62ea213b',
                '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7'
            ],
            interestTokensAddresses: [
                '0x5c0401e81bc07ca70fad469b451682c0d747ef1c'
            ],
            expiry: EXP_2023,
            active: true
        },
        {
            address: '0x584560e90c948c7a81b24efb08f1436205f7013c',
            inputTokenAddress: '0x2fea644f2a6fbe995ff8cfdea276644708336c2e',
            contractType: StakingPoolType.LmV1Multi,
            rewardTokenAddresses: [
                '0xfb98b335551a418cd0737375a2ea0ded62ea213b',
                '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7'
            ],
            interestTokensAddresses: [
                '0xd82b9b055f79d1a244005406988f85ed970797ed'
            ],
            expiry: EXP_2023,
            active: true
        },
        {
            address: '0xba755f827e09ce89dc3d74f4e6f10786235c8170',
            inputTokenAddress: '0x6b2d9699dd33bb8a844d429b3da2a2b00a20527a',
            contractType: StakingPoolType.LmV1Multi,
            rewardTokenAddresses: [
                '0xfb98b335551a418cd0737375a2ea0ded62ea213b',
                '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7'
            ],
            interestTokensAddresses: [
                '0x57319d41f71e81f3c65f2a47ca4e001ebafd4f33'
            ],
            expiry: EXP_2023,
            active: true
        },
    ],
    misc: {
        PendleRedeemProxy: '0x4e3df0e67c15380df6ee109af3555f33101276d7',
        PendleLiquidityRewardsProxy: '0x6a5377f50f37103acfc63e328dca652e08240ea7',
        PendleRouter: '0x771ad65bf2837c89a1cc0a0fc601d9de7f217b52',
        PendleData: '0x94d7e5c48ca9627001facb04d1820c54dff3032c',
        MultiCallV2: '0x11b8399bc71e8b67a0f7cca2663612af1ca38536',
        JOE_MASTERCHEFV2: '0xd6a4f121ca35509af06a0be99093d08462f53052',
        PendleWrapper: '0x2e130d5dc593ffe5eb8f54f63f6b5e50df169a47'
    },
    tokens: {
        USDC: '0xa7d7079b0fead91f3e65f86e8915cb59c1a4c664',
        JOE: '0x6e84a6216ea6dacc71ee8e6b0a5b7322eebc0fdd',
        WETH: '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7',
        PENDLE: '0xfb98b335551a418cd0737375a2ea0ded62ea213b',
        qiUSDC: '0xbeb5d47a3f720ec0a390d04b4d41ed7d9688bc7f',
        xJOE: '0x57319d41f71e81f3c65f2a47ca4e001ebafd4f33',
        QI: '0x8729438eb15e2c8b576fcc6aecda6a148776c0f5'
    },
    forges: {
        [forgeIdsInBytes.JOE_SIMPLE]: "0x5802cd94b51b3cd5a8446a6d3fa26c25d97618c2",
        [forgeIdsInBytes.BENQI]: "0x23b868bebdfd2d6faedaa92e44aef6c8704612bc",
        [forgeIdsInBytes.XJOE]: "0x09131d750f3f7e646fbdce6dd9699775fa0daaca"
    }
}