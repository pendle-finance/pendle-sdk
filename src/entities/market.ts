import { Token } from './token'

export class Market {
  public readonly address: string
  public readonly yt?: Token
  public readonly baseToken?: Token

  public constructor(marketAddress: string, yt?: Token, baseToken?: Token) {
    this.address = marketAddress
    this.yt = yt
    this.baseToken = baseToken
  }
}
