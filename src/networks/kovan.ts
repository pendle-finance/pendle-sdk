import { NetworkContractAddresses, StakingPoolType } from "./types";
import { EXP_2021, EXP_2022, forgeIdsInBytes, marketFactoryIds } from "../constants";
import { MarketProtocols } from "./types";

export const kovanContracts: NetworkContractAddresses = {
    OTs: [
        {
            address: '0xcabd309d0337b40935064f94fa8d5b79dc484df6',
            yieldTokenAddress: '0xe12afec5aa12cf614678f9bfeeb98ca9bb95b5b0',
            forgeIdInBytes: forgeIdsInBytes.AAVE
        },
        {
            address: '0x0bd27a73f06f2ec9aea8df6ade306b6a4e0851ff',
            yieldTokenAddress: '0xe12afec5aa12cf614678f9bfeeb98ca9bb95b5b0',
            forgeIdInBytes: forgeIdsInBytes.AAVE
        },
        {
            address: '0x3d213f7813d6071aa7f29182c89e40db4093b95d',
            yieldTokenAddress: '0xf0d0eb522cfa50b716b3b1604c4f0fa6f04376ad',
            forgeIdInBytes: forgeIdsInBytes.COMPOUND
        },
        {
            address: '0x6a9f015e02937b5c59dd21d30219743d641f5291',
            yieldTokenAddress: '0xf0d0eb522cfa50b716b3b1604c4f0fa6f04376ad',
            forgeIdInBytes: forgeIdsInBytes.COMPOUND
        },
        {
            address: '0x4217abf12cbfedcdc0e8a30a4f384be58989db51',
            yieldTokenAddress: '0xcec1967d0ea74e2efe7eda4dfa323e8252e57550',
            forgeIdInBytes: forgeIdsInBytes.SUSHISWAP_COMPLEX
        },
        {
            address: '0x994963c5501e7600f48d6d7154f3a10d6a33f4ae',
            yieldTokenAddress: '0x0db5af4b374e810f6e5a15ccc3d65e28cc4dbec7',
            forgeIdInBytes: forgeIdsInBytes.SUSHISWAP_SIMPLE
        }
    ],
    YTs: [
        {
            address: '0xc955476480071d00c1afd1c9fd3a12526d309912',
            rewardTokenAddresses: [
                '0xe12afec5aa12cf614678f9bfeeb98ca9bb95b5b0'
            ],
            underlyingAssetAddress: '0xe22da380ee6b445bb8273c81944adeb6e8450422',
            forgeIdInBytes: forgeIdsInBytes.AAVE,
            expiry: EXP_2021
        },
        {
            address: '0xe105f625dcfe828528a7bcfd342e792606739f32',
            rewardTokenAddresses: [
                '0xe12afec5aa12cf614678f9bfeeb98ca9bb95b5b0'
            ],
            underlyingAssetAddress: '0xe22da380ee6b445bb8273c81944adeb6e8450422',
            forgeIdInBytes: forgeIdsInBytes.AAVE,
            expiry: EXP_2022
        },
        {
            address: '0xaee5e8b3a1ae9f54548e62f423144f8c160382e0',
            rewardTokenAddresses: [
                '0xf0d0eb522cfa50b716b3b1604c4f0fa6f04376ad'
            ],
            underlyingAssetAddress: '0x4f96fe3b7a6cf9725f59d353f723c1bdb64ca6aa',
            forgeIdInBytes: forgeIdsInBytes.COMPOUND,
            expiry: EXP_2021
        },
        {
            address: '0xf3fc34298d3883b1c65d7e37fca12184240e47cd',
            rewardTokenAddresses: [
                '0xf0d0eb522cfa50b716b3b1604c4f0fa6f04376ad'
            ],
            underlyingAssetAddress: '0x4f96fe3b7a6cf9725f59d353f723c1bdb64ca6aa',
            forgeIdInBytes: forgeIdsInBytes.COMPOUND,
            expiry: EXP_2022
        },
        {
            address: '0x1c5f59efb97bd1cf55853745507ef7093d6d64d4',
            rewardTokenAddresses: [
                '0xcec1967d0ea74e2efe7eda4dfa323e8252e57550'
            ],
            underlyingAssetAddress: '0xcec1967d0ea74e2efe7eda4dfa323e8252e57550',
            forgeIdInBytes: forgeIdsInBytes.SUSHISWAP_COMPLEX,
            expiry: EXP_2022
        },
        {
            address: '0xa1f84fd89c96e2fcc783f641ea07c661d3e53e55',
            rewardTokenAddresses: [
                '0x0db5af4b374e810f6e5a15ccc3d65e28cc4dbec7'
            ],
            underlyingAssetAddress: '0x0db5af4b374e810f6e5a15ccc3d65e28cc4dbec7',
            forgeIdInBytes: forgeIdsInBytes.SUSHISWAP_SIMPLE,
            expiry: EXP_2022
        }
    ],
    pendleMarkets: [
        {
            address: '0x16d7dd5673ed2f1adaaa0feabba2271585e498cc',
            pair: [
                '0xc955476480071d00c1afd1c9fd3a12526d309912',
                '0xe22da380ee6b445bb8273c81944adeb6e8450422'
            ],
            rewardTokenAddresses: [
                '0xe12afec5aa12cf614678f9bfeeb98ca9bb95b5b0'
            ],
            marketFactoryId: marketFactoryIds.AAVE,
        },
        {
            address: '0xba83823e364646d0d60ecfc9b2b31311abf66688',
            pair: [
                '0xe105f625dcfe828528a7bcfd342e792606739f32',
                '0xe22da380ee6b445bb8273c81944adeb6e8450422'
            ],
            rewardTokenAddresses: [
                '0xe12afec5aa12cf614678f9bfeeb98ca9bb95b5b0'
            ],
            marketFactoryId: marketFactoryIds.AAVE
        },
        {
            address: '0xbcd2962e406a3265a90d4ed54880cc089bc8ec1f',
            pair: [
                '0xaee5e8b3a1ae9f54548e62f423144f8c160382e0',
                '0xe22da380ee6b445bb8273c81944adeb6e8450422'
            ],
            rewardTokenAddresses: [
                '0xf0d0eb522cfa50b716b3b1604c4f0fa6f04376ad'
            ],
            marketFactoryId: marketFactoryIds.COMPOUND
        },
        {
            address: '0x2c49cf6bba5b6263d15c2afe79d98fa8a0386ec2',
            pair: [
                '0xf3fc34298d3883b1c65d7e37fca12184240e47cd',
                '0xe22da380ee6b445bb8273c81944adeb6e8450422'
            ],
            rewardTokenAddresses: [
                '0xf0d0eb522cfa50b716b3b1604c4f0fa6f04376ad'
            ],
            marketFactoryId: marketFactoryIds.COMPOUND
        },
        {
            address: '0x68fc791abd6339c064146ddc9506774aa142efbe',
            pair: [
                '0x1c5f59efb97bd1cf55853745507ef7093d6d64d4',
                '0xe22da380ee6b445bb8273c81944adeb6e8450422'
            ],
            rewardTokenAddresses: [
                '0xcec1967d0ea74e2efe7eda4dfa323e8252e57550'
            ],
            marketFactoryId: marketFactoryIds.GENERIC
        },
        {
            address: '0x4835f1f01102ea3c033ae193ec6ec63961863335',
            pair: [
                '0xa1f84fd89c96e2fcc783f641ea07c661d3e53e55',
                '0xff3b42ccb73dc70af4bb2a03efcf021b5ad08033'
            ],
            rewardTokenAddresses: [
                '0x0db5af4b374e810f6e5a15ccc3d65e28cc4dbec7'
            ],
            marketFactoryId: marketFactoryIds.GENERIC
        }
    ],
    otherMarkets: [
        {
            address: '0xb55d4f07987e593c5a5052275a50893f200882be',
            pair: [
                '0x3d213f7813d6071aa7f29182c89e40db4093b95d',
                '0xb7a4f3e9097c08da09517b5ab877f7a917224ede'
            ],
            platform: MarketProtocols.Sushiswap
        }, {
            address: '0xfff220f5c22d3e3ff41ece82702627d2a43f64b0',
            pair: [
                '0x6a9f015e02937b5c59dd21d30219743d641f5291',
                '0xb7a4f3e9097c08da09517b5ab877f7a917224ede'   
            ],
            platform: MarketProtocols.Sushiswap
        }, {
            address: '0xe0685f1e7e4f67893d0d9b1532992edddb1a305e',
            pair: [
                '0xcabd309d0337b40935064f94fa8d5b79dc484df6',
                '0xb7a4f3e9097c08da09517b5ab877f7a917224ede'
            ],
            platform: MarketProtocols.Sushiswap
        }, {
            address: '0xfb8d844bfc4ec1e03d9aed3f0db909b46defe95a',
            pair: [
                '0x0bd27a73f06f2ec9aea8df6ade306b6a4e0851ff',
                '0xb7a4f3e9097c08da09517b5ab877f7a917224ede'
            ],
            platform: MarketProtocols.Sushiswap
        }, {
            address: '0xe109b6099926515dd06fe0467f769894a307a3ae',
            pair: [
                '0x994963c5501e7600f48d6d7154f3a10d6a33f4ae',
                '0xff3b42ccb73dc70af4bb2a03efcf021b5ad08033'
            ],
            platform: MarketProtocols.Sushiswap
        }, {
            address: '0xead1c2a646f1cf4f8936ae34e9112fd79bab3646',
            pair: [
                '0x4217abf12cbfedcdc0e8a30a4f384be58989db51',
                '0xe22da380ee6b445bb8273c81944adeb6e8450422'
            ],
            platform: MarketProtocols.Sushiswap
        }
    ],
    stakingPools: [
        {
            address: '0x25fc31df947eb3d92cfbdbbc38ebcf8519be49bc',
            inputTokenAddress: '0x16d7dd5673ed2f1adaaa0feabba2271585e498cc',
            contractType: StakingPoolType.LmV1,
            rewardTokenAddresses: [
                '0xff3b42ccb73dc70af4bb2a03efcf021b5ad08033'
            ],
            interestTokensAddresses: [
                '0xe12afec5aa12cf614678f9bfeeb98ca9bb95b5b0'
            ],
            expiry: EXP_2021,
            active: true
        },
        {
            address: '0x25fc31df947eb3d92cfbdbbc38ebcf8519be49bc',
            inputTokenAddress: '0xba83823e364646d0d60ecfc9b2b31311abf66688',
            contractType: StakingPoolType.LmV1,
            rewardTokenAddresses: [
                '0xff3b42ccb73dc70af4bb2a03efcf021b5ad08033'
            ],
            interestTokensAddresses: [
                '0xe12afec5aa12cf614678f9bfeeb98ca9bb95b5b0'
            ],
            expiry: EXP_2022,
            active: true
        },
        {
            address: '0x4a7e31f01119c921fda702e54a882a289cf7c637',
            inputTokenAddress: '0xbcd2962e406a3265a90d4ed54880cc089bc8ec1f',
            contractType: StakingPoolType.LmV1,
            rewardTokenAddresses: [
                '0xff3b42ccb73dc70af4bb2a03efcf021b5ad08033'
            ],
            interestTokensAddresses: [
                '0xf0d0eb522cfa50b716b3b1604c4f0fa6f04376ad'
            ],
            expiry: EXP_2021,
            active: true
        },
        {
            address: '0x4a7e31f01119c921fda702e54a882a289cf7c637',
            inputTokenAddress: '0x2c49cf6bba5b6263d15c2afe79d98fa8a0386ec2',
            contractType: StakingPoolType.LmV1,
            rewardTokenAddresses: [
                '0xff3b42ccb73dc70af4bb2a03efcf021b5ad08033'
            ],
            interestTokensAddresses: [
                '0xf0d0eb522cfa50b716b3b1604c4f0fa6f04376ad'
            ],
            expiry: EXP_2022,
            active: true
        },
        {
            address: '0x63faa1e8faebafa0209e8a9fb4c418828485de85',
            inputTokenAddress: '0x68fc791abd6339c064146ddc9506774aa142efbe',
            contractType: StakingPoolType.LmV1,
            rewardTokenAddresses: [
                '0xff3b42ccb73dc70af4bb2a03efcf021b5ad08033'
            ],
            interestTokensAddresses: [
                '0xcec1967d0ea74e2efe7eda4dfa323e8252e57550'
            ],
            expiry: EXP_2022,
            active: true
        },
        {
            address: '0x5fdbb48fced67425ab0598544de1aa63c220ea9d',
            inputTokenAddress: '0x4835f1f01102ea3c033ae193ec6ec63961863335',
            contractType: StakingPoolType.LmV1,
            rewardTokenAddresses: [
                '0xff3b42ccb73dc70af4bb2a03efcf021b5ad08033'
            ],
            interestTokensAddresses: [
                '0x0db5af4b374e810f6e5a15ccc3d65e28cc4dbec7'
            ],
            expiry: EXP_2022,
            active: true
        },
        {
            address: "0x5a336682ed0b21d48c4e905d62d7db627c46dfe6",
            inputTokenAddress: "0xb55d4f07987e593c5a5052275a50893f200882be",
            contractType: StakingPoolType.LmV2,
            rewardTokenAddresses: [
                '0xff3b42ccb73dc70af4bb2a03efcf021b5ad08033'
            ],
            interestTokensAddresses: [],
            active: true
        },
        {
            address: "0x4e0dd650beffc89a7872df4cce4756f3564aca22",
            inputTokenAddress: "0xfff220f5c22d3e3ff41ece82702627d2a43f64b0",
            contractType: StakingPoolType.LmV2,
            rewardTokenAddresses: [
                '0xff3b42ccb73dc70af4bb2a03efcf021b5ad08033'
            ],
            interestTokensAddresses: [],
            active: true
        },
        {
            address: "0x92d44a8c833c26f8778fa056c382ae1090492049",
            inputTokenAddress: "0xe0685f1e7e4f67893d0d9b1532992edddb1a305e",
            contractType: StakingPoolType.LmV2,
            rewardTokenAddresses: [
                '0xff3b42ccb73dc70af4bb2a03efcf021b5ad08033'
            ],
            interestTokensAddresses: [],
            active: true
        },
        {
            address: "0xb29f1150c96f182cdd37ac78325216481ef43de7",
            inputTokenAddress: "0xfb8d844bfc4ec1e03d9aed3f0db909b46defe95a",
            contractType: StakingPoolType.LmV2,
            rewardTokenAddresses: [
                '0xff3b42ccb73dc70af4bb2a03efcf021b5ad08033'
            ],
            interestTokensAddresses: [],
            active: true
        },
        {
            address: "0x71faf7da78be1e30aa6dcf4cbcef047fa937d08d",
            inputTokenAddress: "0xe109b6099926515dd06fe0467f769894a307a3ae",
            contractType: StakingPoolType.LmV2,
            rewardTokenAddresses: [
                '0xff3b42ccb73dc70af4bb2a03efcf021b5ad08033'
            ],
            interestTokensAddresses: [],
            active: true
        },
        {
            address: "0xefb89e619519cf78e1f45806ee5650b2e49ed6f6",
            inputTokenAddress: "0xead1c2a646f1cf4f8936ae34e9112fd79bab3646",
            contractType: StakingPoolType.LmV2,
            rewardTokenAddresses: [
                '0xff3b42ccb73dc70af4bb2a03efcf021b5ad08033'
            ],
            interestTokensAddresses: [],
            active: true
        },
        {
            address: '0x762545bf8fcae6c0d2d4c48af159dc57ec8d2e67',
            inputTokenAddress: '0xff3b42ccb73dc70af4bb2a03efcf021b5ad08033',
            contractType: StakingPoolType.PendleSingleSided,
            rewardTokenAddresses: [
                '0xff3b42ccb73dc70af4bb2a03efcf021b5ad08033'
            ],
            interestTokensAddresses: [],
            active: true
        }
    ],
    misc: {
        PendleRedeemProxy: '0x866a680d43cb17f2b65f7ccc3471146a560afada',
        PendleLiquidityRewardsReader: '0xb4972941692b3a324af1015dacd78f9df2da3601',
        PendleRouter: '0xA088F289659245af08640A439956256e130aBB9F',
        PendleData: '0xb41094b55ae8ce23adfa6c4156c473e6d0e3287e',
        MultiCallV2: '0xf6a6133725d5c77f35883f4a198bcd1aa5bd50a8'
    },
    tokens: {
        USDC: '0xe22da380ee6b445bb8273c81944adeb6e8450422',
        PENDLE: '0xff3b42ccb73dc70af4bb2a03efcf021b5ad08033',
        DAI: '0x4f96fe3b7a6cf9725f59d353f723c1bdb64ca6aa',
        PENDLEETH_SLP: '0x0db5af4b374e810f6e5a15ccc3d65e28cc4dbec7',
        ETHUSDC_SLP: '0xcec1967d0ea74e2efe7eda4dfa323e8252e57550',
        WETH: '0xd0a1e359811322d97991e03f863a0c30c2cf029c'
    },
    forges: {
        [forgeIdsInBytes.AAVE]: "0x08f16a620629be196e72ef91f408bf9ecd0c5e42",
        [forgeIdsInBytes.COMPOUND]: "0x9b0234cda0edb9bcd51406ad711a542787745a58",
        [forgeIdsInBytes.SUSHISWAP_SIMPLE]: "0x76f85ae7b6061af474f28e395b90f6391c1b7e57",
        [forgeIdsInBytes.SUSHISWAP_COMPLEX]: "0xacf49e27b5e7aa663e0b4a38d65d151f65e00b62"
    }
}

