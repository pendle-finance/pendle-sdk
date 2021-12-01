import { BigNumber as BN, utils } from 'ethers';

const ONE_E_18 = BN.from(10).pow(18);
const ONE_DAY = BN.from(86400);
const RONE = BN.from(2).pow(40);
const LIQ_MINING_ALLOCATION_DENOMINATOR = 1000000000;
const INF = BN.from(2)
  .pow(256)
  .sub(1);

export const common = {
  ONE_E_18,
  INF,
  FORGE_AAVE_V2: utils.formatBytes32String('AaveV2'),
  MARKET_FACTORY_AAVE: utils.formatBytes32String('Aave'),
  FORGE_COMPOUND: utils.formatBytes32String('CompoundV2'),
  MARKET_FACTORY_COMPOUND: utils.formatBytes32String('Compound'),
  FORGE_SUSHISWAP_SIMPLE: utils.formatBytes32String('SushiswapSimple'),
  FORGE_SUSHISWAP_COMPLEX: utils.formatBytes32String('SushiswapComplex'),
  FORGE_COMPOUNDV2: utils.formatBytes32String('CompoundV2Upgraded'),
  MARKET_FACTORY_GENERIC: utils.formatBytes32String('Generic'),
  CODE_HASH_SUSHISWAP: '0xe18a34eb0e04b04f7a0ac29a6e80748dca96319b42c54d679cb821dca90c6303',
  CODE_HASH_UNISWAP: '0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f',
  ZERO_ADDRESS: '0x0000000000000000000000000000000000000000',
  MAX_ALLOWANCE: BN.from(2)
    .pow(BN.from(256))
    .sub(BN.from(1)),
  ONE_DAY,
  // TEST_EXPIRY: 1624147200,
  LIQ_MINING_ALLOCATION_DENOMINATOR,
  HIGH_GAS_OVERRIDE: { gasLimit: 80000000 },
  liqParams: {
    EPOCH_DURATION: ONE_DAY.mul(7),
    VESTING_EPOCHS: 5,
    ALLOCATIONS: [LIQ_MINING_ALLOCATION_DENOMINATOR],
    REWARDS_PER_EPOCH: [], // TO BE OVERRIDED in script
    EXPIRIES: [], // TO BE OVERRIDED in script
    START_TIME: 0, // TO BE OVERRIDED in script
  },

  // Protocol params;
  LOCK_NUMERATOR: BN.from(1),
  LOCK_DENOMINATOR: BN.from(20),
  INTEREST_UPDATE_RATE_DELTA_FOR_MARKET: BN.from(2)
    .pow(40)
    .mul(334184)
    .div(1e10), // 0.00334184 %
  EXPIRY_DIVISOR: ONE_DAY.mul(7),
  B_DELTA: BN.from(6595),
  // Fee
  FORGE_FEE: RONE.mul(3).div(100), // 3% forge fee
  SWAP_FEE: RONE.mul(35).div(10000), // 0.35%
  PROTOCOL_SWAP_FEE: RONE.div(7), // 1/7 * 0.35% = 0.05%
};

export const mainnetConstants = {
  common,
  misc: {
    // AAVE_LENDING_POOL_CORE_ADDRESS: '0x3dfd23A6c5E8BbcFc9581d2E864a68feb6a076d3',
    // AAVE_LENDING_POOL_ADDRESS: '0x398ec7346dcd622edc5ae82352f02be94c62d119',
    COMPOUND_COMPTROLLER_ADDRESS: '0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b', //checked *2
    AAVE_V2_LENDING_POOL_ADDRESS: '0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9', //checked *2

    // Pendle token distribution
    INVESTOR_AMOUNT: BN.from(37417125).mul(ONE_E_18),
    ADVISOR_AMOUNT: BN.from(2500000).mul(ONE_E_18),
    TEAM_AMOUNT: BN.from(55000000).mul(ONE_E_18),
    TEAM_INVESTOR_ADVISOR_AMOUNT: BN.from(94917125).mul(ONE_E_18),
    ECOSYSTEM_FUND_TOKEN_AMOUNT: BN.from(46 * 10 ** 6).mul(ONE_E_18),
    PUBLIC_SALES_TOKEN_AMOUNT: BN.from(16582875).mul(ONE_E_18),
    INITIAL_LIQUIDITY_EMISSION: BN.from(1200000).mul(ONE_E_18),
    CONFIG_DENOMINATOR: BN.from(72000000000),
    CONFIG_CHANGES_TIME_LOCK: BN.from(7 * 24 * 3600),
    PENDLE_START_TIME: BN.from(4000000000),
    INITIAL_WEEKLY_EMISSION: BN.from(1200000).mul(ONE_E_18),
    ONE_QUARTER: BN.from(7884000),

    // OT rewards
    STKAAVE_ADDRESS: '0x4da27a545c0c5b758a6ba100e3a049001de870f5', // checked * 2
    COMP_ADDRESS: '0xc00e94cb662c3520282e6f5717214004a7f26888', // checked * 2
    AAVE_INCENTIVES_CONTROLLER: '0xd784927Ff2f95ba542BfC824c8a8a98F3495f6b5', //checked * 2
    SUSHI_ADDRESS: '0x6b3595068778dd592e39a122f4f5a5cf09c90fe2',
    MASTER_CHEF: '0xc2EdaD668740f1aA35E4D8f227fB8E17dcA888Cd',

    SUSHISWAP_PAIR_FACTORY: '0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac',
    SUSHISWAP_ROUTER: '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F',
    UNISWAP_ROUTER: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
  },
  tokens: {
    USDT_AAVE: {
      // USDT
      address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
      decimal: 6,
      owner: '0xC6CDE7C39eB2f0F0095F41570af89eFC2C1Ea828',
      compound: '0xf650c3d88d12db855b8bf7d11be6c55a4e07dcc9',
    },
    USDT_COMPOUND: {
      // USDT
      address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
      decimal: 6,
      owner: '0xC6CDE7C39eB2f0F0095F41570af89eFC2C1Ea828',
      compound: '0xf650c3d88d12db855b8bf7d11be6c55a4e07dcc9',
    },
    WETH: {
      // must check
      address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', // checked * 2
      decimal: 18,
      compound: '0x4ddc2d193948926d02f9b1fe9e1daa0718270ed5', // cEther - checked * 2
    },
    USDC: {
      address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // checked * 2
      decimal: 6,
      compound: '0x39aa39c021dfbae8fac545936693ac917d5e7563', // cUSDC - checked * 2
      whales: [
        '0x0a59649758aa4d66e25f08dd01271e891fe52199',
        '0x47ac0fb4f2d84898e4d9e7b4dab3c24507a6d503',
        '0xae2d4617c862309a3d75a0ffb358c7a5009c673f',
        '0xf977814e90da44bfa03b6295a0616a897441acec',
        '0xa191e578a6736167326d05c119ce0c90849e84b7',
        '0x7e0188b0312a26ffe64b7e43a7a91d430fb20673',
      ],
    },
    USDT: {
      address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
      decimal: 6,
      owner: '0xC6CDE7C39eB2f0F0095F41570af89eFC2C1Ea828',
      compound: '0xf650c3d88d12db855b8bf7d11be6c55a4e07dcc9',
      whales: [
        '0xa929022c9107643515f5c777ce9a910f0d1e490c',
        '0x28C6c06298d514Db089934071355E5743bf21d60',
        '0x47ac0fb4f2d84898e4d9e7b4dab3c24507a6d503',
        '0x3567cafb8bf2a83bbea4e79f3591142fb4ebe86d',
        '0x5754284f345afc66a98fbb0a0afe71e0f007b949',
        '0xF5565F298D47C95DE222d0e242A69D2711fE3E89',
      ],
    },
    DAI: {
      address: '0x6b175474e89094c44da98b954eedeac495271d0f',
      decimal: 18,
      whales: [
        '0x47ac0fb4f2d84898e4d9e7b4dab3c24507a6d503',
        '0x6f6c07d80d0d433ca389d336e6d1febea2489264',
        '0x9cd83be15a79646a3d22b81fc8ddf7b7240a62cb',
        '0xb527a981e1d415af696936b3174f2d7ac8d11369',
        '0x2feb1512183545f48f6b9c5b4ebfcaf49cfca6f3',
        '0x40ec5B33f54e0E8A33A975908C5BA1c14e5BbbDf',
      ],
    },
    'ETHUSDC-SLP': {
      address: '0x397ff1542f962076d0bfe58ea045ffa2d347aca0',
      decimal: 18,
      whales: [
        '0xc2edad668740f1aa35e4d8f227fb8e17dca888cd',
        '0x7ac049b7d78bc930e463709ec5e77855a5dca4c4',
        '0xa019a71f73922f5170031f99efc37f31d3020f0b',
        '0xe4169a135c437b9c7d5606f5b0ea1b3f612e961e',
        '0xee7cb13cab0fb7bdbb454eaf0aae2e459f3a0e50',
        '0x3cc432b703c68b089601f0e3f407632df6d8701a',
        '0x43771f30f50a556faee372a24ce9c9d73492a121',
      ],
    },
    'PENDLEETH-SLP': {
      address: '0x37922c69b08babcceae735a31235c81f1d1e8e43',
      decimals: 18,
      whales: [
        '0xc33f3c7b350e42d9cda46a8170faf7bdea178d4b',
        '0xbfd6b497dca3e5d1fa4bbd52996d400980c29eb7',
        '0xc8549e0d675737e7d42775b416a4285d0198b2d2',
      ],
    },
    PENDLE: {
      address: '0x808507121B80c02388fAd14726482e061B8da827',
      decimals: 18,
      whales: [
        '0xea8761b697bb193b7c511d97017ad09638701ee7',
        '0x8849d0d4c35679aa78df1b5b4ceca358d57635df',
        '0xc21a74c7150fed22c7ca0bf9a15bbe0ddb4977cc',
        '0x6262998ced04146fa42253a5c0af90ca02dfd2a3',
        '0x6a23da6b0a1b07e82b12d620a0de66682e1d99f7',
        '0x760484042a7856e62b627318796ebb609c8131a1',
      ],
    },
    'OT-PE/P-SLP': {
      address: '0xb124c4e18a282143d362a066736fd60d22393ef4',
      decimals: 18,
      whales: [
        '0x309d8cf8f7c3340b50ff0ef457075a3c5792203f',
        '0x5fa58f29c6138c07c2f9e9d0066f774a7ca3b7df',
        '0x2c09fd74e80ce12bebbc8f56fab8633ea41c2bcc',
        '0xc2edad668740f1aa35e4d8f227fb8e17dca888cd',
        '0x29bbf26fc9628d076094c20f0cea51142bbc4aa5',
      ],
    },
    cDAI: {
      address: '0x5d3a536e4d6dbd6114cc1ead35777bab948e3643',
      decimals: 8,
      whales: [
        '0x6341c289b2e0795a04223df04b53a77970958723',
        '0x41d207bc7e5d1f44aaf572d4a06cd0ef1ea2b01b',
        '0x1d1e63975486dfa6e7f28448ae224c9f41588642',
        '0xab4ce310054a11328685ece1043211b68ba5d082',
        '0x52185a2bbcfd67c1d07963e3575175ee9f95a551',
        '0x7d6149ad9a573a6e2ca6ebf7d4897c1b766841b4',
      ],
    },
    aUSDC: {
      address: '0xbcca60bb61934080951369a648fb03df4f96263c',
      decimals: 6,
      whales: [
        '0x3ddfa8ec3052539b6c9549f12cea2c295cff5296',
        '0x763bf487d386afbf9c476e047d37b74636b9e831',
        '0x602d9abd5671d24026e2ca473903ff2a9a957407',
      ],
    },
    // AUSDT: {
    //   address: '0x71fc860F7D3A592A4a98740e39dB31d25db65ae8',
    //   decimal: 6,
    //   owner: '0x4188a7dca2757ebc7d9a5bd39134a15b9f3c6402',
    // },
  },
};
