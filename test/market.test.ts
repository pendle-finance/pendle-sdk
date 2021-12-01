import { dummyToken, dummyTokenAmount, EXP_2022, Market, PendleMarket, Token, TokenAmount, UniForkMarket, YieldContract } from '../src';
// import { Market } from '../src/entities/market';
import { ethers, BigNumber as BN } from 'ethers';
import * as dotenv from 'dotenv';
import { NetworkInfo } from '../src/networks';
import { distributeConstantsByNetwork, indexRange } from '../src/helpers';
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

const tokens = getMainnetTokens();
describe("Market", () => {
    let provider: ethers.providers.JsonRpcProvider;
    let signer: any;
    let market: Market;

    beforeAll(async () => {
        const providerUrl = chainId == 1 ? `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_KEY}`
            : chainId == 42 ? `https://kovan.infura.io/v3/${process.env.INFURA_KEY}`
                : `https://api.avax.network/ext/bc/C/rpc`;
        // const providerUrl = `http://127.0.0.1:8545`;
        provider = new ethers.providers.JsonRpcProvider(providerUrl);
        signer = provider.getSigner('0xB5E4846Db18d2B859c32951C843a5b7A2bf19126');
        market = Market.find('0x5f973e06a59d0bafe464faf36d5b3b06e075c543', chainId)
        console.log(market)
        // market = PendleMarket.find('0x027dfe08d7a3ce2562ce17a6f6f4b78d26f360bd', chainId)
    });

    it("PendleMarket.readMarketDetails", async () => {
        const marketDetails = await market.methods({signer, provider, chainId}).readMarketDetails();

        console.log(JSON.stringify(marketDetails, null, '  '));
    })

    // it('PendleMarket.yieldContract', async () => {
    //     const yieldContract: YieldContract = market.yieldContract(chainId);
    //     console.log(JSON.stringify(yieldContract, null, '  '));
    // })

    it('PendleMarket.swapExactInDetails', async () => {
        const swapExactInDetails = await market.methods({signer, provider, chainId}).swapExactInDetails(new TokenAmount(
            market.tokens[1],
            BN.from(10).pow(18).toString()
        ),
            0.001);
        console.log(swapExactInDetails);
    })

    it('PendleMarket.swapExactOutDetails', async () => {
        const swapExactOutDetails = await market.methods({signer, provider, chainId}).swapExactOutDetails(new TokenAmount(
            market.tokens[0],
            BN.from(10).pow(18).toString()
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
        const response = await market.methods({signer, provider, chainId}).addDualDetails(new TokenAmount(
            tokens.PENDLEToken,
            BN.from(10).pow(18).toString()
        ));
        console.log(response);
    })

    it.skip('PendleMarket.addDual', async () => {
        const response = await market.methods(signer).addDual([dummyTokenAmount, dummyTokenAmount], 0.001);
        console.log(response);
    })

    it('PendleMarket.addSingleDetails', async () => {
        const response = await market.methods({signer, provider, chainId}).addSingleDetails(new TokenAmount(
            tokens.PENDLEToken,
            BN.from(10).pow(19).toString()
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

    it('UniForkMarket.readMarketDetails', async() => {
        const sushiMarket = UniForkMarket.find('0x2c80d72af9ab0bb9d98f607c817c6f512dd647e6', chainId);
        const response = await sushiMarket.methods({signer, provider, chainId}).readMarketDetails();
        console.log(JSON.stringify(response, null, '  '));
    })

    it('redeem OT market LP rewards', async() => {
        const networkInfo = distributeConstantsByNetwork(chainId);
        const res = await UniForkMarket.methods({signer, provider, chainId}).fetchClaimableRewardsFromOTMarkets(indexRange(1,4).map((i: number) => {
            return Market.find(networkInfo.contractAddresses.otherMarkets![i].address, chainId);
        }), '0x0D207520DF136bFc84c7a2932383362b8ae4fC61');
        console.log(JSON.stringify(res, null, '  '));
    })

    it.only('UniForkMarket.removeDual', async() => {
        const res = await market.methods({signer, provider, chainId}).removeDual(0.5, 0.01);
        console.log(res);
    })

})