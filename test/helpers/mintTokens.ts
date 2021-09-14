import { Token, consts } from "./Constants"
import { BigNumber as BN, Contract, Wallet } from 'ethers';
import { amountToWei } from "./numeric"


export async function convertToAaveV2TokenMainnet (token: Token, alice: Wallet, amount: BN) {
    const { lendingPool } = await aaveV2Fixture(alice);
    const tokenAmount = amountToWei(amount, token.decimal);

    const erc20 = new Contract(token.address, ERC20.abi, alice);
    await erc20.approve(lendingPool.address, tokenAmount);

    await lendingPool.deposit(token.address, tokenAmount, alice.address, 0);
}

export async function mintXytAaveMainnet(token: Token, user: Wallet, amount: BN, expiry: BN): Promise<BN> {
    let router = env.core.router;
    const a2Contract = await getA2Contract(user, env.a2Forge.aaveV2Forge, token);
    let preA2TokenBal = await a2Contract.balanceOf(user.address);
    await mintAaveV2Token(token, user, amount);
    await a2Contract.approve(router.address, consts.INF);
    let postA2TokenBal = await a2Contract.balanceOf(user.address);
    await router
        .connect(user)
        .tokenizeYield(
            consts.FORGE_AAVE_V2,
            token.address,
            expiry,
            postA2TokenBal.sub(preA2TokenBal),
            user.address,
            consts.HG
        );
    return postA2TokenBal.sub(preA2TokenBal);
}