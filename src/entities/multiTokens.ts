import { BigNumber as BN } from 'ethers';
import { Token } from './token';
import { ZERO, zeroAddress } from '../constants';
import { distributeConstantsByNetwork } from '../helpers';
import { NetworkInfo } from '../networks';
import { TokenAmount } from './tokenAmount';

export type TrioTokens = {
  tokenA: string;
  tokenB: string;
  tokenC: string;
};

export type TrioUints = {
  uintA: BN;
  uintB: BN;
  uintC: BN;
};

export class TrioTokenUints {
  public tokens: TrioTokens;
  public uints: TrioUints;

  public constructor(tokens: TrioTokens, uints: TrioUints) {
    this.tokens = {
      tokenA: tokens.tokenA.toLowerCase(),
      tokenB: tokens.tokenB.toLowerCase(),
      tokenC: tokens.tokenC.toLowerCase(),
    };
    this.uints = uints;
  }

  public static fromContractTrioTokenUints(t: any): TrioTokenUints {
    return new TrioTokenUints(
      {
        tokenA: t.tokens.tokenA,
        tokenB: t.tokens.tokenB,
        tokenC: t.tokens.tokenC,
      },
      {
        uintA: t.uints.uintA,
        uintB: t.uints.uintB,
        uintC: t.uints.uintC,
      }
    );
  }

  public static fromTwo(tokenA: string, uintA: BN, tokenB: string, uintB: BN): TrioTokenUints {
    if (tokenA === undefined) tokenA = zeroAddress;
    if (tokenB === undefined) tokenB = zeroAddress;
    return new TrioTokenUints(
      {
        tokenA,
        tokenB,
        tokenC: zeroAddress,
      },
      {
        uintA,
        uintB,
        uintC: ZERO,
      }
    );
  }

  public static fromOne(tokenA: string, uintA: BN): TrioTokenUints {
    if (tokenA === undefined) tokenA = zeroAddress;
    return new TrioTokenUints(
      {
        tokenA,
        tokenB: zeroAddress,
        tokenC: zeroAddress,
      },
      {
        uintA,
        uintB: ZERO,
        uintC: ZERO,
      }
    );
  }

  public toTokenAmounts(chainId?: number): TokenAmount[] {
    const networkInfo: NetworkInfo = distributeConstantsByNetwork(chainId);
    const tokenAmounts: TokenAmount[] = [];
    if (this.tokens.tokenA != zeroAddress) {
      tokenAmounts.push(
        new TokenAmount(
          new Token(this.tokens.tokenA, networkInfo.decimalsRecord[this.tokens.tokenA]),
          this.uints.uintA.toString()
        )
      );
    }
    if (this.tokens.tokenB != zeroAddress) {
      tokenAmounts.push(
        new TokenAmount(
          new Token(this.tokens.tokenB, networkInfo.decimalsRecord[this.tokens.tokenB]),
          this.uints.uintB.toString()
        )
      );
    }
    if (this.tokens.tokenC != zeroAddress) {
      tokenAmounts.push(
        new TokenAmount(
          new Token(this.tokens.tokenC, networkInfo.decimalsRecord[this.tokens.tokenC]),
          this.uints.uintC.toString()
        )
      );
    }
    return tokenAmounts;
  }
}

export type PairUints = {
  uintA: BN;
  uintB: BN;
};

export type PairTokens = {
  tokenA: string;
  tokenB: string;
};

export class PairTokenUints {
  public tokens: PairTokens;
  public uints: PairUints;

  public constructor(tokens: PairTokens, uints: PairUints) {
    this.tokens = {
      tokenA: tokens.tokenA.toLowerCase(),
      tokenB: tokens.tokenB.toLowerCase(),
    };
    this.uints = uints;
  }

  public static fromContractPairTokenUints(p: any): PairTokenUints {
    return new PairTokenUints(
      {
        tokenA: p.tokens.tokenA,
        tokenB: p.tokens.tokenB,
      },
      {
        uintA: p.uints.uintA,
        uintB: p.uints.uintB,
      }
    );
  }

  public static EMPTY = new PairTokenUints(
    {
      tokenA: zeroAddress,
      tokenB: zeroAddress,
    },
    {
      uintA: ZERO,
      uintB: ZERO,
    }
  );

  public static fromOne(tokenA: string, uintA: BN): PairTokenUints {
    if (tokenA === undefined) tokenA = zeroAddress;
    return new PairTokenUints(
      {
        tokenA: tokenA,
        tokenB: zeroAddress,
      },
      {
        uintA: uintA,
        uintB: ZERO,
      }
    );
  }

  public toTokenAmounts(chainId?: number): TokenAmount[] {
    const networkInfo: NetworkInfo = distributeConstantsByNetwork(chainId);
    const tokenAmounts: TokenAmount[] = [];
    if (this.tokens.tokenA != zeroAddress) {
      tokenAmounts.push(
        new TokenAmount(
          new Token(this.tokens.tokenA, networkInfo.decimalsRecord[this.tokens.tokenA]),
          this.uints.uintA.toString()
        )
      );
    }
    if (this.tokens.tokenB != zeroAddress) {
      tokenAmounts.push(
        new TokenAmount(
          new Token(this.tokens.tokenB, networkInfo.decimalsRecord[this.tokens.tokenB]),
          this.uints.uintB.toString()
        )
      );
    }
    return tokenAmounts;
  }
}
