import { providers } from "ethers";
import { TokenAmount } from "./tokenAmount";
import { Contract, BigNumber as BN } from "ethers";
import { NetworkInfo } from "../networks";
import { distributeConstantsByNetwork, getBlockOneDayEarlier } from "../helpers";
import { contracts } from "../contracts";
import BigNumber from "bignumber.js";
import { fetchTokenPrice, fetchValuation } from "../fetchers/priceFetcher";
import { AprInfo } from "./types";
import { calcLMRewardApr, calcValuation, DecimalsPrecision } from "../math/marketMath";
import { Token } from "./token";
import { CurrencyAmount } from "./currencyAmount";
import { ONE_DAY } from "../constants";

export class MasterChef {
    public static methods(signer: providers.JsonRpcSigner, chainId?: number): Record<string, any> {
        const networkInfo: NetworkInfo = distributeConstantsByNetwork(chainId);
        const getRewardsAprs = async(pid: number): Promise<AprInfo[]> => {
            const aprs: AprInfo[] = [];
            if (chainId == 1 || chainId === undefined) {
                const masterChefAddress: string = networkInfo.contractAddresses.misc.MasterChef;
                const masterChefContract: Contract = new Contract(masterChefAddress, contracts.SushiMasterChef.abi, signer.provider);
                const poolInfo: any = await masterChefContract.poolInfo(pid);
                const allocPoint: BN = poolInfo.allocPoint;
                const totalAllocPoint: BN = await masterChefContract.totalAllocPoint();
                const globalSushiPerBlock: BN = await masterChefContract.sushiPerBlock();
                const blockNumber: number = await signer.provider.getBlockNumber();
                const blockNumberOneDayAgo: number = (await getBlockOneDayEarlier(chainId, signer.provider))!;
                const blockPerDay: number = blockNumber - blockNumberOneDayAgo;
                const sushiPerBlock: BN = globalSushiPerBlock.mul(allocPoint).div(totalAllocPoint);
                const sushiAddress: string = networkInfo.contractAddresses.tokens.SUSHI;
                const sushiPrice: BigNumber = await fetchTokenPrice({address: sushiAddress, signer, chainId});
                const sushiRewardsValue: BigNumber = calcValuation(sushiPrice, sushiPerBlock.mul(blockPerDay), networkInfo.decimalsRecord[sushiAddress]);

                const lpContract: Contract = new Contract(poolInfo.lpToken, contracts.IERC20.abi, signer.provider);
                const totalStakedLp: BN = await lpContract.balanceOf(masterChefAddress);
                const stakedUSDValue: CurrencyAmount = await fetchValuation(new TokenAmount(
                        new Token(poolInfo.lpToken, networkInfo.decimalsRecord[poolInfo.lpToken]),
                        totalStakedLp.toString()
                    ),
                    signer,
                    chainId
                );
                aprs.push({
                    origin: 'Sushiswap',
                    apr: calcLMRewardApr(sushiRewardsValue, new BigNumber(stakedUSDValue.amount), 365).toFixed(DecimalsPrecision)
                });
                return aprs;
            } else if (chainId == 43114) {
                const masterChefV2Address: string = networkInfo.contractAddresses.misc.JOE_MASTERCHEFV2;
                const masterChefV2: Contract = new Contract(masterChefV2Address, contracts.JoeMasterChef.abi);

                var poolInfo: any, allocPoint: BN, totalAllocPoint: BN, totalJoePerSec: BN, devPercent: BN, treasuryPercent: BN, investorPercent: BN;
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
                const joeRewardForThisPool: BN = ONE_DAY
                    .mul(totalJoePerSec!)
                    .mul(allocPoint!)
                    .div(totalAllocPoint!)
                    .mul(BN.from(1000).sub(devPercent!).sub(treasuryPercent!).sub(investorPercent!))
                    .div(1000);


                const joeAddress: string = networkInfo.contractAddresses.tokens.JOE;
                const joePrice: BigNumber = await fetchTokenPrice({address: joeAddress, signer, chainId});
                const joeRewardsValue: BigNumber = calcValuation(joePrice, joeRewardForThisPool, networkInfo.decimalsRecord[joeTokenAddress]);
                
                const lpContract: Contract = new Contract(poolInfo.lpToken, contracts.IERC20.abi, signer.provider);
                const totalStakedLp: BN = await lpContract.balanceOf(masterChefV2Address);
                const stakedUSDValue: CurrencyAmount = await fetchValuation(new TokenAmount(
                        new Token(poolInfo.lpToken, networkInfo.decimalsRecord[poolInfo.lpToken]),
                        totalStakedLp.toString()
                    ),
                    signer,
                    chainId
                );
                aprs.push({
                    origin: 'TraderJoe',
                    apr: calcLMRewardApr(joeRewardsValue, new BigNumber(stakedUSDValue.amount), 365).toFixed(DecimalsPrecision)
                });
                return aprs;
            }
            return aprs;
        }
        return {
            getRewardsAprs
        }
    }
}