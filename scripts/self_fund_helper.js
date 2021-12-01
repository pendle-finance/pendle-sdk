require('@nomiclabs/hardhat-ethers');
const { utils, BigNumber } = require('ethers');
const { mainnetConstants } = require('../../helpers/constants');
// import { BigNumber as BN } from 'ethers';
// import { impersonateAccount } from '../../../test/helpers';

const defaultAmount = {
  USDC: BigNumber.from(3000000e6),
  USDT: BigNumber.from(3000000e6),
  DAI: BigNumber.from(10).pow(22),
  'ETHUSDC-SLP': BigNumber.from(10).pow(16),
  'PENDLEETH-SLP': BigNumber.from(10).pow(21),
  PENDLE: BigNumber.from(10).pow(22),
};

function getDefaultAmount(token) {
  if (defaultAmount[token] === undefined) {
    return BigNumber.from(10).pow(22);
  } else {
    return defaultAmount[token];
  }
}

task('self_fund', 'Fund address with tokens in dev environment')
  .addOptionalParam('account', "The account's address to fund")
  .addParam('token', 'The desired token to fund')
  .addOptionalParam('amount', 'The desired amount to fund')
  .setAction(async (taskArgs, hre) => {
    async function impersonateAccount(address) {
      await hre.network.provider.request({
        method: 'hardhat_impersonateAccount',
        params: [address],
      });
    }

    async function impersonateAccountStop(address) {
      await hre.network.provider.request({
        method: 'hardhat_stopImpersonatingAccount',
        params: [address],
      });
    }

    if (hre.network.name != 'development') {
      console.log(`\tThis script is for funding accounts in development !`);
      process.exit(1);
    }

    token = mainnetConstants.tokens[taskArgs.token];
    if (token === undefined) {
      console.log(`\tUnsupported token !`);
      process.exit(1);
    }

    const [alice, bob, charlie, dave, eve] = await hre.ethers.getSigners();

    const selfFund = async (whaleAddress, tokenAddress, amount) => {
      const token = await hre.ethers.getContractAt('IERC20', tokenAddress);
      // Give whale some ether
      await hre.network.provider.send('hardhat_setBalance', [whaleAddress, '0x10000000000000000']);
      console.log(`balance of whale    = ${await token.balanceOf(whaleAddress)}`);
      console.log(`\tbalance of alice = ${await token.balanceOf(alice.address)}`);
      console.log(`\tamount              = ${amount}`);
      await impersonateAccount(whaleAddress);
      const whaleSigner = await hre.ethers.getSigner(whaleAddress);
      if (taskArgs.account !== undefined) {
        await token.connect(whaleSigner).transfer(taskArgs.account, amount, { gasLimit: '300000' });
        console.log(`\tFunded ${taskArgs.account} ${amount} of ${taskArgs.token}`);
      } else {
        for (const person of [alice, bob, charlie, dave, eve]) {
          await token.connect(whaleSigner).transfer(person.address, amount, { gasLimit: '300000' });
          console.log(`\tFunded ${person.address} ${amount} of ${taskArgs.token}`);
        }
      }
      await impersonateAccountStop(whaleAddress);
    };
    success = false;
    for (whale of token.whales) {
      try {
        await selfFund(
          whale,
          token.address,
          taskArgs.amount === undefined ? getDefaultAmount(taskArgs.token) : BigNumber.from(taskArgs.amount)
        );
      } catch (err) {
        continue;
      }
      success = true;
      break;
    }
    if (!success) {
      console.log(`\tUnable to complete self fund !`);
      process.exit(1);
    }
    console.log(`\tFunded`);
  });

module.exports = {};
