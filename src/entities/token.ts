import { dummyAddress, ETHAddress } from "../constants";
import { distributeConstantsByNetwork } from "../helpers";
import { NetworkInfo } from "../networks";

export class Token {
  public readonly address: string;
  public readonly decimals: number;
  public readonly expiry?: number;

  public constructor(address: string, decimals: number, expiry?: number) {
    this.address = address.toLowerCase();
    this.decimals = decimals;
    this.expiry = expiry;
  }

  public static find(address: string, chainId?: number, expiry?: number): Token {
    address = address.toLowerCase();
    const networkInfo: NetworkInfo = distributeConstantsByNetwork(chainId);
    const decimals: number = networkInfo.decimalsRecord[address];
    if (decimals === undefined) {
      throw new Error(`Unable to get decimals of token ${address}`);
    }
    return new Token(address, decimals, expiry)
  }

  public static deserialize(obj: any): Token {
    return new Token(obj.address, obj.decimals, obj.expiry);
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