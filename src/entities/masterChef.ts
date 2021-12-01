import { BigNumber as BN, Contract } from 'ethers';
import { TokenAmount } from './tokenAmount';
import { NetworkInfo } from '../networks';
import { distributeConstantsByNetwork, getBlocksomeDurationEarlier } from '../helpers';
import { contracts } from '../contracts';
import BigNumber from 'bignumber.js';
import { fetchTokenPrice, fetchValuation } from '../fetchers/priceFetcher';
import { AprInfo, ChainSpecifics } from './types';
import { calcLMRewardApr, calcValuation, DecimalsPrecision } from '../math/marketMath';
import { Token } from './token';
import { CurrencyAmount } from './currencyAmount';
import { ONE_DAY } from '../constants';

export class MasterChef {
  public static methods({ signer, provider, chainId }: ChainSpecifics): Record<string, any> {
    const networkInfo: NetworkInfo = distributeConstantsByNetwork(chainId);
    const getRewardsAprs = async (pid: number): Promise<AprInfo[]> => {
      const aprs: AprInfo[] = [];
      if (chainId == 1 || chainId === undefined) {
        const masterChefAddress: string = networkInfo.contractAddresses.misc.MasterChef;
        const masterChefContract: Contract = new Contract(masterChefAddress, contracts.SushiMasterChef.abi, provider);
        const poolInfo: any = await masterChefContract.poolInfo(pid);
        const allocPoint: BN = poolInfo.allocPoint;
        const totalAllocPoint: BN = await masterChefContract.totalAllocPoint();
        const globalSushiPerBlock: BN = await masterChefContract.sushiPerBlock();
        const blockNumber: number = await provider.getBlockNumber();
        const blockNumberOneDayAgo: number = (await getBlocksomeDurationEarlier(
          ONE_DAY.toNumber(),
          chainId,
          provider
        ))!;
        const blockPerDay: number = blockNumber - blockNumberOneDayAgo;
        const sushiPerBlock: BN = globalSushiPerBlock.mul(allocPoint).div(totalAllocPoint);
        const sushiAddress: string = networkInfo.contractAddresses.tokens.SUSHI;
        const sushiPrice: BigNumber = await fetchTokenPrice({ address: sushiAddress, provider, chainId });
        const sushiRewardsValue: BigNumber = calcValuation(
          sushiPrice,
          sushiPerBlock.mul(blockPerDay),
          networkInfo.decimalsRecord[sushiAddress]
        );

        const lpContract: Contract = new Contract(poolInfo.lpToken, contracts.IERC20.abi, provider);
        const totalStakedLp: BN = await lpContract.balanceOf(masterChefAddress);
        const stakedUSDValue: CurrencyAmount = await fetchValuation(
          new TokenAmount(
            new Token(poolInfo.lpToken, networkInfo.decimalsRecord[poolInfo.lpToken]),
            totalStakedLp.toString()
          ),
          provider,
          chainId
        );
        aprs.push({
          origin: 'Sushiswap',
          apr: calcLMRewardApr(sushiRewardsValue, new BigNumber(stakedUSDValue.amount), 365).toFixed(DecimalsPrecision),
        });
        return aprs;
      } else if (chainId == 43114) {
        const masterChefV2Address: string = networkInfo.contractAddresses.misc.JOE_MASTERCHEFV2;
        const masterChefV2: Contract = new Contract(masterChefV2Address, contracts.JoeMasterChef.abi, provider);

        var poolInfo: any,
          allocPoint: BN,
          totalAllocPoint: BN,
          totalJoePerSec: BN,
          devPercent: BN,
          treasuryPercent: BN,
          investorPercent: BN;
        const promises: Promise<any>[] = [];
        promises.push(masterChefV2.poolInfo(pid));
        promises.push(masterChefV2.totalAllocPoint());
        promises.push(masterChefV2.joePerSec());
        promises.push(masterChefV2.devPercent());
        promises.push(masterChefV2.treasuryPercent());
        promises.push(masterChefV2.investorPercent());
        await Promise.all(promises).then((values: any[]) => {
          poolInfo = values[0];
          allocPoint = values[0].allocPoint;
          totalAllocPoint = values[1];
          totalJoePerSec = values[2];
          devPercent = values[3];
          treasuryPercent = values[4];
          investorPercent = values[5];
        });
        const joeTokenAddress: string = (await masterChefV2.joe()).toLowerCase();
        const joeRewardForThisPool: BN = ONE_DAY.mul(totalJoePerSec!)
          .mul(allocPoint!)
          .div(totalAllocPoint!)
          .mul(
            BN.from(1000)
              .sub(devPercent!)
              .sub(treasuryPercent!)
              .sub(investorPercent!)
          )
          .div(1000);

        const joeAddress: string = networkInfo.contractAddresses.tokens.JOE;
        const joePrice: BigNumber = await fetchTokenPrice({ address: joeAddress, provider, chainId });
        const joeRewardsValue: BigNumber = calcValuation(
          joePrice,
          joeRewardForThisPool,
          networkInfo.decimalsRecord[joeTokenAddress]
        );

        const lpContract: Contract = new Contract(poolInfo.lpToken, contracts.IERC20.abi, provider);
        const totalStakedLp: BN = await lpContract.balanceOf(masterChefV2Address);
        const stakedUSDValue: CurrencyAmount = await fetchValuation(
          new TokenAmount(
            new Token(poolInfo.lpToken, networkInfo.decimalsRecord[poolInfo.lpToken]),
            totalStakedLp.toString()
          ),
          provider,
          chainId
        );
        aprs.push({
          origin: 'TraderJoe',
          apr: calcLMRewardApr(joeRewardsValue, new BigNumber(stakedUSDValue.amount), 365).toFixed(DecimalsPrecision),
        });
        return aprs;
      }
      return aprs;
    };
    return {
      getRewardsAprs,
    };
  }
}
