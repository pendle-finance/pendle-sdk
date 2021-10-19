import { NetworkContractAddresses, StakingPoolType } from "./types";
import { EXP_2022, forgeIdsInBytes, marketFactoryIds } from "../constants";


export const avalancheContracts: NetworkContractAddresses = {
    YTs: [
        {
            address: '0xfa8c4c0b81b6f760716bf53f5ca89b0f3cb0b42a',
            underlyingAssetAddress: '0xa7a1e25fdbc12471607d56a6074f067ec85563f2',
            rewardTokenAddresses: ['0xa7a1e25fdbc12471607d56a6074f067ec85563f2'],
            forgeIdInBytes: forgeIdsInBytes.JOE_SIMPLE,
            expiry: EXP_2022
        },
        {
            address: '0xce0de38ab57a317b29d5706981d5649445277519',
            underlyingAssetAddress: '0xa7d7079b0fead91f3e65f86e8915cb59c1a4c664',
            rewardTokenAddresses: ['0x76145e99d3f4165a313e8219141ae0d26900b710'],
            forgeIdInBytes: forgeIdsInBytes.BENQI,
            expiry: EXP_2022
        },
        {
            address: '0x933d84fb9abceb42aac538bf10e1318f1edfa8f5',
            underlyingAssetAddress: '0xa389f9430876455c36478deea9769b7ca4e3ddb1',
            rewardTokenAddresses: ['0xa389f9430876455c36478deea9769b7ca4e3ddb1'],
            forgeIdInBytes: forgeIdsInBytes.JOE_COMPLEX,
            expiry: EXP_2022
        }
    ],
    OTs: [
        {
            address: '0x67eb520947a89eb3163e0a09a2a80bbe40577873',
            yieldTokenAddress: '0xa7a1e25fdbc12471607d56a6074f067ec85563f2',
            rewardTokenAddresses: [
                '0x6e84a6216ea6dacc71ee8e6b0a5b7322eebc0fdd',
                '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7'
            ]
        },
        {
            address: '0xae81dd9397425dd3daf855fc26b2e4e25e9e14f2',
            yieldTokenAddress: '0x76145e99d3f4165a313e8219141ae0d26900b710',
            rewardTokenAddresses: [
                '0x8729438eb15e2c8b576fcc6aecda6a148776c0f5',
                '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7'
            ]
        },
        {
            address: '0xc4d0d6d546ece6a11d14b34e0416be632aa06815',
            yieldTokenAddress: '0xa389f9430876455c36478deea9769b7ca4e3ddb1',
            rewardTokenAddresses: [
                '0x6e84a6216ea6dacc71ee8e6b0a5b7322eebc0fdd',
                '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7'
            ]
        }
    ],
    pendleMarkets: [
        {
            address: '0xe42c21149cb53363856c380c8ed7d92bae55f38d',
            pair: [
                '0xfa8c4c0b81b6f760716bf53f5ca89b0f3cb0b42a',
                '0xb4a4807c35782f74b071b99e606e8fbfc66d2fa3'
            ],
            rewardTokenAddresses: [
                '0xa7a1e25fdbc12471607d56a6074f067ec85563f2'
            ],
            marketFactoryId: marketFactoryIds.GENERIC
        },
        {
            address: '0xd4f2345676fafd080f331b947dc33304078b955e',
            pair: [
                '0xce0de38ab57a317b29d5706981d5649445277519',
                '0xa7d7079b0fead91f3e65f86e8915cb59c1a4c664'
            ],
            rewardTokenAddresses: [
                '0x76145e99d3f4165a313e8219141ae0d26900b710'
            ],
            marketFactoryId: marketFactoryIds.GENERIC
        },
        {
            address:'0xb489f5eb6eefa03f9ca13e89700954019912d4f6',
            pair: [
                '0x933d84fb9abceb42aac538bf10e1318f1edfa8f5',
                '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7'
            ],
            rewardTokenAddresses: [
                '0xa389f9430876455c36478deea9769b7ca4e3ddb1'
            ],
            marketFactoryId: marketFactoryIds.GENERIC
        }
    ],
    otherMarkets: [],
    stakingPools: [
        {
            address: '0xa2af72ff5ec9e7de38237c1d526a9e8746b99b91',
            inputTokenAddress: '0xe42c21149cb53363856c380c8ed7d92bae55f38d',
            contractType: StakingPoolType.LmV1,
            rewardTokenAddresses: [
                '0xb4a4807c35782f74b071b99e606e8fbfc66d2fa3',
                '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7'
            ],
            interestTokensAddresses: [
                '0xa7a1e25fdbc12471607d56a6074f067ec85563f2'
            ],
            active: true
        },
        {
            address: '0xc96fa930ae9183574705f8884f0afbd368206f07',
            inputTokenAddress: '0xd4f2345676fafd080f331b947dc33304078b955e',
            contractType: StakingPoolType.LmV1,
            rewardTokenAddresses: [
                '0xb4a4807c35782f74b071b99e606e8fbfc66d2fa3',
                '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7'
            ],
            interestTokensAddresses: [
                '0x76145e99d3f4165a313e8219141ae0d26900b710'
            ],
            active: true
        },
        {
            address: '0xdfa4b40e783700facfe501c73ba70aaa10635b08',
            inputTokenAddress: '0xb489f5eb6eefa03f9ca13e89700954019912d4f6',
            contractType: StakingPoolType.LmV1,
            rewardTokenAddresses: [
                '0xb4a4807c35782f74b071b99e606e8fbfc66d2fa3',
                '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7' 
            ],
            interestTokensAddresses: [
                '0xa389f9430876455c36478deea9769b7ca4e3ddb1'
            ],
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
        USDC: '0xa7d7079b0fead91f3e65f86e8915cb59c1a4c664'
    },
    forges: {
        [forgeIdsInBytes.JOE_SIMPLE]: "0x3966b3f49995ea333b21750294ff457eec27f5ae",
        [forgeIdsInBytes.JOE_COMPLEX]: "0x9f14ca71b241ae5d77c28b358442c4bfea5afeff",
        [forgeIdsInBytes.BENQI]: "0xfdf3a3dd683d0e8cb98fa615bcab02dace83d98a",
    }
}
