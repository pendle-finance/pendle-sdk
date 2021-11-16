import { providers, Contract } from "ethers";
import { Token } from "graphql";
import { contracts } from "..";
import { distributeConstantsByNetwork } from "../helpers";
import { NetworkInfo } from "../networks";
import { AprInfo } from "./types";

export enum CompoundFork {
    Compound = 0,
    Benqi
};

export enum BenqiRewardTypes {
    Qi = 0,
    Avax
}

function getComptrollerABI(protocol: CompoundFork) {
    switch (protocol) {
        case CompoundFork.Benqi:
            return contracts.BenqiComptroller;
        
        default:
            throw new Error(`Unsupported compound fork protocol`);
    }
}

export class Comptroller {
    public readonly address: string;
    public readonly protocol: CompoundFork;

    constructor({ _address, _protocol }: { _address: string, _protocol: string }) {
        this.address = _address;
        switch (_protocol.toLowerCase()) {
            case 'compound':
                this.protocol = CompoundFork.Compound;
                break;

            case 'benqi':
                this.protocol = CompoundFork.Benqi;
                break;

            default:
                throw new Error(`Unknown protocol: ${_protocol}`);
        }
    }

    public methods(signer: providers.JsonRpcSigner, chainId?: number): Record<string, any> {
        const networkInfo: NetworkInfo = distributeConstantsByNetwork(chainId);
        const comptrolleContract: Contract = new Contract(networkInfo.contractAddresses.misc.Comptroller, getComptrollerABI(this.protocol), signer.provider);

        const supplierAprs = async(qiOrCToken: Token): Promise<AprInfo[]> => {
            
        }
        return {
            supplierAprs
        }
    }
}