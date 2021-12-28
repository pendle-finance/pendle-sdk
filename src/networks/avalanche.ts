import { NetworkContractAddresses, StakingPoolType } from "./types";
import { EXP_2023, EXP_WONDERLAND, forgeIdsInBytes, marketFactoryIds, EXP_2022JUN } from "../constants";
import { MarketProtocols } from "./types";

export const avalancheContracts: NetworkContractAddresses = {
    YTs: [
        {
            address: '0x41e8e841f3c9fe666921eda128ca8e2b143eb136',
            underlyingAssetAddress: '0xa7d7079b0fead91f3e65f86e8915cb59c1a4c664',
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
            address: '0x654e4fbad01cb0f483069714ecc53ac87a895716',
            underlyingAssetAddress: '0x3acd2ff1c3450bc8a9765afd8d0dea8e40822c86',
            rewardTokenAddresses: ['0x3acd2ff1c3450bc8a9765afd8d0dea8e40822c86'],
            forgeIdInBytes: forgeIdsInBytes.JOE_SIMPLE,
            expiry: EXP_2023
        },
        {
            address: '0xd36a5269ee4621a8b6985f999e6a1f228e1b7737',
            underlyingAssetAddress: '0x6e84a6216ea6dacc71ee8e6b0a5b7322eebc0fdd',
            rewardTokenAddresses: ['0x57319d41f71e81f3c65f2a47ca4e001ebafd4f33'],
            forgeIdInBytes: forgeIdsInBytes.XJOE,
            expiry: EXP_2022JUN
        },
        {
            address: "0xceb4181f8e80837437a0a2dd4d97e5688471c4b3",
            underlyingAssetAddress: "0x136acd46c134e8269052c62a67042d6bdedde3c9",
            rewardTokenAddresses: ["0x0da67235dd5787d67955420c84ca1cecd4e5bb3b"],
            forgeIdInBytes: forgeIdsInBytes.WONDERLAND,
            expiry: EXP_WONDERLAND
        }
    ],
    OTs: [
        {
            address: '0xfffe5fc3e511ce11df20684aec435a3e2b7d8136',
            yieldTokenAddress: '0xbeb5d47a3f720ec0a390d04b4d41ed7d9688bc7f',
            underlyingAssetAddress: '0xa7d7079b0fead91f3e65f86e8915cb59c1a4c664',
            rewardTokenAddresses: [
                '0x8729438eb15e2c8b576fcc6aecda6a148776c0f5',
                '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7'
            ],
            forgeIdInBytes: forgeIdsInBytes.BENQI,
            expiry: EXP_2023
        },
        {
            address: '0xecc5748b1ff6b23f284ec81e8bf034409961d8dc',
            yieldTokenAddress: '0x5c0401e81bc07ca70fad469b451682c0d747ef1c',
            underlyingAssetAddress: '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7',
            rewardTokenAddresses: [
                '0x8729438eb15e2c8b576fcc6aecda6a148776c0f5',
                '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7'
            ],
            forgeIdInBytes: forgeIdsInBytes.BENQI,
            expiry: EXP_2023
        },
        {
            address: '0xabced2a62fd308bd1b98085c13df74b685140c0b',
            yieldTokenAddress: '0x3acd2ff1c3450bc8a9765afd8d0dea8e40822c86',
            underlyingAssetAddress: '0x3acd2ff1c3450bc8a9765afd8d0dea8e40822c86',
            rewardTokenAddresses: [
                '0x6e84a6216ea6dacc71ee8e6b0a5b7322eebc0fdd',
                '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7'
            ],
            forgeIdInBytes: forgeIdsInBytes.JOE_SIMPLE,
            expiry: EXP_2023
        },
        {
            address: '0x7d1e8650abd5f8363d63dc7ab838cec8c726dd38',
            yieldTokenAddress: '0x57319d41f71e81f3c65f2a47ca4e001ebafd4f33',
            underlyingAssetAddress: '0x6e84a6216ea6dacc71ee8e6b0a5b7322eebc0fdd',
            rewardTokenAddresses: [
                '0x6e84a6216ea6dacc71ee8e6b0a5b7322eebc0fdd',
                '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7'
            ],
            forgeIdInBytes: forgeIdsInBytes.XJOE,
            expiry: EXP_2022JUN
        },
        {
            address: "0xb7e446ff1a2eeea8cd07331c7e06b0276d0b06b7",
            yieldTokenAddress: '0x0da67235dd5787d67955420c84ca1cecd4e5bb3b',
            underlyingAssetAddress: '0x136acd46c134e8269052c62a67042d6bdedde3c9',
            rewardTokenAddresses: [],
            forgeIdInBytes: forgeIdsInBytes.WONDERLAND,
            expiry: EXP_WONDERLAND
        }
    ],
    pendleMarkets: [
        {
            address: '0x7552f903e33db53a86167c1e74f0e082bd0740d5',
            pair: [
                '0x41e8e841f3c9fe666921eda128ca8e2b143eb136',
                '0xa7d7079b0fead91f3e65f86e8915cb59c1a4c664'
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
            address: '0xd5736ba0be93c99a10e2264e8e4ebd54633306f8',
            pair: [
                '0x654e4fbad01cb0f483069714ecc53ac87a895716',
                '0xfb98b335551a418cd0737375a2ea0ded62ea213b'
            ],
            rewardTokenAddresses: [
                '0x3acd2ff1c3450bc8a9765afd8d0dea8e40822c86'
            ],
            marketFactoryId: marketFactoryIds.GENERIC
        },
        {
            address: '0x3e2737eb1b513bcee93a2144204d22695b272215',
            pair: [
                '0xd36a5269ee4621a8b6985f999e6a1f228e1b7737',
                '0xa7d7079b0fead91f3e65f86e8915cb59c1a4c664'
            ],
            rewardTokenAddresses: ['0x57319d41f71e81f3c65f2a47ca4e001ebafd4f33'],
            marketFactoryId: marketFactoryIds.GENERIC
        },
        {
            address: '0x11b9346eefa301e278f246d857c0a6edfbf97fb4',
            pair: [
                '0xceb4181f8e80837437a0a2dd4d97e5688471c4b3',
                '0x130966628846bfd36ff31a822705796e8cb8c18d'
            ],
            rewardTokenAddresses: ['0x0da67235dd5787d67955420c84ca1cecd4e5bb3b'],
            marketFactoryId: marketFactoryIds.GENERIC
        }
    ],
    otherMarkets: [
        {
            address: '0x3acd2ff1c3450bc8a9765afd8d0dea8e40822c86',
            pair: [
                '0xfb98b335551a418cd0737375a2ea0ded62ea213b',
                '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7'
            ],
            platform: MarketProtocols.TraderJoe
        },
        {
            address: '0x82db765c214c1aab16672058a3c22b12f6a42cd0',
            pair: [
                '0xfffe5fc3e511ce11df20684aec435a3e2b7d8136',
                '0xa7d7079b0fead91f3e65f86e8915cb59c1a4c664'
            ],
            platform: MarketProtocols.TraderJoe
        },
        {
            address: '0x5f973e06a59d0bafe464faf36d5b3b06e075c543',
            pair: [
                '0xecc5748b1ff6b23f284ec81e8bf034409961d8dc',
                '0xa7d7079b0fead91f3e65f86e8915cb59c1a4c664'
            ],
            platform: MarketProtocols.TraderJoe
        },
        {
            address: '0x82922e6fbe83547c5e2e0229815942a2108e4624',
            pair: [
                '0xabced2a62fd308bd1b98085c13df74b685140c0b',
                '0xfb98b335551a418cd0737375a2ea0ded62ea213b'
            ],
            platform: MarketProtocols.TraderJoe
        },
        {
            address: '0xd1f377b881010cb97ab0890a5ef908c45bcf13f9',
            pair: [
                '0x7d1e8650abd5f8363d63dc7ab838cec8c726dd38',
                '0xa7d7079b0fead91f3e65f86e8915cb59c1a4c664'
            ],
            platform: MarketProtocols.TraderJoe
        },
        {
            address: '0x588dc0dd7c8be073e9da79307e023f1f756f06c6',
            pair: [
                '0xb7e446ff1a2eeea8cd07331c7e06b0276d0b06b7',
                '0x130966628846bfd36ff31a822705796e8cb8c18d'
            ],
            platform: MarketProtocols.TraderJoe
        }
    ],
    stakingPools: [
        {
            address: '0x2489a32844556193fb296c22597bdc158e9762a0',
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
            active: true,
            startTime: "1636632000"
        },
        {
            address: '0x224d395e9e123bc9c37bff8bcd845562d5232713',
            inputTokenAddress: '0x82db765c214c1aab16672058a3c22b12f6a42cd0',
            contractType: StakingPoolType.LmV2Multi,
            rewardTokenAddresses: [
                '0xfb98b335551a418cd0737375a2ea0ded62ea213b',
                '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7'
            ],
            interestTokensAddresses: [],
            expiry: EXP_2023,
            active: true,
            startTime: "1636632000"
        },
        {
            address: '0x47a3e9d5c87651d4074ef67a160afdb3f42cb242',
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
            active: true,
            startTime: "1636632000"
        },
        {
            address: '0xfe60eec35e3c4aad1e69f10957ad0a7d3cfc6cea',
            inputTokenAddress: '0x5f973e06a59d0bafe464faf36d5b3b06e075c543',
            contractType: StakingPoolType.LmV2Multi,
            rewardTokenAddresses: [
                '0xfb98b335551a418cd0737375a2ea0ded62ea213b',
                '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7'
            ],
            interestTokensAddresses: [],
            expiry: EXP_2023,
            active: true,
            startTime: "1636632000"
        },
        {
            address: '0x204e698a71bb1973823517c74be041a985eaa46e',
            inputTokenAddress: '0xd5736ba0be93c99a10e2264e8e4ebd54633306f8',
            contractType: StakingPoolType.LmV1Multi,
            rewardTokenAddresses: [
                '0xfb98b335551a418cd0737375a2ea0ded62ea213b',
                '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7'
            ],
            interestTokensAddresses: [
                '0x3acd2ff1c3450bc8a9765afd8d0dea8e40822c86'
            ],
            expiry: EXP_2023,
            active: true,
            startTime: "1636632000"
        },
        {
            address: '0xb3c6772f341ad234fa41f8c4f981cf4489dfa6e9',
            inputTokenAddress: '0x82922e6fbe83547c5e2e0229815942a2108e4624',
            contractType: StakingPoolType.LmV2Multi,
            rewardTokenAddresses: [
                '0xfb98b335551a418cd0737375a2ea0ded62ea213b',
                '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7'
            ],
            interestTokensAddresses: [],
            expiry: EXP_2023,
            active: true,
            startTime: "1636632000"
        },
        {
            address: '0xa3e0ca7e35f47f6547c0c2d8f005312c2188e70f',
            inputTokenAddress: '0x3e2737eb1b513bcee93a2144204d22695b272215',
            contractType: StakingPoolType.LmV1Multi,
            rewardTokenAddresses: [
                '0xfb98b335551a418cd0737375a2ea0ded62ea213b',
                '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7'
            ],
            interestTokensAddresses: [
                '0x57319d41f71e81f3c65f2a47ca4e001ebafd4f33'
            ],
            expiry: EXP_2022JUN,
            active: true,
            startTime: "1636632000"
        },
        {
            address: '0xd0788af7a613b81f437a51b96594a6387c7329b1',
            inputTokenAddress: '0xd1f377b881010cb97ab0890a5ef908c45bcf13f9',
            contractType: StakingPoolType.LmV2Multi,
            rewardTokenAddresses: [
                '0xfb98b335551a418cd0737375a2ea0ded62ea213b',
                '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7'
            ],
            interestTokensAddresses: [],
            expiry: EXP_2022JUN,
            active: true,
            startTime: "1636632000"
        },
        {
            address: '0x9ada5ce16cdbd76afdd28b891cd0a1a9f659dad6',
            inputTokenAddress: '0x11b9346eefa301e278f246d857c0a6edfbf97fb4',
            contractType: StakingPoolType.LmV1Multi,
            rewardTokenAddresses: [
                '0xfb98b335551a418cd0737375a2ea0ded62ea213b',
                '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7'
            ],
            interestTokensAddresses: [
                '0x0da67235dd5787d67955420c84ca1cecd4e5bb3b'
            ],
            expiry: EXP_WONDERLAND,
            active: true,
            startTime: "1639656000"
        },
        {
            address: '0x2aa0bec34deeb6987c118ce353d14eea6def24ce',
            inputTokenAddress: '0x588dc0dd7c8be073e9da79307e023f1f756f06c6',
            contractType: StakingPoolType.LmV2Multi,
            rewardTokenAddresses: [
                '0xfb98b335551a418cd0737375a2ea0ded62ea213b',
                '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7'
            ],
            interestTokensAddresses: [],
            expiry: EXP_WONDERLAND,
            active: true,
            startTime: "1639656000"
        }
    ],
    misc: {
        PendleRedeemProxy: '0xee206ce750c86a438fabcb9bba2f1d69cebce7b0',
        PendleLiquidityRewardsReader: '0x6a5377f50f37103acfc63e328dca652e08240ea7',
        PendleRouter: '0x771ad65bf2837c89a1cc0a0fc601d9de7f217b52',
        PendleData: '0x94d7e5c48ca9627001facb04d1820c54dff3032c',
        MultiCallV2: '0x11b8399bc71e8b67a0f7cca2663612af1ca38536',
        JOE_MASTERCHEFV2: '0xd6a4f121ca35509af06a0be99093d08462f53052',
        PendleWrapper: '0x40484FC214885E071980E1Df660b2Da8dF734b45',
        Comptroller: '0x486af39519b4dc9a7fccd318217352830e8ad9b4',
        JoeRouter: '0x60ae616a2155ee3d9a68541ba4544862310933d4',
        TIMEStaking: '0x4456b87af11e87e329ab7d7c7a246ed1ac2168b9',
        PendleZapEstimatorPAP: '0xe9dadd8e4e48997264b839a38d5f67d321b7f6be',
        PendleZapEstimatorSingle: '0xe42e8d0923cc9ff772b3b81125a628c771aa46e4'
    },
    tokens: {
        USDC: '0xa7d7079b0fead91f3e65f86e8915cb59c1a4c664',
        JOE: '0x6e84a6216ea6dacc71ee8e6b0a5b7322eebc0fdd',
        WETH: '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7',
        PENDLE: '0xfb98b335551a418cd0737375a2ea0ded62ea213b',
        qiUSDC: '0xbeb5d47a3f720ec0a390d04b4d41ed7d9688bc7f',
        qiAVAX: '0x5c0401e81bc07ca70fad469b451682c0d747ef1c',
        xJOE: '0x57319d41f71e81f3c65f2a47ca4e001ebafd4f33',
        QI: '0x8729438eb15e2c8b576fcc6aecda6a148776c0f5',
        MEMO: '0x136acd46c134e8269052c62a67042d6bdedde3c9',
        TIME: '0xb54f16fb19478766a268f172c9480f8da1a7c9c3',
        MIM: '0x130966628846bfd36ff31a822705796e8cb8c18d',
        wMEMO: '0x0da67235dd5787d67955420c84ca1cecd4e5bb3b'
    },
    forges: {
        [forgeIdsInBytes.JOE_SIMPLE]: "0x5802cd94b51b3cd5a8446a6d3fa26c25d97618c2",
        [forgeIdsInBytes.BENQI]: "0x23b868bebdfd2d6faedaa92e44aef6c8704612bc",
        [forgeIdsInBytes.XJOE]: "0x09131d750f3f7e646fbdce6dd9699775fa0daaca",
        [forgeIdsInBytes.WONDERLAND]: "0xdd0f8542f1171d462d2aa74fa107a790ce93b06f"
    }
}