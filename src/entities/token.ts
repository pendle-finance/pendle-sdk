export class Token {
  public readonly address: string
  public readonly decimals: number

  public constructor(address: string, decimals: number) {
    this.address = address.toLowerCase()
    this.decimals = decimals
  }
}
