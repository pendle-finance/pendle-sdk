import { dummyToken, dummyTokenAmount, PendleMarket, YieldContract } from '../src';
// import { Market } from '../src/entities/market';
import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
dotenv.config();
jest.setTimeout(30000);

const dummyUser = '0x186e446fbd41dd51ea2213db2d3ae18b05a05ba8'; // local alice account

describe("Yiled Contract", async() => {
    let provider: ethers.providers.JsonRpcProvider;
    let signer: any;
    let yContract: YieldContract;
  
    beforeAll(async () => {
      const providerUrl = `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_KEY}`;
  
    //   const providerUrl = `http://127.0.0.1:8545`;
      provider = new ethers.providers.JsonRpcProvider(providerUrl);
      signer = provider.getSigner();
      console.log(signer)
      yContract = new YieldContract('AAve2', dummyToken, 12345);
    });

    it('yieldContract.mintDetails', async() => {
      const response = await yContract.methods(signer).mintDetails(dummyTokenAmount);
      console.log(response);
    })
  
    it('yieldContract.mint', async() => {
      const response = await yContract.methods(signer).mint(dummyTokenAmount);
      console.log(response);
    })

    it('yieldContract.redeemDetails', async() => {
      const response = await yContract.methods(signer).redeemDetails(dummyTokenAmount, dummyUser);
      console.log(response);
    })

    it('yieldContract.redeem', async() => {
      const response = await yContract.methods(signer).redeem(dummyTokenAmount);
      console.log(response);
    })
})
