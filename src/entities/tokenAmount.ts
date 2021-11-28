import BigNumberjs from 'bignumber.js';
import { providers, Contract, BigNumber as BN } from 'ethers';
import { contracts } from '../contracts';
import { Call_MultiCall, decimalFactor, distributeConstantsByNetwork, formatOutput, indexRange, Result_MultiCall } from '../helpers';
import { NetworkInfo } from '../networks';
import { Token, dummyToken } from './token';
import { HG } from '../constants';
import { ChainSpecifics } from './types'

export class TokenAmount {
    public readonly token: Token;
    private rawAmnt: string;

    public constructor(token: Token, amount: string, isRaw: boolean = true) {
        if (isRaw) {
            this.rawAmnt = amount;
        } else {
            this.rawAmnt = new BigNumberjs(amount)
                .times(decimalFactor(token.decimals))
                .toFixed(0);
        }
        this.token = token;
    }

    public formattedAmount(): string {
        return new BigNumberjs(this.rawAmnt)
            .div(decimalFactor(this.token.decimals))
            .toString();
    }

    public rawAmount(): string {
        return this.rawAmnt;
    }

    public static methods({signer, provider, chainId}: ChainSpecifics): Record < string, any > {
        const networkInfo: NetworkInfo = distributeConstantsByNetwork(chainId);
        const balancesOf = async ({ user, tokens }: { user: string, tokens: Token[] }): Promise<TokenAmount[]> => {
            const multiCallV2Contract: Contract = new Contract(networkInfo.contractAddresses.misc.MultiCallV2, contracts.MultiCallV2.abi, provider);
            const calls: Call_MultiCall[] = new Array<Call_MultiCall>(tokens.length);
            await Promise.all(indexRange(0, tokens.length).map(async (i: number): Promise<boolean> => {
                const t: Token = tokens[i];
                const tContract: Contract = new Contract(t.address, contracts.IERC20.abi, provider);
                calls[i] = {
                    callData: (await tContract.populateTransaction.balanceOf(user)).data!,
                    target: t.address
                }
                return true;
            }));
            const returnedData: Result_MultiCall[] = (await multiCallV2Contract.callStatic.tryBlockAndAggregate(true, calls, HG)).returnData;
            const balances: TokenAmount[] = new Array<TokenAmount>(tokens.length);
            indexRange(0, tokens.length).forEach((i: number) => {
                const balance: BN = formatOutput(returnedData[i].returnData, contracts.IERC20.abi, "balanceOf")[0];
                balances[i] = new TokenAmount(
                    tokens[i],
                    balance.toString()
                )
            });
            return balances;
        }
        return {
            balancesOf
        }
    }
}

export const dummyTokenAmount: TokenAmount = new TokenAmount(
    dummyToken,
    "1000000000000000"
)
