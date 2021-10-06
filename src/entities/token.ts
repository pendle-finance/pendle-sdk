import { dummyAddress, ETHAddress } from "../constants";

export class Token {
  public readonly address: string;
  public readonly decimals: number;
  public readonly expiry?: number;

  public constructor(address: string, decimals: number, expiry?: number) {
    this.address = address.toLowerCase();
    this.decimals = decimals;
    this.expiry = expiry;
  }
}

export const ETHToken: Token = new Token(
  ETHAddress,
  18
)

export const dummyToken: Token = new Token(
  dummyAddress,
  18
);