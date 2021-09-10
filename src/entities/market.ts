import { TokenAmount, Token } from './token';
import { Contract, providers, BigNumber as BN } from 'ethers';
import { contracts } from '../contracts';
import { YtOrMarketInterest } from './token';
import { MARKETNFO, NetworkInfo } from '../networks';
import { distributeConstantsByNetwork, getDecimal, xor } from '../helpers'
import { dummyCurrencyAmount, dummyToken, dummyTokenAmount, CurrencyAmount } from '..';
import { YieldContract } from './yieldContract';
import { calAvgRate, calcExactIn, calcExactOut, calcOtherTokenAmount, calcRateWithSwapFee, calcSwapFee, calcOutAmountLp, calcPriceImpact, calcShareOfPool, calcRate } from '../math/marketMath';
import bigDecimal from 'js-big-decimal';


export type TokenReserveDetails = {
  reserves: TokenAmount
  weights: string
}

export type MarketDetails = {
  tokenReserves: TokenReserveDetails[],
  otherDetails: { // from subgraph
    dailyVolume: CurrencyAmount, //TODO: to confirm
    volume24hChange: string,
    liquidity: CurrencyAmount,
    liquidity24HChange: string,
    swapFeeApr: string,
    impliedYield: string
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
  otherTokenAmount: TokenAmount
  shareOfPool: string
}

export type AddSingleLiquidityDetails = {
  shareOfPool: string
  priceImpact: string
  swapFee: TokenAmount
}

export type RemoveDualLiquidityDetails = {
  tokenAmounts: TokenAmount[]
}

export type RemoveSingleLiquidityDetails = {
  outAmount: TokenAmount
  priceImpact?: string
  swapFee?: TokenAmount
}

type MarketReservesRaw = {
  xytBalance: BN,
  xytWeight: BN,
  tokenBalance: BN,
  tokenWeight: BN,
  currentBlock: BN
}

const SlippageMaxDecimals: number = 6;
const SlippageRONE: BN = BN.from(10).pow(SlippageMaxDecimals);

const WRONG_TOKEN: Error = new Error("Input Token not part of this market");

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
  public ytWeightRaw?: string;
  public baseTokenWeightRaw?: string;

  public constructor(marketAddress: string, tokens: Token[]) {
    super(marketAddress, [tokens[0], tokens[1]]);
  }

  public yieldContract(): YieldContract {
    return new YieldContract("Aave2", dummyToken, 1672272000);
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
      userAddress: string,
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
            new Token(marketInfo.rewardTokenAddresses[0], await getDecimal(chainId, decimalsRecord, marketInfo.rewardTokenAddresses[0], signer.provider)),
            userInterests[i].toString()
          ),
        });
      }
      return formattedResult;
    };
    return {
      fetchInterests
    }
  };

  public methods(signer: providers.JsonRpcSigner,
    chainId?: number): Record<string, any> {

    const networkInfo: NetworkInfo = distributeConstantsByNetwork(chainId);
    const marketContract = new Contract(this.address, contracts.IPendleMarket.abi, signer.provider);
    const pendleDataContract = new Contract(networkInfo.contractAddresses.misc.PendleData, contracts.IPendleData.abi, signer.provider);

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
      return {
        tokenReserves: [ytReserveDetails, baseTokenReserveDetails],
        otherDetails: {
          dailyVolume: dummyCurrencyAmount,
          volume24hChange: "0.5",
          liquidity: dummyCurrencyAmount,
          liquidity24HChange: "0.5",
          swapFeeApr: "0.5",
          impliedYield: "0.5"
        }
      };
    };

    const swapExactInDetails = async (slippage: number, inTokenAmount: TokenAmount): Promise<SwapDetails> => {
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
      const avgRate: BN = calAvgRate(inAmount, outAmount, inTokenAmount.token.decimals);
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

    const swapExactOutDetails = async (slippage: number, outTokenAmount: TokenAmount): Promise<SwapDetails> => {
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
      const avgRate: BN = calAvgRate(inAmount, outAmount, tokenDetailsRelative.inToken.decimals);
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

    const swapExactIn = async (_: number, __: TokenAmount): Promise<providers.TransactionResponse> => {
      const USDCContract = new Contract("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", contracts.IERC20.abi);
      return (await USDCContract.connect(signer).approve('0xABB6f9F596dC2564406bAe7557d34B98bFeBB6b5', 1));
    }

    const swapExactOut = async (_: number, __: TokenAmount): Promise<providers.TransactionResponse> => {
      const USDCContract = new Contract("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", contracts.IERC20.abi);
      return (await USDCContract.connect(signer).approve('0xABB6f9F596dC2564406bAe7557d34B98bFeBB6b5', 1));
    }

    const addDualDetails = async (tokenAmount: TokenAmount): Promise<AddDualLiquidityDetails> => {
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

    const addDual = async (_: TokenAmount[], __: number | string): Promise<providers.TransactionResponse> => {
      const USDCContract = new Contract("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", contracts.IERC20.abi);
      return (await USDCContract.connect(signer).approve('0xABB6f9F596dC2564406bAe7557d34B98bFeBB6b5', 1));
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
      const avgRate: BN = calAvgRate(details.inAmountSwapped, details.outAmountSwapped, tokenAmount.token.decimals);
      const currentRateWithSwapFee: BN = calcRate(
        tokenDetailsRelative.inReserve,
        tokenDetailsRelative.inWeight,
        tokenDetailsRelative.outReserve,
        tokenDetailsRelative.outWeight,
        tokenAmount.token.decimals
      );
      const priceImpact: bigDecimal = calcPriceImpact(currentRateWithSwapFee, avgRate);
      const shareOfPool: bigDecimal = calcShareOfPool(totalSupplyLp, details.exactOutLp);
      return {
        shareOfPool: shareOfPool.getValue(),
        priceImpact: priceImpact.getValue(),
        swapFee: new TokenAmount(
          tokenAmount.token,
          details.swapFee.toString()
        )
      }
    }

    const addSingle = async (_: TokenAmount, __: number | string): Promise<providers.TransactionResponse> => {
      const USDCContract = new Contract("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", contracts.IERC20.abi);
      return (await USDCContract.connect(signer).approve('0xABB6f9F596dC2564406bAe7557d34B98bFeBB6b5', 1));
    }

    const removeDualDetails = async (_: number): Promise<RemoveDualLiquidityDetails> => {
      return {
        tokenAmounts: [
          dummyTokenAmount,
          dummyTokenAmount
        ]
      }
    }

    const removeDual = async (_: number, __: number): Promise<providers.TransactionResponse> => {
      const USDCContract = new Contract("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", contracts.IERC20.abi);
      return (await USDCContract.connect(signer).approve('0xABB6f9F596dC2564406bAe7557d34B98bFeBB6b5', 1));
    }

    const removeSingleDetails = async (_: number, __: Token, ___: number): Promise<RemoveSingleLiquidityDetails> => {
      return {
        outAmount: dummyTokenAmount,
        priceImpact: "0.001",
        swapFee: dummyTokenAmount
      }
    }

    const removeSingle = async (_: number, __: Token, ___: number): Promise<providers.TransactionResponse> => {
      const USDCContract = new Contract("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", contracts.IERC20.abi);
      return (await USDCContract.connect(signer).approve('0xABB6f9F596dC2564406bAe7557d34B98bFeBB6b5', 1));
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
    }
  }

  private getTokenDetailsRelative(token: Token, marketReserves: MarketReservesRaw, isInToken: boolean): TokenDetailsRelative {
    var inReserve: BN, inWeight: BN, outReserve: BN, outWeight: BN, inToken: Token, outToken: Token;
    const tokenAddress = token.address.toLowerCase();
    if (tokenAddress != this.tokens[0].address && tokenAddress != this.tokens[1].address) {
      throw WRONG_TOKEN;
    }
    if (xor(tokenAddress == this.tokens[0].address, isInToken)) {
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
      inReserve: inReserve,
      inWeight: inWeight,
      inToken: inToken,
      outReserve: outReserve,
      outWeight: outWeight,
      outToken: outToken
    }
  }
}
