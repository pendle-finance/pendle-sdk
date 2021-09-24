import { Token } from './token';
import { TokenAmount } from './tokenAmount';
import { Contract, providers, BigNumber as BN, utils } from 'ethers';
import { contracts } from '../contracts';
import { YtOrMarketInterest, Yt } from './yt';
import { MARKETNFO, NetworkInfo, YTINFO } from '../networks';
import { distributeConstantsByNetwork, getBlockOneDayEarlier, getCurrentTimestamp, getDecimal, getGasLimit, isSameAddress, xor, getABIByForgeId } from '../helpers'
import { CurrencyAmount } from './currencyAmount';
import { YieldContract } from './yieldContract';
import {
  TransactionFetcher,
  PendleAmmQuery,
} from './transactions';
import { PercentageMaxDecimals, PONE, calcAvgRate, calcExactIn, calcExactOut, calcOtherTokenAmount, calcRateWithSwapFee, calcSwapFee, calcOutAmountLp, calcPriceImpact, calcShareOfPool, calcRate, calcOutAmountToken, calcReserveUSDValue, calcSwapFeeAPR, calcTokenPriceByMarket, calcPrincipalForSLPYT, DecimalsPrecision, ONE, calcImpliedYield, calcPrincipalFloat, calcSlippedDownAmount, calcSlippedUpAmount } from '../math/marketMath';
import { forgeIdsInBytes, ONE_DAY } from '../constants';
import { fetchAaveYield, fetchCompoundYield, fetchSushiYield } from '../fetchers/externalYieldRateFetcher';
import { TRANSACTION } from './transactions/types';
import { fetchTokenPrice } from '../fetchers/priceFetcher';

import BigNumber from 'bignumber.js';

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
    YTPrice: CurrencyAmount
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

  public constructor(marketAddress: string, tokens: Token[]) {
    this.address = marketAddress;
    this.tokens = tokens.map((t: Token) => new Token(
      t.address.toLowerCase(),
      t.decimals,
      t.expiry
    ));
  }
}

export class PendleMarket extends Market {
  private marketFactoryId: string = "";
  public ytInfo: YTINFO = {} as YTINFO;
  public constructor(marketAddress: string, tokens: Token[]) {
    super(marketAddress, [tokens[0], tokens[1]]);
  }

  public static find(address: string, chainId?: number): PendleMarket {
    address = address.toLowerCase();
    const networkInfo: NetworkInfo = distributeConstantsByNetwork(chainId);
    const marketInfo: MARKETNFO | undefined = networkInfo.contractAddresses.markets.find((m: MARKETNFO) => {
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
    const networkInfo: NetworkInfo = distributeConstantsByNetwork(chainId);
    const ytInfo: YTINFO[] = networkInfo.contractAddresses.YTs.filter((yt: YTINFO) => isSameAddress(yt.address, this.tokens[0].address));
    if (ytInfo.length === 0) {
      throw Error(`YT with address ${this.tokens[0].address} not found on this network`);
    }
    this.ytInfo = ytInfo[0];
    return new YieldContract(
      utils.parseBytes32String(ytInfo[0].forgeIdInBytes),
      new Token(
        ytInfo[0].underlyingAssetAddress,
        networkInfo.decimalsRecord[ytInfo[0].rewardTokenAddresses[0]]
      ),
      this.tokens[0].expiry!
    )
  }

  public static methods(
    signer: providers.JsonRpcSigner,
    chainId?: number
  ): Record<string, any> {
    const networkInfo: NetworkInfo = distributeConstantsByNetwork(chainId);
    const markets: MARKETNFO[] = networkInfo.contractAddresses.markets;

    const redeemProxyContract = new Contract(
      networkInfo.contractAddresses.misc.PendleRedeemProxy,
      contracts.PendleRedeemProxy.abi,
      signer.provider
    );

    const decimalsRecord: Record<string, number> = networkInfo.decimalsRecord;

    const fetchInterests = async (
      userAddress: string
    ): Promise<YtOrMarketInterest[]> => {
      const formattedResult: YtOrMarketInterest[] = [];
      const userInterests = await redeemProxyContract.callStatic.redeemMarkets(
        markets.map((marketInfo: any) => marketInfo.address),
        { from: userAddress }
      );
      for (let i = 0; i < markets.length; i++) {
        const marketInfo = markets[i];
        formattedResult.push({
          address: marketInfo.address,
          interest: new TokenAmount(
            new Token(marketInfo.rewardTokenAddresses[0], await getDecimal(decimalsRecord, marketInfo.rewardTokenAddresses[0], signer.provider)),
            userInterests[i].toString()
          ),
        });
      }
      return formattedResult;
    };

    const getSwapTransactions = (query: PendleAmmQuery) => {
      return new TransactionFetcher(networkInfo.chainId).getSwapTransactions(
        query
      );
    };

    const getLiquidityTransactions = (query: PendleAmmQuery) => {
      return new TransactionFetcher(
        networkInfo.chainId
      ).getLiquidityTransactions(query);
    };
    return {
      fetchInterests,
      getSwapTransactions,
      getLiquidityTransactions
    }
  }

  public methods(signer: providers.JsonRpcSigner,
    chainId?: number): Record<string, any> {

    const networkInfo: NetworkInfo = distributeConstantsByNetwork(chainId);
    const marketContract = new Contract(this.address, contracts.IPendleMarket.abi, signer.provider);
    const pendleDataContract = new Contract(networkInfo.contractAddresses.misc.PendleData, contracts.IPendleData.abi, signer.provider);
    const pendleRouterContract = new Contract(networkInfo.contractAddresses.misc.PendleRouter, contracts.IPendleRouter.abi, signer.provider);
    const transactionFetcher: TransactionFetcher = new TransactionFetcher(chainId === undefined ? 1 : chainId);
    const underlyingAsset: string = networkInfo.contractAddresses.YTs.find((ytInfo: YTINFO) => isSameAddress(ytInfo.address, this.tokens[0].address))!.underlyingAssetAddress;
    const yieldContract: YieldContract = this.yieldContract();
    const forgeAddress = networkInfo.contractAddresses.forges[yieldContract.forgeIdInBytes];
    const pendleForgeContract = new Contract(forgeAddress, getABIByForgeId(yieldContract.forgeIdInBytes).abi, signer.provider);

    const getMarketFactoryId = async (): Promise<string> => {
      if (this.marketFactoryId === "") {
        this.marketFactoryId = await marketContract.factoryId();
      }
      return this.marketFactoryId;
    }

    const readMarketDetails = async (): Promise<MarketDetails> => {
      const marketReserves: MarketReservesRaw = await marketContract.getReserves();
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

      var underlyingYieldRate: number = 0;
      if (chainId !== undefined && chainId !== 1) {
        underlyingYieldRate = 0;
      } else {
        const yieldBearingAddress: string = Yt.find(this.tokens[0].address).yieldBearingAddress;
        switch (yieldContract.forgeIdInBytes) {
          case forgeIdsInBytes.AAVE:
            underlyingYieldRate = await fetchAaveYield(yieldContract.underlyingAsset.address);
            break;

          case forgeIdsInBytes.COMPOUND:
            underlyingYieldRate = await fetchCompoundYield(yieldBearingAddress);
            break;

          case forgeIdsInBytes.SUSHISWAP_COMPLEX:
          case forgeIdsInBytes.SUSHISWAP_SIMPLE:
            underlyingYieldRate = await fetchSushiYield(yieldBearingAddress);
            break;
        }
      }

      const currentTime: number = await getCurrentTimestamp(signer.provider);

      const volumeToday: CurrencyAmount = await getVolume(currentTime - ONE_DAY.toNumber(), currentTime);
      const volumeYesterday: CurrencyAmount = await getVolume(currentTime - ONE_DAY.mul(2).toNumber(), currentTime - ONE_DAY.toNumber())

      var liquidityToday: CurrencyAmount = await getLiquidityValue(marketReserves);
      var liquidityYesterday: CurrencyAmount = await getPastLiquidityValue();
      const swapFee: BN = await pendleDataContract.swapFee();
      const protocolFee: BN = await pendleDataContract.protocolSwapFee();
      const swapFeeForLP: BigNumber = calcSwapFeeAPR(volumeToday.amount, swapFee, protocolFee, liquidityToday.amount);

      const { ytPrice, impliedYield }: { ytPrice: number, impliedYield: number } = await getYTPriceAndImpliedYield(marketReserves);

      return {
        tokenReserves: [ytReserveDetails, baseTokenReserveDetails],
        otherDetails: {
          dailyVolume: volumeToday,
          volume24hChange: volumeYesterday.amount === 0
            ? volumeToday.amount === 0 ? '0' : '1'
            : ((volumeToday.amount - volumeYesterday.amount) / volumeYesterday.amount).toString(),
          liquidity: liquidityToday,
          liquidity24HChange: liquidityYesterday.amount === 0
          ? liquidityToday.amount === 0 ? '0' : '1'
          : ((liquidityToday.amount - liquidityYesterday.amount) / liquidityYesterday.amount).toString(),
          swapFeeApr: swapFeeForLP.toFixed(DecimalsPrecision),
          impliedYield: impliedYield.toString(),
          YTPrice: {
            currency: 'USD',
            amount: ytPrice
          },
          underlyingYieldRate
        }
      };
    };

    const swapExactInDetails = async (inTokenAmount: TokenAmount, slippage: number): Promise<SwapDetails> => {
      const inAmount: BN = BN.from(inTokenAmount.rawAmount());
      const marketReserves: MarketReservesRaw = await marketContract.getReserves();
      const swapFee: BN = await pendleDataContract.swapFee();
      const tokenDetailsRelative: TokenDetailsRelative = this.getTokenDetailsRelative(inTokenAmount.token, marketReserves, true);
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
      const tokenDetailsRelative: TokenDetailsRelative = this.getTokenDetailsRelative(outTokenAmount.token, marketReserves, false);
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
      const gasEstimate = await pendleRouterContract.connect(signer).estimateGas.swapExactIn(...args);
      return pendleRouterContract.connect(signer).swapExactIn(...args, getGasLimit(gasEstimate));
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
      const gasEstimate = await pendleRouterContract.connect(signer).estimateGas.swapExactOut(...args);
      return pendleRouterContract.connect(signer).swapExactOut(...args, getGasLimit(gasEstimate));
    }

    const addDualDetails = async (tokenAmount: TokenAmount, _: number): Promise<AddDualLiquidityDetails> => {
      const marketReserves: MarketReservesRaw = await marketContract.getReserves();
      const inAmount: BN = BN.from(tokenAmount.rawAmount());
      const tokenDetailsRelative: TokenDetailsRelative = this.getTokenDetailsRelative(tokenAmount.token, marketReserves, true);
      const otherAmount: BN = calcOtherTokenAmount(tokenDetailsRelative.inReserve, tokenDetailsRelative.outReserve, inAmount);
      const shareOfPool: BigNumber = calcShareOfPool(tokenDetailsRelative.inReserve, inAmount);
      return {
        otherTokenAmount: new TokenAmount(
          tokenDetailsRelative.outToken,
          otherAmount.toString()
        ),
        shareOfPool: shareOfPool.toFixed(DecimalsPrecision)
      }
    }

    const addDual = async (tokenAmounts: TokenAmount[], slippage: number): Promise<providers.TransactionResponse> => {
      const desiredXytAmount: BN = BN.from(tokenAmounts[0].rawAmount());
      const desiredTokenAmount: BN = BN.from(tokenAmounts[1].rawAmount());
      const xytMinAmount: BN = calcSlippedDownAmount(desiredXytAmount, slippage);
      const tokenMinAmount: BN = calcSlippedDownAmount(desiredTokenAmount, slippage);
      const args: any[] = [
        await getMarketFactoryId(),
        this.tokens[0].address,
        this.tokens[1].address,
        desiredXytAmount,
        desiredTokenAmount,
        xytMinAmount,
        tokenMinAmount
      ]
      const gasEstimate: BN = await pendleRouterContract.connect(signer).estimateGas.addMarketLiquidityDual(...args);
      return pendleRouterContract.connect(signer).addMarketLiquidityDual(...args, getGasLimit(gasEstimate));
    }

    const addSingleDetails = async (tokenAmount: TokenAmount): Promise<AddSingleLiquidityDetails> => {
      const marketReserves: MarketReservesRaw = await marketContract.getReserves();
      const totalSupplyLp: BN = await marketContract.totalSupply();
      const swapFee: BN = await pendleDataContract.swapFee();
      const inAmount: BN = BN.from(tokenAmount.rawAmount());
      const tokenDetailsRelative: TokenDetailsRelative = this.getTokenDetailsRelative(tokenAmount.token, marketReserves, true);

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
        rate: new TokenAmount (
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
      const tokenDetailsRelative: TokenDetailsRelative = this.getTokenDetailsRelative(tokenAmount.token, marketReserves, true);

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
      const args: any[] = [
        await getMarketFactoryId(),
        this.tokens[0].address,
        this.tokens[1].address,
        isSameAddress(tokenAmount.token.address, this.tokens[0].address),
        tokenAmount.rawAmount(),
        minOutLp
      ];
      const gasEstimate: BN = await pendleRouterContract.connect(signer).estimateGas.addMarketLiquiditySingle(...args);
      return pendleRouterContract.connect(signer).addMarketLiquiditySingle(...args, getGasLimit(gasEstimate));
    }

    const getLpAmountByFraction = async (percentage: number): Promise<BN> => {
      if (percentage <= 0 || percentage > 1) {
        throw Error("Invalid Percentage");
      }
      percentage = Math.trunc(percentage * Math.pow(10, PercentageMaxDecimals));
      const userLpBalance: BN = await marketContract.balanceOf(await signer.getAddress());
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
            this.tokens[1],
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
        this.tokens[0].address,
        this.tokens[1].address,
        getLpAmountByFraction(percentage),
        minXytOut,
        minTokenOut
      ]
      const gasEstimate: BN = await pendleRouterContract.connect(signer).estimateGas.removeMarketLiquidityDual(...args);
      return pendleRouterContract.connect(signer).removeMarketLiquidityDual(...args, getGasLimit(gasEstimate));
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
      const tokenDetailsRelative: TokenDetailsRelative = this.getTokenDetailsRelative(outToken, marketReserves, false);
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

      const args: any[] = [
        await getMarketFactoryId(),
        this.tokens[0].address,
        this.tokens[1].address,
        isSameAddress(outToken.address, this.tokens[0].address),
        getLpAmountByFraction(percentage),
        minOutAmount
      ];
      const gasEstimate: BN = await pendleRouterContract.connect(signer).estimateGas.removeMarketLiquiditySingle(...args);
      return pendleRouterContract.connect(signer).removeMarketLiquiditySingle(...args, getGasLimit(gasEstimate));
    }

    const getVolume = async (leftBound: number, rightBound: number): Promise<CurrencyAmount> => {
      let volume: CurrencyAmount = {
        currency: "USD",
        amount: 0
      };
      let amount: number = 0, page: number = 1;
      let f: boolean = true;
      while (f) {
        const result: TRANSACTION[] = await transactionFetcher.getSwapTransactions({
          page: page,
          limit: 100,
          marketAddress: this.address,
        });
        for (let i: number = 0; i < result.length; i++) {
          if (result[i].timestamp! > leftBound && result[i].timestamp! <= rightBound) {
            amount = amount + (result[i].amount.amount);
          } else if (result[i].timestamp! <= leftBound) {
            f = false;
            break;
          }
        }
      }
      volume.amount = amount;
      return volume;
    }

    const getLiquidityValue = async (marketReserve: MarketReservesRaw): Promise<CurrencyAmount> => {
      const baseTokenPrice: BigNumber = await fetchTokenPrice(this.tokens[1].address, chainId);
      const totalLiquidityUSD: BigNumber = calcReserveUSDValue(marketReserve.tokenBalance, networkInfo.decimalsRecord[this.tokens[1].address], baseTokenPrice, marketReserve.tokenWeight);

      return {
        currency: 'USD',
        amount: parseFloat(totalLiquidityUSD.toFixed(DecimalsPrecision))
      };
    }

    const getPastLiquidityValue = async (): Promise<CurrencyAmount> => {
      const pastBlockNumber: number | undefined = await getBlockOneDayEarlier(chainId, signer.provider);
      if (pastBlockNumber === undefined) {
        console.error("Unable to get block that is 1 day old");
        return {
          currency: "USD",
          amount: 0
        }
      }
      const pastMarketReserves: MarketReservesRaw = await marketContract.getReserves({ blockTag: pastBlockNumber });
      return getLiquidityValue(pastMarketReserves);
    }

    const getYTPriceAndImpliedYield = async (marketReserves: MarketReservesRaw): Promise<{ ytPrice: number, impliedYield: number }> => {
      const underlyingPrice: BigNumber = await fetchTokenPrice(underlyingAsset, chainId);
      const baseTokenPrice: BigNumber = await fetchTokenPrice(this.tokens[1].address, chainId);
      const ytDecimal: number = networkInfo.decimalsRecord[this.tokens[0].address];
      const rate: BN = calcRate(marketReserves.xytBalance, marketReserves.xytWeight, marketReserves.tokenBalance, marketReserves.tokenWeight, ytDecimal);
      const ytPrice: BigNumber = calcTokenPriceByMarket(baseTokenPrice, rate, networkInfo.decimalsRecord[this.tokens[1].address]);

      var principalPerYT: BN = BN.from(10).pow(18);
      switch (yieldContract.forgeIdInBytes) {
        case forgeIdsInBytes.AAVE:
          principalPerYT = BN.from(10).pow(18);
          break;

        case forgeIdsInBytes.COMPOUND:
          principalPerYT = await pendleForgeContract.initialRate(underlyingAsset);
          break;

        case forgeIdsInBytes.SUSHISWAP_SIMPLE:
        case forgeIdsInBytes.SUSHISWAP_COMPLEX:
          principalPerYT = calcPrincipalForSLPYT(await pendleForgeContract.callStatic.getExchangeRate(underlyingAsset));
          break
      }
      const principalPerYTFloat: BigNumber = calcPrincipalFloat(principalPerYT, ytDecimal, networkInfo.decimalsRecord[underlyingAsset]);
      const p: BigNumber = ytPrice.dividedBy(underlyingPrice.multipliedBy(principalPerYTFloat));

      // means yield is infinite
      if (p.isGreaterThanOrEqualTo(ONE)) {
        return {
          ytPrice: ytPrice.toNumber(),
          impliedYield: 999999999
        };
      }
      const currentTime: number = await getCurrentTimestamp(signer.provider);
      const daysLeft: BigNumber = new BigNumber(yieldContract.expiry - currentTime).dividedBy(24 * 3600);

      const y_annum: number = calcImpliedYield(p, daysLeft);

      return {
        ytPrice: ytPrice.toNumber(),
        impliedYield: y_annum
      };
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
    };
  }

  private getTokenDetailsRelative(token: Token, marketReserves: MarketReservesRaw, isInToken: boolean): TokenDetailsRelative {
    var inReserve: BN, inWeight: BN, outReserve: BN, outWeight: BN, inToken: Token, outToken: Token;
    const tokenAddress = token.address.toLowerCase();
    if (tokenAddress != this.tokens[0].address && tokenAddress != this.tokens[1].address) {
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
}
