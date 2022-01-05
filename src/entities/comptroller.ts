import { Contract, BigNumber as BN } from "ethers";
import { Token } from "./token";
import { contracts } from "../contracts";
import { fetchValuation } from "../fetchers";
import { ETHAddress, ONE_DAY } from "../constants";
import { distributeConstantsByNetwork } from "../helpers";
import { AprInfo, ChainSpecifics } from "./types";
import { TokenAmount } from "./tokenAmount";
import { CurrencyAmount } from "./currencyAmount";
import { calcLMRewardApr, DecimalsPrecision } from "../math/marketMath";
import BigNumber from "bignumber.js";

export enum CompoundFork {
    Compound = 0,
    Benqi
};

export enum BenqiRewardTypes {
    Qi = 0,
    Avax
}

const unsupportedProtocol: string = `Unsupported compound fork protocol`;

function getComptrollerABI(protocol: CompoundFork) {
    switch (protocol) {
        case CompoundFork.Benqi:
            return contracts.BenqiComptroller;
        
        default:
            throw new Error(unsupportedProtocol);
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

    public methods({signer, provider, chainId}: ChainSpecifics): Record<string, any> {
        const networkInfo = distributeConstantsByNetwork(chainId);
        const comptrollerContract: Contract = new Contract(networkInfo.contractAddresses.misc.Comptroller, getComptrollerABI(this.protocol).abi, provider);

        const getSupplierAprs = async(qiOrCToken: Token): Promise<AprInfo[]> => {
            switch (this.protocol) {
                case CompoundFork.Benqi: {
                    const qiTokenContract: Contract = new Contract(qiOrCToken.address, contracts.IQiToken.abi, provider);
                    var supplySpeedForQi: BN, supplySpeedForAvax: BN, totalSupply: BN;
                    var promises = [];
                    promises.push(comptrollerContract.rewardSpeeds(BenqiRewardTypes.Qi, qiOrCToken.address).then((res: BN) => supplySpeedForQi = res));
                    promises.push(comptrollerContract.rewardSpeeds(BenqiRewardTypes.Avax, qiOrCToken.address).then((res: BN) => supplySpeedForAvax = res));
                    promises.push(qiTokenContract.totalSupply().then((res: BN) => totalSupply = res));
                    await Promise.all(promises);

                    promises = [];
                    const QiRewardPerDay: TokenAmount = new TokenAmount(
                        Token.find(networkInfo.contractAddresses.tokens.QI, chainId),
                        supplySpeedForQi!.mul(ONE_DAY).toString()
                    )
                    var QiRewardPerDayValuation: CurrencyAmount;
                    promises.push(fetchValuation(QiRewardPerDay, provider, chainId).then((res: CurrencyAmount) => QiRewardPerDayValuation = res));
                    const AvaxRewardPerDay: TokenAmount = new TokenAmount(
                        Token.find(ETHAddress, chainId),
                        supplySpeedForAvax!.mul(ONE_DAY).toString()
                    )
                    var AvaxRewardPerDayValuation: CurrencyAmount;
                    promises.push(fetchValuation(AvaxRewardPerDay, provider, chainId).then((res: CurrencyAmount) => AvaxRewardPerDayValuation = res));
                    const totalQiTokenSupply: TokenAmount = new TokenAmount(
                        Token.find(qiOrCToken.address, chainId),
                        totalSupply!.toString()
                    )
                    var totalDepositValuation: CurrencyAmount;
                    promises.push(fetchValuation(totalQiTokenSupply, provider, chainId).then((res: CurrencyAmount) => totalDepositValuation = res));
                    await Promise.all(promises);
                    
                    const aprs: AprInfo[] = [];
                    aprs.push({
                        origin: "Benqi - Qi reward",
                        apr: calcLMRewardApr(new BigNumber(QiRewardPerDayValuation!.amount), new BigNumber(totalDepositValuation!.amount), 365).toFixed(DecimalsPrecision)
                    })
                    aprs.push({
                        origin: "Benqi - Avax reward",
                        apr: calcLMRewardApr(new BigNumber(AvaxRewardPerDayValuation!.amount), new BigNumber(totalDepositValuation!.amount), 365).toFixed(DecimalsPrecision)
                    })                    
                    return aprs
                }

                default:
                    throw new Error(unsupportedProtocol);
            }
        }
        return {
            getSupplierAprs
        }
    }
}