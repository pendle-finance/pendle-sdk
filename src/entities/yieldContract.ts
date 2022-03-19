import { Token } from "./token";
import { TokenAmount } from "./tokenAmount";
import { providers, Contract, BigNumber as BN, utils } from "ethers"
import { forgeIdsInBytes, dummyAddress } from "../constants";
import { contracts } from '../contracts';
import { NetworkInfo, OTINFO, YTINFO } from '../networks'
import { decimalFactor, distributeConstantsByNetwork, getABIByForgeId, isSameAddress, submitTransaction, getCurrentTimestamp } from '../helpers'
import { rmul, cmul } from "../math/mathLib";
import {
    TransactionFetcher as SubgraphTransactions,
    ForgeQuery,
} from './transactionFetcher';
import { TRANSACTION } from "./transactionFetcher/types";
import { calcPrincipalForSLPYT } from "../math/marketMath";
import { ChainSpecifics } from "./types";
import { fetchAaveYield, fetchBenqiYield, fetchBTRFLYYield, fetchCompoundYield, fetchSushiForkYield, fetchWonderlandYield, fetchXJOEYield } from "../fetchers/externalYieldRateFetcher";
import { CurrencyAmount } from "./currencyAmount";
import { fetchValuation } from "../fetchers";
import axios from "axios";
export type RedeemDetails = {
    redeemableAmount: TokenAmount;
    interestAmount: TokenAmount;
};

export class YieldContract {
    public readonly forgeIdInBytes: string;
    public readonly forgeId: string;
    public readonly underlyingAsset: Token;
    public readonly expiry: number;
    public readonly chainId?: number;
    public readonly yieldToken: Token;

    public constructor(_forgeId: string, _underlyingAsset: Token, _expiry: number, _chainId?: number) {
        this.forgeIdInBytes = utils.formatBytes32String(_forgeId);
        this.underlyingAsset = _underlyingAsset;
        this.expiry = _expiry;
        this.forgeId = _forgeId;
        this.chainId = _chainId;
        const networkInfo: NetworkInfo = distributeConstantsByNetwork(this.chainId);
        const ytInfo: YTINFO = networkInfo.contractAddresses.YTs.find((yt: YTINFO) => isSameAddress(yt.underlyingAssetAddress, _underlyingAsset.address))!;
        this.yieldToken = new Token(
            ytInfo.rewardTokenAddresses[0],
            networkInfo.decimalsRecord[ytInfo.rewardTokenAddresses[0]]
        );
    }

    public useCompoundMath(): boolean {
        return this.forgeIdInBytes == forgeIdsInBytes.COMPOUND_UPGRADED ||
            this.forgeIdInBytes == forgeIdsInBytes.BENQI ||
            this.forgeIdInBytes == forgeIdsInBytes.WONDERLAND ||
            this.forgeIdInBytes == forgeIdsInBytes.REDACTED;
    }

    public methods({ signer, provider, chainId }: ChainSpecifics): Record<string, any> {
        const networkInfo: NetworkInfo = distributeConstantsByNetwork(chainId);
        if (networkInfo.contractAddresses.forges[this.forgeIdInBytes] === undefined) {
            return Error(`No such forge with forgeId ${this.forgeIdInBytes} in this network.`)
        }
        const forgeAddress = networkInfo.contractAddresses.forges[this.forgeIdInBytes];
        const pendleForgeContract = new Contract(forgeAddress, getABIByForgeId(this.forgeIdInBytes).abi, provider);
        const pendleDataContract = new Contract(networkInfo.contractAddresses.misc.PendleData, contracts.IPendleData.abi, provider);
        const pendleRouterContract = new Contract(networkInfo.contractAddresses.misc.PendleRouter, contracts.IPendleRouter.abi, provider);

        const getUnderlyingYieldRate = async (): Promise<number> => {
            const requestUrl = axios.getUri({
                url: "http://localhost:3000/underlying-yield",
                params: {
                    chainId: chainId,
                    forgeId: this.forgeId,
                    underlyingAsset: this.underlyingAsset.address,
                    expiry: this.expiry
                }
            });
            const data = await axios.get(requestUrl).then((res: any) => res.data);
            return data;
        }

        const computeUnderlyingYieldRate = async (): Promise<number> => {

            if (chainId == 42) return 0; // return 0 for kovan 
            var underlyingYieldRate: number = 0;
            try {
                switch (this.forgeIdInBytes) {
                    case forgeIdsInBytes.AAVE:
                        underlyingYieldRate = await fetchAaveYield(this.underlyingAsset.address);
                        break;

                    case forgeIdsInBytes.COMPOUND:
                        underlyingYieldRate = await fetchCompoundYield(this.yieldToken.address);
                        break;

                    case forgeIdsInBytes.BENQI:
                        underlyingYieldRate = await fetchBenqiYield(this.underlyingAsset.address);
                        break;

                    case forgeIdsInBytes.SUSHISWAP_COMPLEX:
                    case forgeIdsInBytes.SUSHISWAP_SIMPLE:
                    case forgeIdsInBytes.JOE_COMPLEX:
                    case forgeIdsInBytes.JOE_SIMPLE:
                        underlyingYieldRate = await fetchSushiForkYield(this.yieldToken.address, chainId);
                        break;

                    case forgeIdsInBytes.XJOE:
                        underlyingYieldRate = await fetchXJOEYield();
                        break;

                    case forgeIdsInBytes.WONDERLAND:
                        underlyingYieldRate = await fetchWonderlandYield(provider, chainId);
                        break;

                    case forgeIdsInBytes.REDACTED:
                        underlyingYieldRate = await fetchBTRFLYYield(provider, chainId);
                        break;
                }
            } catch (err) {
            }
            return underlyingYieldRate;
        }

        const mintDetails = async (toMint: TokenAmount): Promise<TokenAmount[]> => {
            if (this.forgeIdInBytes == forgeIdsInBytes.AAVE || this.forgeIdInBytes == forgeIdsInBytes.COMPOUND) {
                const response = await pendleForgeContract.callStatic.mintOtAndXyt(this.underlyingAsset.address, this.expiry, BN.from(toMint.rawAmount()), dummyAddress, { from: networkInfo.contractAddresses.misc.PendleRouter });
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
                const exchangeRate: BN = await pendleForgeContract.callStatic.getExchangeRate(this.underlyingAsset.address, { from: networkInfo.contractAddresses.misc.PendleRouter });
                const ot: string = (await pendleDataContract.callStatic.otTokens(this.forgeIdInBytes, this.underlyingAsset.address, this.expiry)).toLowerCase();
                const yt: string = (await pendleDataContract.callStatic.xytTokens(this.forgeIdInBytes, this.underlyingAsset.address, this.expiry)).toLowerCase();
                const amountToMint: BN = this.useCompoundMath() ? cmul(BN.from(toMint.rawAmount()), exchangeRate) : rmul(BN.from(toMint.rawAmount()), exchangeRate);
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
            const args = [this.forgeIdInBytes, this.underlyingAsset.address, this.expiry, BN.from(toMint.rawAmount()), await signer!.getAddress()];
            return submitTransaction(pendleRouterContract, signer!, 'tokenizeYield', args);
        }
        const redeemDetails = async (amountToRedeem: TokenAmount, userAddress: string): Promise<RedeemDetails> => {
            const interestRedeemed: BN = await pendleForgeContract.callStatic.redeemDueInterests(userAddress, this.underlyingAsset.address, this.expiry, { from: networkInfo.contractAddresses.misc.PendleRouter });
            const yTokenAddress: string = networkInfo.contractAddresses.OTs.find((OtInfo: OTINFO) => OtInfo.address == amountToRedeem.token.address)!.yieldTokenAddress;
            const yToken: Token = new Token(
                yTokenAddress,
                networkInfo.decimalsRecord[yTokenAddress]
            );
            const testMintAmount: BN = BN.from(10).pow(18);
            const testMintedAmount: TokenAmount[] = await mintDetails(new TokenAmount(
                yToken,
                testMintAmount.toString()
            ));
            const amountRedeemed: TokenAmount = new TokenAmount(
                yToken,
                BN.from(amountToRedeem.rawAmount()).mul(testMintAmount).div(testMintedAmount[0].rawAmount()).toString()
            )
            return {
                redeemableAmount: amountRedeemed,
                interestAmount: new TokenAmount(
                    yToken,
                    (interestRedeemed).toString()
                ),
            }
        }
        const redeem = async (toRedeem: TokenAmount): Promise<providers.TransactionResponse> => {
            const currentTime = await getCurrentTimestamp(provider);
            if (currentTime > this.expiry) {
                const args = [
                    this.forgeIdInBytes,
                    this.underlyingAsset.address,
                    this.expiry,
                ]
                return submitTransaction(pendleRouterContract, signer!, "redeemAfterExpiry", args);
            } else {
                const args = [
                    this.forgeIdInBytes,
                    this.underlyingAsset.address,
                    this.expiry,
                    toRedeem.rawAmount()
                ];
                return submitTransaction(pendleRouterContract, signer!, 'redeemUnderlying', args);
            }
        }

        const computePrincipalPerYT = async (): Promise<TokenAmount> => {
            switch (this.forgeIdInBytes) {
                case forgeIdsInBytes.AAVE:
                    return new TokenAmount(this.underlyingAsset, decimalFactor(networkInfo.decimalsRecord[this.underlyingAsset.address]));

                case forgeIdsInBytes.COMPOUND:
                    return new TokenAmount(this.underlyingAsset, (await pendleForgeContract.initialRate(this.underlyingAsset.address)).div(decimalFactor(10)).toString());

                case forgeIdsInBytes.SUSHISWAP_SIMPLE:
                case forgeIdsInBytes.SUSHISWAP_COMPLEX:
                case forgeIdsInBytes.JOE_SIMPLE:
                case forgeIdsInBytes.JOE_COMPLEX:
                    return new TokenAmount(
                        this.underlyingAsset,
                        calcPrincipalForSLPYT(
                            await pendleForgeContract.callStatic.getExchangeRate(this.underlyingAsset.address),
                            networkInfo.decimalsRecord[this.underlyingAsset.address]
                        ).toString()
                    );

                case forgeIdsInBytes.XJOE:
                case forgeIdsInBytes.BENQI:
                case forgeIdsInBytes.WONDERLAND:
                case forgeIdsInBytes.REDACTED:
                    return new TokenAmount(this.underlyingAsset, decimalFactor(networkInfo.decimalsRecord[this.underlyingAsset.address]));

                default:
                    throw Error(`Unsupported forgeId in computePrincipalPerYT ${this.forgeId}`)
            }
        }

        const getPrincipalValuationPerYT = async (): Promise<{ principal: TokenAmount, valuation: CurrencyAmount }> => {
            const requestUrl = axios.getUri({
                url: "http://localhost:3000/principal-valuation",
                params: {
                    chainId: chainId,
                    forgeId: this.forgeId,
                    underlyingAsset: this.underlyingAsset.address,
                    expiry: this.expiry
                }
            });
            const data = await axios.get(requestUrl).then((res: any) => res.data);
            data.principal = TokenAmount.deserialize(data.principal);
            return data;
        }

        const computePrincipalValuationPerYT = async (): Promise<{ principal: TokenAmount, valuation: CurrencyAmount }> => {
            const principal = await computePrincipalPerYT();
            const valuation = await fetchValuation(principal, provider, chainId);
            return { principal, valuation };
        }

        return {
            mintDetails,
            mint,
            redeemDetails,
            redeem,
            computePrincipalPerYT,
            computePrincipalValuationPerYT,
            getPrincipalValuationPerYT,
            computeUnderlyingYieldRate,
            getUnderlyingYieldRate
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
