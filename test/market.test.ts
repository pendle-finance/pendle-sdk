import { dummyToken, dummyTokenAmount, EXP_2022, PendleMarket, Token, TokenAmount, YieldContract } from '../src';
// import { Market } from '../src/entities/market';
import { ethers, BigNumber as BN } from 'ethers';
import * as dotenv from 'dotenv';
dotenv.config();
jest.setTimeout(30000);

// const dummyUser = '0x82c9D29739333258f08cD3957d2a7ac7f4d53fAb'; // Mainnet test account
const USDCToken: Token = new Token(
    '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    6
)
const aUSDCYTToken: Token = new Token(
    '0xffaf22db1ff7e4983b57ca9632f796f68ededef9',
    6
)
const PENDLEToken: Token = new Token(
    '0x808507121b80c02388fad14726482e061b8da827',
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
const PendleEthMarket = PendleMarket.find("0x685d32f394a5F03e78a1A0F6A91B4E2bf6F52cfE", 1);
const ETHUSDCMarket = PendleMarket.find("0x79c05Da47dC20ff9376B2f7DbF8ae0c994C3A0D0", 1);
const aUSDC2022Market = PendleMarket.find("0x8315bcbc2c5c1ef09b71731ab3827b0808a2d6bd",1);
const cDAI2022Market = PendleMarket.find("0xb26c86330fc7f97533051f2f8cd0a90c2e82b5ee", 1);


const markets = { PendleEthMarket, ETHUSDCMarket, aUSDC2022Market, cDAI2022Market };
describe("Market", () => {
    let provider: ethers.providers.JsonRpcProvider;
    let signer: any;
    let market: PendleMarket;

    beforeAll(async () => {
        const providerUrl = `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_KEY}`;

        // const providerUrl = `http://127.0.0.1:8545`;
        provider = new ethers.providers.JsonRpcProvider(providerUrl);
        signer = provider.getSigner("0xb69da28b6b5ddf0fd4fee4823a3ffd2243a13c92");
        market = markets.aUSDC2022Market;
    });

    it.only("PendleMarket.readMarketDetails", async () => {
        const marketDetails = await market.methods(signer).readMarketDetails();
        console.log(JSON.stringify(marketDetails, null, '  '));
    })

    it('PendleMarket.yieldContract', async() => {
        const yieldContract: YieldContract = market.yieldContract();
        console.log(JSON.stringify(yieldContract, null, '  '));
    })

    it('PendleMarket.swapExactInDetails', async () => {
        const swapExactInDetails = await market.methods(signer).swapExactInDetails(new TokenAmount(
            market.tokens[1],
            BN.from(10).pow(12).toString()
        ),
        0.01);
        console.log(swapExactInDetails);
    })

    it('PendleMarket.swapExactOutDetails', async () => {
        const swapExactOutDetails = await market.methods(signer).swapExactOutDetails(new TokenAmount(
            market.tokens[1],
            BN.from(10).pow(12).toString()
        ),
        0.01);
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
        const response = await market.methods(signer).addDualDetails(new TokenAmount(
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
        const response = await market.methods(signer).addSingleDetails(new TokenAmount(
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
})