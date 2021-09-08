import { dummyToken, dummyTokenAmount, PendleMarket } from '../src';
// import { Market } from '../src/entities/market';
import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
dotenv.config();
jest.setTimeout(30000);

// const dummyUser = '0x82c9D29739333258f08cD3957d2a7ac7f4d53fAb'; // Mainnet test account

describe("Market", () => {
    let provider: ethers.providers.JsonRpcProvider;
    let signer: any;
    let market: PendleMarket;
  
    beforeAll(async () => {
      const providerUrl = `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_KEY}`;
  
    //   const providerUrl = `http://127.0.0.1:8545`;
      provider = new ethers.providers.JsonRpcProvider(providerUrl);
      signer = provider.getSigner();
      console.log(signer)
      market = new PendleMarket('0x9e382e5f78b06631e4109b5d48151f2b3f326df0', [dummyToken, dummyToken]);
    });
  
    it("PendleMarket.readMarketDetails", async() => {
        const marketDetails = await market.methods(signer).readMarketDetails();
        console.log(marketDetails);
    })

    it('PendleMarket.swapExactInDetails', async() => {
        const swapExactInDetails = await market.methods(signer).swapExactInDetails(0.01, dummyTokenAmount);
        console.log(swapExactInDetails);
    })

    it('PendleMarket.swapExactOutDetails', async() => {
        const swapExactOutDetails = await market.methods(signer).swapExactInDetails(0.01, dummyTokenAmount);
        console.log(swapExactOutDetails);
    })

    it.only('PendleMarket.swapExactIn', async() => {
        const response = await market.methods(signer).swapExactIn(0.01, dummyTokenAmount);
        console.log(response);
    })

    it('PendleMarket.swapExactOut', async() => {
        const response = await market.methods(signer).swapExactOut(0.01, dummyTokenAmount);
        console.log(response);
    });

    it('PendleMarket.addDualDetails', async() => {
        const response = await market.methods(signer).addDualDetails(dummyTokenAmount);
        console.log(response);
    })

    it('PendleMarket.addDual', async() => {
        const response = await market.methods(signer).addDual([dummyTokenAmount, dummyTokenAmount], 0.001);
        console.log(response);
    })

    it('PendleMarket.addSingleDetails', async() => {
        const response = await market.methods(signer).addSingleDetails(dummyTokenAmount);
        console.log(response);
    })

    it('PendleMarket.addSingle', async() => {
        const response = await market.methods(signer).addSingle(dummyTokenAmount, 0.001);
        console.log(response);
    })

    it('PendleMarket.removeDualDetails', async() => {
        const response = await market.methods(signer).removeDualDetails(0.5);
        console.log(response);
    })

    it('PendleMarket.removeDual', async() => {
        const response = await market.methods(signer).removeDual(0.5, 0.001);
        console.log(response);
    })

    it('PendleMarket.removeSingleDetails', async() => {
        const response = await market.methods(signer).removeDualDetails(0.5, dummyToken, 0.001);
        console.log(response);
    })

    it('PendleMarket.removeSingle', async() => {
        const response = await market.methods(signer).removeSingle(0.5, dummyToken, 0.001);
        console.log(response);
    })
})