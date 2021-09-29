import { request, gql } from 'graphql-request'
import BigNumberjs from 'bignumber.js';
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

      return underlyingData.liquidityRate * 100
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

      return underlyingData.supply_rate.value * 100
    })

  return yieldInPercentage
}

const sushiSubgraphURL: string = "https://api.thegraph.com/subgraphs/name/sushiswap/exchange"

export const fetchSushiYield = async (poolAddress: string, _?: number): Promise<number> => { //chainId
  const yieldRate: number = await request(
    sushiSubgraphURL,
    gql`
        {
          pairs(where: { id: "${poolAddress}" }) {
            hourData(first: 24, orderBy: date, orderDirection: desc) {
              volumeUSD
              reserveUSD
            }
          }
        }
      `
  )
    .then((data: any) => {
      const pair = data.pairs[0]

      const volumeUSD = pair.hourData.reduce((accumulator: any, hourData: any) => {
        return accumulator.plus(hourData.volumeUSD)
      }, new BigNumberjs(0))

      const reserveUSD = pair.hourData[0].reserveUSD

      if (!pair) throw Error('Pair or data doesnt exist')

      const yieldRate = new BigNumberjs(volumeUSD)
        .multipliedBy(0.0025)
        .dividedBy(reserveUSD)
        .plus(1)
        .pow(365)
        .minus(1)
      const yieldRatePercentage = yieldRate.multipliedBy(100)

      return yieldRatePercentage.toNumber()
    })
    .catch((err: any) => {
      throw Error(`Something went wrong fetching Sushi Yield Rate ${err}`)
    })

  return yieldRate
}