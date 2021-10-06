import { Token, ETHToken } from './token';
import { TokenAmount } from './tokenAmount';
import { Contract, providers, BigNumber as BN, utils } from 'ethers';
import { contracts } from '../contracts';
import { YtOrMarketInterest, Yt } from './yt';
import { PENDLEMARKETNFO, NetworkInfo, YTINFO, MARKETINFO, MarketProtocols } from '../networks';
import { distributeConstantsByNetwork, getBlockOneDayEarlier, getCurrentTimestamp, getDecimal, getGasLimit, isSameAddress, xor, getABIByForgeId, getGasLimitWithETH } from '../helpers'
import { CurrencyAmount } from './currencyAmount';
import { YieldContract } from './yieldContract';
import {
  TransactionFetcher,
  PendleAmmQuery,
} from './transactions';
import { PercentageMaxDecimals, PONE, calcAvgRate, calcExactIn, calcExactOut, calcOtherTokenAmount, calcRateWithSwapFee, calcSwapFee, calcOutAmountLp, calcPriceImpact, calcShareOfPool, calcRate, calcOutAmountToken, calcReserveUSDValue, calcSwapFeeAPR, calcTokenPriceByMarket, calcPrincipalForSLPYT, DecimalsPrecision, ONE, calcImpliedYield, calcPrincipalFloat, calcSlippedDownAmount, calcSlippedUpAmount } from '../math/marketMath';
import { forgeIdsInBytes, ONE_DAY, ETHAddress } from '../constants';
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
    } catch (error) {
      const networkInfo: NetworkInfo = distributeConstantsByNetwork(chainId);
      const marketInfo: MARKETINFO | undefined = networkInfo.contractAddresses.otherMarkets?.find((m: MARKETINFO) => isSameAddress(address, m.address));
      if (marketInfo !== undefined && marketInfo.platform == MarketProtocols.Sushiswap) {
        return new SushiMarket(
          address,
          [],
        )
      } else {
        throw new Error(MARKET_NOT_EXIST)
      }
    }
  }

  public methods(_: providers.JsonRpcSigner,
    __?: number): Record<string, any> {
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
    const markets: PENDLEMARKETNFO[] = networkInfo.contractAddresses.pendleMarkets;

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

  public methods(signer: providers.JsonRpcSigner,
    chainId?: number): Record<string, any> {

    const networkInfo: NetworkInfo = distributeConstantsByNetwork(chainId);
    const marketContract = new Contract(this.address, contracts.IPendleMarket.abi, signer.provider);
    const pendleDataContract = new Contract(networkInfo.contractAddresses.misc.PendleData, contracts.IPendleData.abi, signer.provider);
    const pendleRouterContract = new Contract(networkInfo.contractAddresses.misc.PendleRouter, contracts.IPendleRouter.abi, signer.provider);
    const transactionFetcher: TransactionFetcher = new TransactionFetcher(chainId === undefined ? 1 : chainId);
    const underlyingAsset: string = networkInfo.contractAddresses.YTs.find((ytInfo: YTINFO) => isSameAddress(ytInfo.address, this.tokens[0].address))!.underlyingAssetAddress;
    const yieldContract: YieldContract = this.yieldContract(chainId);
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
            underlyingYieldRate = await fetchSushiYield(yieldBearingAddress, chainId);
            break;

          // TODO: add Uniswap support here
        }
      }

      const currentTime: number = await getCurrentTimestamp(signer.provider);

      const volumeToday: CurrencyAmount = await getVolume(currentTime - ONE_DAY.toNumber(), currentTime);
      const volumeYesterday: CurrencyAmount = await getVolume(currentTime - ONE_DAY.mul(2).toNumber(), currentTime - ONE_DAY.toNumber())

      var liquidityToday: CurrencyAmount = await getLiquidityValue(marketReserves);
      var liquidityYesterday: CurrencyAmount = await getPastLiquidityValue();
      const swapFee: BN = await pendleDataContract.swapFee();
      const protocolFee: BN = await pendleDataContract.protocolSwapFee();
      const swapFeeApr: BigNumber = calcSwapFeeAPR(volumeToday.amount, swapFee, protocolFee, liquidityToday.amount);

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
          swapFeeApr: swapFeeApr.toFixed(DecimalsPrecision),
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
      if (isSameAddress(details.inAmount.token.address, ETHAddress)) {
        const gasEstimate = await pendleRouterContract.connect(signer).estimateGas.swapExactIn(...args, { value: BN.from(details.inAmount.rawAmount()) });
        return pendleRouterContract.connect(signer).swapExactIn(...args, getGasLimitWithETH(gasEstimate, BN.from(details.inAmount.rawAmount())));
      } else {
        const gasEstimate = await pendleRouterContract.connect(signer).estimateGas.swapExactIn(...args);
        return pendleRouterContract.connect(signer).swapExactIn(...args, getGasLimit(gasEstimate));
      }
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
      if (isSameAddress(details.inAmount.token.address, ETHAddress)) {
        const gasEstimate = await pendleRouterContract.connect(signer).estimateGas.swapExactOut(...args, { value: BN.from(details.maxInput!.rawAmount()) });
        return pendleRouterContract.connect(signer).swapExactOut(...args, getGasLimitWithETH(gasEstimate, BN.from(details.maxInput!.rawAmount())));
      } else {
        const gasEstimate = await pendleRouterContract.connect(signer).estimateGas.swapExactOut(...args);
        return pendleRouterContract.connect(signer).swapExactOut(...args, getGasLimit(gasEstimate));
      }
    }

    const addDualDetails = async (tokenAmount: TokenAmount, _: number): Promise<AddDualLiquidityDetails> => {
      const marketReserves: MarketReservesRaw = await marketContract.getReserves();
      const inAmount: BN = BN.from(tokenAmount.rawAmount());
      const tokenDetailsRelative: TokenDetailsRelative = getTokenDetailsRelative(tokenAmount.token, marketReserves, true);
      const otherAmount: BN = calcOtherTokenAmount(tokenDetailsRelative.inReserve, tokenDetailsRelative.outReserve, inAmount);
      const shareOfPool: BigNumber = calcShareOfPool(tokenDetailsRelative.inReserve, inAmount);

      if (isSameAddress(tokenDetailsRelative.outToken.address, networkInfo.contractAddresses.tokens.WETH)) {
        tokenDetailsRelative.outToken = ETHToken;
      }

      return {
        otherTokenAmount: new TokenAmount(
          tokenDetailsRelative.outToken,
          otherAmount.toString()
        ),
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
      if (isSameAddress(baseTokenAmount.token.address, ETHAddress)) {
        const gasEstimate: BN = await pendleRouterContract.connect(signer).estimateGas.addMarketLiquidityDual(...args, { value: desiredTokenAmount });
        return pendleRouterContract.connect(signer).addMarketLiquidityDual(...args, getGasLimitWithETH(gasEstimate, desiredTokenAmount));
      } else {
        const gasEstimate: BN = await pendleRouterContract.connect(signer).estimateGas.addMarketLiquidityDual(...args);
        return pendleRouterContract.connect(signer).addMarketLiquidityDual(...args, getGasLimit(gasEstimate));
      }
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

      if (!isForXyt && isSameAddress(tokenAmount.token.address, ETHAddress)) {
        const gasEstimate: BN = await pendleRouterContract.connect(signer).estimateGas.addMarketLiquiditySingle(...args, { value: BN.from(tokenAmount.rawAmount()) });
        return pendleRouterContract.connect(signer).addMarketLiquiditySingle(...args, getGasLimitWithETH(gasEstimate, BN.from(tokenAmount.rawAmount())));
      } else {
        const gasEstimate: BN = await pendleRouterContract.connect(signer).estimateGas.addMarketLiquiditySingle(...args);
        return pendleRouterContract.connect(signer).addMarketLiquiditySingle(...args, getGasLimit(gasEstimate));
      }
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

    const getLiquidityValueBigNumber = async (marketReserve: MarketReservesRaw): Promise<BigNumber> => {
      const baseTokenPrice: BigNumber = await fetchTokenPrice(this.tokens[1].address, chainId);
      const totalLiquidityUSD: BigNumber = calcReserveUSDValue(marketReserve.tokenBalance, networkInfo.decimalsRecord[this.tokens[1].address], baseTokenPrice, marketReserve.tokenWeight);
      return totalLiquidityUSD;
    }

    const getLiquidityValue = async (marketReserve: MarketReservesRaw): Promise<CurrencyAmount> => {
      const totalLiquidityUSD: BigNumber = await getLiquidityValueBigNumber(marketReserve);
      return {
        currency: 'USD',
        amount: parseFloat(totalLiquidityUSD.toFixed(DecimalsPrecision))
      };
    }

    const getPastLiquidityValue = async (): Promise<CurrencyAmount> => {
      if (chainId === undefined || chainId == 1) {
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
      } else { // If Kovan, then return 0 since we do not have access to achived state
        return {
          currency: 'USD',
          amount: 0
        };
      }
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
      const marketReserves: MarketReservesRaw = await marketContract.getReserves();
      const liquidity: BigNumber = await getLiquidityValueBigNumber(marketReserves);
      const totalSupplyLp: BN = await marketContract.totalSupply();
      const decimal: number = networkInfo.decimalsRecord[this.address];
      return liquidity.multipliedBy(BN.from(10).pow(decimal).toString()).dividedBy(totalSupplyLp.toString());
    }

    const getSwapFeeAprBigNumber = async (): Promise<BigNumber> => {
      const marketReserves: MarketReservesRaw = await marketContract.getReserves();

      const currentTime: number = await getCurrentTimestamp(signer.provider);

      const volumeToday: CurrencyAmount = await getVolume(currentTime - ONE_DAY.toNumber(), currentTime);

      var liquidityToday: CurrencyAmount = await getLiquidityValue(marketReserves);
      const swapFee: BN = await pendleDataContract.swapFee();
      const protocolFee: BN = await pendleDataContract.protocolSwapFee();
      const swapFeeApr: BigNumber = calcSwapFeeAPR(volumeToday.amount, swapFee, protocolFee, liquidityToday.amount);
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
      getSwapFeeApr
    };
  }
}


export class SushiMarket extends Market {
  public constructor(address: string, pair: Token[]) {
    super(address, pair, MarketProtocols.Sushiswap);
  }

  public methods(_: providers.JsonRpcSigner, chainId?: number): Record<string, any> {
    const getSwapFeeApr = async (): Promise<string> => {
      return (await fetchSushiYield(this.address, chainId)).toString()
    }

    return {
      getSwapFeeApr
    }
  }
}