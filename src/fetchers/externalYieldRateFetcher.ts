import { request, gql } from 'graphql-request'
import BigNumberjs from 'bignumber.js';
import { sushiswapSubgraphApi, traderJoeSubgraphApi, ONE_DAY} from '../constants';
import { NetworkInfo } from '../networks';
import { distributeConstantsByNetwork, isSameAddress, getCurrentTimestampLocal, getCurrentTimestamp } from '../helpers';
import { BigNumber as BN, providers, Contract } from "ethers"
import BigNumber from 'bignumber.js';
import { contracts } from '../contracts';
import { fetchValuation } from './priceFetcher';
import { Token, TokenAmount } from '../entities';
const axios = require('axios');
BigNumberjs.config({POW_PRECISION: 20});

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
  poolAddress = poolAddress.toLowerCase();
  const currentTime = getCurrentTimestampLocal()
  const dateAfter = currentTime - ONE_DAY.toNumber();
  const yieldRate: number = await request(
    chainId === undefined || chainId == 1 ? sushiswapSubgraphApi : traderJoeSubgraphApi,
    gql`
        {
          pairs(where: { id: "${poolAddress}" }) {
            hourData(first: 24, where: {date_gt: ${dateAfter}}, orderBy: date, orderDirection: desc) {
              volumeUSD
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
        return accumulator.plus(hourData.volumeUSD)
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

export async function fetchBenqiYield(qiTokenAddress: string, provider?: providers.JsonRpcProvider, chainId?: number): Promise<number> {
  if(chainId != 43114){
    throw new Error(`Unsupported chainId ${chainId} in fetchBenqiYield`);
  }

  const qiTokenContract: Contract = new Contract(qiTokenAddress, contracts.IQiToken.abi, provider);
  const supplyRatePerTimestamp = await qiTokenContract.supplyRatePerTimestamp();
  const supplyAPY = new BigNumberjs(supplyRatePerTimestamp.toString())
    .div("1000000000000000000")
    .plus(1)
    .pow(31536000)
    .minus(1);

  return supplyAPY.toNumber();
}

export async function fetchXJOEYield(provider?: providers.JsonRpcProvider, chainId?: number): Promise<number> {
  return 0;
}

export async function fetchWonderlandYield(provider: providers.JsonRpcProvider, chainId?: number): Promise<number> {
  if (chainId != 43114) {
    throw new Error(`Unsupported chainId ${chainId} in fetchWonderlandYield`);
  }
  const networkInfo: NetworkInfo = distributeConstantsByNetwork(chainId);
  const TIMEStakingAddress: string = networkInfo.contractAddresses.misc.TIMEStaking;
  const TIMEStakingContract: Contract = new Contract(TIMEStakingAddress, contracts.TIMEStaking.abi, provider);
  const epochPromise = TIMEStakingContract.epoch();
  const memoContract: Contract = new Contract(networkInfo.contractAddresses.tokens.MEMO, contracts.MEMOToken.abi, provider);
  const circPromise = memoContract.circulatingSupply();
  
  const [epoch, circ] = await Promise.all([epochPromise, circPromise]);
  const stakingReward = epoch.distribute;
  const stakingRebase = stakingReward / circ;
  const stakingAPY = Math.pow(1 + stakingRebase, 365 * 3) - 1;
  return stakingAPY;
}

export async function fetchBTRFLYYield(provider: providers.JsonRpcProvider, chainId?: number): Promise<number> {
  if (!((chainId ?? 1) == 1)) {
    throw new Error(`Unsupported chainId ${chainId} in fetchWonderlandYield`);
  }
  const networkInfo: NetworkInfo = distributeConstantsByNetwork(chainId);
  const StakingAddress: string = networkInfo.contractAddresses.misc.BTRFLYStaking;
  const StakingContract: Contract = new Contract(StakingAddress, contracts.BTRFLYStaking.abi, provider);
  const epochPromise = StakingContract.epoch();
  const xBTRFLYContract: Contract = new Contract(networkInfo.contractAddresses.tokens.xBTRFLY, contracts.MEMOToken.abi, provider);
  const circPromise = xBTRFLYContract.circulatingSupply();
  
  const [epoch, circ] = await Promise.all([epochPromise, circPromise]);
  const stakingReward = epoch.distribute;
  const stakingRebase = stakingReward / circ;
  const stakingAPY = Math.pow(1 + stakingRebase, 365 * 3) - 1;
  return stakingAPY;
}

