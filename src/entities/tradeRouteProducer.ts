import {Pair, Token as JoeToken, TokenAmount as JoeTokenAmount,Trade as JoeTrade, CAVAX, Currency as JoeCurrency, CurrencyAmount as JoeCurrencyAmount} from "@traderjoe-xyz/sdk"
import { Token, ETHToken } from "./token";
import { TokenAmount } from "./tokenAmount";
import pairsInfo from "../uniForkPairs/traderJoe.json";
import { isSameAddress } from "../helpers";
import { ETHAddress } from "../constants"
import { distributeConstantsByNetwork } from "../helpers";
export type Trade = {
    path: string[],
    input: TokenAmount,
    outPut: TokenAmount
}

const AvaxChainID = 43114;

var traderJoePairs: Pair[] = [];

function populateJoePairs() {
    for (const pInfo of pairsInfo) {
        const token0: JoeToken = new JoeToken(AvaxChainID, pInfo.token0.address, pInfo.token0.decimals);
        const token1: JoeToken = new JoeToken(AvaxChainID, pInfo.token1.address, pInfo.token1.decimals);
        const token0Amount: JoeTokenAmount = new JoeTokenAmount(token0, pInfo.token0.reserve);
        const token1Amount: JoeTokenAmount = new JoeTokenAmount(token1, pInfo.token1.reserve);
        traderJoePairs.push(new Pair(token0Amount, token1Amount, AvaxChainID));
    }
}

function wrapTokenToJoeCurrency(token: Token): JoeCurrency {
    if (isSameAddress(token.address, ETHAddress)) {
        return CAVAX;
    }
    return new JoeToken(AvaxChainID, token.address, token.decimals);
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

function unwrapJoeCurrencyAmountToTokenAmount(joeTokenAmount: JoeTokenAmount): TokenAmount {
    return new TokenAmount(unwrapJoeCurrencyToToken(joeTokenAmount.token), joeTokenAmount.toExact());
}
export function computeTradeRoute(inToken: Token, outTokenAmount: TokenAmount): Trade {
    if (isSameAddress(inToken.address, outTokenAmount.token.address)) {
        return {
            path: [inToken.address],
            input: outTokenAmount,
            outPut: outTokenAmount
        }
    }
    if (isSameAddress(inToken.address, ETHAddress) && isSameAddress(outTokenAmount.token.address, distributeConstantsByNetwork(AvaxChainID).contractAddresses.tokens.WETH)) {
        return {
            path: [outTokenAmount.token.address],
            input: new TokenAmount(
                inToken,
                outTokenAmount.rawAmount()
            ),
            outPut: outTokenAmount
        }
    }
    if (traderJoePairs.length === 0) {
        populateJoePairs();
    }
    const outTokenAmountJoe: JoeCurrencyAmount = wrapTokenAmountToJoeCurrencyAmount(outTokenAmount);
    const bestTrade: JoeTrade = JoeTrade.bestTradeExactOut(traderJoePairs, wrapTokenToJoeCurrency(inToken), outTokenAmountJoe)[0];
    return {
        path: bestTrade.route.path.map((t: JoeToken) => t.address),
        input: unwrapJoeCurrencyAmountToTokenAmount(bestTrade.inputAmount as JoeTokenAmount),
        outPut: outTokenAmount
    }
}