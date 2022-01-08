import { request, gql } from 'graphql-request'
import BigNumberjs from 'bignumber.js';
import { sushiswapSubgraphApi, traderJoeSubgraphApi, ONE_DAY} from '../constants';
import { NetworkInfo } from '../networks';
import { distributeConstantsByNetwork, getBlocksomeDurationEarlier, isSameAddress, getCurrentTimestampLocal, getCurrentTimestamp } from '../helpers';
import { BigNumber as BN, providers, Contract } from "ethers"
import { getxJOEExchangeRate } from './priceFetcher';
import BigNumber from 'bignumber.js';
import { contracts } from '../contracts';
import { fetchValuation } from './priceFetcher';
import { Token, TokenAmount } from '../entities';
const axios = require('axios');

export const fetchAaveYield = async (underlyingAddress: string) => {
  const url =
    'https://aave-api-v2.aave.com/data/markets-data/0xb53c1a33016b2dc2ff3653530bff1848a515c8c5'

  const yieldInPercentage = await axios.get(url)
    .then((res: any) => {
      return res.data;
    })
    .then((data: any) => {
      const underlyingData = data.reserves.find(
        (data: any) => data.underlyingAsset.toLowerCase() === underlyingAddress
      )

      if (!underlyingData) return 0

      return underlyingData.liquidityRate
    })

  return yieldInPercentage
}

export const fetchCompoundYield = async (yieldBearingAddress: string) => {
  const url = 'https://api.compound.finance/api/v2/ctoken'
  const yieldInPercentage = await axios.get(url)
    .then((res: any) => res.data)
    .then((data: any) => {
      const underlyingData = data.cToken.find(
        (data: any) => data.token_address.toLowerCase() === yieldBearingAddress
      )

      if (!underlyingData) return 0

      return underlyingData.supply_rate.value
    })

  return yieldInPercentage
}

export const fetchSushiForkYield = async (poolAddress: string, chainId?: number): Promise<number> => { //chainId
  const currentTime = getCurrentTimestampLocal()
  const dateAfter = currentTime - ONE_DAY.toNumber();
  const yieldRate: number = await request(
    chainId === undefined || chainId == 1 ? sushiswapSubgraphApi : traderJoeSubgraphApi,
    gql`
        {
          pairs(where: { id: "${poolAddress}" }) {
            hourData(first: 24, where: {date_gt: ${dateAfter}}, orderBy: date, orderDirection: desc) {
              untrackedVolumeUSD
              reserveUSD
              date
            }
            reserveUSD
          }
        }
      `
  )
    .then((data: any) => {
      const pair = data.pairs[0]

      const volumeUSD = pair.hourData.reduce((accumulator: any, hourData: any) => {
        return accumulator.plus(hourData.untrackedVolumeUSD)
      }, new BigNumberjs(0))

      const reserveUSD = pair.reserveUSD;

      if (!pair) throw Error('Pair or data doesnt exist')

      const yieldRate = new BigNumberjs(volumeUSD)
        .multipliedBy(0.0025)
        .dividedBy(reserveUSD)
        .plus(1)
        .pow(365)
        .minus(1)

      return yieldRate.toNumber()
    })
    .catch((err: any) => {
      throw Error(`Something went wrong fetching Sushi Yield Rate ${err}`)
    })

  return yieldRate
}

export async function fetchBenqiYield(underlyingAddress: string): Promise<number> {
  const networkInfo: NetworkInfo = distributeConstantsByNetwork(43114);
  const benqiAPI = 'https://api.benqi.fi/tokens/total_apys';
  const response = await axios.get(benqiAPI).then((res: any) => res.data);
  for (const t in networkInfo.contractAddresses.tokens) {
    if (isSameAddress(networkInfo.contractAddresses.tokens[t], underlyingAddress)) {
      if (t == "WETH") return response["AVAX"].supply;
      return response[t].supply;
    }
  }
  return 0;
}

export async function fetchXJOEYield(provider: providers.JsonRpcProvider, chainId?: number): Promise<number> {
  if (chainId != 43114) throw Error(`Invalid chainId: ${chainId} in fetchXJOEYield`);
  const dateAfter = (await getCurrentTimestamp(provider)) - ONE_DAY.mul(7).toNumber();
  const sevenDayTradingVolume: BigNumber = await request(
    traderJoeSubgraphApi,
    gql`{
      dayDatas(where: {factory: "0x9ad6c38be94206ca50bb0d90783181662f0cfa10", date_gte: ${dateAfter}}) {
        date
        volumeUSD
        untrackedVolume
        txCount
        __typename
      }
    }`
  ).then((data: any) => {
    return data.dayDatas.reduce((s: BigNumber, d: any, index: number): BigNumber => {
      if (index >= 7) {
        return s
      };
      return s.plus(d.volumeUSD);
    }, new BigNumber(0))
  })
  const networkInfo: NetworkInfo = distributeConstantsByNetwork(chainId);
  const JOEAddress: string = networkInfo.contractAddresses.tokens.JOE;
  const xJOEAddress: string = networkInfo.contractAddresses.tokens.xJOE;
  const JOEContract: Contract = new Contract(JOEAddress, contracts.IERC20.abi, provider);
  const joeLocked: BN = await JOEContract.balanceOf(xJOEAddress);
  const joeValuelocked = await fetchValuation(new TokenAmount(
    new Token(
      JOEAddress,
      networkInfo.decimalsRecord[JOEAddress]
    ),
    joeLocked.toString()
  ), provider, chainId);
  return sevenDayTradingVolume.multipliedBy(365).div(7).multipliedBy(0.0005).div(joeValuelocked.amount).toNumber()
}
export async function fetchWonderlandYield(provider: providers.JsonRpcProvider, chainId?: number): Promise<number> {
  if (chainId != 43114) {
    throw new Error(`Unsupported chainId ${chainId} in fetchWonderlandYield`);
  }
  const networkInfo: NetworkInfo = distributeConstantsByNetwork(chainId);
  const TIMEStakingAddress: string = networkInfo.contractAddresses.misc.TIMEStaking;
  const TIMEStakingContract: Contract = new Contract(TIMEStakingAddress, contracts.TIMEStaking.abi, provider);
  const epoch = await TIMEStakingContract.epoch();
  const stakingReward = epoch.distribute;

  const memoContract: Contract = new Contract(networkInfo.contractAddresses.tokens.MEMO, contracts.MEMOToken.abi, provider);

  const circ = await memoContract.circulatingSupply();
  const stakingRebase = stakingReward / circ;
  const stakingAPY = Math.pow(1 + stakingRebase, 365 * 3) - 1;
  return stakingAPY;
}