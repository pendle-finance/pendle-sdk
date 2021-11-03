import { StakingPool } from '../src/entities/stakingPool';
import { Contract, ethers } from 'ethers';
import * as dotenv from 'dotenv';
import { contracts, dummyAddress } from '../src';
import { distributeConstantsByNetwork } from '../src/helpers';

dotenv.config()
jest.setTimeout(300000);

var chainId = 43114;

const PendleSingle: StakingPool = StakingPool.find('0x07282f2ceebd7a65451fcd268b364300d9e6d7f5', '0x808507121b80c02388fad14726482e061b8da827',1);
const OTPE2022Pool: StakingPool = StakingPool.find('0x2c09fd74e80ce12bebbc8f56fab8633ea41c2bcc', '0xb124c4e18a282143d362a066736fd60d22393ef4', 1);
const OTcDAI2021Pool: StakingPool = StakingPool.find("0x071dc669be57c1b3053f746db20cb3bf54383aea","0x2c80d72af9ab0bb9d98f607c817c6f512dd647e6", 1);
const OTaUSDC2022Pool: StakingPool = StakingPool.find('0x94a7432b811e29128964fba993f159928744e7c7', '0x0d8a21f2ea15269b7470c347083ee1f85e6a723b', 1);
const YTcDAI2021Pool: StakingPool = StakingPool.find('0x5b1c59eb6872f88a92469751a034b9b5ada9a73f', '0x944d1727d0b656f497e74044ff589871c330334f', 1);
const YTcDAI2022Pool: StakingPool = StakingPool.find('0x5b1c59eb6872f88a92469751a034b9b5ada9a73f', '0xb26c86330fc7f97533051f2f8cd0a90c2e82b5ee', 1);
const YTPE2022Pool: StakingPool = StakingPool.find("0x0f3bccbfef1dc227f33a11d7a51cd02dead208c8","0x685d32f394a5f03e78a1a0f6a91b4e2bf6f52cfe", 1);
const YTaUSDC2022Pool: StakingPool = StakingPool.find("0x6f40a68e99645c60f14b497e75ae024777d61726", "0x8315bcbc2c5c1ef09b71731ab3827b0808a2d6bd", 1);
const YTaUSDC2021Pool: StakingPool = StakingPool.find("0x6f40a68e99645c60f14b497e75ae024777d61726", "0x9e382e5f78b06631e4109b5d48151f2b3f326df0", 1);

const sps = {PendleSingle, OTaUSDC2022Pool, YTcDAI2021Pool, YTPE2022Pool, OTPE2022Pool, YTaUSDC2022Pool, YTcDAI2022Pool, YTaUSDC2021Pool, OTcDAI2021Pool};

describe("Staking pools", () => {
    let provider: ethers.providers.JsonRpcProvider;
    let signer: any;
    let sp: StakingPool;
    beforeAll(async () => {
        const providerUrl = chainId == 1 ? `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_KEY}` : `https://api.avax.network/ext/bc/C/rpc`;

        // const providerUrl = `http://127.0.0.1:8545`;
        provider = new ethers.providers.JsonRpcProvider(providerUrl, chainId);
        signer = provider.getSigner();
        sp = StakingPool.find('0xa90db3286122355309cd161c3aec2ddb28021b6a', '0x027dfe08d7a3ce2562ce17a6f6f4b78d26f360bd', chainId);
    });
    it('Get totalStaked', async() => {
        const totalStake = await sp.methods(signer).getTotalStaked();
        console.log(JSON.stringify(totalStake, null, '  '));
    })

    it('Get balance', async() => {
        const balance = await sp.methods(signer).balanceOf(dummyAddress);
        console.log(JSON.stringify(balance, null, '  '));
    })

    it.only('Get Reward APRs', async() => {
        const aprs = await sp.methods(signer, chainId).rewardAprs();
        console.log(JSON.stringify(aprs, null, '  '));
    })
})