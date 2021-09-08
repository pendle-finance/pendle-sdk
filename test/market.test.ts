import { dummyToken, PendleMarket } from '../src';
// import { Market } from '../src/entities/market';
import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
dotenv.config();
jest.setTimeout(30000);

describe("Market", () => {
    let provider: ethers.providers.JsonRpcProvider;
    let signer: any;
  
    beforeAll(async () => {
      const providerUrl = `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_KEY}`;
  
      // const providerUrl = `http://127.0.0.1:8545`;
      provider = new ethers.providers.JsonRpcProvider(providerUrl);
      signer = provider.getSigner();
    });
  
    it("PendleMarket.readMarketDetails", async() => {
        const MarketDetails = await (new PendleMarket('0x9e382e5f78b06631e4109b5d48151f2b3f326df0', [dummyToken, dummyToken]).methods(signer)
            .readMarketDetails());
        console.log(MarketDetails);
    })
})