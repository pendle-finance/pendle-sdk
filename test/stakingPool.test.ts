import { StakingPool } from '../src/entities/stakingPool';
import { ethers } from 'ethers';
import * as dotenv from 'dotenv';

dotenv.config()
jest.setTimeout(30000);

const chainId = 1;
const PendleSingle: StakingPool = StakingPool.find('0x07282f2ceebd7a65451fcd268b364300d9e6d7f5', '0x808507121b80c02388fad14726482e061b8da827',1);
const OTaUSDC2022Pool: StakingPool = StakingPool.find('0x529c513dde7968e19e79e38ff94d36e4c3c21eb7', '0x72972b21ce425cfd67935e07c68e84300ce3f40f', 1);
const YTcDAI2021Pool: StakingPool = StakingPool.find('0x5b1c59eb6872f88a92469751a034b9b5ada9a73f', '0x944d1727d0b656f497e74044ff589871c330334f', 1);

const sps = {PendleSingle, OTaUSDC2022Pool, YTcDAI2021Pool};

describe("Staking pools", () => {
    let provider: ethers.providers.JsonRpcProvider;
    let signer: any;
    let sp: StakingPool;
    beforeAll(async () => {
        const providerUrl = chainId == 1 ? `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_KEY}` : `https://kovan.infura.io/v3/${process.env.INFURA_KEY}`;

        // const providerUrl = `http://127.0.0.1:8545`;
        provider = new ethers.providers.JsonRpcProvider(providerUrl);
        signer = provider.getSigner();
        sp = sps.YTcDAI2021Pool;
    });
    it('Pendle single', async() => {
        const totalStake = await sp.methods(signer).getTotalStaked();
        console.log(JSON.stringify(totalStake, null, '  '));
    })
})