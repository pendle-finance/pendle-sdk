
import * as dotenv from 'dotenv';
import { ethers, providers } from 'ethers';
import { generateTJPoolDetails, TokenAmount, NetworkInfo, distributeConstantsByNetwork, Token, decimalFactor, getOnePool } from '../src';
import { computeTradeRouteExactIn } from '../src/entities/tradeRouteProducer';

dotenv.config()
jest.setTimeout(300000);

var chainId = 43114;
const networkInfo: NetworkInfo = distributeConstantsByNetwork(chainId);

describe("Staking pools", () => {
    let provider: ethers.providers.JsonRpcProvider;
    let signer: any;
    beforeAll(async () => {
        const providerUrl = chainId == 1 ? `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_KEY}` : `https://api.avax.network/ext/bc/C/rpc`;

        // const providerUrl = `http://127.0.0.1:8545`;
        provider = new ethers.providers.JsonRpcProvider(providerUrl);
        signer = provider.getSigner();
    });
    
    it.only('generate', async() => {
        const res = await generateTJPoolDetails(provider)
        console.log(JSON.stringify(res, null, '  '));
        console.log(res.length)
    })

    it('generate one pool', async() => {
        const t0 = {
            chainId: 43114,
            address: '0x8F47416CaE600bccF9530E9F3aeaA06bdD1Caa79',
            decimals: 18,
            name: 'THOR v2',
            symbol: 'THOR',
            logoURI: 'https://raw.githubusercontent.com/traderjoe-xyz/joe-tokenlists/main/logos/0x8F47416CaE600bccF9530E9F3aeaA06bdD1Caa79/logo.png'
        };
        const t1= {
            chainId: 43114,
            address: '0xd9D90f882CDdD6063959A9d837B05Cb748718A05',
            decimals: 18,
            name: 'More Token',
            symbol: 'MORE',
            logoURI: 'https://raw.githubusercontent.com/traderjoe-xyz/joe-tokenlists/main/logos/0xd9D90f882CDdD6063959A9d837B05Cb748718A05/logo.png'
        }
        const res = await getOnePool(t0, t1, provider);
        console.log(JSON.stringify(res, null, '  '))
    })

    it('compute trade route', async()=> {
        const res = await computeTradeRouteExactIn(new TokenAmount(
            new Token(
                networkInfo.contractAddresses.tokens.USDC,
                6
            ),
            decimalFactor(5)
        ),
        new Token(
            networkInfo.contractAddresses.tokens.MIM,
            18
        ))
        console.log(res);
    })
})