import { BigNumber as BN } from "ethers"
import { Token } from "./token";
import { zeroAddress, ZERO } from "../constants";
import { distributeConstantsByNetwork } from "../helpers";
import { NetworkInfo } from "../networks";
import { TokenAmount } from "./tokenAmount";

export type TrioTokens = {
    tokenA: string;
    tokenB: string;
    tokenC: string;
}

export type TrioUints = {
    uintA: BN;
    uintB: BN;
    uintC: BN;
}

export class TrioTokenUints {
    public tokens: TrioTokens;
    public uints: TrioUints;

    public constructor(tokens: TrioTokens, uints: TrioUints) {
        this.tokens = tokens;
        this.uints = uints;
    }

    public static fromTwo(tokenA: string, uintA: BN, tokenB: string, uintB: BN): TrioTokenUints {
        if (tokenA === undefined) tokenA = zeroAddress;
        if (tokenB === undefined) tokenB = zeroAddress;
        return new TrioTokenUints(
            {
                tokenA,
                tokenB,
                tokenC: zeroAddress
            },
            {
                uintA,
                uintB,
                uintC: ZERO
            }
        )
    }

    public static fromOne(tokenA: string, uintA: BN): TrioTokenUints {
        if (tokenA === undefined) tokenA = zeroAddress;
        return new TrioTokenUints(
            {
                tokenA,
                tokenB: zeroAddress,
                tokenC: zeroAddress
            },
            {
                uintA,
                uintB: ZERO,
                uintC: ZERO
            }
        )
    }

    public toTokenAmounts(chainId?: number): TokenAmount[] {
        const networkInfo: NetworkInfo = distributeConstantsByNetwork(chainId);
        const tokenAmounts: TokenAmount[] = []
        if (this.tokens.tokenA != zeroAddress) {
            tokenAmounts.push(new TokenAmount(
                new Token(
                    this.tokens.tokenA,
                    networkInfo.decimalsRecord[this.tokens.tokenA]
                ),
                this.uints.uintA.toString()
            ))
        }
        if (this.tokens.tokenB != zeroAddress) {
            tokenAmounts.push(new TokenAmount(
                new Token(
                    this.tokens.tokenB,
                    networkInfo.decimalsRecord[this.tokens.tokenB]
                ),
                this.uints.uintB.toString()
            ))
        }
        if (this.tokens.tokenC != zeroAddress) {
            tokenAmounts.push(new TokenAmount(
                new Token(
                    this.tokens.tokenC,
                    networkInfo.decimalsRecord[this.tokens.tokenC]
                ),
                this.uints.uintC.toString()
            ))
        }
        return tokenAmounts;
    }
}

export type PairUints = {
    uintA: BN;
    uintB: BN;
}

export type PairTokens = {
    tokenA: string;
    tokenB: string;
}

export class PairTokenUints {
    public tokens: PairTokens;
    public uints: PairUints;

    public constructor(tokens: PairTokens, uints: PairUints) {
        this.tokens = tokens;
        this.uints = uints;
    }

    public static EMPTY = PairTokenUints.fromOne(zeroAddress, ZERO);

    public static fromOne(tokenA: string, uintA: BN): PairTokenUints {
        if (tokenA === undefined) tokenA = zeroAddress;
        return new PairTokenUints(
            {
                tokenA: tokenA,
                tokenB: zeroAddress
            },
            {
                uintA: uintA,
                uintB: ZERO
            }
        )
    }

    public toTokenAmounts(chainId?: number): TokenAmount[] {
        const networkInfo: NetworkInfo = distributeConstantsByNetwork(chainId);
        const tokenAmounts: TokenAmount[] = []
        if (this.tokens.tokenA != zeroAddress) {
            tokenAmounts.push(new TokenAmount(
                new Token(
                    this.tokens.tokenA,
                    networkInfo.decimalsRecord[this.tokens.tokenA]
                ),
                this.uints.uintA.toString()
            ))
        }
        if (this.tokens.tokenB != zeroAddress) {
            tokenAmounts.push(new TokenAmount(
                new Token(
                    this.tokens.tokenB,
                    networkInfo.decimalsRecord[this.tokens.tokenB]
                ),
                this.uints.uintB.toString()
            ))
        }
        return tokenAmounts;
    }
}