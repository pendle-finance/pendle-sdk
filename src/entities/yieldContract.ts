import { Token } from "./token";
import { TokenAmount } from "./tokenAmount";
import { providers, Contract, BigNumber as BN, utils } from "ethers"
import { forgeIdsInBytes, dummyAddress } from "../constants";
import { contracts } from '../contracts';
import { NetworkInfo, OTINFO } from '../networks'
import { distributeConstantsByNetwork, getABIByForgeId, getGasLimit } from '../helpers'
import { rmul, rdiv, cmul } from "../math/mathLib";
import {
    TransactionFetcher as SubgraphTransactions,
    ForgeQuery,
} from './transactions';
import { TRANSACTION } from "./transactions/types";
export type RedeemDetails = {
    redeemableAmount: TokenAmount;
    interestAmount: TokenAmount;
};

export class YieldContract {
    public readonly forgeIdInBytes: string;
    public readonly forgeId: string;
    public readonly underlyingAsset: Token;
    public readonly expiry: number;

    public constructor(_forgeId: string, _underlyingAsset: Token, _expiry: number) {
        this.forgeIdInBytes = utils.formatBytes32String(_forgeId);
        this.underlyingAsset = _underlyingAsset;
        this.expiry = _expiry;
        this.forgeId = _forgeId
    }

    public methods(
        signer: providers.JsonRpcSigner,
        chainId?: number
    ): Record<string, any> {
        const networkInfo: NetworkInfo = distributeConstantsByNetwork(chainId);
        if (networkInfo.contractAddresses.forges[this.forgeIdInBytes] === undefined) {
            return Error(`No such forge with forgeId ${this.forgeIdInBytes} in this network.`)
        }
        // const PendleRouterContract = new Contract(networkInfo.contractAddresses.misc.PendleRouter, contracts.IPendleRouter.abi, provider);
        const forgeAddress = networkInfo.contractAddresses.forges[this.forgeIdInBytes];
        const pendleForgeContract = new Contract(forgeAddress, getABIByForgeId(this.forgeIdInBytes).abi, signer.provider);
        const pendleDataContract = new Contract(networkInfo.contractAddresses.misc.PendleData, contracts.IPendleData.abi, signer.provider);
        const pendleRouterContract = new Contract(networkInfo.contractAddresses.misc.PendleRouter, contracts.IPendleRouter.abi, signer.provider);

        const useCompoundMath = (): boolean => {
            return this.forgeIdInBytes == forgeIdsInBytes.COMPOUND_UPGRADED || this.forgeIdInBytes == forgeIdsInBytes.BENQI;
        }

        const mintDetails = async (toMint: TokenAmount): Promise<TokenAmount[]> => {
            if (this.forgeIdInBytes == forgeIdsInBytes.AAVE && this.forgeIdInBytes == forgeIdsInBytes.COMPOUND) {
                const response = await pendleForgeContract.connect(signer.provider).callStatic.mintOtAndXyt(this.underlyingAsset.address, this.expiry, BN.from(toMint.rawAmount()), dummyAddress, { from: networkInfo.contractAddresses.misc.PendleRouter });
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
                const exchangeRate: BN = await pendleForgeContract.connect(signer.provider).callStatic.getExchangeRate(this.underlyingAsset.address, { from: networkInfo.contractAddresses.misc.PendleRouter });
                const ot: string = (await pendleDataContract.callStatic.otTokens(this.forgeIdInBytes, this.underlyingAsset.address, this.expiry)).toLowerCase();
                const yt: string = (await pendleDataContract.callStatic.xytTokens(this.forgeIdInBytes, this.underlyingAsset.address, this.expiry)).toLowerCase();
                const amountToMint: BN = useCompoundMath() ? cmul(BN.from(toMint.rawAmount()), exchangeRate) : rmul(BN.from(toMint.rawAmount()), exchangeRate);
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
            const args = [this.forgeIdInBytes, this.underlyingAsset.address, this.expiry, BN.from(toMint.rawAmount()), await signer.getAddress()];
            const gasEstimate: BN = await pendleRouterContract.connect(signer).estimateGas.tokenizeYield(...args);
            return pendleRouterContract.connect(signer).tokenizeYield(...args, getGasLimit(gasEstimate));
        }
        const redeemDetails = async (amountToRedeem: TokenAmount, userAddress: string): Promise<RedeemDetails> => {
            const interestRedeemed: BN = await pendleForgeContract.connect(signer.provider).callStatic.redeemDueInterests(userAddress, this.underlyingAsset.address, this.expiry, { from: networkInfo.contractAddresses.misc.PendleRouter });
            const yTokenAddress: string = networkInfo.contractAddresses.OTs.find((OtInfo: OTINFO) => OtInfo.address == amountToRedeem.token.address)!.yieldTokenAddress;
            var amountRedeemed: BN = BN.from(0);
            switch (this.forgeIdInBytes) {
                case forgeIdsInBytes.AAVE: {
                    amountRedeemed = BN.from(amountToRedeem.rawAmount());
                    break;
                }

                case forgeIdsInBytes.COMPOUND: {
                    const initialRate: BN = await pendleForgeContract.callStatic.initialRate(this.underlyingAsset.address);
                    const currentRate: BN = await pendleForgeContract.callStatic.getExchangeRate(this.underlyingAsset.address);
                    amountRedeemed = BN.from(amountToRedeem.rawAmount()).mul(initialRate).div(currentRate);
                    break;
                }

                case forgeIdsInBytes.SUSHISWAP_SIMPLE:
                case forgeIdsInBytes.SUSHISWAP_COMPLEX: {
                    const currentRate: BN = await pendleForgeContract.callStatic.getExchangeRate(this.underlyingAsset.address);
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
                this.forgeIdInBytes,
                this.underlyingAsset.address,
                this.expiry,
                toRedeem.rawAmount()
            ];
            const gasEstimate: BN = await pendleRouterContract.connect(signer).estimateGas.redeemUnderlying(...args);
            return pendleRouterContract.connect(signer).redeemUnderlying(...args, getGasLimit(gasEstimate))
        }

        return {
            mintDetails,
            mint,
            redeemDetails,
            redeem,
        };
    }

    public static methods(
        _: providers.JsonRpcSigner,
        chainId?: number
    ): Record<string, any> {
        const getMintTransactions = (query: ForgeQuery): Promise<TRANSACTION[]> => {
            return new SubgraphTransactions(chainId).getMintTransactions(query);
        };

        const getRedeemTransactions = (query: ForgeQuery): Promise<TRANSACTION[]> => {
            return new SubgraphTransactions(chainId).getRedeemTransactions(query);
        };

        return {
            getMintTransactions,
            getRedeemTransactions
        }
    }
}
