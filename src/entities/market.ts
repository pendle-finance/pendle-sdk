import { Token } from './token';
import { TokenAmount } from './tokenAmount';
import { Contract, providers, BigNumber as BN, utils } from 'ethers';
import { contracts } from '../contracts';
import { YtOrMarketInterest, Yt } from './yt';
import { MARKETNFO, NetworkInfo, YTINFO } from '../networks';
import { distributeConstantsByNetwork, getDecimal, getGasLimit, isSameAddress, xor } from '../helpers'
import { dummyCurrencyAmount, CurrencyAmount } from './currencyAmount';
import { YieldContract } from './yieldContract';
import {
  Transaction as SubgraphTransactions,
  PendleAmmQuery,
} from './transactions';
import { calcAvgRate, calcExactIn, calcExactOut, calcOtherTokenAmount, calcRateWithSwapFee, calcSwapFee, calcOutAmountLp, calcPriceImpact, calcShareOfPool, calcRate, calcOutAmountToken } from '../math/marketMath';
import { forgeIdsInBytes } from '../constants';
import { fetchAaveYield, fetchCompoundYield, fetchSushiYield } from '../fetchers/externalYieldRateFetcher';

import bigDecimal from 'js-big-decimal';

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
    underlyingYieldRate: number
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
  priceImpact: string;
  swapFee: TokenAmount;
};

export type RemoveDualLiquidityDetails = {
  tokenAmounts: TokenAmount[];
}

export type RemoveSingleLiquidityDetails = {
  outAmount: TokenAmount;
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

const SlippageMaxDecimals: number = 6;
const SlippageRONE: BN = BN.from(10).pow(SlippageMaxDecimals);

const WRONG_TOKEN: string = "Input Token not part of this market";
const MARKET_NOT_EXIST: string = "No Market is found at the given address";
const ZERO_AMOUNT: string = "Zero redeem amount";

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

  public getToken0PriceInToken1(): string {
    // TODO
    return '1';
  }
}

export class PendleMarket extends Market {
  private marketFactoryId: string = "";

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
    return new PendleMarket(
      address,
      marketInfo.pair.map((tokenAddress: string) => {
        return new Token(
          tokenAddress.toLowerCase(),
          networkInfo.decimalsRecord[tokenAddress.toLowerCase()]
        )
      })
    )
  }

  public yieldContract(chainId?: number): YieldContract {
    const networkInfo: NetworkInfo = distributeConstantsByNetwork(chainId);
    const ytInfo: YTINFO[] = networkInfo.contractAddresses.YTs.filter((yt: YTINFO) => isSameAddress(yt.address, this.tokens[0].address));
    if (ytInfo.length === 0) {
      throw Error(`YT with address ${this.tokens[0].address} not found on this network`);
    }
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
      return new SubgraphTransactions(networkInfo.chainId).getSwapTransactions(
        query
      );
    };

    const getLiquidityTransactions = (query: PendleAmmQuery) => {
      return new SubgraphTransactions(
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
        const yieldContract: YieldContract = this.yieldContract();
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

      return {
        tokenReserves: [ytReserveDetails, baseTokenReserveDetails],
        otherDetails: {
          dailyVolume: dummyCurrencyAmount,
          volume24hChange: '0.5',
          liquidity: dummyCurrencyAmount,          
          liquidity24HChange: "0.5",
          swapFeeApr: "0.5",
          impliedYield: "0.5",
          underlyingYieldRate
        }
      };
    };

    const swapExactInDetails = async (inTokenAmount: TokenAmount, slippage: number): Promise<SwapDetails> => {
      slippage = Math.trunc(slippage * Math.pow(10, SlippageMaxDecimals));
      const inAmount: BN = BN.from(inTokenAmount.rawAmount());
      const marketReserves: MarketReservesRaw = await marketContract.getReserves();
      const swapFee: BN = await pendleDataContract.swapFee();
      const tokenDetailsRelative = this.getTokenDetailsRelative(inTokenAmount.token, marketReserves, true);
      const outAmount: BN = calcExactOut(
        tokenDetailsRelative.inReserve,
        tokenDetailsRelative.inWeight,
        tokenDetailsRelative.outReserve,
        tokenDetailsRelative.outWeight,
        inAmount,
        swapFee
      );
      const minReceived: BN = outAmount.mul(SlippageRONE.sub(slippage)).div(SlippageRONE);
      const avgRate: BN = calcAvgRate(inAmount, outAmount, inTokenAmount.token.decimals);
      const currentRateWithSwapFee: BN = calcRateWithSwapFee(
        tokenDetailsRelative.inReserve,
        tokenDetailsRelative.inWeight,
        tokenDetailsRelative.outReserve,
        tokenDetailsRelative.outWeight,
        inTokenAmount.token.decimals,
        swapFee
      );
      const priceImpact: bigDecimal = calcPriceImpact(currentRateWithSwapFee, avgRate);
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
        priceImpact: priceImpact.getValue(),
        swapFee: new TokenAmount(
          inTokenAmount.token,
          calcSwapFee(inAmount, swapFee).toString()
        )
      }
    };

    const swapExactOutDetails = async (outTokenAmount: TokenAmount, slippage: number): Promise<SwapDetails> => {
      slippage = Math.trunc(slippage * Math.pow(10, SlippageMaxDecimals));
      const outAmount: BN = BN.from(outTokenAmount.rawAmount());
      const marketReserves: MarketReservesRaw = await marketContract.getReserves();
      const swapFee: BN = await pendleDataContract.swapFee();
      const tokenDetailsRelative = this.getTokenDetailsRelative(outTokenAmount.token, marketReserves, false);
      const inAmount: BN = calcExactIn(
        tokenDetailsRelative.inReserve,
        tokenDetailsRelative.inWeight,
        tokenDetailsRelative.outReserve,
        tokenDetailsRelative.outWeight,
        outAmount,
        swapFee
      );
      const maxInput: BN = inAmount.mul(SlippageRONE.add(slippage)).div(SlippageRONE);
      const avgRate: BN = calcAvgRate(inAmount, outAmount, tokenDetailsRelative.inToken.decimals);
      const currentRateWithSwapFee: BN = calcRateWithSwapFee(
        tokenDetailsRelative.inReserve,
        tokenDetailsRelative.inWeight,
        tokenDetailsRelative.outReserve,
        tokenDetailsRelative.outWeight,
        tokenDetailsRelative.inToken.decimals,
        swapFee
      );
      const priceImpact: bigDecimal = calcPriceImpact(currentRateWithSwapFee, avgRate);
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
        priceImpact: priceImpact.getValue(),
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
      const gasEstimate = await pendleRouterContract.estimateGas.swapExactIn(...args);
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
      const gasEstimate = await pendleRouterContract.estimateGas.swapExactIn(...args);
      return pendleRouterContract.connect(signer).swapExactIn(...args, getGasLimit(gasEstimate));
    }

    const addDualDetails = async (tokenAmount: TokenAmount, _: number): Promise<AddDualLiquidityDetails> => {
      const marketReserves: MarketReservesRaw = await marketContract.getReserves();
      const inAmount: BN = BN.from(tokenAmount.rawAmount());
      const tokenDetailsRelative = this.getTokenDetailsRelative(tokenAmount.token, marketReserves, true);
      const otherAmount: BN = calcOtherTokenAmount(tokenDetailsRelative.inReserve, tokenDetailsRelative.outReserve, inAmount);
      const shareOfPool: bigDecimal = calcShareOfPool(tokenDetailsRelative.inReserve, inAmount);
      return {
        otherTokenAmount: new TokenAmount(
          tokenDetailsRelative.outToken,
          otherAmount.toString()
        ),
        shareOfPool: shareOfPool.getValue()
      }
    }

    const addDual = async (tokenAmounts: TokenAmount[], slippage: number): Promise<providers.TransactionResponse> => {
      const desiredXytAmount: BN = BN.from(tokenAmounts[0].rawAmount());
      const desiredTokenAmount: BN = BN.from(tokenAmounts[1].rawAmount());
      const xytMinAmount: BN = BN.from(Math.trunc(desiredXytAmount.toNumber() * (1 - slippage)))
      const tokenMinAmount: BN = BN.from(Math.trunc(desiredTokenAmount.toNumber() * (1 - slippage)))
      const args: any[] = [
        await getMarketFactoryId(),
        this.tokens[0].address,
        this.tokens[1].address,
        desiredXytAmount,
        desiredTokenAmount,
        xytMinAmount,
        tokenMinAmount
      ]
      const gasEstimate: BN = await pendleRouterContract.estimateGas.addMarketLiquidityDual(...args);
      return pendleRouterContract.connect(signer).addMarketLiquidityDual(...args, getGasLimit(gasEstimate));
    }

    const addSingleDetails = async (tokenAmount: TokenAmount): Promise<AddSingleLiquidityDetails> => {
      const marketReserves: MarketReservesRaw = await marketContract.getReserves();
      const totalSupplyLp: BN = await marketContract.totalSupply();
      const swapFee: BN = await pendleDataContract.swapFee();
      const inAmount: BN = BN.from(tokenAmount.rawAmount());
      const tokenDetailsRelative = this.getTokenDetailsRelative(tokenAmount.token, marketReserves, true);

      const details: Record<string, BN> = calcOutAmountLp(
        inAmount,
        tokenDetailsRelative.inReserve,
        tokenDetailsRelative.inWeight,
        tokenDetailsRelative.outReserve,
        swapFee,
        totalSupplyLp
      );
      console.log(details);
      const avgRate: BN = calcAvgRate(details.inAmountSwapped, details.outAmountSwapped, tokenAmount.token.decimals);
      const currentRate: BN = calcRate(
        tokenDetailsRelative.inReserve,
        tokenDetailsRelative.inWeight,
        tokenDetailsRelative.outReserve,
        tokenDetailsRelative.outWeight,
        tokenAmount.token.decimals
      );
      console.log(currentRate.toString(), avgRate.toString())
      const priceImpact: bigDecimal = calcPriceImpact(currentRate, avgRate);
      const shareOfPool: bigDecimal = calcShareOfPool(totalSupplyLp, details.exactOutLp);
      return {
        shareOfPool: shareOfPool.getValue(),
        priceImpact: priceImpact.getValue(),
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
      const tokenDetailsRelative = this.getTokenDetailsRelative(tokenAmount.token, marketReserves, true);

      const details: Record<string, BN> = calcOutAmountLp(
        inAmount,
        tokenDetailsRelative.inReserve,
        tokenDetailsRelative.inWeight,
        tokenDetailsRelative.outReserve,
        swapFee,
        totalSupplyLp
      );
      const exactOutLp: BN = details.exactOutLp;
      const minOutLp: BN = BN.from(Math.trunc(exactOutLp.toNumber() * (1 - slippage)));
      const args: any[] = [
        await getMarketFactoryId(),
        this.tokens[0].address,
        this.tokens[1].address,
        isSameAddress(tokenAmount.token.address, this.tokens[0].address),
        tokenAmount.rawAmount(),
        minOutLp
      ];
      const gasEstimate: BN = await pendleRouterContract.estimateGas.addMarketLiquiditySingle(...args);
      return pendleRouterContract.connect(signer).addMarketLiquiditySingle(...args, getGasLimit(gasEstimate));
    }

    const getLpAmountByFraction = async (percentage: number): Promise<BN> => {
      if (percentage <= 0 || percentage > 1) {
        throw Error("Invalid Percentage");
      }
      const userLpBalance: BN = await marketContract.balanceOf(await signer.getAddress());
      const redeemAmount: BN = BN.from(Math.trunc(userLpBalance.toNumber() * percentage));
      return redeemAmount;
    }

    const removeDualDetails = async (percentage: number, _: number): Promise<RemoveDualLiquidityDetails> => {
      const redeemAmount: BN = await getLpAmountByFraction(percentage);
      if (redeemAmount.eq(0)) {
        throw new Error(ZERO_AMOUNT);
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
      const minXytOut: BN = BN.from(Math.trunc(desiredXytOut.toNumber() * (1 - slippage)));
      const minTokenOut: BN = BN.from(Math.trunc(desiredTokenOut.toNumber() * (1 - slippage)));
      const args: any[] = [
        await signer.getAddress(),
        getLpAmountByFraction(percentage),
        minXytOut,
        minTokenOut
      ]
      const gasEstimate: BN = await pendleRouterContract.estimateGas.removeMarketLiquidityDual(...args);
      return pendleRouterContract.connect(signer).removeMarketLiquidityDual(...args, getGasLimit(gasEstimate));
    }

    const removeSingleDetails = async (percentage: number, outToken: Token, _: number): Promise<RemoveSingleLiquidityDetails> => {
      const redeemAmount: BN = await getLpAmountByFraction(percentage);
      if (redeemAmount.eq(0)) {
        throw new Error(ZERO_AMOUNT);
      }
      const totalSupplyLp: BN = await marketContract.totalSupply();
      const marketReserves: MarketReservesRaw = await marketContract.getReserves();
      const tokenDetailsRelative = this.getTokenDetailsRelative(outToken, marketReserves, false);
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
      const priceImpact: bigDecimal = calcPriceImpact(currentRate, avgRate);

      return {
        outAmount: new TokenAmount(
          outToken,
          details.exactOutToken.toString()
        ),
        priceImpact: priceImpact.getValue(),
        swapFee: new TokenAmount(
          outToken,
          details.swapFee.toString()
        )
      }
    }

    const removeSingle = async (percentage: number, outToken: Token, slippage: number): Promise<providers.TransactionResponse> => {
      const details: RemoveSingleLiquidityDetails = await removeSingleDetails(percentage, outToken, slippage);
      const exactOutAmount: BN = BN.from(details.outAmount.rawAmount());
      const minOutAmount: BN = BN.from(Math.trunc(exactOutAmount.toNumber() * (1 - slippage)));
      const args: any[] = [
        await signer.getAddress(),
        outToken.address,
        getLpAmountByFraction(percentage),
        minOutAmount
      ]
      const gasEstimate: BN = await pendleRouterContract.estimateGas.removeMarketLiquiditySingle(...args);
      return pendleRouterContract.connect(signer).removeMarketLiquiditySingle(...args, getGasLimit(gasEstimate));
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
