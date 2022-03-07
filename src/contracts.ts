import IPendleMarket from '@pendle/core/build/artifacts/contracts/interfaces/IPendleMarket.sol/IPendleMarket.json';
import IPendleRouter from '@pendle/core/build/artifacts/contracts/interfaces/IPendleRouter.sol/IPendleRouter.json';
import IPendleData from '@pendle/core/build/artifacts/contracts/interfaces/IPendleData.sol/IPendleData.json';
import IPendleForge from '@pendle/core/build/artifacts/contracts/interfaces/IPendleForge.sol/IPendleForge.json';
import PendleBaseToken from '@pendle/core/build/artifacts/contracts/tokens/PendleBaseToken.sol/PendleBaseToken.json';
import PendleSushiswapComplexForge from '@pendle/core/build/artifacts/contracts/core/SushiswapComplex/PendleSushiswapComplexForge.sol/PendleSushiswapComplexForge.json';
import PendleAaveV2Forge from '@pendle/core/build/artifacts/contracts/core/aave/v2/PendleAaveV2Forge.sol/PendleAaveV2Forge.json';
import PendleCompoundForge from '@pendle/core/build/artifacts/contracts/core/compound/PendleCompoundForge.sol/PendleCompoundForge.json';
import PendleCompoundV2Forge from '@pendle/core/build/artifacts/contracts/core/compoundV2/PendleCompoundV2Forge.sol/PendleCompoundV2Forge.json';
import PendleSushiswapSimpleForge from '@pendle/core/build/artifacts/contracts/core/SushiswapSimple/PendleSushiswapSimpleForge.sol/PendleSushiswapSimpleForge.json';
import IERC20 from '@pendle/core/build/artifacts/contracts/interfaces/ICToken.sol/ICToken.json';
import PendleLiquidityMiningBase from '@pendle/core/build/artifacts/contracts/core/abstract/PendleLiquidityMiningBase.sol/PendleLiquidityMiningBase.json';
import PendleLiquidityMiningV2Base from '@pendle/core/build/artifacts/contracts/core/abstractV2/PendleLiquidityMiningBaseV2.sol/PendleLiquidityMiningBaseV2.json';
import PendleGenericLiquidityMiningMulti from '@pendle/core/build/artifacts/contracts/core/Generic/PendleGenericLiquidityMiningMulti.sol/PendleGenericLiquidityMiningMulti.json';
import PendleLiquidityMiningBaseV2Multi from '@pendle/core/build/artifacts/contracts/core/abstractV2/PendleLiquidityMiningBaseV2Multi.sol/PendleLiquidityMiningBaseV2Multi.json';
import PendleMarketBase from '@pendle/core/build/artifacts/contracts/core/abstract/PendleMarketBase.sol/PendleMarketBase.json';
import PendleSLPLiquidityMining from '@pendle/core/build/artifacts/contracts/core/SushiswapComplex/PendleSLPLiquidityMining.sol/PendleSLPLiquidityMining.json';
import PendleRedeemProxy from './abis/PendleRedeemProxyETH.json';
import PendleRedeemProxyMulti from '@pendle/core/build/artifacts/contracts/misc/PendleRedeemProxyMulti.sol/PendleRedeemProxyMulti.json';
import PendleLiquidityRewardsReaderMulti from '@pendle/core/build/artifacts/contracts/misc/LiquidityRewardsReader/PendleLiquidityRewardsReaderMulti.sol/PendleLiquidityRewardsReaderMulti.json';
import PendleSingleSidedStaking from '@pendle/single-staking/build/artifacts/contracts/SingleStaking.sol/SingleStaking.json';
import PendleSingleStakingManager from '@pendle/single-staking/build/artifacts/contracts/SingleStakingManager.sol/SingleStakingManager.json';
import PendleWrapper from '@pendle/core/build/artifacts/contracts/proxies/PendleWrapper.sol/PendleWrapper.json';
import PendleTraderJoeYieldTokenHolder from "@pendle/core/build/artifacts/contracts/core/TraderJoe/PendleTraderJoeYieldTokenHolder.sol/PendleTraderJoeYieldTokenHolder.json";
import PendleZapEstimatorPAP from '@pendle/core/build/artifacts/contracts/misc/PendleZapEstimator/PendleZapEstimatorPAP.sol/PendleZapEstimatorPAP.json';
import PendleZapEstimatorSingle from '@pendle/core/build/artifacts/contracts/misc/PendleZapEstimator/PendleZapEstimatorSingle.sol/PendleZapEstimatorSingle.json';
import SushiMasterChef from './abis/SushiMasterChefABI.json';
import UniswapRouter02 from '@pendle/core/build/artifacts/contracts/interfaces/IUniswapV2Router02.sol/IUniswapV2Router02.json';
import JoeMasterChef from './abis/JoeMasterChefABI.json';
import MultiCallV2 from './abis/MulticallV2.json';
import UniswapV2Pair from '@pendle/core/build/artifacts/contracts/interfaces/IUniswapV2Pair.sol/IUniswapV2Pair.json';
import ICToken from '@pendle/core/build/artifacts/contracts/interfaces/ICToken.sol/ICToken.json';
import IQiToken from '@pendle/core/build/artifacts/contracts/interfaces/IQiToken.sol/IQiToken.json';
import BenqiComptroller from './abis/BenqiComptroller.json';
import WrappedMEMO from './abis/WrappedMEMO.json';
import TIMEStaking from './abis/TIMEStaking.json';
import MEMOToken from './abis/MEMO.json';
import wxBTRFLY from './abis/wxBTRFLY.json';
import BTRFLYStaking from './abis/BTRFLYStaking.json';
import UniForkFactory from '@pendle/core/build/artifacts/contracts/interfaces/IUniswapV2Factory.sol/IUniswapV2Factory.json';
import PendleMerkleDistributor from '@pendle/core/build/artifacts/contracts/misc/PendleMerkleDistributor.sol/PendleMerkleDistributor.json';
import PendleIncentiveData from '@pendle/core/build/artifacts/contracts/misc/PendleIncentiveData.sol/PendleIncentiveData.json';


//TODO: User proper IERC20

export const contracts = {
  IPendleMarket,
  IPendleRouter,
  IPendleData,
  IPendleForge,
  IERC20,
  PendleBaseToken,
  PendleLiquidityMiningBase,
  PendleLiquidityMiningV2Base,
  PendleMarketBase,
  PendleSLPLiquidityMining,
  PendleGenericLiquidityMiningMulti,
  PendleLiquidityMiningBaseV2Multi,
  PendleSingleSidedStaking,
  PendleRedeemProxy,
  PendleRedeemProxyMulti,
  PendleLiquidityRewardsReaderMulti,
  PendleSushiswapComplexForge,
  PendleSushiswapSimpleForge,
  PendleAaveV2Forge,
  PendleCompoundForge,
  PendleCompoundV2Forge,
  PendleTraderJoeYieldTokenHolder,
  PendleZapEstimatorPAP,
  PendleZapEstimatorSingle,
  SushiMasterChef,
  UniswapRouter02,
  JoeMasterChef,
  PendleSingleStakingManager,
  PendleWrapper,
  MultiCallV2,
  UniswapV2Pair,
  ICToken,
  IQiToken,
  BenqiComptroller,
  WrappedMEMO,
  TIMEStaking,
  MEMOToken,
  wxBTRFLY,
  BTRFLYStaking,
  UniForkFactory,
  PendleMerkleDistributor,
  PendleIncentiveData
};
