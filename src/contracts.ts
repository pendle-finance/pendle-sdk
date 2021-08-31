const IPendleMarket = require('@pendle/core/build/artifacts/contracts/interfaces/IPendleMarket.sol/IPendleMarket.json');
const IPendleRouter = require('@pendle/core/build/artifacts/contracts/interfaces/IPendleRouter.sol/IPendleRouter.json');
const IERC20 = require('@pendle/core/build/artifacts/contracts/interfaces/ICToken.sol/ICToken.json');
//TODO: User proper IERC20

export const contracts = {
  IPendleMarket,
  IPendleRouter,
  IERC20,
};
