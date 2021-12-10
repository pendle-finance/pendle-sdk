import { decimalFactor, distributeConstantsByNetwork, isSameAddress } from "../helpers"
import { MARKETINFO, MarketProtocols, NetworkInfo } from "../networks";
import { request, gql } from "graphql-request"
import BigNumber from "bignumber.js";
import { ETHAddress, sushiswapSubgraphApi, traderJoeSubgraphApi } from "../constants";
import { TokenAmount } from "../entities/tokenAmount";
import { CurrencyAmount } from "../entities/currencyAmount";
import { PendleMarket, UniForkMarket } from "../entities/market";
import { providers } from "ethers";
import { Ot } from "../entities/ot";
import { Yt } from "../entities/yt";
import { Contract, BigNumber as BN } from "ethers";
import { contracts } from "../contracts";
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

async function getSushiForkPairInfo(pairAddress: string, chainId: number | undefined): Promise<any> {
  if (chainId === undefined || chainId == 1) {
    return (await request(
      sushiswapSubgraphApi,
      sushiswapReservesQuery(pairAddress)
    )).pairs[0];
  } else if (chainId == 43114) {
    return (await request(
      traderJoeSubgraphApi,
      sushiswapReservesQuery(pairAddress)
    )).pairs[0];
  } else {
    throw Error("Unsupported network in getSushiForkPairInfo");
  }
}

export async function fetchSLPPrice({ address, provider, chainId }: { address: string, provider: providers.JsonRpcProvider, chainId: number}): Promise<BigNumber> {
  var pair = await getSushiForkPairInfo(address, chainId);
  try {
    const token0Price: BigNumber = await fetchTokenPrice({ address: pair.token0.id, provider, chainId });
    const reserveUSD: BigNumber = token0Price.multipliedBy(pair.reserve0).multipliedBy(2);
    return reserveUSD.dividedBy(new BigNumber(pair.totalSupply));
  } catch {
    try {
      const token1Price: BigNumber = await fetchTokenPrice({ address: pair.token1.id, provider, chainId });
      const reserveUSD: BigNumber = token1Price.multipliedBy(pair.reserve1).multipliedBy(2);
      return reserveUSD.dividedBy(new BigNumber(pair.totalSupply));
    } catch {
      throw Error(`Unable to fetch price for both tokens of SLP ${address}`);
    }
  }
}

export async function fetchOtPrice(ot: Ot, provider: providers.JsonRpcProvider, chainId: number): Promise<BigNumber> {
  const marketAddress: string | undefined = ot.priceFeedMarketAddress;
  if (marketAddress === undefined) {
    console.error(`No price feeding market found for this OT ${ot.address}`);
    return new BigNumber(1);
  }
  const otMarket: UniForkMarket = UniForkMarket.find(marketAddress, chainId);
  return await otMarket.methods({provider, chainId}).getOtPrice();
}

export async function fetchYtPrice(yt: Yt, provider: providers.JsonRpcProvider, chainId: number): Promise<BigNumber> {
  const market: PendleMarket = PendleMarket.find(yt.priceFeedMarketAddress, chainId);
  return await market.methods({provider, chainId}).getYTPrice();
}

export async function fetchCTokenPrice(address: string, provider: providers.JsonRpcProvider, chainId: number): Promise<BigNumber> {
  const networkInfo: NetworkInfo = distributeConstantsByNetwork(chainId);
  const cTokenContract: Contract = new Contract(address, contracts.ICToken.abi, provider);
  var underlyingAsset: string;
  if (isSameAddress(address, networkInfo.contractAddresses.tokens.qiAVAX)) {
    underlyingAsset = ETHAddress;
  } else {
    underlyingAsset = await cTokenContract.callStatic.underlying();
  }
  const exchangeRate: BN = await cTokenContract.callStatic.exchangeRateCurrent();
  const adjustedExchangeRate: BigNumber = new BigNumber(exchangeRate.toString()).div(decimalFactor(10 + networkInfo.decimalsRecord[underlyingAsset.toLowerCase()]));
  return adjustedExchangeRate.multipliedBy(await fetchTokenPrice({address: underlyingAsset, provider, chainId}));
}

export async function getxJOEExchangeRate(xJOEAddress: string, JOEAddress: string, provider: providers.JsonRpcProvider, blockTag?: number): Promise<BigNumber> {
  const JOEContract: Contract = new Contract(JOEAddress, contracts.IERC20.abi, provider);
  const joeLocked: BN = await JOEContract.balanceOf(xJOEAddress, {blockTag: blockTag === undefined ? "latest": blockTag});
  const xJOEContract: Contract = new Contract(xJOEAddress, contracts.IERC20.abi, provider);
  const totalSupply: BN = await xJOEContract.totalSupply({blockTag: blockTag === undefined ? "latest": blockTag});
  return new BigNumber(joeLocked.toString()).div(totalSupply.toString())
}

export async function fetchxJOEPrice(xJOEAddress: string, JOEAddress: string, provider: providers.JsonRpcProvider, chainId: number): Promise<BigNumber> {
  return (await fetchTokenPrice({address: JOEAddress, provider, chainId})).multipliedBy(await getxJOEExchangeRate(xJOEAddress, JOEAddress, provider))
}

export async function fetchBasicTokenPrice(address: string, provider: providers.JsonRpcProvider, chainId: number): Promise<BigNumber> {
  const networkInfo: NetworkInfo = await distributeConstantsByNetwork(chainId);
  if (chainId === undefined || chainId == 1) {
    switch (address.toLowerCase()) {
      case networkInfo.contractAddresses.tokens.USDC:
      case networkInfo.contractAddresses.tokens.DAI:
      case networkInfo.contractAddresses.tokens.aUSDC:
        return new BigNumber(1)

      case networkInfo.contractAddresses.tokens.PENDLE:
        return await fetchPriceFromCoingecko('pendle');

      case networkInfo.contractAddresses.tokens.WETH:
      case ETHAddress.toLowerCase():
        return await fetchPriceFromCoingecko('ethereum');

      case networkInfo.contractAddresses.tokens.SUSHI:
        return await fetchPriceFromCoingecko('sushi');

      case networkInfo.contractAddresses.tokens.COMP:
        return await fetchPriceFromCoingecko('compound-governance-token');

      case networkInfo.contractAddresses.tokens.stkAAVE:
        return await fetchPriceFromCoingecko('aave');

      case networkInfo.contractAddresses.tokens.cDAI:
        return await fetchPriceFromCoingecko('cdai');
    }
  } else if (chainId == 43114) {
    switch (address.toLowerCase()) {
      case networkInfo.contractAddresses.tokens.USDC:
      case networkInfo.contractAddresses.tokens.MIM:
        return new BigNumber(1)

      case networkInfo.contractAddresses.tokens.qiUSDC:
      case networkInfo.contractAddresses.tokens.qiAVAX:
        return await fetchCTokenPrice(address, provider, chainId);

      case networkInfo.contractAddresses.tokens.WETH:
      case ETHAddress.toLocaleLowerCase():
        return await fetchPriceFromCoingecko('avalanche-2');

      case networkInfo.contractAddresses.tokens.JOE:
        return await fetchPriceFromCoingecko('joe');

      case networkInfo.contractAddresses.tokens.PENDLE:
        return await fetchPriceFromCoingecko('pendle');

      case networkInfo.contractAddresses.tokens.QI:
        return await fetchPriceFromCoingecko('benqi');

      case networkInfo.contractAddresses.tokens.MEMO:
        return await fetchPriceFromCoingecko('wonderland');

      case networkInfo.contractAddresses.tokens.xJOE:
        return await fetchxJOEPrice(address, networkInfo.contractAddresses.tokens.JOE, provider, chainId);
    }
  }
  throw Error(`Token ${address} is not supported in basic tokens`);
}

export async function fetchTokenPrice({ address, provider, chainId }: { address: string, provider: providers.JsonRpcProvider, chainId: number }): Promise<BigNumber> {
  const networkInfo: NetworkInfo = await distributeConstantsByNetwork(chainId);
  if (chainId === undefined || chainId == 1 || chainId == 43114) {
    try {
      return await fetchBasicTokenPrice(address, provider, chainId);
    } catch (err) { }

    try {
      const ot: Ot = Ot.find(address, chainId);
      return await fetchOtPrice(ot, provider, chainId);
    } catch (err) { }

    try {
      const yt: Yt = Yt.find(address, chainId);
      return await fetchYtPrice(yt, provider, chainId);
    } catch (err) { }

    try {
      const pendleMarket: PendleMarket = PendleMarket.find(address, chainId);
      return await pendleMarket.methods({provider, chainId}).getLPPriceBigNumber()
    } catch (err) { }

    const otherMarket: MARKETINFO | undefined = networkInfo.contractAddresses.otherMarkets?.find((m: MARKETINFO) => isSameAddress(m.address, address));
    if (otherMarket !== undefined && (otherMarket.platform == MarketProtocols.Sushiswap || otherMarket.platform == MarketProtocols.TraderJoe)) {
      return await fetchSLPPrice({ address, provider, chainId });
    }
    throw Error(`Unsupported token ${address} with chainId ${chainId} in fetch toke price`);
  } else if (chainId == 42) {
    return new BigNumber(1); // returning dummy data since it's kovan
  } else {
    throw Error("Unsupported network in fetchTokenPrice");
  }
}

export async function fetchValuation(amount: TokenAmount, provider: providers.JsonRpcProvider, chainId: number): Promise<CurrencyAmount> {
  const networkInfo: NetworkInfo = await distributeConstantsByNetwork(chainId);

  const price: BigNumber = await fetchTokenPrice({ address: amount.token.address, provider, chainId });
  return {
    currency: 'USD',
    amount: price.multipliedBy(new BigNumber(amount.rawAmount())).dividedBy(new BigNumber(10).pow(networkInfo.decimalsRecord[amount.token.address])).toFixed(DecimalsPrecision)
  }
} 