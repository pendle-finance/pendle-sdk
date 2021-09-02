const IPendleMarket = require('@pendle/core/build/artifacts/contracts/interfaces/IPendleMarket.sol/IPendleMarket.json');
const IPendleRouter = require('@pendle/core/build/artifacts/contracts/interfaces/IPendleRouter.sol/IPendleRouter.json');
const IERC20 = require('@pendle/core/build/artifacts/contracts/interfaces/ICToken.sol/ICToken.json');
const PendleLiquidityMiningBase = require('@pendle/core/build/artifacts/contracts/core/abstract/PendleLiquidityMiningBase.sol/PendleLiquidityMiningBase.json');
const PendleRedeemProxy = require('@pendle/core/build/artifacts/contracts/misc/PendleRedeemProxy.sol/PendleRedeemProxy.json');
const PendleLiquidityRewardsProxy = require('@pendle/core/build/artifacts/contracts/misc/PendleLiquidityRewardsProxy.sol/PendleLiquidityRewardsProxy.json')

//TODO: User proper IERC20

export const contracts = {
  IPendleMarket,
  IPendleRouter,
  IERC20,
  PendleLiquidityMiningBase,
  PendleRedeemProxy,
  PendleLiquidityRewardsProxy
};
