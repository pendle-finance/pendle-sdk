import { Token, ETHToken } from './token';
import { TokenAmount } from './tokenAmount';
import { Contract, providers, BigNumber as BN, utils } from 'ethers';
import { contracts } from '../contracts';
import { YtOrMarketInterest, Yt } from './yt';
import { PENDLEMARKETNFO, NetworkInfo, YTINFO, MARKETINFO, MarketProtocols } from '../networks';
import { distributeConstantsByNetwork, getBlocksomeDurationEarlier, getCurrentTimestamp, isSameAddress, xor, decimalFactor, indexRange, submitTransaction, isExpired } from '../helpers'
import { CurrencyAmount, ZeroCurrencyAmount } from './currencyAmount';
import { YieldContract } from './yieldContract';
import {
  TransactionFetcher,
  PendleAmmQuery,
} from './transactionFetcher';
import { PercentageMaxDecimals, PONE, calcAvgRate, calcExactIn, calcExactOut, calcOtherTokenAmount, calcRateWithSwapFee, calcSwapFee, calcOutAmountLp, calcPriceImpact, calcShareOfPool, calcRate, calcOutAmountToken, calcReserveUSDValue, calcSwapFeeAPR, calcTokenPriceByMarket, calcPrincipalForSLPYT, DecimalsPrecision, ONE, calcImpliedYield, calcPrincipalFloat, calcSlippedDownAmount, calcSlippedUpAmount, calcUnweightedRate } from '../math/marketMath';
import { forgeIdsInBytes, ONE_DAY, ONE_MINUTE, ETHAddress, ZERO, RONE } from '../constants';
import { fetchAaveYield, fetchBenqiYield, fetchCompoundYield, fetchSushiForkYield, fetchXJOEYield, fetchWonderlandYield } from '../fetchers/externalYieldRateFetcher';
import { TRANSACTION } from './transactionFetcher/types';
import { fetchTokenPrice, fetchValuation } from '../fetchers/priceFetcher';

import BigNumber from 'bignumber.js';
import { RedeemProxy } from './redeemProxy';
import { Ot } from './ot';
import { ChainSpecifics } from './types';

export type TokenReserveDetails = {
  reserves: TokenAmount
  weights: string
};

export type MarketDetails = {
  tokenReserves: TokenReserveDetails[],
  otherDetails: { // from subgraph
    dailyVolume: CurrencyAmount, //TODO: to confirm
    volume24hChange: string,
    liquidity: CurrencyAmount,
    liquidity24HChange: string,
    swapFeeApr: string,
    impliedYield: string,
    underlyingYieldRate: number,
    YTPrice: CurrencyAmount,
    underlyingPrice: CurrencyAmount
  }
}

export type SwapDetails = {
  inAmount: TokenAmount,
  outAmount: TokenAmount,
  minReceived?: TokenAmount,
  maxInput?: TokenAmount
  priceImpact: string,
  swapFee: TokenAmount
}

export type AddDualLiquidityDetails = {
  otherTokenAmount: TokenAmount;
  lpMinted: string
  shareOfPool: string;
};

export type AddSingleLiquidityDetails = {
  shareOfPool: string;
  rate: TokenAmount;
  priceImpact: string;
  swapFee: TokenAmount;
};

export type RemoveDualLiquidityDetails = {
  tokenAmounts: TokenAmount[];
}

export type RemoveSingleLiquidityDetails = {
  outAmount: TokenAmount;
  rate: TokenAmount;
  priceImpact?: string;
  swapFee?: TokenAmount;
};

type MarketReservesRaw = {
  xytBalance: BN,
  xytWeight: BN,
  tokenBalance: BN,
  tokenWeight: BN,
  currentBlock: BN
}

const WRONG_TOKEN: string = "Input Token not part of this market";
const MARKET_NOT_EXIST: string = "No Market is found at the given address";

type TokenDetailsRelative = {
  inReserve: BN,
  inWeight: BN,
  outReserve: BN,
  outWeight: BN,
  inToken: Token,
  outToken: Token;
}


export class Market {
  public readonly address: string;
  public readonly tokens: Token[];
  public readonly protocol: MarketProtocols;

  public constructor(marketAddress: string, tokens: Token[], protocol: MarketProtocols) {
    this.address = marketAddress;
    this.tokens = tokens.map((t: Token) => new Token(
      t.address.toLowerCase(),
      t.decimals,
      t.expiry
    ));
    this.protocol = protocol;
  }

  public static find(address: string, chainId?: number): Market {
    try {
      let pendleMarket: PendleMarket = PendleMarket.find(address, chainId);
      return pendleMarket;
    } catch (error) {}
    
    try {
      let uniForkMarket: UniForkMarket = UniForkMarket.find(address, chainId);
      return uniForkMarket;
    } catch (error) {}

    throw new Error(MARKET_NOT_EXIST)
  }

  public methods(_: ChainSpecifics): Record<string, any> {
    return {}
  }
}

export class PendleMarket extends Market {
  private marketFactoryId: string = "";
  public ytInfo: YTINFO = {} as YTINFO;
  public constructor(marketAddress: string, tokens: Token[]) {
    super(marketAddress, [tokens[0], tokens[1]], MarketProtocols.Pendle);
  }

  public static find(address: string, chainId?: number): PendleMarket {
    address = address.toLowerCase();
    const networkInfo: NetworkInfo = distributeConstantsByNetwork(chainId);
    const marketInfo: PENDLEMARKETNFO | undefined = networkInfo.contractAddresses.pendleMarkets.find((m: PENDLEMARKETNFO) => {
      return isSameAddress(m.address, address);
    })
    if (marketInfo === undefined) {
      throw new Error(MARKET_NOT_EXIST);
    }
    const ytInfo: YTINFO = networkInfo.contractAddresses.YTs.find((m: YTINFO) => isSameAddress(m.address, marketInfo.pair[0]))!;
    const pair: Token[] = [
      new Token(
        marketInfo.pair[0],
        networkInfo.decimalsRecord[marketInfo.pair[0]],
        ytInfo.expiry.toNumber()
      ),
      new Token(
        marketInfo.pair[1],
        networkInfo.decimalsRecord[marketInfo.pair[1]],
      )
    ];
    return new PendleMarket(
      address,
      pair
    )
  }

  public yieldContract(chainId?: number): YieldContract {
    const yt: Yt = Yt.find(this.tokens[0].address, chainId);
    return yt.yieldContract(chainId);
  }

  public static methods({signer, provider, chainId}: ChainSpecifics): Record<string, any> {
    const networkInfo: NetworkInfo = distributeConstantsByNetwork(chainId);
    const markets: PENDLEMARKETNFO[] = networkInfo.contractAddresses.pendleMarkets;

    const fetchInterests = async (
      userAddress: string
    ): Promise<YtOrMarketInterest[]> => {
      const userInterests: TokenAmount[] = await RedeemProxy.methods({signer, provider,chainId}).callStatic.redeemMarkets(
        markets.map((marketInfo: any) => marketInfo.address),
        userAddress
      );
      const formattedResult: YtOrMarketInterest[] = indexRange(0, markets.length).map((i: number) => {
        return {
          address: markets[i].address,
          interest: userInterests[i]
        }
      });

      return formattedResult;
    };

    const getSwapTransactions = (query: PendleAmmQuery): Promise<TRANSACTION[]> => {
      return new TransactionFetcher(networkInfo.chainId).getSwapTransactions(
        query
      );
    };

    const getLiquidityTransactions = (query: PendleAmmQuery): Promise<TRANSACTION[]> => {
      return new TransactionFetcher(
        networkInfo.chainId
      ).getLiquidityTransactions(query);
    };
    return {
      fetchInterests,
      getSwapTransactions,
      getLiquidityTransactions
    }
  };

  public methods({signer, provider, chainId}: ChainSpecifics): Record<string, any> {

    const networkInfo: NetworkInfo = distributeConstantsByNetwork(chainId);
    const marketContract = new Contract(this.address, contracts.IPendleMarket.abi, provider);
    const pendleDataContract = new Contract(networkInfo.contractAddresses.misc.PendleData, contracts.IPendleData.abi, provider);
    const pendleRouterContract = new Contract(networkInfo.contractAddresses.misc.PendleRouter, contracts.IPendleRouter.abi, provider);
    const transactionFetcher: TransactionFetcher = new TransactionFetcher(chainId === undefined ? 1 : chainId);
    const underlyingAsset: string = networkInfo.contractAddresses.YTs.find((ytInfo: YTINFO) => isSameAddress(ytInfo.address, this.tokens[0].address))!.underlyingAssetAddress;
    const yieldContract: YieldContract = this.yieldContract(chainId);

    const getMarketFactoryId = async (): Promise<string> => {
      if (this.marketFactoryId === "") {
        this.marketFactoryId = await marketContract.factoryId();
      }
      return this.marketFactoryId;
    }

    const getMarketReserves = async (): Promise<MarketReservesRaw> => {
      var marketReserves: MarketReservesRaw;
      if (!(await isExpired(yieldContract.expiry, provider))) {
        marketReserves = await marketContract.getReserves();
      } else {
        const YTContract: Contract = new Contract(this.tokens[0].address, contracts.IERC20.abi, provider);
        const baseTokenContract: Contract = new Contract(this.tokens[1].address, contracts.IERC20.abi, provider);
        marketReserves = {
          xytWeight: ZERO,
          tokenWeight: RONE,
        } as MarketReservesRaw;
        var promises = [];
        promises.push(YTContract.balanceOf(this.address).then((res: BN) => {marketReserves.xytBalance = res}));
        promises.push(baseTokenContract.balanceOf(this.address).then((res: BN) => {marketReserves.tokenBalance = res}));
        await Promise.all(promises);
      }
      return marketReserves;
    }

 

    const readMarketDetails = async (): Promise<MarketDetails> => {
      const marketReserves: MarketReservesRaw = await getMarketReserves();
      const ytReserveDetails: TokenReserveDetails = {
        reserves: new TokenAmount(
          this.tokens[0],
          marketReserves.xytBalance.toString()
        ),
        weights: marketReserves.xytWeight.toString()
      }
      const baseTokenReserveDetails: TokenReserveDetails = {
        reserves: new TokenAmount(
          this.tokens[1],
          marketReserves.tokenBalance.toString()
        ),
        weights: marketReserves.tokenWeight.toString()
      }

      const yieldBearingAsset: string = Yt.find(this.tokens[0].address, chainId).yieldBearingAddress;
      var promises: Promise<any>[] = [];
      var underlyingYieldRate: number = 0;
      promises.push(yieldContract.methods({signer, provider, chainId}).getUnderlyingYieldRate().then((res: number) => underlyingYieldRate = res));

      const currentTime: number = await getCurrentTimestamp(provider);

      var volumeToday: CurrencyAmount = ZeroCurrencyAmount, volumeYesterday: CurrencyAmount = ZeroCurrencyAmount;
      promises.push(getVolume(currentTime - ONE_DAY.toNumber(), currentTime).then((res: CurrencyAmount) => volumeToday = res));
      promises.push(getVolume(currentTime - ONE_DAY.mul(2).toNumber(), currentTime - ONE_DAY.toNumber()).then((res: CurrencyAmount) => volumeYesterday = res));

      var liquidityToday: CurrencyAmount = ZeroCurrencyAmount;
      promises.push(getLiquidityValue(marketReserves).then((res: CurrencyAmount) => liquidityToday = res));
      var liquidityYesterday: CurrencyAmount = ZeroCurrencyAmount;
      promises.push(getPastLiquidityValue().then((res: CurrencyAmount) => liquidityYesterday = res));
      const swapFee: BN = await pendleDataContract.swapFee();
      const protocolFee: BN = await pendleDataContract.protocolSwapFee();
      await Promise.all(promises);

      const swapFeeApr: BigNumber = calcSwapFeeAPR(new BigNumber(volumeToday.amount), swapFee, protocolFee, new BigNumber(liquidityToday.amount));

      const { ytPrice, principalValuation, impliedYield }: { ytPrice: BigNumber, principalValuation: BigNumber, impliedYield: BigNumber } = await getYTPriceAndImpliedYield(marketReserves);

      const volume24hChange: string = new BigNumber(volumeYesterday.amount).lte(0)
        ? new BigNumber(volumeToday.amount).lte(0) ? '0' : '1'
        : (new BigNumber(volumeToday.amount).minus(volumeYesterday.amount)).dividedBy(volumeYesterday.amount).toFixed(DecimalsPrecision);
      const liquidity24HChange: string = new BigNumber(liquidityYesterday.amount).lte(0)
        ? new BigNumber(liquidityToday.amount).lte(0) ? '0' : '1'
        : ((new BigNumber(liquidityToday.amount).minus(liquidityYesterday.amount)).dividedBy(liquidityYesterday.amount)).toFixed(DecimalsPrecision);
      return {
        tokenReserves: [ytReserveDetails, baseTokenReserveDetails],
        otherDetails: {
          dailyVolume: volumeToday,
          volume24hChange: volume24hChange,
          liquidity: liquidityToday,
          liquidity24HChange: liquidity24HChange,
          swapFeeApr: swapFeeApr.toFixed(DecimalsPrecision),
          impliedYield: impliedYield.toString(),
          YTPrice: {
            currency: 'USD',
            amount: ytPrice.toFixed(DecimalsPrecision)
          },
          underlyingPrice: {
            currency: 'USD',
            amount: principalValuation.toFixed(DecimalsPrecision)
          },
          underlyingYieldRate
        }
      };
    };

    const swapExactInDetails = async (inTokenAmount: TokenAmount, slippage: number): Promise<SwapDetails> => {
      const inAmount: BN = BN.from(inTokenAmount.rawAmount());
      const marketReserves: MarketReservesRaw = await marketContract.getReserves();
      const swapFee: BN = await pendleDataContract.swapFee();
      const tokenDetailsRelative: TokenDetailsRelative = getTokenDetailsRelative(inTokenAmount.token, marketReserves, true);
      const outAmount: BN = calcExactOut(
        tokenDetailsRelative.inReserve,
        tokenDetailsRelative.inWeight,
        tokenDetailsRelative.outReserve,
        tokenDetailsRelative.outWeight,
        inAmount,
        swapFee
      );
      const minReceived: BN = calcSlippedDownAmount(outAmount, slippage);
      const avgRate: BN = calcAvgRate(inAmount, outAmount, inTokenAmount.token.decimals);
      const currentRateWithSwapFee: BN = calcRateWithSwapFee(
        tokenDetailsRelative.inReserve,
        tokenDetailsRelative.inWeight,
        tokenDetailsRelative.outReserve,
        tokenDetailsRelative.outWeight,
        inTokenAmount.token.decimals,
        swapFee
      );
      const priceImpact: BigNumber = calcPriceImpact(currentRateWithSwapFee, avgRate);

      if (isSameAddress(tokenDetailsRelative.outToken.address, networkInfo.contractAddresses.tokens.WETH)) {
        tokenDetailsRelative.outToken = ETHToken;
      }

      return {
        inAmount: inTokenAmount,
        outAmount: new TokenAmount(
          tokenDetailsRelative.outToken,
          outAmount.toString()
        ),
        minReceived: new TokenAmount(
          tokenDetailsRelative.outToken,
          minReceived.toString()
        ),
        priceImpact: priceImpact.toFixed(DecimalsPrecision),
        swapFee: new TokenAmount(
          inTokenAmount.token,
          calcSwapFee(inAmount, swapFee).toString()
        )
      }
    };

    const swapExactOutDetails = async (outTokenAmount: TokenAmount, slippage: number): Promise<SwapDetails> => {
      const outAmount: BN = BN.from(outTokenAmount.rawAmount());
      const marketReserves: MarketReservesRaw = await marketContract.getReserves();
      const swapFee: BN = await pendleDataContract.swapFee();
      const tokenDetailsRelative: TokenDetailsRelative = getTokenDetailsRelative(outTokenAmount.token, marketReserves, false);
      if (outAmount.gte(tokenDetailsRelative.outReserve)) {
        throw Error("Out Amount Too Large");
      }
      const inAmount: BN = calcExactIn(
        tokenDetailsRelative.inReserve,
        tokenDetailsRelative.inWeight,
        tokenDetailsRelative.outReserve,
        tokenDetailsRelative.outWeight,
        outAmount,
        swapFee
      );
      const maxInput: BN = calcSlippedUpAmount(inAmount, slippage);
      const avgRate: BN = calcAvgRate(inAmount, outAmount, tokenDetailsRelative.inToken.decimals);
      const currentRateWithSwapFee: BN = calcRateWithSwapFee(
        tokenDetailsRelative.inReserve,
        tokenDetailsRelative.inWeight,
        tokenDetailsRelative.outReserve,
        tokenDetailsRelative.outWeight,
        tokenDetailsRelative.inToken.decimals,
        swapFee
      );
      const priceImpact: BigNumber = calcPriceImpact(currentRateWithSwapFee, avgRate);

      if (isSameAddress(tokenDetailsRelative.inToken.address, networkInfo.contractAddresses.tokens.WETH)) {
        tokenDetailsRelative.inToken = ETHToken;
      }

      return {
        inAmount: new TokenAmount(
          tokenDetailsRelative.inToken,
          inAmount.toString()
        ),
        outAmount: outTokenAmount,
        maxInput: new TokenAmount(
          tokenDetailsRelative.inToken,
          maxInput.toString()
        ),
        priceImpact: priceImpact.toFixed(DecimalsPrecision),
        swapFee: new TokenAmount(
          tokenDetailsRelative.inToken,
          calcSwapFee(inAmount, swapFee).toString()
        )
      }
    };

    const swapExactIn = async (inTokenAmount: TokenAmount, slippage: number): Promise<providers.TransactionResponse> => {
      const details: SwapDetails = await swapExactInDetails(inTokenAmount, slippage);
      const args: any[] = [
        details.inAmount.token.address,
        details.outAmount.token.address,
        details.inAmount.rawAmount(),
        details.minReceived!.rawAmount(),
        await getMarketFactoryId()
      ];
      const ETHAmountToSend: BN = isSameAddress(details.inAmount.token.address, ETHAddress) ? BN.from(details.inAmount.rawAmount()) : ZERO;
      return submitTransaction(pendleRouterContract, signer!, 'swapExactIn', args, ETHAmountToSend);
    }

    const swapExactOut = async (outTokenAmount: TokenAmount, slippage: number): Promise<providers.TransactionResponse> => {
      const details: SwapDetails = await swapExactOutDetails(outTokenAmount, slippage);
      const args: any[] = [
        details.inAmount.token.address,
        details.outAmount.token.address,
        details.outAmount.rawAmount(),
        details.maxInput!.rawAmount(),
        await getMarketFactoryId()
      ];
      const ETHAmountToSend: BN = isSameAddress(details.inAmount.token.address, ETHAddress) ? BN.from(details.maxInput!.rawAmount()) : ZERO;
      return submitTransaction(pendleRouterContract, signer!, 'swapExactOut', args, ETHAmountToSend);
    }

    const addDualDetails = async (tokenAmount: TokenAmount, _: number): Promise<AddDualLiquidityDetails> => {
      const marketReserves: MarketReservesRaw = await marketContract.getReserves();
      const inAmount: BN = BN.from(tokenAmount.rawAmount());
      const tokenDetailsRelative: TokenDetailsRelative = getTokenDetailsRelative(tokenAmount.token, marketReserves, true);
      const otherAmount: BN = calcOtherTokenAmount(tokenDetailsRelative.inReserve, tokenDetailsRelative.outReserve, inAmount);
      const shareOfPool: BigNumber = calcShareOfPool(tokenDetailsRelative.inReserve, inAmount);

      const totalSupply: BN = await marketContract.totalSupply();
      const lpMinted: BN = totalSupply.mul(inAmount).div(tokenDetailsRelative.inReserve);

      if (isSameAddress(tokenDetailsRelative.outToken.address, networkInfo.contractAddresses.tokens.WETH)) {
        tokenDetailsRelative.outToken = ETHToken;
      }

      return {
        otherTokenAmount: new TokenAmount(
          tokenDetailsRelative.outToken,
          otherAmount.toString()
        ),
        lpMinted: lpMinted.toString(),
        shareOfPool: shareOfPool.toFixed(DecimalsPrecision)
      }
    }

    const addDual = async (tokenAmounts: TokenAmount[], slippage: number): Promise<providers.TransactionResponse> => {
      const xytTokenAmount: TokenAmount = isSameAddress(tokenAmounts[0].token.address, this.tokens[0].address) ? tokenAmounts[0] : tokenAmounts[1];
      const baseTokenAmount: TokenAmount = isSameAddress(tokenAmounts[0].token.address, this.tokens[0].address) ? tokenAmounts[1] : tokenAmounts[0];

      const desiredXytAmount: BN = BN.from(xytTokenAmount.rawAmount());
      const desiredTokenAmount: BN = BN.from(baseTokenAmount.rawAmount());
      const xytMinAmount: BN = calcSlippedDownAmount(desiredXytAmount, slippage);
      const tokenMinAmount: BN = calcSlippedDownAmount(desiredTokenAmount, slippage);
      const args: any[] = [
        await getMarketFactoryId(),
        xytTokenAmount.token.address,
        baseTokenAmount.token.address,
        desiredXytAmount,
        desiredTokenAmount,
        xytMinAmount,
        tokenMinAmount
      ]
      const ETHAmountToSend: BN = isSameAddress(baseTokenAmount.token.address, ETHAddress) ? BN.from(desiredTokenAmount) : ZERO;
      return submitTransaction(pendleRouterContract, signer!, 'addMarketLiquidityDual', args, ETHAmountToSend);
    }

    const addSingleDetails = async (tokenAmount: TokenAmount): Promise<AddSingleLiquidityDetails> => {
      const marketReserves: MarketReservesRaw = await marketContract.getReserves();
      const totalSupplyLp: BN = await marketContract.totalSupply();
      const swapFee: BN = await pendleDataContract.swapFee();
      const inAmount: BN = BN.from(tokenAmount.rawAmount());
      const tokenDetailsRelative: TokenDetailsRelative = getTokenDetailsRelative(tokenAmount.token, marketReserves, true);

      const details: Record<string, BN> = calcOutAmountLp(
        inAmount,
        tokenDetailsRelative.inReserve,
        tokenDetailsRelative.inWeight,
        tokenDetailsRelative.outReserve,
        swapFee,
        totalSupplyLp
      );
      const avgRate: BN = calcAvgRate(details.inAmountSwapped, details.outAmountSwapped, tokenAmount.token.decimals);
      const currentRate: BN = calcRate(
        tokenDetailsRelative.inReserve,
        tokenDetailsRelative.inWeight,
        tokenDetailsRelative.outReserve,
        tokenDetailsRelative.outWeight,
        tokenAmount.token.decimals
      );
      const priceImpact: BigNumber = calcPriceImpact(currentRate, avgRate);
      const shareOfPool: BigNumber = calcShareOfPool(totalSupplyLp, details.exactOutLp);
      return {
        shareOfPool: shareOfPool.toFixed(DecimalsPrecision),
        rate: new TokenAmount(
          tokenDetailsRelative.outToken,
          avgRate.toString()
        ),
        priceImpact: priceImpact.toFixed(DecimalsPrecision),
        swapFee: new TokenAmount(
          tokenAmount.token,
          details.swapFee.toString()
        ),
      }
    }

    const addSingle = async (tokenAmount: TokenAmount, slippage: number): Promise<providers.TransactionResponse> => {
      const marketReserves: MarketReservesRaw = await marketContract.getReserves();
      const totalSupplyLp: BN = await marketContract.totalSupply();
      const swapFee: BN = await pendleDataContract.swapFee();
      const inAmount: BN = BN.from(tokenAmount.rawAmount());
      const tokenDetailsRelative: TokenDetailsRelative = getTokenDetailsRelative(tokenAmount.token, marketReserves, true);

      const details: Record<string, BN> = calcOutAmountLp(
        inAmount,
        tokenDetailsRelative.inReserve,
        tokenDetailsRelative.inWeight,
        tokenDetailsRelative.outReserve,
        swapFee,
        totalSupplyLp
      );
      const exactOutLp: BN = details.exactOutLp;
      const minOutLp: BN = calcSlippedDownAmount(exactOutLp, slippage);

      const isForXyt: boolean = isSameAddress(tokenAmount.token.address, this.tokens[0].address);

      const args: any[] = [
        await getMarketFactoryId(),
        this.tokens[0].address,
        isForXyt
          ? this.tokens[1].address
          : tokenAmount.token.address,
        isForXyt,
        tokenAmount.rawAmount(),
        minOutLp
      ];

      const ETHAmountToSend: BN = (!isForXyt && isSameAddress(tokenAmount.token.address, ETHAddress)) ? BN.from(tokenAmount.rawAmount()) : ZERO;
      return submitTransaction(pendleRouterContract, signer!, 'addMarketLiquiditySingle', args, ETHAmountToSend);
    }

    const getLpAmountByFraction = async (percentage: number): Promise<BN> => {
      if (percentage <= 0 || percentage > 1) {
        throw Error("Invalid Percentage");
      }
      percentage = Math.trunc(percentage * Math.pow(10, PercentageMaxDecimals));
      const userLpBalance: BN = await marketContract.balanceOf(await signer!.getAddress());
      const redeemAmount: BN = userLpBalance.mul(percentage).div(PONE);
      return redeemAmount;
    }

    const removeDualDetails = async (percentage: number, _: number): Promise<RemoveDualLiquidityDetails> => {
      const outBaseToken: Token = isSameAddress(this.tokens[1].address, networkInfo.contractAddresses.tokens.WETH) ? ETHToken : this.tokens[1];
      const redeemAmount: BN = await getLpAmountByFraction(percentage);
      if (redeemAmount.eq(0)) {
        return {
          tokenAmounts: [
            new TokenAmount(
              this.tokens[0],
              "0"
            ),
            new TokenAmount(
              outBaseToken,
              "0"
            )
          ]
        }
      }

      const totalSupplyLp: BN = await marketContract.totalSupply();
      const marketReserves: MarketReservesRaw = await marketContract.getReserves();
      const xytRedeemAmout: BN = marketReserves.xytBalance.mul(redeemAmount).div(totalSupplyLp);
      const baseTokenRedeemAmount: BN = marketReserves.tokenBalance.mul(redeemAmount).div(totalSupplyLp);
      return {
        tokenAmounts: [
          new TokenAmount(
            this.tokens[0],
            xytRedeemAmout.toString()
          ),
          new TokenAmount(
            outBaseToken,
            baseTokenRedeemAmount.toString()
          )
        ]
      }
    }

    const removeDual = async (percentage: number, slippage: number): Promise<providers.TransactionResponse> => {

      const details: RemoveDualLiquidityDetails = await removeDualDetails(percentage, slippage);
      const desiredXytOut: BN = BN.from(details.tokenAmounts[0].rawAmount());
      const desiredTokenOut: BN = BN.from(details.tokenAmounts[1].rawAmount());
      const minXytOut: BN = calcSlippedDownAmount(desiredXytOut, slippage);
      const minTokenOut: BN = calcSlippedDownAmount(desiredTokenOut, slippage);
      const args: any[] = [
        await getMarketFactoryId(),
        details.tokenAmounts[0].token.address,
        details.tokenAmounts[1].token.address,
        getLpAmountByFraction(percentage),
        minXytOut,
        minTokenOut
      ]
      return submitTransaction(pendleRouterContract, signer!, 'removeMarketLiquidityDual', args);
    }

    const removeSingleDetails = async (percentage: number, outToken: Token, _: number): Promise<RemoveSingleLiquidityDetails> => {
      const redeemAmount: BN = await getLpAmountByFraction(percentage);
      if (redeemAmount.eq(0)) {
        return {
          outAmount: new TokenAmount(
            outToken,
            "0"
          ),
          rate: new TokenAmount(
            outToken,
            "0"
          ),
          priceImpact: "0",
          swapFee: new TokenAmount(
            outToken,
            "0"
          )
        }
      }
      const totalSupplyLp: BN = await marketContract.totalSupply();
      const marketReserves: MarketReservesRaw = await marketContract.getReserves();
      const tokenDetailsRelative: TokenDetailsRelative = getTokenDetailsRelative(outToken, marketReserves, false);
      const swapFee: BN = await pendleDataContract.swapFee();

      const details = calcOutAmountToken(
        tokenDetailsRelative.inReserve,
        tokenDetailsRelative.outReserve,
        tokenDetailsRelative.outWeight,
        totalSupplyLp,
        redeemAmount,
        swapFee
      )
      const avgRate: BN = calcAvgRate(details.inAmountSwapped, details.outAmountSwapped, tokenDetailsRelative.inToken.decimals);
      const currentRate: BN = calcRate(
        tokenDetailsRelative.inReserve,
        tokenDetailsRelative.inWeight,
        tokenDetailsRelative.outReserve,
        tokenDetailsRelative.outWeight,
        tokenDetailsRelative.inToken.decimals
      );
      const priceImpact: BigNumber = calcPriceImpact(currentRate, avgRate);

      return {
        outAmount: new TokenAmount(
          outToken,
          details.exactOutToken.toString()
        ),
        rate: new TokenAmount(
          tokenDetailsRelative.outToken,
          avgRate.toString()
        ),
        priceImpact: priceImpact.toFixed(DecimalsPrecision),
        swapFee: new TokenAmount(
          outToken,
          details.swapFee.toString()
        )
      }
    }

    const removeSingle = async (percentage: number, outToken: Token, slippage: number): Promise<providers.TransactionResponse> => {
      const details: RemoveSingleLiquidityDetails = await removeSingleDetails(percentage, outToken, slippage);
      const exactOutAmount: BN = BN.from(details.outAmount.rawAmount());
      const minOutAmount: BN = calcSlippedDownAmount(exactOutAmount, slippage);

      const isForXyt: boolean = isSameAddress(outToken.address, this.tokens[0].address);

      const args: any[] = [
        await getMarketFactoryId(),
        this.tokens[0].address,
        isForXyt
          ? this.tokens[1].address
          : outToken.address,
        isForXyt,
        getLpAmountByFraction(percentage),
        minOutAmount
      ];
      return submitTransaction(pendleRouterContract, signer!, 'removeMarketLiquiditySingle', args);
    }

    const getVolume = async (leftBound: number, rightBound: number): Promise<CurrencyAmount> => {
      let volume: CurrencyAmount = Object.assign({}, ZeroCurrencyAmount);
      let amount: BigNumber = new BigNumber(0), page: number = 1;
      let f: boolean = true;
      while (f) {
        const result: TRANSACTION[] = await transactionFetcher.getSwapTransactions({
          page: page,
          limit: 100,
          marketAddress: this.address,
        });
        if (result.length === 0) {
          f = false;
          break;
        }
        for (let i: number = 0; i < result.length; i++) {
          if (result[i].timestamp! > leftBound && result[i].timestamp! <= rightBound) {
            amount = amount.plus(result[i].amount.amount);
          } else if (result[i].timestamp! <= leftBound) {
            f = false;
            break;
          }
        }
        page = page + 1;
      }
      volume.amount = amount.toFixed(DecimalsPrecision);
      return volume;
    }

    const getLiquidityValueBigNumber = async (marketReserve: MarketReservesRaw): Promise<BigNumber> => {
      const baseTokenPrice: BigNumber = await fetchTokenPrice({ address: this.tokens[1].address, provider, chainId });
      const totalLiquidityUSD: BigNumber = calcReserveUSDValue(marketReserve.tokenBalance, networkInfo.decimalsRecord[this.tokens[1].address], baseTokenPrice, marketReserve.tokenWeight);
      return totalLiquidityUSD;
    }

    const getLiquidityValue = async (marketReserve: MarketReservesRaw): Promise<CurrencyAmount> => {
      const totalLiquidityUSD: BigNumber = await getLiquidityValueBigNumber(marketReserve);
      return {
        currency: 'USD',
        amount: totalLiquidityUSD.toFixed(DecimalsPrecision)
      };
    }

    const getPastLiquidityValue = async (): Promise<CurrencyAmount> => {
      if (chainId == 42) return ZeroCurrencyAmount  // If Kovan, then return 0 since we do not have access to achived state

      const pastBlockNumber: number | undefined = await getBlocksomeDurationEarlier(ONE_DAY.toNumber(), chainId, provider);
      if (pastBlockNumber === undefined) {
        console.error("Unable to get block that is 1 day old");
        return ZeroCurrencyAmount
      }
      var getPastReserveSuccess: boolean = true;
      const pastMarketReserves: MarketReservesRaw = await marketContract.getReserves({ blockTag: pastBlockNumber }).catch((err: any) => {
        getPastReserveSuccess = false;
      });
      if (!getPastReserveSuccess) {
        return ZeroCurrencyAmount;
      }
      return getLiquidityValue(pastMarketReserves);
    }

    const getYTPrice = async (marketReserves: MarketReservesRaw | undefined): Promise<BigNumber> => {
      if (await isExpired(yieldContract.expiry, provider)) return new BigNumber(0);
      if (marketReserves === undefined) {
        marketReserves = await marketContract.getReserves();
      }
      const baseTokenPrice: BigNumber = await fetchTokenPrice({ address: this.tokens[1].address, provider, chainId });
      const ytDecimal: number = networkInfo.decimalsRecord[this.tokens[0].address];
      const rate: BN = calcRate(marketReserves!.xytBalance, marketReserves!.xytWeight, marketReserves!.tokenBalance, marketReserves!.tokenWeight, ytDecimal);
      const ytPrice: BigNumber = calcTokenPriceByMarket(baseTokenPrice, rate, networkInfo.decimalsRecord[this.tokens[1].address]);
      return ytPrice;
    }

    const getYTPriceAndImpliedYield = async (marketReserves: MarketReservesRaw): Promise<{ ytPrice: BigNumber, principalValuation: BigNumber, impliedYield: BigNumber }> => {
      const ytPrice: BigNumber = await getYTPrice(marketReserves);
      const principalValuationPerYT: CurrencyAmount = (await yieldContract.methods({signer, provider, chainId}).getPrincipalValuationPerYT()).valuation;
      const p: BigNumber = ytPrice.dividedBy(principalValuationPerYT.amount);

      // means yield is infinite
      if (p.isGreaterThanOrEqualTo(ONE)) {
        return {
          ytPrice: ytPrice,
          principalValuation: new BigNumber(principalValuationPerYT.amount),
          impliedYield: new BigNumber(999999999)
        };
      }
      const currentTime: number = await getCurrentTimestamp(provider);
      const daysLeft: BigNumber = new BigNumber(yieldContract.expiry - currentTime).dividedBy(24 * 3600);

      const y_annum: BigNumber = calcImpliedYield(p, daysLeft);

      return {
        ytPrice: ytPrice,
        principalValuation: new BigNumber(principalValuationPerYT.amount),
        impliedYield: y_annum
      };
    }


    const getTokenDetailsRelative = (token: Token, marketReserves: MarketReservesRaw, isInToken: boolean): TokenDetailsRelative => {
      var tokenAddress = token.address;
      if (isSameAddress(tokenAddress, ETHAddress)) {
        tokenAddress = networkInfo.contractAddresses.tokens.WETH;
      }
      var inReserve: BN, inWeight: BN, outReserve: BN, outWeight: BN, inToken: Token, outToken: Token;
      if (!isSameAddress(tokenAddress, this.tokens[0].address) && !isSameAddress(tokenAddress, this.tokens[1].address)) {
        throw new Error(WRONG_TOKEN);
      }
      if (xor(isSameAddress(tokenAddress, this.tokens[0].address), isInToken)) {
        inReserve = marketReserves.tokenBalance;
        inWeight = marketReserves.tokenWeight;
        inToken = this.tokens[1];
        outReserve = marketReserves.xytBalance;
        outWeight = marketReserves.xytWeight;
        outToken = this.tokens[0];
      } else {
        inReserve = marketReserves.xytBalance;
        inWeight = marketReserves.xytWeight;
        inToken = this.tokens[0];
        outReserve = marketReserves.tokenBalance;
        outWeight = marketReserves.tokenWeight;
        outToken = this.tokens[1];
      }
      return {
        inReserve,
        inWeight,
        inToken,
        outReserve,
        outWeight,
        outToken
      }
    }

    const getLPPriceBigNumber = async (): Promise<BigNumber> => {
      var marketReserves: MarketReservesRaw = await getMarketReserves()
      const liquidity: BigNumber = await getLiquidityValueBigNumber(marketReserves);
      const totalSupplyLp: BN = await marketContract.totalSupply();
      const decimal: number = networkInfo.decimalsRecord[this.address];
      return liquidity.multipliedBy(BN.from(10).pow(decimal).toString()).dividedBy(totalSupplyLp.toString());
    }

    const getSwapFeeAprBigNumber = async (): Promise<BigNumber> => {
      if (await isExpired(yieldContract.expiry, provider)) return new BigNumber(0);

      var promises = [];
      var marketReserves: MarketReservesRaw, volumeToday: CurrencyAmount, swapFee: BN, protocolFee: BN;
      promises.push(marketContract.getReserves().then((res: MarketReservesRaw) => {marketReserves = res}));
      promises.push( getCurrentTimestamp(provider).then(async (currentTime: number) => {
        volumeToday = await getVolume(currentTime - ONE_DAY.toNumber(), currentTime);
      }));
      promises.push(pendleDataContract.swapFee().then((res: BN) => {swapFee = res}))
      promises.push(pendleDataContract.protocolSwapFee().then((res: BN) => {protocolFee = res}))
      await Promise.all(promises);
      
      var liquidityToday: CurrencyAmount = await getLiquidityValue(marketReserves!);
      const swapFeeApr: BigNumber = calcSwapFeeAPR(new BigNumber(volumeToday!.amount), swapFee!, protocolFee!, new BigNumber(liquidityToday.amount));
      return swapFeeApr;
    }

    const getSwapFeeApr = async (): Promise<string> => {
      return (await getSwapFeeAprBigNumber()).toFixed(DecimalsPrecision);
    }

    return {
      readMarketDetails,
      swapExactInDetails,
      swapExactIn,
      swapExactOutDetails,
      swapExactOut,
      addDualDetails,
      addDual,
      addSingleDetails,
      addSingle,
      removeDualDetails,
      removeDual,
      removeSingleDetails,
      removeSingle,
      getLPPriceBigNumber,
      getSwapFeeApr,
      getMarketFactoryId,
      getYTPrice
    };
  }
}

export type OtherMarketDetails = {
  tokenReserves: TokenAmount[],
  otherDetails: {
    rates: TokenAmount[],
    liquidity: CurrencyAmount,
    totalSupplyLP: string,
    otPrice?: CurrencyAmount,
    impliedYield?: string
  }
}

export class UniForkMarket extends Market {
  public constructor(address: string, pair: Token[], protocol: MarketProtocols) {
    super(address, pair, protocol);
  }

  public static find(address: string, chainId?: number): UniForkMarket {
    const networkInfo: NetworkInfo = distributeConstantsByNetwork(chainId);
    const marketInfo: MARKETINFO | undefined = networkInfo.contractAddresses.otherMarkets?.find((m: MARKETINFO) => isSameAddress(address, m.address));
    if (marketInfo !== undefined && (marketInfo.platform == MarketProtocols.Sushiswap || marketInfo.platform == MarketProtocols.TraderJoe)) {
      return new UniForkMarket(
        address,
        marketInfo.pair.map((ad: string) => new Token(
          ad,
          networkInfo.decimalsRecord[ad]
        )),
        marketInfo.platform
      )
    } else {
      throw Error(`Cannot find Uni fork Market at ${address} on chain ${chainId}`);
    }
  }

  private getRouterAddress(chainId: number | undefined, protocol: MarketProtocols): string {
    const networkInfo: NetworkInfo = distributeConstantsByNetwork(chainId);
    if (protocol == MarketProtocols.Sushiswap) {
      return networkInfo.contractAddresses.misc.SushiRouter;
    } else if (protocol == MarketProtocols.TraderJoe) {
      return networkInfo.contractAddresses.misc.JoeRouter;
    } else {
      throw new Error(`Unsupported market protocol`)
    }
  }

  public yieldContract(chainId?: number): YieldContract {
    try {
      const ot: Ot = Ot.find(this.tokens[0].address, chainId);
      return ot.yieldContract(chainId);
    } catch (err) {
      throw new Error(`${this.address} is not an OT market on chain ${chainId}`);
    }
  }
  public static methods({signer, provider, chainId}: ChainSpecifics): Record<string, any> {

    const fetchClaimableRewardsFromOTMarkets = async (markets: UniForkMarket[], userAddress: string): Promise<TokenAmount[]> => {
      const rawResult: TokenAmount[][] = await Promise.all(markets.map(async (m: UniForkMarket) => {
        return m.methods({signer, provider, chainId}).fetchRewardsFromOtReserves(userAddress);
      }));
      const flattenedResult = rawResult.flat();
      const tokenSet: Set<string> = new Set();
      const res: TokenAmount[] = [];
      for (var i = 0; i < flattenedResult.length; i++) {
        if (tokenSet.has(flattenedResult[i].token.address)) continue;
        tokenSet.add(flattenedResult[i].token.address);
        res.push(flattenedResult[i]);
      }
      return res;
    }

    return {
      fetchClaimableRewardsFromOTMarkets
    }
  }
  public methods({signer, provider, chainId}: ChainSpecifics): Record<string, any> {

    const networkInfo: NetworkInfo = distributeConstantsByNetwork(chainId);
    const uniForkRouterContract: Contract = new Contract(this.getRouterAddress(chainId, this.protocol), contracts.UniswapRouter02.abi, provider);
    const marketContract: Contract = new Contract(this.address, contracts.UniswapV2Pair.abi, provider);
    
    const getSwapFeeApr = async (): Promise<string> => {
      return (await fetchSushiForkYield(this.address, chainId)).toString()
    }

    const readMarketDetails = async (): Promise<OtherMarketDetails> => {
      const marketContract: Contract = new Contract(this.address, contracts.UniswapV2Pair.abi, provider);
      var token0Address: string = '', token0Reserve: BN = ZERO, token1Reserve: BN = ZERO, totalSupplyLP: BN = ZERO;
      const promises = [];
      promises.push(marketContract.token0().then((r: string) => {
        token0Address = r;
      }));
      promises.push(marketContract.getReserves().then((r: any) => {
        token0Reserve = r.reserve0;
        token1Reserve = r.reserve1;
      }));
      promises.push(marketContract.totalSupply().then((r: BN) => {
        totalSupplyLP = r;
      }))
      await Promise.all(promises);

      if (!isSameAddress(this.tokens[0].address, token0Address)) {
        const t: BN = token0Reserve;
        token0Reserve = token1Reserve;
        token1Reserve = t;
      }

      const tokenAmount0: TokenAmount = new TokenAmount(
        this.tokens[0],
        token0Reserve.toString()
      );
      const tokenAmount1: TokenAmount = new TokenAmount(
        this.tokens[1],
        token1Reserve.toString()
      );
      const rateOfToken0: BN = calcUnweightedRate(token0Reserve, token1Reserve, networkInfo.decimalsRecord[this.tokens[0].address]);
      const rateOfToken1: BN = calcUnweightedRate(token1Reserve, token0Reserve, networkInfo.decimalsRecord[this.tokens[1].address]);
      const singleSidedLiquidity: CurrencyAmount = await fetchValuation(tokenAmount0, provider, chainId);
      const liquidity: CurrencyAmount = {
        currency: singleSidedLiquidity.currency,
        amount: new BigNumber(singleSidedLiquidity.amount).multipliedBy(2).toFixed(DecimalsPrecision)
      }
      const marketDetails: OtherMarketDetails = {
        tokenReserves: [tokenAmount0, tokenAmount1],
        otherDetails: {
          rates: [
            new TokenAmount(
              this.tokens[1],
              rateOfToken0.toString()
            ),
            new TokenAmount(
              this.tokens[0],
              rateOfToken1.toString()
            )
          ],
          liquidity,
          totalSupplyLP: totalSupplyLP.toString()
        }
      };
      try {
        const {otPrice, impliedYield} = await getOtPriceAndimpliedYield();
        marketDetails.otherDetails.otPrice = {
          currency: 'USD',
          amount: otPrice.toFixed(DecimalsPrecision)
        };
        marketDetails.otherDetails.impliedYield = impliedYield.toFixed(DecimalsPrecision);
      } catch(err) {}
      
      return marketDetails;
    }

    const getOtPrice = async(): Promise<BigNumber> => {
      var otAddress: string = this.tokens[0].address;
      var otherTokenAddress: string = this.tokens[1].address;

      var token0: string, token1: string, marketReserve: any;
      var promises = [];
      promises.push(marketContract.token0());
      promises.push(marketContract.token1());
      promises.push(marketContract.getReserves());
      await Promise.all(promises).then((values: any[]) => {
        token0 = values[0].toLowerCase();
        token1 = values[1].toLowerCase();
        marketReserve = values[2];
      })
      var otReserve: BN, otherReserve: BN;
      if (isSameAddress(token0!, this.tokens[0].address)) {
        otReserve = marketReserve.reserve0;
        otherReserve = marketReserve.reserve1;
      } else {
        otReserve = marketReserve.reserve1;
        otherReserve = marketReserve.reserve0;
      }
      const otherPirce: BigNumber = await fetchTokenPrice({address: otherTokenAddress, provider, chainId});
      return otherPirce.multipliedBy(otherReserve.toString()).div(decimalFactor(networkInfo.decimalsRecord[otherTokenAddress]))
        .multipliedBy(decimalFactor(networkInfo.decimalsRecord[otAddress])).div(otReserve.toString());
    }

    const getOtPriceAndimpliedYield = async(): Promise<{otPrice: BigNumber, impliedYield: BigNumber}> => {
      const otPrice: BigNumber = await getOtPrice();
      const yieldContract: YieldContract = this.yieldContract(chainId);
      const principalPerOT: TokenAmount = await yieldContract.methods({signer, provider, chainId}).getPrincipalPerYT();
      const principalValuation: CurrencyAmount = await fetchValuation(principalPerOT, provider, chainId);
      const p: BigNumber = (new BigNumber(principalValuation.amount).minus(otPrice)).dividedBy(principalValuation.amount);

      // means yield is infinite
      if (p.isGreaterThanOrEqualTo(ONE)) {
        return {
          otPrice: otPrice,
          impliedYield: new BigNumber(999999999)
        };
      }
      const currentTime: number = await getCurrentTimestamp(provider);
      const daysLeft: BigNumber = new BigNumber(yieldContract.expiry - currentTime).dividedBy(24 * 3600);

      const y_annum: BigNumber = calcImpliedYield(p, daysLeft);
      return {
        otPrice: otPrice,
        impliedYield: y_annum
      };
    }

    const addDualDetails = async (tokenAmount: TokenAmount, _: number): Promise<AddDualLiquidityDetails> => {
      var token0: string, token1: string, totalSupplyLP: BN, marketReserve: any;
      var promises = [];
      promises.push(marketContract.token0());
      promises.push(marketContract.token1());
      promises.push(marketContract.getReserves());
      promises.push(marketContract.totalSupply());
      await Promise.all(promises).then((values: any[]) => {
        token0 = values[0].toLowerCase();
        token1 = values[1].toLowerCase();
        marketReserve = values[2];
        totalSupplyLP = values[3];
      })
      const token0Reserve: BN = marketReserve!.reserve0;
      const token1Reserve: BN = marketReserve!.reserve1;
      var inputToken: string, otherToken: string, inputTokenReserve: BN, otherTokenReserve: BN;
      if (isSameAddress(tokenAmount.token.address, token0!)) {
        inputToken = token0!;
        otherToken = token1!;
        inputTokenReserve = token0Reserve;
        otherTokenReserve = token1Reserve;
      } else {
        inputToken = token1!;
        otherToken = token0!;
        inputTokenReserve = token1Reserve;
        otherTokenReserve = token0Reserve;
      }
      return {
        otherTokenAmount: new TokenAmount(
          new Token(
            otherToken,
            networkInfo.decimalsRecord[otherToken]
          ),
          BN.from(tokenAmount.rawAmount()).mul(otherTokenReserve).div(inputTokenReserve).toString()
        ),
        shareOfPool: calcShareOfPool(token0Reserve, BN.from(tokenAmount.rawAmount())).toFixed(DecimalsPrecision),
        lpMinted: totalSupplyLP!.mul(tokenAmount.rawAmount()).div(inputTokenReserve).toString()
      }
    }

    const addDual = async (tokenAmounts: TokenAmount[], slippage: number): Promise<providers.TransactionResponse> => {
      const args: any[] = [
        tokenAmounts[0].token.address,
        tokenAmounts[1].token.address,
        tokenAmounts[0].rawAmount(),
        tokenAmounts[1].rawAmount(),
        calcSlippedDownAmount(BN.from(tokenAmounts[0].rawAmount()), slippage),
        calcSlippedDownAmount(BN.from(tokenAmounts[1].rawAmount()), slippage),
        await signer!.getAddress(),
        (await getCurrentTimestamp(provider)) + ONE_MINUTE.mul(60).toNumber()
      ]
      return submitTransaction(uniForkRouterContract, signer!, 'addLiquidity', args);
    }

    const getLpAmountByFraction = async (percentage: number): Promise<BN> => {
      if (percentage <= 0 || percentage > 1) {
        throw Error("Invalid Percentage");
      }
      percentage = Math.trunc(percentage * Math.pow(10, PercentageMaxDecimals));
      const userLpBalance: BN = await marketContract.balanceOf(await signer!.getAddress());
      const redeemAmount: BN = userLpBalance.mul(percentage).div(PONE);
      return redeemAmount;
    }
    
    const removeDualDetails = async (percentage: number, _: number): Promise<RemoveDualLiquidityDetails> => {
      const redeemAmount: BN = await getLpAmountByFraction(percentage);
      if (redeemAmount.eq(0)) {
        return {
          tokenAmounts: [
            new TokenAmount(
              this.tokens[0],
              "0"
            ),
            new TokenAmount(
              this.tokens[1],
              "0"
            )
          ]
        }
      }

      var token0: string, token1: string, totalSupplyLP: BN, marketReserve: any;
      var promises = [];
      promises.push(marketContract.token0());
      promises.push(marketContract.token1());
      promises.push(marketContract.getReserves());
      promises.push(marketContract.totalSupply());
      await Promise.all(promises).then((values: any[]) => {
        token0 = values[0].toLowerCase();
        token1 = values[1].toLowerCase();
        marketReserve = values[2];
        totalSupplyLP = values[3];
      })
      const token0RedeemAmout: BN = isSameAddress(token0!, this.tokens[0].address) ? marketReserve.reserve0.mul(redeemAmount).div(totalSupplyLP!) : marketReserve.reserve1.mul(redeemAmount).div(totalSupplyLP!);
      const token1RedeemAmout: BN = isSameAddress(token1!, this.tokens[1].address) ? marketReserve.reserve1.mul(redeemAmount).div(totalSupplyLP!) : marketReserve.reserve0.mul(redeemAmount).div(totalSupplyLP!);
      return {
        tokenAmounts: [
          new TokenAmount(
            this.tokens[0],
            token0RedeemAmout.toString()
          ),
          new TokenAmount(
            this.tokens[1],
            token1RedeemAmout.toString()
          )
        ]
      }
    }

    const removeDual = async (percentage: number, slippage: number): Promise<providers.TransactionResponse> => {
      const redeemAmount: BN = await getLpAmountByFraction(percentage);
      const removeDetails: RemoveDualLiquidityDetails = await removeDualDetails(percentage, slippage);
      const args = [
        removeDetails.tokenAmounts[0].token.address,
        removeDetails.tokenAmounts[1].token.address,
        redeemAmount,
        calcSlippedDownAmount(BN.from(removeDetails.tokenAmounts[0].rawAmount()), slippage),
        calcSlippedDownAmount(BN.from(removeDetails.tokenAmounts[1].rawAmount()), slippage),
        await signer!.getAddress(),
        (await getCurrentTimestamp(provider)) + ONE_MINUTE.mul(60).toNumber()
      ];
      return submitTransaction(uniForkRouterContract, signer!, 'removeLiquidity', args);
    }

    const fetchRewardsFromOtReserves = async (userAddress: string): Promise<TokenAmount[]> => {
      var res: TokenAmount[] = [];
      for (const t of this.tokens) {
        try {
          const ot: Ot = Ot.find(t.address, chainId);
          const redeemResults: TokenAmount[] = await RedeemProxy.methods({signer, provider, chainId}).callStatic.redeemTokenDist(ot.rewardTokenAddresses, userAddress);
          res = res.concat(redeemResults.filter((tokenAmount: TokenAmount) => BN.from(tokenAmount.rawAmount()).gt(0)));
        } catch (err) { }
      }
      return res;
    }

    return {
      getSwapFeeApr,
      readMarketDetails,
      fetchRewardsFromOtReserves,
      addDualDetails,
      addDual,
      removeDualDetails,
      removeDual,
      getOtPrice
    }
  }
}