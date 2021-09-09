const IPendleMarket = require('@pendle/core/build/artifacts/contracts/interfaces/IPendleMarket.sol/IPendleMarket.json');
const IPendleRouter = require('@pendle/core/build/artifacts/contracts/interfaces/IPendleRouter.sol/IPendleRouter.json');
const IPendleData = require('@pendle/core/build/artifacts/contracts/interfaces/IPendleData.sol/IPendleData.json');
const IPendleForge = require('@pendle/core/build/artifacts/contracts/interfaces/IPendleForge.sol/IPendleForge.json');
const PendleSushiswapComplexForge = require('@pendle/core/build/artifacts/contracts/core/SushiswapComplex/PendleSushiswapComplexForge.sol/PendleSushiswapComplexForge.json')
const IERC20 = require('@pendle/core/build/artifacts/contracts/interfaces/ICToken.sol/ICToken.json');
const PendleLiquidityMiningBase = require('@pendle/core/build/artifacts/contracts/core/abstract/PendleLiquidityMiningBase.sol/PendleLiquidityMiningBase.json');
const PendleRedeemProxy = require('@pendle/core/build/artifacts/contracts/misc/PendleRedeemProxy.sol/PendleRedeemProxy.json');
const PendleLiquidityRewardsProxy = require('@pendle/core/build/artifacts/contracts/misc/PendleLiquidityRewardsProxy.sol/PendleLiquidityRewardsProxy.json')

//TODO: User proper IERC20

export const contracts = {
  IPendleMarket,
  IPendleRouter,
  IPendleData,
  IPendleForge,
  IERC20,
  PendleLiquidityMiningBase,
  PendleRedeemProxy,
  PendleLiquidityRewardsProxy,
  PendleSushiswapComplexForge
};
