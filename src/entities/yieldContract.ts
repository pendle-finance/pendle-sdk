import { Token, TokenAmount } from ".";
import { providers, Contract, BigNumber as BN } from "ethers"
import { dummyAddress } from "..";
import { contracts } from '../contracts';
import { forgeIds } from "../constants";
import { NetworkInfo, OTINFO } from '../networks'
import { distributeConstantsByNetwork, getABIByForgeId, getGasLimit } from '../helpers'
import { rmul, rdiv } from "../math/mathLib";

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

    public methods(signer: providers.JsonRpcSigner,
        chainId?: number): Record<string, any> {
        const networkInfo: NetworkInfo = distributeConstantsByNetwork(chainId);
        if (networkInfo.contractAddresses.forges[this.forgeId] === undefined) {
            return Error(`No such forge with forgeId ${this.forgeId} in this network.`)
        }
        // const PendleRouterContract = new Contract(networkInfo.contractAddresses.misc.PendleRouter, contracts.IPendleRouter.abi, provider);
        const forgeAddress = networkInfo.contractAddresses.forges[this.forgeId];
        const PendleForgeContract = new Contract(forgeAddress, getABIByForgeId(this.forgeId).abi, signer.provider);
        const PendleDataContract = new Contract(networkInfo.contractAddresses.misc.PendleData, contracts.IPendleData.abi, signer.provider);
        const PendleRouterContract = new Contract(networkInfo.contractAddresses.misc.PendleRouter, contracts.IPendleRouter.abi, signer.provider);

        const mintDetails = async (toMint: TokenAmount): Promise<TokenAmount[]> => {
            if (this.forgeId !== forgeIds.SUSHISWAP_COMPLEX) {
                const response = await PendleForgeContract.connect(signer.provider).callStatic.mintOtAndXyt(this.underlyingAsset.address, this.expiry, BN.from(toMint.rawAmount()), dummyAddress, { from: networkInfo.contractAddresses.misc.PendleRouter });
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
                const exchangeRate: BN = await PendleForgeContract.connect(signer.provider).callStatic.getExchangeRate(this.underlyingAsset.address, { from: networkInfo.contractAddresses.misc.PendleRouter });
                const ot: string = (await PendleDataContract.callStatic.otTokens(this.forgeId, this.underlyingAsset.address, this.expiry)).toLowerCase();
                const yt: string = (await PendleDataContract.callStatic.xytTokens(this.forgeId, this.underlyingAsset.address, this.expiry)).toLowerCase();
                const amountToMint = rmul(BN.from(toMint.rawAmount()), exchangeRate);
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
        const mint = async (toMint: TokenAmount): Promise<providers.TransactionResponse> => {
            const args = [this.forgeId, this.underlyingAsset.address, this.expiry, toMint.rawAmount(), signer.getAddress()];
            const gasEstimate: BN = await PendleRouterContract.estimateGas.tokenizeYield(...args);
            return PendleRouterContract.connect(signer).tokenizeYield(...args, getGasLimit(gasEstimate));
        }
        const redeemDetails = async (amountToRedeem: TokenAmount, userAddress: string): Promise<RedeemDetails> => {
            const interestRedeemed: BN = await PendleForgeContract.connect(signer.provider).callStatic.redeemDueInterests(userAddress, this.underlyingAsset.address, this.expiry, { from: networkInfo.contractAddresses.misc.PendleRouter });
            const yTokenAddress: string = networkInfo.contractAddresses.OTs.find((OtInfo: OTINFO) => OtInfo.address == amountToRedeem.token.address)!.yieldTokenAddress;
            var amountRedeemed: BN = BN.from(0);
            switch (this.forgeId) {
                case forgeIds.AAVE: {
                    amountRedeemed = BN.from(amountToRedeem.rawAmount());
                    break;
                }

                case forgeIds.COMPOUND: {
                    const initialRate: BN = await PendleForgeContract.callStatic.initialRate(this.underlyingAsset.address);
                    const currentRate: BN = await PendleForgeContract.callStatic.getExchangeRate(this.underlyingAsset.address);
                    amountRedeemed = BN.from(amountToRedeem.rawAmount()).mul(initialRate).div(currentRate);
                    break;
                }

                case forgeIds.SUSHISWAP_SIMPLE:
                case forgeIds.SUSHISWAP_COMPLEX: {
                    const currentRate: BN = await PendleForgeContract.callStatic.getExchangeRate(this.underlyingAsset.address);
                    amountRedeemed = rdiv(BN.from(amountToRedeem.rawAmount()), (currentRate));
                    break;
                }
            }
            return {
                redeemableAmount: new TokenAmount(
                    new Token(yTokenAddress, networkInfo.decimalsRecord[yTokenAddress]),
                    amountRedeemed.toString()
                ),
                interestAmount: new TokenAmount(
                    new Token(yTokenAddress, networkInfo.decimalsRecord[yTokenAddress]),
                    (interestRedeemed).toString()
                ),
            }
        }
        const redeem = async (toRedeem: TokenAmount): Promise<providers.TransactionResponse> => {
            const args = [
                this.forgeId,
                this.underlyingAsset.address,
                this.expiry,
                toRedeem.rawAmount()
            ];
            const gasEstimate: BN = await PendleRouterContract.estimateGas.redeemUnderlying(...args);
            return PendleRouterContract.connect(signer).redeemUnderlying(...args, getGasLimit(gasEstimate))
        }
        return {
            mintDetails,
            mint,
            redeemDetails,
            redeem
        }
    }
}