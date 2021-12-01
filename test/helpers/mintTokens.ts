import { consts, Network, Token, tokens } from './Constants';
import { BigNumber as BN, Contract, Wallet } from 'ethers';
import { amountToWei } from './numeric';
import { TestEnv } from '../TestEnv';

import LendingPool from '@pendle/core/build/artifacts/contracts/interfaces/IAaveV2LendingPool.sol/IAaveV2LendingPool.json';
import ERC20 from '@openzeppelin/contracts/build/contracts/ERC20.json';

const hre = require('hardhat');

export async function convertToAaveV2TokenMainnet(token: Token, alice: Wallet, amount: BN) {
  const { lendingPool } = new Contract(
    consts.address[Network.Mainnet].AAVE_V2_LENDING_POOL_ADDRESS,
    LendingPool.abi,
    alice
  );
  const tokenAmount = amountToWei(amount, token.decimal);

  const erc20 = new Contract(token.address, ERC20.abi, alice);
  await erc20.approve(lendingPool.address, tokenAmount);

  await lendingPool.deposit(token.address, tokenAmount, alice.address, 0);
}

export async function mintXytAaveMainnet(
  token: Token,
  user: Wallet,
  amount: BN,
  expiry: BN,
  env: TestEnv
): Promise<BN> {
  let router = env.router;
  const a2ContractAddress: string = await env.forge.callStatic.getYieldBearingToken(token.address);
  const a2Contract: Contract = new Contract(a2ContractAddress, ERC20.abi, user);
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

export async function mintUSDCMainnet(user: Wallet, amount: BN) {}

export async function mintToken(token: Token, user: Wallet, amount: BN) {
  switch (token) {
    case tokens[Network.Mainnet].USDC:
      await mintUSDCMainnet(user, amount);
      break;
  }
}
