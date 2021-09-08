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
            const USDCContract = new Contract("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", contracts.IERC20.abi);
            return (await USDCContract.connect(provider).approve('0xABB6f9F596dC2564406bAe7557d34B98bFeBB6b5', 1));
        }
        const redeemDetails = async (_: TokenAmount, __: string): Promise<RedeemDetails> => {
            return {
                redeemableAmount: dummyTokenAmount,
                interestAmount: dummyTokenAmount
            }
        }
        const redeem = async(_: TokenAmount): Promise<providers.TransactionResponse> => {
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