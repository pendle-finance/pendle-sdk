import { providers } from "ethers";
import { TokenAmount } from ".";
import { Token } from "./token";
import { RedeemProxy } from "./redeemProxy";
export class TokenDistributor {
    public static methods(signer: providers.JsonRpcSigner, chainId?: number): Record<string, any> {
        const fetchClaimableRewards = async({tokens, userAddress}:{tokens: Token[], userAddress: string}): Promise<TokenAmount[]> => {
            return RedeemProxy.methods(signer, chainId).callStatic.redeemTokenDist(tokens.map((t: Token) => t.address), userAddress);
        }
        return {
            fetchClaimableRewards
        }
    }
}