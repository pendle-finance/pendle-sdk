import { RedeemProxy } from "../src/entities/redeemProxy";
import { ethers } from 'ethers'
import { LMINFO, NetworkInfo } from "../src/networks";
import { distributeConstantsByNetwork } from "../src/helpers";
import { dummyAddress, StakingPool } from "../src";
var chainId = 43114;

describe('Redeem Proxy', () => {
    let provider: ethers.providers.JsonRpcProvider;
    let signer: ethers.providers.JsonRpcSigner;
    let networkInfo: NetworkInfo = distributeConstantsByNetwork(chainId)

    beforeAll(async () => {
        const providerUrl = chainId == 1 ? `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_KEY}`
            : chainId == 42 ? `https://kovan.infura.io/v3/${process.env.INFURA_KEY}`
                : `https://api.avax.network/ext/bc/C/rpc`;
        // const providerUrl = `http://127.0.0.1:8545`;
        provider = new ethers.providers.JsonRpcProvider(providerUrl);
        
        signer = provider.getSigner('0x0D207520DF136bFc84c7a2932383362b8ae4fC61');
    })
    
    it('redeemLmV2Interests', async() => {
        const lmAddresses: string[] = networkInfo.contractAddresses.stakingPools.filter((s: LMINFO) => StakingPool.isLmV2ByType(s.contractType)).map((s: LMINFO) => s.address);
        const res = await RedeemProxy.methods({signer, provider, chainId}).callStatic.redeemLmV2Interests(lmAddresses, dummyAddress);
        console.log(JSON.stringify(res, null, '  '));
    })

    it('redeemTokenDist', async() => {
        const res = await RedeemProxy.methods({signer, provider, chainId}).callStatic.redeemTokenDist(['0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7', '0x8729438eb15e2c8b576fcc6aecda6a148776c0f5'], '0x0D207520DF136bFc84c7a2932383362b8ae4fC61');
        console.log(JSON.stringify(res, null, '  '));
    })
})