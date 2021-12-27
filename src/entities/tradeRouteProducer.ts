import {Pair, Token as JoeToken, TokenAmount as JoeTokenAmount,Trade as JoeTrade, CAVAX, Currency as JoeCurrency, CurrencyAmount as JoeCurrencyAmount} from "@traderjoe-xyz/sdk"
import { Token, ETHToken } from "./token";
import { TokenAmount } from "./tokenAmount";
import { isSameAddress, isNativeOrEquivalent } from "../helpers";
import { ETHAddress } from "../constants"
import { distributeConstantsByNetwork } from "../helpers";
import { PoolDetail } from "../uniForkPairs";
import axios from "axios";
import { utils } from "ethers";
export type Trade = {
    path: string[],
    input: TokenAmount,
    output: TokenAmount
}

const AvaxChainID = 43114;

export async function populateJoePairs(): Promise<PoolDetail[]> {
    var traderJoePairs = await axios.get('https://api.pendle.finance/pool/detail/avalanche').then((res: any) => res.data);
    return traderJoePairs;
}

function wrapTokenToJoeCurrency(token: Token): JoeCurrency {
    if (isSameAddress(token.address, ETHAddress)) {
        return CAVAX;
    }
    return new JoeToken(AvaxChainID, utils.getAddress(token.address), token.decimals);
}

function wrapTokenAmountToJoeCurrencyAmount(tokenAmount: TokenAmount): JoeCurrencyAmount {
    if (isSameAddress(tokenAmount.token.address, ETHAddress)) {
        return JoeCurrencyAmount.ether(tokenAmount.rawAmount());
    }
    return new JoeTokenAmount(wrapTokenToJoeCurrency(tokenAmount.token) as JoeToken, tokenAmount.rawAmount());
}

function unwrapJoeCurrencyToToken(joeToken: JoeCurrency): Token {
    if (joeToken === CAVAX) {
        return ETHToken
    }
    return new Token((joeToken as JoeToken).address, joeToken.decimals);
}

function unwrapJoeCurrencyAmountToTokenAmount(joeTokenAmount: JoeCurrencyAmount): TokenAmount {
    return new TokenAmount(unwrapJoeCurrencyToToken(joeTokenAmount.currency), joeTokenAmount.toExact(), false);
}
export async function computeTradeRouteExactOut(inToken: Token, outTokenAmount: TokenAmount): Promise<Trade> {
    if (isSameAddress(inToken.address, outTokenAmount.token.address)) {
        return {
            path: [inToken.address],
            input: outTokenAmount,
            output: outTokenAmount
        }
    }
    if (isNativeOrEquivalent(inToken.address, AvaxChainID) && isNativeOrEquivalent(outTokenAmount.token.address,AvaxChainID)) {
        return {
            path: [inToken.address],
            input: new TokenAmount(
                inToken,
                outTokenAmount.rawAmount()
            ),
            output: outTokenAmount
        }
    }
    var traderJoePairs = await populateJoePairs();
    const pairFormatter = (p: PoolDetail): Pair => {
        const tokenAmount0: JoeTokenAmount = new JoeTokenAmount(new JoeToken(AvaxChainID, p.token0.address, p.token0.decimals), p.token0.reserve);
        const tokenAmount1: JoeTokenAmount = new JoeTokenAmount(new JoeToken(AvaxChainID, p.token1.address, p.token1.decimals), p.token1.reserve);
        return new Pair(tokenAmount0, tokenAmount1, AvaxChainID);
    }
    const outTokenAmountJoe: JoeCurrencyAmount = wrapTokenAmountToJoeCurrencyAmount(outTokenAmount);
    const bestTrade: JoeTrade = JoeTrade.bestTradeExactOut(traderJoePairs.map(pairFormatter), wrapTokenToJoeCurrency(inToken), outTokenAmountJoe)[0];
    const path: string[] = bestTrade.route.path.map((t: JoeToken) => t.address);
    path[0] = inToken.address; path[path.length - 1] = outTokenAmount.token.address;
    return {
        path,
        input: unwrapJoeCurrencyAmountToTokenAmount(bestTrade.inputAmount as JoeCurrencyAmount),
        output: outTokenAmount
    }
}

export async function computeTradeRouteExactIn(inTokenAmount: TokenAmount, outToken: Token): Promise<Trade> {
    if (isSameAddress(inTokenAmount.token.address, outToken.address)) {
        return {
            path: [inTokenAmount.token.address],
            input: inTokenAmount,
            output: inTokenAmount
        }
    }
    if (isNativeOrEquivalent(inTokenAmount.token.address, AvaxChainID) && isNativeOrEquivalent(outToken.address, AvaxChainID)) {
        return {
            path: [inTokenAmount.token.address],
            input: inTokenAmount,
            output: new TokenAmount(
                outToken,
                inTokenAmount.rawAmount()
            )
        }
    }
    var traderJoePairs = await populateJoePairs();
    const pairFormatter = (p: PoolDetail): Pair => {
        const tokenAmount0: JoeTokenAmount = new JoeTokenAmount(new JoeToken(AvaxChainID, p.token0.address, p.token0.decimals), p.token0.reserve);
        const tokenAmount1: JoeTokenAmount = new JoeTokenAmount(new JoeToken(AvaxChainID, p.token1.address, p.token1.decimals), p.token1.reserve);
        return new Pair(tokenAmount0, tokenAmount1, AvaxChainID);
    }
    const inTokenAmountJoe: JoeCurrencyAmount = wrapTokenAmountToJoeCurrencyAmount(inTokenAmount);
    const bestTrade: JoeTrade = JoeTrade.bestTradeExactIn(traderJoePairs.map(pairFormatter), inTokenAmountJoe, wrapTokenToJoeCurrency(outToken))[0];
    const path: string[] = bestTrade.route.path.map((t: JoeToken) => t.address);
    path[0] = inTokenAmount.token.address; path[path.length - 1] = outToken.address;
    return {
        path,
        input: inTokenAmount,
        output: unwrapJoeCurrencyAmountToTokenAmount(bestTrade.outputAmount as JoeCurrencyAmount),
    }
}