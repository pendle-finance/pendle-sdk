import { distributeConstantsByNetwork, isSameAddress } from "../helpers"
import { MARKETINFO, MarketProtocols, NetworkInfo } from "../networks";
import { request, gql } from "graphql-request"
import BigNumber from "bignumber.js";
import { ETHAddress } from "../constants";
import { TokenAmount } from "../entities/tokenAmount";
import { DecimalsPrecision } from "../math/marketMath";
const axios = require('axios')

export async function fetchPriceFromCoingecko(id: string): Promise<BigNumber> {
  const price = await axios.get(
    `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd`
  ).then((res: any) => {
    return res.data
  })

  return new BigNumber(price[id].usd)
}

const sushiswapReservesQuery = (slpAddress: string) => gql`{
  pairs(where:{id: "${slpAddress}"}) {
    totalSupply,
    token0{
      id
    },
    token1{
      id
    },
    reserve0,
    reserve1,
  }
}`

export async function fetchSLPPrice(address: string, chainId: number | undefined): Promise<BigNumber> {

  if (chainId !== undefined && chainId != 1) {
    throw Error("Unsupported network in fetchSLPPrice");
  }
  const sushiswapSubgraphApi: string = "https://api.thegraph.com/subgraphs/name/sushiswap/exchange";
  const pair: any = (await request(
    sushiswapSubgraphApi,
    sushiswapReservesQuery(address)
  )).pairs[0];
  try {
    const token0Price: BigNumber = await fetchTokenPrice(pair.token0.id, chainId);
    const reserveUSD: BigNumber = token0Price.multipliedBy(pair.reserve0).multipliedBy(2);
    return reserveUSD.dividedBy(new BigNumber(pair.totalSupply));
  } catch {
    try {
      const token1Price: BigNumber = await fetchTokenPrice(pair.token1.id, chainId);
      const reserveUSD: BigNumber = token1Price.multipliedBy(pair.reserve1).multipliedBy(2);
      return reserveUSD.dividedBy(new BigNumber(pair.totalSupply));
    }  catch {
      throw Error(`Unable to fetch price for both tokens of SLP ${address}`);
    }
  }
}

export async function fetchTokenPrice(address: string, chainId: number | undefined): Promise<BigNumber> {
  const networkInfo: NetworkInfo = await distributeConstantsByNetwork(chainId);
  if (chainId === undefined || chainId == 1) {
    switch (address.toLowerCase()) {
      case networkInfo.contractAddresses.tokens.USDC:
      case networkInfo.contractAddresses.tokens.DAI:
        return new BigNumber(1)

      case networkInfo.contractAddresses.tokens.PENDLE:
        return fetchPriceFromCoingecko('pendle');

      case networkInfo.contractAddresses.tokens.WETH:
      case ETHAddress.toLowerCase():
        return fetchPriceFromCoingecko('ethereum');

      case networkInfo.contractAddresses.tokens.SUSHI:
        return fetchPriceFromCoingecko('sushi');
    }
    const market: MARKETINFO | undefined = networkInfo.contractAddresses.otherMarkets?.find((m: MARKETINFO) => isSameAddress(m.address, address));
    if (market !== undefined && market.platform == MarketProtocols.Sushiswap) {
      return fetchSLPPrice(address, chainId);
    }
    throw Error(`Unsupported token ${address} in fetch toke price`)
  } else if (chainId == 42) {
    return new BigNumber(1); // returning dummy data since it's kovan
  } else {
    throw Error("Unsupported network in fetchTokenPrice");
  }
}

export async function fetchValuation(amount: TokenAmount, chainId: number | undefined): Promise<string> {
  const networkInfo: NetworkInfo = await distributeConstantsByNetwork(chainId);

  const price: BigNumber = await fetchTokenPrice(amount.token.address, chainId);
  return price.multipliedBy(new BigNumber(amount.rawAmount())).dividedBy(new BigNumber(10).pow(networkInfo.decimalsRecord[amount.token.address])).toFixed(DecimalsPrecision);
} 