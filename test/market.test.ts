import { dummyToken, dummyTokenAmount, EXP_2022, Market, PendleMarket, Token, TokenAmount, YieldContract } from '../src';
// import { Market } from '../src/entities/market';
import { ethers, BigNumber as BN } from 'ethers';
import * as dotenv from 'dotenv';
import { NetworkInfo } from '../src/networks';
import { distributeConstantsByNetwork } from '../src/helpers';
dotenv.config();
jest.setTimeout(300000);

const chainId: number = 43114;
const networkInfo: NetworkInfo = distributeConstantsByNetwork(chainId);

function getMainnetTokens() {
    const USDCToken: Token = new Token(
        networkInfo.contractAddresses.tokens.USDC,
        6
    )
    const aUSDCYTToken: Token = new Token(
        '0xffaf22db1ff7e4983b57ca9632f796f68ededef9',
        6
    )
    const PENDLEToken: Token = new Token(
        networkInfo.contractAddresses.tokens.PENDLE,
        18
    )
    const PENDLEETHYTToken: Token = new Token(
        '0x49c8ac20de6409c7e0b8f9867cffd1481d8206c6',
        18,
        EXP_2022.toNumber()
    )
    const ETHUSDCYTToken = new Token(
        '0x311FCB5dB45A3a5876975f8108237F20525Fa7e0',
        18,
        EXP_2022.toNumber()
    )
    const tokens = { USDCToken, aUSDCYTToken, PENDLEToken, PENDLEETHYTToken, ETHUSDCYTToken }
    return tokens
}

function getMainnetMarkets() {
    const PendleEthMarket = PendleMarket.find("0x685d32f394a5F03e78a1A0F6A91B4E2bf6F52cfE", 1);
    const ETHUSDCMarket = PendleMarket.find("0x79c05Da47dC20ff9376B2f7DbF8ae0c994C3A0D0", 1);
    const aUSDC2022Market = PendleMarket.find("0x8315bcbc2c5c1ef09b71731ab3827b0808a2d6bd", 1);
    const cDAI2022Market = PendleMarket.find("0xb26c86330fc7f97533051f2f8cd0a90c2e82b5ee", 1);
    const aUSDC2021Market = Market.find("0x9e382e5f78b06631e4109b5d48151f2b3f326df0", 1);

    const markets = { PendleEthMarket, ETHUSDCMarket, aUSDC2022Market, cDAI2022Market, aUSDC2021Market };
    return markets
}

const networkTestEnv = {
    1: {
        Tokens: getMainnetTokens(),
        Markets: getMainnetMarkets()
    },
}
const markets = networkTestEnv[1].Markets;
const tokens = networkTestEnv[1].Tokens;
describe("Market", () => {
    let provider: ethers.providers.JsonRpcProvider;
    let signer: any;
    let market: PendleMarket;

    beforeAll(async () => {
        const providerUrl = chainId == 1 ? `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_KEY}`
            : chainId == 42 ? `https://kovan.infura.io/v3/${process.env.INFURA_KEY}`
                : `https://api.avax.network/ext/bc/C/rpc`;
        // const providerUrl = `http://127.0.0.1:8545`;
        provider = new ethers.providers.JsonRpcProvider(providerUrl);
        signer = provider.getSigner();
        market = PendleMarket.find('0x50d3a2991db715e51c55a5ec06488e91522029d2', chainId)
    });

    it.only("PendleMarket.readMarketDetails", async () => {
        const marketDetails = await market.methods(signer, chainId).readMarketDetails();

        console.log(JSON.stringify(marketDetails, null, '  '));
    })

    it('PendleMarket.yieldContract', async () => {
        const yieldContract: YieldContract = market.yieldContract(chainId);
        console.log(JSON.stringify(yieldContract, null, '  '));
    })

    it('PendleMarket.swapExactInDetails', async () => {
        const swapExactInDetails = await market.methods(signer, chainId).swapExactInDetails(new TokenAmount(
            market.tokens[1],
            BN.from(10).pow(6).toString()
        ),
            0.001);
        console.log(swapExactInDetails);
    })

    it('PendleMarket.swapExactOutDetails', async () => {
        const swapExactOutDetails = await market.methods(signer, chainId).swapExactOutDetails(new TokenAmount(
            market.tokens[0],
            BN.from(10).pow(6).toString()
        ),
            0.001);
        console.log(swapExactOutDetails);
    })

    it.skip('PendleMarket.swapExactIn', async () => {
        const response = await market.methods(signer).swapExactIn(0.01, dummyTokenAmount);
        console.log(response);
    })

    it.skip('PendleMarket.swapExactOut', async () => {
        const response = await market.methods(signer).swapExactOut(0.01, dummyTokenAmount);
        console.log(response);
    });

    it('PendleMarket.addDualDetails', async () => {
        const response = await market.methods(signer, chainId).addDualDetails(new TokenAmount(
            tokens.USDCToken,
            BN.from(10).pow(11).toString()
        ));
        console.log(response);
    })

    it.skip('PendleMarket.addDual', async () => {
        const response = await market.methods(signer).addDual([dummyTokenAmount, dummyTokenAmount], 0.001);
        console.log(response);
    })

    it('PendleMarket.addSingleDetails', async () => {
        const response = await market.methods(signer, chainId).addSingleDetails(new TokenAmount(
            tokens.USDCToken,
            BN.from(10).pow(12).toString()
        ));
        console.log(response);
    })

    it.skip('PendleMarket.addSingle', async () => {
        const response = await market.methods(signer).addSingle(dummyTokenAmount, 0.001);
        console.log(response);
    })

    it('PendleMarket.removeDualDetails', async () => {
        const response = await market.methods(signer).removeDualDetails(0.5);
        console.log(response);
    })

    it.skip('PendleMarket.removeDual', async () => {
        const response = await market.methods(signer).removeDual(0.5, 0.001);
        console.log(response);
    })

    it('PendleMarket.removeSingleDetails', async () => {
        const response = await market.methods(signer).removeSingleDetails(0.05, tokens.USDCToken, 0.001);
        console.log(JSON.stringify(response, null, '  '));
    })

    it.skip('PendleMarket.removeSingle', async () => {
        const response = await market.methods(signer).removeSingle(0.5, dummyToken, 0.001);
        console.log(response);
    })

    it('Market.readMarketDetails', async() => {
        const sushiMarket = Market.find('0x37922c69b08babcceae735a31235c81f1d1e8e43', 1);
        const response = await sushiMarket.methods(signer, 1).readMarketDetails();
        console.log(JSON.stringify(response, null, '  '));
    })
})