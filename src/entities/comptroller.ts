import { BigNumber as BN, Contract, providers } from 'ethers';
import { Token } from './token';
import { contracts, ETHAddress, fetchValuation, ONE_DAY } from '..';
import { distributeConstantsByNetwork } from '../helpers';
import { AprInfo } from './types';
import { TokenAmount } from '.';
import { CurrencyAmount } from './currencyAmount';
import { calcLMRewardApr, DecimalsPrecision } from '../math/marketMath';
import BigNumber from 'bignumber.js';

export enum CompoundFork {
  Compound = 0,
  Benqi,
}

export enum BenqiRewardTypes {
  Qi = 0,
  Avax,
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

  constructor({
    _address,
    _protocol,
  }: {
    _address: string;
    _protocol: string;
  }) {
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

  public methods(
    signer: providers.JsonRpcSigner,
    chainId?: number
  ): Record<string, any> {
    const networkInfo = distributeConstantsByNetwork(chainId);
    const comptrolleContract: Contract = new Contract(
      networkInfo.contractAddresses.misc.Comptroller,
      getComptrollerABI(this.protocol),
      signer.provider
    );

    const getSupplierAprs = async (qiOrCToken: Token): Promise<AprInfo[]> => {
      switch (this.protocol) {
        case CompoundFork.Benqi: {
          const qiTokenContract: Contract = new Contract(
            qiOrCToken.address,
            contracts.IQiToken.abi,
            signer.provider
          );
          var supplySpeedForQi: BN, supplySpeedForAvax: BN, totalSupply: BN;
          var promises = [];
          promises.push(
            comptrolleContract
              .rewardSpeeds(BenqiRewardTypes.Qi, qiOrCToken.address)
              .then((res: BN) => (supplySpeedForQi = res))
          );
          promises.push(
            comptrolleContract
              .rewardSpeeds(BenqiRewardTypes.Avax, qiOrCToken.address)
              .then((res: BN) => (supplySpeedForAvax = res))
          );
          promises.push(
            qiTokenContract.totalSupply().then((res: BN) => (totalSupply = res))
          );
          await Promise.all(promises);

          promises = [];
          const QiRewardPerDay: TokenAmount = new TokenAmount(
            Token.find(networkInfo.contractAddresses.tokens.Qi, chainId),
            supplySpeedForQi!.mul(ONE_DAY).toString()
          );
          var QiRewardPerDayValuation: CurrencyAmount;
          promises.push(
            fetchValuation(QiRewardPerDay, signer, chainId).then(
              (res: CurrencyAmount) => (QiRewardPerDayValuation = res)
            )
          );
          const AvaxRewardPerDay: TokenAmount = new TokenAmount(
            Token.find(ETHAddress, chainId),
            supplySpeedForAvax!.mul(ONE_DAY).toString()
          );
          var AvaxRewardPerDayValuation: CurrencyAmount;
          promises.push(
            fetchValuation(AvaxRewardPerDay, signer, chainId).then(
              (res: CurrencyAmount) => (AvaxRewardPerDayValuation = res)
            )
          );
          const totalQiTokenSupply: TokenAmount = new TokenAmount(
            Token.find(qiOrCToken.address, chainId),
            totalSupply!.toString()
          );
          var totalDepositValuation: CurrencyAmount;
          promises.push(
            fetchValuation(totalQiTokenSupply, signer, chainId).then(
              (res: CurrencyAmount) => (totalDepositValuation = res)
            )
          );
          await Promise.all(promises);

          const aprs: AprInfo[] = [];
          aprs.push({
            origin: 'Benqi - Qi reward',
            apr: calcLMRewardApr(
              new BigNumber(QiRewardPerDayValuation!.amount),
              new BigNumber(totalDepositValuation!.amount),
              365
            ).toFixed(DecimalsPrecision),
          });
          aprs.push({
            origin: 'Benqi - Avax reward',
            apr: calcLMRewardApr(
              new BigNumber(AvaxRewardPerDayValuation!.amount),
              new BigNumber(totalDepositValuation!.amount),
              365
            ).toFixed(DecimalsPrecision),
          });
          return aprs;
        }

        default:
          throw new Error(unsupportedProtocol);
      }
    };
    return {
      getSupplierAprs,
    };
  }
}
