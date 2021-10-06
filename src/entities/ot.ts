import { providers, Contract } from "ethers";
import { TokenAmount } from "./tokenAmount";
import { distributeConstantsByNetwork, indexRange } from "../helpers";
import { NetworkInfo, OTINFO } from "../networks";
import { Token } from "./token";
import { contracts } from "../contracts";
import { zeroAddress } from "../constants";

export type OtReward = {
    reward: TokenAmount
    address: string
}

export class Ot extends Token {
    public readonly yieldBearingAddress: string;

    public constructor(address: string, decimals: number, yieldBearingAddress: string, expiry?: number) {
        super(address, decimals, expiry);
        this.yieldBearingAddress = yieldBearingAddress;
    }

    public static methods(signer: providers.JsonRpcSigner, chainId?: number): Record<string, any> {
        const networkInfo: NetworkInfo = distributeConstantsByNetwork(chainId);
        const OTs: OTINFO[] = networkInfo.contractAddresses.OTs;
        const redeemProxyContract = new Contract(
            networkInfo.contractAddresses.misc.PendleRedeemProxy,
            contracts.PendleRedeemProxy.abi,
            signer.provider
        );        
        const fetchRewards = async (userAddress: string): Promise<OtReward[]> => {

            const userRewards = await redeemProxyContract.callStatic.redeemOts(
                OTs.map((OTInfo: OTINFO) => OTInfo.address),
                { from: userAddress }
            );
            const formattedResult: OtReward[] = indexRange(0, OTs.length).map((i: number) => {
                const OTInfo: OTINFO = OTs[i];
                if (OTInfo.rewardTokenAddresses === undefined) {
                    return {
                        address: OTInfo.address,
                        reward: new TokenAmount(
                            new Token(zeroAddress, 0),
                            '0'
                        )
                    };
                }
                return {
                    address: OTInfo.address,
                    reward: new TokenAmount(
                        new Token(OTInfo.rewardTokenAddresses![0], networkInfo.decimalsRecord[OTInfo.rewardTokenAddresses![0]]),
                        userRewards[i].amountRewardOne.toString()
                    )
                }
            })
            return formattedResult;
        }

        return {
            fetchRewards
        }
    }
}