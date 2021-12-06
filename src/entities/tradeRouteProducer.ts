import {Pair, Token as JoeToken, TokenAmount as JoeTokenAmount,Trade as JoeTrade} from "@traderjoe-xyz/sdk"
import { Token } from "./token";
import { TokenAmount } from "./tokenAmount";
import pairsInfo from "../uniForkPairs/traderJoe.json";
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

function wrapTokenToJoeToken(token: Token): JoeToken {
    return new JoeToken(AvaxChainID, token.address, token.decimals);
}

function wrapTokenAmountToJoeTokenAmount(tokenAmount: TokenAmount): JoeTokenAmount {
    return new JoeTokenAmount(wrapTokenToJoeToken(tokenAmount.token), tokenAmount.rawAmount());
}

function unwrapJoeTokenToToken(joeToken: JoeToken): Token {
    return new Token(joeToken.address, joeToken.decimals);
}

function unwrapJoeTokenAmountToTokenAmount(joeTokenAmount: JoeTokenAmount): TokenAmount {
    return new TokenAmount(unwrapJoeTokenToToken(joeTokenAmount.token), joeTokenAmount.toExact());
}
export function computeTradeRoute(inTokenAmount: TokenAmount, outToken : Token): Trade {
    if (traderJoePairs.length === 0) {
        populateJoePairs();
    }
    const inTokenAmountJoe: JoeTokenAmount = wrapTokenAmountToJoeTokenAmount(inTokenAmount);
    const bestTrade: JoeTrade = JoeTrade.bestTradeExactIn(traderJoePairs, inTokenAmountJoe, wrapTokenToJoeToken(outToken))[0];
    return {
        path: bestTrade.route.path.map((t: JoeToken) => t.address),
        input: inTokenAmount,
        outPut: unwrapJoeTokenAmountToTokenAmount(bestTrade.outputAmount as JoeTokenAmount)
    }
}