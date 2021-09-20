import { distributeConstantsByNetwork } from "../helpers"
import { NetworkInfo } from "../networks";
import { request, gql } from "graphql-request"
import BigNumber from "bignumber.js";

export async function fetchPendleUsdPrice(): Promise<BigNumber> {
  const price = await fetch(
    'https://api.coingecko.com/api/v3/simple/price?ids=pendle&vs_currencies=usd'
  ).then((res) => res.json())

  return new BigNumber(price?.pendle?.usd)
}

const sushiswapReservesQuery = (slpAddress: string) => gql`{
  pairs(where:{id: "${slpAddress}"}) {
    reserveUSD,
    totalSupply
  }
}`

export async function fetchSLPPrice(address: string): Promise<BigNumber> {

  const sushiswapSubgraphApi: string = "https://api.thegraph.com/subgraphs/name/sushiswap/exchange";
  const usdPrice: BigNumber = await request(
    sushiswapSubgraphApi,
    sushiswapReservesQuery(address)
  )
    .then((response) => {
      const pair = response.pairs[0]
      return new BigNumber(pair.reserveUSD)
        .div(new BigNumber(pair.totalSupply));
    })
    .catch((err) => {
      console.error(
        'Something went wrong fetching PENDLE/ETH (SLP) price, default to 1 USD',
        err
      )
      return new BigNumber(1);
    })

  return usdPrice

}

export async function fetchTokenPrice(address: string, chainId?: number): Promise<BigNumber> {
  const networkInfo: NetworkInfo = await distributeConstantsByNetwork(chainId);
  if (chainId === undefined || chainId == 1) {
    switch (address) {
      case networkInfo.contractAddresses.tokens.USDC:
      case networkInfo.contractAddresses.tokens.DAI:
        return new BigNumber(1)

      case networkInfo.contractAddresses.tokens.PENDLE:
        return fetchPendleUsdPrice();

      case networkInfo.contractAddresses.tokens.ETHUSDC_SLP:
      case networkInfo.contractAddresses.tokens.PENDLEETH_SLP:
        return fetchSLPPrice(address);

      default:
        throw Error("Unsupporrted token in fetchTokenPrice");
    }
  } else {
    throw Error("Unsupported network in fetchTokenPrice");
  }
}