import { providers } from "ethers";
import { TokenAmount } from ".";
import { distributeConstantsByNetwork } from "../helpers";
import { NetworkInfo, OTINFO } from "../networks";
import { Token } from "./token";

export type OtReward = {
    rewards: TokenAmount;
    address: string;
}

export class Ot extends Token {
    public readonly yieldBearingAddress: string;

    public constructor(address: string, decimals: number, yieldBearingAddress: string, expiry?: number) {
        super(address, decimals, expiry);
        this.yieldBearingAddress = yieldBearingAddress;
    }

    public static methods(signer: providers.JsonRpcSigner, chainId?: number): Record<string, any> {
        
        const fetchRewards = async (userAddress: string): Promise<OtReward[]> => {
            const networkInfo: NetworkInfo = distributeConstantsByNetwork(chainId);
            const ots: OTINFO[] = networkInfo.contractAddresses.OTs;
            
        }

        return {}
    }
}