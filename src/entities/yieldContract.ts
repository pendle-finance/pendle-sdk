import { Token, TokenAmount } from ".";
import { providers, Contract, BigNumber as BN, utils } from "ethers"
import { dummyAddress } from "..";
import { contracts } from '../contracts';
import { NetworkInfo, OTINFO } from '../networks'
import { distributeConstantsByNetwork } from '../helpers'

const RONE = BN.from(2).pow(40);

function rmul(x: BN, y: BN): BN {
    return (RONE.div(2)).add(x.mul(y)).div(RONE);
}

export type RedeemDetails = {
    redeemableAmount: TokenAmount
    interestAmount: TokenAmount
}

export class YieldContract {
    public readonly forgeId: string;
    public readonly underlyingAsset: Token;
    public readonly expiry: number;

    public constructor(_forgeId: string, _underlyingAsset: Token, _expiry: number) {
        this.forgeId = _forgeId;
        this.underlyingAsset = _underlyingAsset;
        this.expiry = _expiry;
    }

    public methods(provider: providers.JsonRpcSigner,
        chainId?: number): Record<string, any> {
        const networkInfo: NetworkInfo = distributeConstantsByNetwork(chainId);
        if (networkInfo.contractAddresses.forges[this.forgeId] === undefined) {
            return Error(`No such forge with forgeId ${this.forgeId} in this network.`)
        }
        // const PendleRouterContract = new Contract(networkInfo.contractAddresses.misc.PendleRouter, contracts.IPendleRouter.abi, provider);
        const forgeAddress = networkInfo.contractAddresses.forges[this.forgeId];
        const PendleForgeContract = new Contract(forgeAddress, this.forgeId == "SushiswapComplex" ? contracts.PendleSushiswapComplexForge.abi : contracts.IPendleForge.abi, provider.provider);
        const PendleDataContract = new Contract(networkInfo.contractAddresses.misc.PendleData, contracts.IPendleData.abi, provider.provider);

        const mintDetails = async (amountToTokenize: TokenAmount): Promise<TokenAmount[]> => {
            if (this.forgeId !== "SushiswapComplex") {
                const response = await PendleForgeContract.connect(provider.provider).callStatic.mintOtAndXyt(this.underlyingAsset.address, this.expiry, BN.from(amountToTokenize.rawAmount()), dummyAddress, { from: networkInfo.contractAddresses.misc.PendleRouter });
                return [
                    new TokenAmount(
                        new Token(
                            response.ot,
                            networkInfo.decimalsRecord[response.xyt.toLowerCase()],
                            this.expiry
                        ),
                        response.amountTokenMinted.toString()
                    ),
                    new TokenAmount(
                        new Token(
                            response.xyt,
                            networkInfo.decimalsRecord[response.xyt.toLowerCase()],
                            this.expiry
                        ),
                        response.amountTokenMinted.toString()
                    ),
                ]
            } else {
                console.log("before exchangeRate");
                const exchangeRate: BN = await PendleForgeContract.connect(provider.provider).callStatic.getExchangeRate(this.underlyingAsset.address, { from: networkInfo.contractAddresses.misc.PendleRouter });
                console.log(exchangeRate);
                const ot: string = (await PendleDataContract.callStatic.otTokens(utils.formatBytes32String(this.forgeId), this.underlyingAsset.address, this.expiry)).toLowerCase();
                const yt: string = (await PendleDataContract.callStatic.xytTokens(utils.formatBytes32String(this.forgeId), this.underlyingAsset.address, this.expiry)).toLowerCase();
                const amountToMint = rmul(BN.from(amountToTokenize.rawAmount()), exchangeRate);
                return [
                    new TokenAmount(
                        new Token(
                            ot,
                            networkInfo.decimalsRecord[yt],
                            this.expiry
                        ),
                        amountToMint.toString()
                    ),
                    new TokenAmount(
                        new Token(
                            yt,
                            networkInfo.decimalsRecord[yt],
                            this.expiry
                        ),
                        amountToMint.toString()
                    ),
                ]
            }
        }
        const mint = async (_: TokenAmount): Promise<providers.TransactionResponse> => {
            const USDCContract = new Contract("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", contracts.IERC20.abi);
            return (await USDCContract.connect(provider).approve('0xABB6f9F596dC2564406bAe7557d34B98bFeBB6b5', 1));
        }
        const redeemDetails = async (amountToRedeem: TokenAmount, userAddress: string): Promise<RedeemDetails> => {
            const amountRedeemed: BN = await PendleForgeContract.connect(provider.provider).callStatic.redeemUnderlying(userAddress, this.underlyingAsset.address, this.expiry, BN.from(amountToRedeem.rawAmount()), { from: networkInfo.contractAddresses.misc.PendleRouter });
            const interestRedeemed: BN = await PendleForgeContract.connect(provider.provider).callStatic.redeemDueInterests(userAddress, this.underlyingAsset.address, this.expiry, { from: networkInfo.contractAddresses.misc.PendleRouter });
            const yTokenAddress: string = networkInfo.contractAddresses.OTs.find((OtInfo: OTINFO) => OtInfo.address == amountToRedeem.token.address)!.address
            return {
                redeemableAmount: new TokenAmount(
                    new Token(yTokenAddress, networkInfo.decimalsRecord[yTokenAddress]),
                    amountRedeemed.sub(interestRedeemed).toString()
                ),
                interestAmount: new TokenAmount(
                    new Token(yTokenAddress, networkInfo.decimalsRecord[yTokenAddress]),
                    (interestRedeemed).toString()
                ),
            }
        }
        const redeem = async (_: TokenAmount): Promise<providers.TransactionResponse> => {
            const USDCContract = new Contract("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", contracts.IERC20.abi);
            return (await USDCContract.connect(provider).approve('0xABB6f9F596dC2564406bAe7557d34B98bFeBB6b5', 1));
        }
        return {
            mintDetails,
            mint,
            redeemDetails,
            redeem
        }
    }
}