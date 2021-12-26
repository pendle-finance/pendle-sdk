import {Pair, Token as JoeToken, TokenAmount as JoeTokenAmount,Trade as JoeTrade, CAVAX, Currency as JoeCurrency, CurrencyAmount as JoeCurrencyAmount} from "@traderjoe-xyz/sdk"
import { Token, ETHToken } from "./token";
import { TokenAmount } from "./tokenAmount";
import { isSameAddress } from "../helpers";
import { ETHAddress } from "../constants"
import { distributeConstantsByNetwork } from "../helpers";
import { PoolDetail } from "../uniForkPairs";
import axios from "axios";
export type Trade = {
    path: string[],
    input: TokenAmount,
    outPut: TokenAmount
}

const AvaxChainID = 43114;

export async function populateJoePairs(): Promise<PoolDetail[]> {
    var traderJoePairs = await axios.get('https://api.pendle.finance/pool/detail/avalanche').then((res: any) => res.data);
    console.log(traderJoePairs);
    return [];
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
export async function computeTradeRoute(inToken: Token, outTokenAmount: TokenAmount): Promise<Trade> {
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
    var traderJoePairs = await populateJoePairs();
    const pairFormatter = (p: PoolDetail): Pair => {
        const tokenAmount0: JoeTokenAmount = new JoeTokenAmount(new JoeToken(AvaxChainID, p.token0.address, p.token0.decimals), p.token0.reserve);
        const tokenAmount1: JoeTokenAmount = new JoeTokenAmount(new JoeToken(AvaxChainID, p.token1.address, p.token1.decimals), p.token1.reserve);
        return new Pair(tokenAmount0, tokenAmount1, AvaxChainID);
    }
    const outTokenAmountJoe: JoeCurrencyAmount = wrapTokenAmountToJoeCurrencyAmount(outTokenAmount);
    const bestTrade: JoeTrade = JoeTrade.bestTradeExactOut(traderJoePairs.map(pairFormatter), wrapTokenToJoeCurrency(inToken), outTokenAmountJoe)[0];
    return {
        path: bestTrade.route.path.map((t: JoeToken) => t.address),
        input: unwrapJoeCurrencyAmountToTokenAmount(bestTrade.inputAmount as JoeTokenAmount),
        outPut: outTokenAmount
    }
}