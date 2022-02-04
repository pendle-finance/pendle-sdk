import { NetworkContractAddresses, StakingPoolType, MarketProtocols } from "./types";
import { EXP_2021, EXP_2022, forgeIdsInBytes, marketFactoryIds } from "../constants";

export const mainnetContracts: NetworkContractAddresses = {
    stakingPools: [
        {
            address: "0x0f3bccbfef1dc227f33a11d7a51cd02dead208c8",
            inputTokenAddress: "0x685d32f394a5f03e78a1a0f6a91b4e2bf6f52cfe",
            contractType: StakingPoolType.LmV1,
            rewardTokenAddresses: [
                "0x808507121b80c02388fad14726482e061b8da827"
            ],
            interestTokensAddresses: [
                "0x37922c69b08babcceae735a31235c81f1d1e8e43"
            ],
            expiry: EXP_2022,
            active: false,
            startTime: "1629331200"
        },
        {
            address: "0xa78029ab5235b9a83ec45ed036042db26c6e4300",
            inputTokenAddress: "0x79c05da47dc20ff9376b2f7dbf8ae0c994c3a0d0",
            contractType: StakingPoolType.LmV1,
            rewardTokenAddresses: [
                "0x808507121b80c02388fad14726482e061b8da827"
            ],
            interestTokensAddresses: [
                "0x397ff1542f962076d0bfe58ea045ffa2d347aca0"
            ],
            expiry: EXP_2022,
            active: false,
            startTime: "1629331200"
        },
        {
            address: "0x6f40a68e99645c60f14b497e75ae024777d61726",
            inputTokenAddress: "0x9e382e5f78b06631e4109b5d48151f2b3f326df0",
            contractType: StakingPoolType.LmV1,
            rewardTokenAddresses: [
                "0x808507121b80c02388fad14726482e061b8da827"
            ],
            interestTokensAddresses: [
                "0xbcca60bb61934080951369a648fb03df4f96263c"
            ],
            expiry: EXP_2021,
            active: false,
            startTime: "1623888000"
        },
        {
            address: "0x6f40a68e99645c60f14b497e75ae024777d61726",
            inputTokenAddress: "0x8315bcbc2c5c1ef09b71731ab3827b0808a2d6bd",
            contractType: StakingPoolType.LmV1,
            rewardTokenAddresses: [
                "0x808507121b80c02388fad14726482e061b8da827"
            ],
            interestTokensAddresses: [
                "0xbcca60bb61934080951369a648fb03df4f96263c"
            ],
            expiry: EXP_2022,
            active: false,
            startTime: "1623888000"
        },
        {
            address: "0x5b1c59eb6872f88a92469751a034b9b5ada9a73f",
            inputTokenAddress: "0x944d1727d0b656f497e74044ff589871c330334f",
            contractType: StakingPoolType.LmV1,
            rewardTokenAddresses: [
                "0x808507121b80c02388fad14726482e061b8da827"
            ],
            interestTokensAddresses: [
                "0x5d3a536e4d6dbd6114cc1ead35777bab948e3643"
            ],
            expiry: EXP_2021,
            active: false,
            startTime: "1623888000"
        },
        {
            address: "0x5b1c59eb6872f88a92469751a034b9b5ada9a73f",
            inputTokenAddress: "0xb26c86330fc7f97533051f2f8cd0a90c2e82b5ee",
            contractType: StakingPoolType.LmV1,
            rewardTokenAddresses: [
                "0x808507121b80c02388fad14726482e061b8da827"
            ],
            interestTokensAddresses: [
                "0x5d3a536e4d6dbd6114cc1ead35777bab948e3643"
            ],
            expiry: EXP_2022,
            active: false,
            startTime: "1623888000"
        },
        {
            address: "0x309d8cf8f7c3340b50ff0ef457075a3c5792203f",
            inputTokenAddress: "0xb124c4e18a282143d362a066736fd60d22393ef4",
            contractType: StakingPoolType.LmV2,
            rewardTokenAddresses: [
                "0x808507121b80c02388fad14726482e061b8da827"
            ],
            interestTokensAddresses: [],
            active: false,
            startTime: "1629331200"
        },
        {
            address: "0x529c513dde7968e19e79e38ff94d36e4c3c21eb7",
            inputTokenAddress: "0x72972b21ce425cfd67935e07c68e84300ce3f40f",
            contractType: StakingPoolType.LmV2,
            rewardTokenAddresses: [
                "0x808507121b80c02388fad14726482e061b8da827"
            ],
            interestTokensAddresses: [],
            active: false,
            startTime: "1629331200"
        },
        {
            address: "0xa26da78fe6c8d4ba2f1779fd36aed994a8a50bee",
            inputTokenAddress: "0x8b758d7fd0fc58fca8caa5e53af2c7da5f5f8de1",
            contractType: StakingPoolType.LmV2,
            rewardTokenAddresses: [
                "0x808507121b80c02388fad14726482e061b8da827"
            ],
            interestTokensAddresses: [],
            active: false,
            startTime: "1628726400"
        },
        {
            address: "0x94a7432b811e29128964fba993f159928744e7c7",
            inputTokenAddress: "0x0d8a21f2ea15269b7470c347083ee1f85e6a723b",
            contractType: StakingPoolType.LmV2,
            rewardTokenAddresses: [
                "0x808507121b80c02388fad14726482e061b8da827"
            ],
            interestTokensAddresses: [],
            active: false,
            startTime: "1628726400"
        },
        {
            address: "0x31fc01529419ee9623afc5b65d7d72102d116e90",
            inputTokenAddress: "0x2c80d72af9ab0bb9d98f607c817c6f512dd647e6",
            contractType: StakingPoolType.LmV2,
            rewardTokenAddresses: [
                "0x808507121b80c02388fad14726482e061b8da827"
            ],
            interestTokensAddresses: [],
            active: false,
            startTime: "1628726400"
        },
        {
            address: "0xfc3468da89cb5bdf893242ece0324b51ea6482c6",
            inputTokenAddress: "0x4556c4488cc16d5e9552cc1a99a529c1392e4fe9",
            contractType: StakingPoolType.LmV2,
            rewardTokenAddresses: [
                "0x808507121b80c02388fad14726482e061b8da827"
            ],
            interestTokensAddresses: [],
            active: false,
            startTime: "1628726400"
        },
        {
            address: "0x07c87cfe096c417212eab4152d365f0f7dc6fce4",
            inputTokenAddress: "0x8b758d7fd0fc58fca8caa5e53af2c7da5f5f8de1",
            contractType: StakingPoolType.LmV2,
            rewardTokenAddresses: [
                "0x808507121b80c02388fad14726482e061b8da827"
            ],
            interestTokensAddresses: [],
            active: false,
            startTime: "1629936000"
        },
        {
            address: "0xfb0e378b3ed6d7f8b73230644d945e28fd7f7b03",
            inputTokenAddress: "0x0d8a21f2ea15269b7470c347083ee1f85e6a723b",
            contractType: StakingPoolType.LmV2,
            rewardTokenAddresses: [
                "0x808507121b80c02388fad14726482e061b8da827"
            ],
            interestTokensAddresses: [],
            active: false,
            startTime: "1629936000"
        },
        {
            address: "0x071dc669be57c1b3053f746db20cb3bf54383aea",
            inputTokenAddress: "0x2c80d72af9ab0bb9d98f607c817c6f512dd647e6",
            contractType: StakingPoolType.LmV2,
            rewardTokenAddresses: [
                "0x808507121b80c02388fad14726482e061b8da827"
            ],
            interestTokensAddresses: [],
            active: false,
            startTime: "1629936000"
        },
        {
            address: "0xa660c9aaa46b696df01768e1d2d88ce2d5293778",
            inputTokenAddress: "0x4556c4488cc16d5e9552cc1a99a529c1392e4fe9",
            contractType: StakingPoolType.LmV2,
            rewardTokenAddresses: [
                "0x808507121b80c02388fad14726482e061b8da827"
            ],
            interestTokensAddresses: [],
            active: false,
            startTime: "1629936000"
        },
        {
            address: "0x2c09fd74e80ce12bebbc8f56fab8633ea41c2bcc",
            inputTokenAddress: "0xb124c4e18a282143d362a066736fd60d22393ef4",
            contractType: StakingPoolType.LmV2,
            rewardTokenAddresses: [
                "0x808507121b80c02388fad14726482e061b8da827"
            ],
            interestTokensAddresses: [
                "0x6b3595068778dd592e39a122f4f5a5cf09c90fe2"
            ],
            active: false,
            startTime: "1631145600"
        },
        {
            address: '0x07282f2ceebd7a65451fcd268b364300d9e6d7f5',
            inputTokenAddress: '0x808507121b80c02388fad14726482e061b8da827',
            contractType: StakingPoolType.PendleSingleSided,
            rewardTokenAddresses: [
                '0x808507121b80c02388fad14726482e061b8da827'
            ],
            interestTokensAddresses: [],
            active: true,
            startTime: "1623888000"
        }
    ],
    YTs: [
        {
            address: "0xffaf22db1ff7e4983b57ca9632f796f68ededef9",
            rewardTokenAddresses: [
                "0xbcca60bb61934080951369a648fb03df4f96263c"
            ],
            underlyingAssetAddress: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
            forgeIdInBytes: forgeIdsInBytes.AAVE,
            expiry: EXP_2021,
        },
        {
            address: "0xcdb5b940e95c8632decdc806b90dd3fc44e699fe",
            rewardTokenAddresses: [
                "0xbcca60bb61934080951369a648fb03df4f96263c"
            ],
            underlyingAssetAddress: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
            forgeIdInBytes: forgeIdsInBytes.AAVE,
            expiry: EXP_2022,
        },
        {
            address: "0x31654eb46a3a450265c6dfc4fc4fbbfe371e26fe",
            rewardTokenAddresses: [
                "0x5d3a536e4d6dbd6114cc1ead35777bab948e3643"
            ],
            underlyingAssetAddress: "0x6b175474e89094c44da98b954eedeac495271d0f",
            forgeIdInBytes: forgeIdsInBytes.COMPOUND,
            expiry: EXP_2021,
        },
        {
            address: "0xb7defe73528942793649c0a950ec528f66159047",
            rewardTokenAddresses: [
                "0x5d3a536e4d6dbd6114cc1ead35777bab948e3643"
            ],
            underlyingAssetAddress: "0x6b175474e89094c44da98b954eedeac495271d0f",
            forgeIdInBytes: forgeIdsInBytes.COMPOUND,
            expiry: EXP_2022
        },
        {
            address: "0x311fcb5db45a3a5876975f8108237f20525fa7e0",
            rewardTokenAddresses: [
                "0x397ff1542f962076d0bfe58ea045ffa2d347aca0"
            ],
            underlyingAssetAddress: "0x397ff1542f962076d0bfe58ea045ffa2d347aca0",
            forgeIdInBytes: forgeIdsInBytes.SUSHISWAP_COMPLEX,
            expiry: EXP_2022
        },
        {
            address: "0x49c8ac20de6409c7e0b8f9867cffd1481d8206c6",
            rewardTokenAddresses: [
                "0x37922c69b08babcceae735a31235c81f1d1e8e43"
            ],
            underlyingAssetAddress: "0x37922c69b08babcceae735a31235c81f1d1e8e43",
            forgeIdInBytes: forgeIdsInBytes.SUSHISWAP_SIMPLE,
            expiry: EXP_2022
        }
    ],
    OTs: [
        {
            address: "0x010a0288af52ed61e32674d82bbc7ddbfa9a1324",
            yieldTokenAddress: "0xbcca60bb61934080951369a648fb03df4f96263c",
            underlyingAssetAddress: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
            rewardTokenAddresses: [
                '0x4da27a545c0c5b758a6ba100e3a049001de870f5'
            ],
            forgeIdInBytes: forgeIdsInBytes.AAVE,
            expiry: EXP_2021
        },
        {
            address: "0x8fcb1783bf4b71a51f702af0c266729c4592204a",
            yieldTokenAddress: "0xbcca60bb61934080951369a648fb03df4f96263c",
            underlyingAssetAddress: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
            rewardTokenAddresses: [
                '0x4da27a545c0c5b758a6ba100e3a049001de870f5'
            ],
            forgeIdInBytes: forgeIdsInBytes.AAVE,
            expiry: EXP_2022
        },
        {
            address: "0xe55e3b62005a2035d48ac0c41a5a9c799f04892c",
            yieldTokenAddress: "0x5d3a536e4d6dbd6114cc1ead35777bab948e3643",
            underlyingAssetAddress: "0x6b175474e89094c44da98b954eedeac495271d0f",
            rewardTokenAddresses: [
                '0xc00e94cb662c3520282e6f5717214004a7f26888'
            ],
            forgeIdInBytes: forgeIdsInBytes.COMPOUND,
            expiry: EXP_2021
        },
        {
            address: "0x3d4e7f52efafb9e0c70179b688fc3965a75bcfea",
            yieldTokenAddress: "0x5d3a536e4d6dbd6114cc1ead35777bab948e3643",
            underlyingAssetAddress: "0x6b175474e89094c44da98b954eedeac495271d0f",
            rewardTokenAddresses: [
                '0xc00e94cb662c3520282e6f5717214004a7f26888'
            ],
            forgeIdInBytes: forgeIdsInBytes.COMPOUND,
            expiry: EXP_2022
        },
        {
            address: "0x322d6c69048330247165231eb7848a5c80a48878",
            yieldTokenAddress: "0x397ff1542f962076d0bfe58ea045ffa2d347aca0",
            underlyingAssetAddress: "0x397ff1542f962076d0bfe58ea045ffa2d347aca0",
            rewardTokenAddresses: [
                '0x6b3595068778dd592e39a122f4f5a5cf09c90fe2'
            ],
            forgeIdInBytes: forgeIdsInBytes.SUSHISWAP_COMPLEX,
            expiry: EXP_2022
        },
        {
            address: '0xbf682bd31a615123d28d611b38b0ae3d2b675c2c',
            yieldTokenAddress: '0x37922c69b08babcceae735a31235c81f1d1e8e43',
            underlyingAssetAddress: "0x37922c69b08babcceae735a31235c81f1d1e8e43",
            rewardTokenAddresses: [],
            forgeIdInBytes: forgeIdsInBytes.SUSHISWAP_SIMPLE,
            expiry: EXP_2022
        }
    ],
    pendleMarkets: [
        {
            address: '0x9e382e5f78b06631e4109b5d48151f2b3f326df0',
            pair: [
                '0xffaf22db1ff7e4983b57ca9632f796f68ededef9', // YT-aUSDC
                '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
            ],
            rewardTokenAddresses: [
                "0xbcca60bb61934080951369a648fb03df4f96263c"
            ],
            marketFactoryId: marketFactoryIds.AAVE
        },
        {
            address: '0x8315bcbc2c5c1ef09b71731ab3827b0808a2d6bd',
            pair: [
                '0xcdb5b940e95c8632decdc806b90dd3fc44e699fe', // YT-aUSDC
                '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
            ],
            rewardTokenAddresses: [
                "0xbcca60bb61934080951369a648fb03df4f96263c"
            ],
            marketFactoryId: marketFactoryIds.AAVE
        },
        {
            address: '0x944d1727d0b656f497e74044ff589871c330334f',
            pair: [
                '0x31654eb46a3a450265c6dfc4fc4fbbfe371e26fe', // YT-cDAI
                '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
            ],
            rewardTokenAddresses: [
                "0x5d3a536e4d6dbd6114cc1ead35777bab948e3643"
            ],
            marketFactoryId: marketFactoryIds.COMPOUND
        },
        {
            address: '0xb26c86330fc7f97533051f2f8cd0a90c2e82b5ee',
            pair: [
                '0xb7defe73528942793649c0a950ec528f66159047', // YT-cDAI
                '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
            ],
            rewardTokenAddresses: [
                "0x5d3a536e4d6dbd6114cc1ead35777bab948e3643"
            ],
            marketFactoryId: marketFactoryIds.COMPOUND
        },
        {
            address: '0x685d32f394a5f03e78a1a0f6a91b4e2bf6f52cfe',
            pair: [
                '0x49c8ac20de6409c7e0b8f9867cffd1481d8206c6', // YT-PE
                '0x808507121b80c02388fad14726482e061b8da827', // PENDLE
            ],
            rewardTokenAddresses: [
                "0x37922c69b08babcceae735a31235c81f1d1e8e43"
            ],
            marketFactoryId: marketFactoryIds.GENERIC
        },
        {
            address: '0x79c05da47dc20ff9376b2f7dbf8ae0c994c3a0d0',
            pair: [
                '0x311fcb5db45a3a5876975f8108237f20525fa7e0', // YT-ETHUSDC
                '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
            ],
            rewardTokenAddresses: [
                "0x397ff1542f962076d0bfe58ea045ffa2d347aca0"
            ],
            marketFactoryId: marketFactoryIds.GENERIC
        },
    ],
    otherMarkets: [
        {
            address: '0x37922c69b08babcceae735a31235c81f1d1e8e43',
            platform: MarketProtocols.Sushiswap,
            pair: [
                '0x808507121b80c02388fad14726482e061b8da827',
                '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
            ]
        },
        {
            address: '0x397ff1542f962076d0bfe58ea045ffa2d347aca0',
            platform: MarketProtocols.Sushiswap,
            pair: [
                '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
                '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
            ]
        },
        {
            address: '0x2c80d72af9ab0bb9d98f607c817c6f512dd647e6',
            platform: MarketProtocols.Sushiswap,
            pair: [
                '0xe55e3b62005a2035d48ac0c41a5a9c799f04892c',
                '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
            ]
        },
        {
            address: '0x4556c4488cc16d5e9552cc1a99a529c1392e4fe9',
            platform: MarketProtocols.Sushiswap,
            pair: [
                '0x3d4e7f52efafb9e0c70179b688fc3965a75bcfea',
                '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
            ]
        },
        {
            address: '0x8b758d7fd0fc58fca8caa5e53af2c7da5f5f8de1',
            platform: MarketProtocols.Sushiswap,
            pair: [
                '0x010a0288af52ed61e32674d82bbc7ddbfa9a1324',
                '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
            ]
        },
        {
            address: '0x0d8a21f2ea15269b7470c347083ee1f85e6a723b',
            platform: MarketProtocols.Sushiswap,
            pair: [
                '0x8fcb1783bf4b71a51f702af0c266729c4592204a',
                '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
            ]
        },
        {
            address: '0x72972b21ce425cfd67935e07c68e84300ce3f40f',
            platform: MarketProtocols.Sushiswap,
            pair: [
                '0x322d6c69048330247165231eb7848a5c80a48878',
                '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
            ]
        },
        {
            address: '0xb124c4e18a282143d362a066736fd60d22393ef4',
            platform: MarketProtocols.Sushiswap,
            pair: [
                '0xbf682bd31a615123d28d611b38b0ae3d2b675c2c',
                '0x808507121b80c02388fad14726482e061b8da827'
            ]
        }
    ],
    merkleDistributors: [
        {
            token: '0x808507121b80c02388fad14726482e061b8da827',
            // TODO: Replace this with the actual contract once deployed
            distributor: '0x000000000000000000000000000000000000dead',
        }
    ],
    misc: {
        PendleRedeemProxy: '0x5d5c1238b1549bcd7ff9e8994045891edd195568',
        PendleLiquidityRewardsReader: '0xa081bf40a06a5885fe5d70521249e8d253dfc2f3',
        PendleRouter: '0x1b6d3e5da9004668e14ca39d1553e9a46fe842b3',
        PendleData: '0xe8a6916576832aa5504092c1cccc46e3bb9491d6',
        PendleSingleStakingManager: '0x747fc744837deda8d1c568d8e90839e5d4495255',
        MultiCallV2: '0x5ba1e12693dc8f9c48aad8770482f4739beed696',
        MasterChef: '0xc2edad668740f1aa35e4d8f227fb8e17dca888cd',
        PendleWrapper: '0x82c9d29739333258f08cd3957d2a7ac7f4d53fab', //Dummy
        Comptroller: '0xc00e94cb662c3520282e6f5717214004a7f26888',
        SushiRouter: '0xd9e1ce17f2641f24ae83637ab66a2cca9c378b9f'
    },
    tokens: {
        USDC: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        PENDLE: '0x808507121b80c02388fad14726482e061b8da827',
        DAI: '0x6b175474e89094c44da98b954eedeac495271d0f',
        PENDLEETH_SLP: '0x37922c69b08babcceae735a31235c81f1d1e8e43',
        ETHUSDC_SLP: '0x397ff1542f962076d0bfe58ea045ffa2d347aca0',
        WETH: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
        SUSHI: '0x6b3595068778dd592e39a122f4f5a5cf09c90fe2',
        COMP: '0xc00e94cb662c3520282e6f5717214004a7f26888',
        stkAAVE: '0x4da27a545c0c5b758a6ba100e3a049001de870f5',
        aUSDC: '0xbcca60bb61934080951369a648fb03df4f96263c',
        cDAI: '0x5d3a536e4d6dbd6114cc1ead35777bab948e3643'
    },
    forges: {
        [forgeIdsInBytes.AAVE]: "0x9902475a6ffc0377b034bf469ee0879f3bd273fb",
        [forgeIdsInBytes.COMPOUND]: "0xc02ac197a4d32d93d473779fbea2dca1fb313ed5",
        [forgeIdsInBytes.SUSHISWAP_SIMPLE]: "0x6b0e6b4c0ee4b6460e5cd35a3625a172fe9d3930",
        [forgeIdsInBytes.SUSHISWAP_COMPLEX]: "0xa71bdadd4aabee6c5005aaabac0ddd27a6657251"
    }
}

