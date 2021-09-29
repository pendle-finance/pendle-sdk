import { StakingPool } from '../src/entities/stakingPool';
import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
import { dummyAddress } from '../src';

dotenv.config()
jest.setTimeout(30000);

const chainId = 1;
const PendleSingle: StakingPool = StakingPool.find('0x07282f2ceebd7a65451fcd268b364300d9e6d7f5', '0x808507121b80c02388fad14726482e061b8da827',1);
const OTaUSDC2022Pool: StakingPool = StakingPool.find('0x94a7432b811e29128964fba993f159928744e7c7', '0x0d8a21f2ea15269b7470c347083ee1f85e6a723b', 1);
const OTPE2022Pool: StakingPool = StakingPool.find('0x2c09fd74e80ce12bebbc8f56fab8633ea41c2bcc', '0xb124c4e18a282143d362a066736fd60d22393ef4', 1);
const YTcDAI2021Pool: StakingPool = StakingPool.find('0x5b1c59eb6872f88a92469751a034b9b5ada9a73f', '0x944d1727d0b656f497e74044ff589871c330334f', 1);
const YTPE2022Pool: StakingPool = StakingPool.find("0x0f3bccbfef1dc227f33a11d7a51cd02dead208c8","0x685d32f394a5f03e78a1a0f6a91b4e2bf6f52cfe", 1);

const sps = {PendleSingle, OTaUSDC2022Pool, YTcDAI2021Pool, YTPE2022Pool, OTPE2022Pool};

describe("Staking pools", () => {
    let provider: ethers.providers.JsonRpcProvider;
    let signer: any;
    let sp: StakingPool;
    beforeAll(async () => {
        const providerUrl = chainId == 1 ? `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_KEY}` : `https://kovan.infura.io/v3/${process.env.INFURA_KEY}`;

        // const providerUrl = `http://127.0.0.1:8545`;
        provider = new ethers.providers.JsonRpcProvider(providerUrl);
        signer = provider.getSigner();
        sp = sps.PendleSingle;
    });
    it('Get totalStaked', async() => {
        const totalStake = await sp.methods(signer).getTotalStaked();
        console.log(JSON.stringify(totalStake, null, '  '));
    })

    it('Get balance', async() => {
        const balance = await sp.methods(signer).balanceOf(dummyAddress);
        console.log(JSON.stringify(balance, null, '  '));
    })

    it('Get Reward APRs', async() => {
        const aprs = await sp.methods(signer).rewardAprs();
        console.log(JSON.stringify(aprs, null, '  '));
    })
})