import { Token, TokenAmount } from ".";
import { providers, Contract } from "ethers"
import { dummyTokenAmount } from "..";
import { contracts } from '../contracts';

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
        __?: number): Record<string, any> {
        const mintDetails = async (_: TokenAmount): Promise<TokenAmount[]> => {
            return [dummyTokenAmount, dummyTokenAmount];
        }
        const mint = async (_: TokenAmount): Promise<providers.TransactionResponse> => {
            const USDTContract = new Contract("0xdac17f958d2ee523a2206206994597c13d831ec7", contracts.IERC20.abi);
            return (await USDTContract.connect(provider).transfer(await provider.getAddress(), 1));
        }
        const redeemDetails = async (_: TokenAmount, __: string): Promise<RedeemDetails> => {
            return {
                redeemableAmount: dummyTokenAmount,
                interestAmount: dummyTokenAmount
            }
        }
        const redeem = async(_: TokenAmount): Promise<providers.TransactionResponse> => {
            const USDTContract = new Contract("0xdac17f958d2ee523a2206206994597c13d831ec7", contracts.IERC20.abi);
            return (await USDTContract.connect(provider).transfer(await provider.getAddress(), 1));
        }
        return {
            mintDetails,
            mint,
            redeemDetails,
            redeem
        }
    }
}