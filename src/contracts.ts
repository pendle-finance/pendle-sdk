const IPendleMarket = require('@pendle/core/build/artifacts/contracts/interfaces/IPendleMarket.sol/IPendleMarket.json');
const IPendleRouter = require('@pendle/core/build/artifacts/contracts/interfaces/IPendleRouter.sol/IPendleRouter.json');
const IPendleData = require('@pendle/core/build/artifacts/contracts/interfaces/IPendleData.sol/IPendleData.json');
const IPendleForge = require('@pendle/core/build/artifacts/contracts/interfaces/IPendleForge.sol/IPendleForge.json');
const PendleSushiswapComplexForge = require('@pendle/core/build/artifacts/contracts/core/SushiswapComplex/PendleSushiswapComplexForge.sol/PendleSushiswapComplexForge.json')
const PendleAaveV2Forge = require('@pendle/core/build/artifacts/contracts/core/aave/v2/PendleAaveV2Forge.sol/PendleAaveV2Forge.json');
const PendleCompoundForge = require('@pendle/core/build/artifacts/contracts/core/compound/PendleCompoundForge.sol/PendleCompoundForge.json');
const PendleSushiswapSimpleForge = require('@pendle/core/build/artifacts/contracts/core/SushiswapSimple/PendleSushiswapSimpleForge.sol/PendleSushiswapSimpleForge.json');
const IERC20 = require('@pendle/core/build/artifacts/contracts/interfaces/ICToken.sol/ICToken.json');
const PendleLiquidityMiningBase = require('@pendle/core/build/artifacts/contracts/core/abstract/PendleLiquidityMiningBase.sol/PendleLiquidityMiningBase.json');
const PendleLiquidityMiningV2Base = require('@pendle/core/build/artifacts/contracts/core/abstractV2/PendleLiquidityMiningBaseV2.sol/PendleLiquidityMiningBaseV2.json');
const PendleSLPLiquidityMining = require('@pendle/core/build/artifacts/contracts/core/SushiswapComplex/PendleSLPLiquidityMining.sol/PendleSLPLiquidityMining.json');
const PendleRedeemProxy = require('@pendle/core/build/artifacts/contracts/misc/PendleRedeemProxyETH.sol/PendleRedeemProxyETH.json');
const PendleLiquidityRewardsProxy = require('@pendle/core/build/artifacts/contracts/misc/PendleLiquidityRewardsProxy.sol/PendleLiquidityRewardsProxy.json');
const PendleSingleSidedStaking = require('@pendle/single-staking/build/artifacts/contracts/SingleStaking.sol/SingleStaking.json');
const PendleSingleStakingManager = require('@pendle/single-staking/build/artifacts/contracts/SingleStakingManager.sol/SingleStakingManager.json');
const PendleWrapper = require('@pendle/core/build/artifacts/contracts/proxies/PendleWrapper.sol/PendleWrapper.json');
const PendleTraderJoeYieldTokenHolder = require("../abis/PendleTraderJoeYieldTokenHolder.json")
const SushiMasterChef = require('../abis/SushiMasterChefABI.json');
const JoeMasterChef = require('../abis/JoeMasterChefABI.json');
const MultiCallV2 = require('../abis/MulticallV2.json');
const UniswapV2Pair = require('@pendle/core/build/artifacts/contracts/interfaces/IUniswapV2Pair.sol/IUniswapV2Pair.json');

//TODO: User proper IERC20

export const contracts = {
  IPendleMarket,
  IPendleRouter,
  IPendleData,
  IPendleForge,
  IERC20,
  PendleLiquidityMiningBase,
  PendleLiquidityMiningV2Base,
  PendleSLPLiquidityMining,
  PendleSingleSidedStaking,
  PendleRedeemProxy,
  PendleLiquidityRewardsProxy,
  PendleSushiswapComplexForge,
  PendleSushiswapSimpleForge,
  PendleAaveV2Forge,
  PendleCompoundForge,
  PendleTraderJoeYieldTokenHolder,
  SushiMasterChef,
  JoeMasterChef,
  PendleSingleStakingManager,
  PendleWrapper,
  MultiCallV2,
  UniswapV2Pair
};
