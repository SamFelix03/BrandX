// const { task } = require('hardhat/config');
require('@nomiclabs/hardhat-etherscan');
require('@nomiclabs/hardhat-ethers');
require('@nomiclabs/hardhat-waffle');
require('hardhat-deploy');
require('hardhat-deploy-ethers');

real_accounts = undefined;
if (process.env.DEPLOYER_KEY && process.env.OWNER_KEY) {
  real_accounts = [process.env.OWNER_KEY, process.env.DEPLOYER_KEY];
}
const gatewayurl =
  'https://ccip-read-gateway.onrender.com/{sender}/{data}.json';

let devgatewayurl = 'https://ccip-read-gateway.onrender.com/{sender}/{data}.json';
if (process.env.REMOTE_GATEWAY) {
  devgatewayurl =
    `${process.env.REMOTE_GATEWAY}/{sender}/{data}.json`;
}
/**
 * @type import('hardhat/config').HardhatUserConfig
 */

module.exports = {
  solidity: '0.8.10',
  networks: {
    hardhat: {
      throwOnCallFailures: false,
      gatewayurl: devgatewayurl,
    },
    ropsten: {
      url: `https://ropsten.infura.io/v3/${process.env.INFURA_ID}`,
      tags: ['test', 'demo'],
      chainId: 3,
      accounts: real_accounts,
      gatewayurl,
    },
    rinkeby: {
      url: `https://rinkeby.infura.io/v3/${process.env.INFURA_ID}`,
      tags: ['test', 'demo'],
      chainId: 4,
      accounts: real_accounts,
      gatewayurl,
    },
    goerli: {
      url: `https://goerli.infura.io/v3/${process.env.INFURA_ID}`,
      tags: ['test', 'demo'],
      chainId: 5,
      accounts: real_accounts,
      gatewayurl,
    },
    sepolia: {
      url: `https://sepolia.infura.io/v3/b4880ead6a9a4f77a6de39dec6f3d0d0`,
      tags: ['test', 'demo'],
      chainId: 11155111,
      accounts: real_accounts,
      gatewayurl,
    },
    mainnet: {
      url: `https://mainnet.infura.io/v3/${process.env.INFURA_ID}`,
      tags: ['demo'],
      chainId: 1,
      accounts: real_accounts,
      gatewayurl,
    },
  },
  etherscan: {
    apiKey: {
      sepolia: process.env.ETHERSCAN_API_KEY,
    },
  },
  namedAccounts: {
    signer: {
      default: '0x2514844F312c02Ae3C9d4fEb40db4eC8830b6844',
    },
    deployer: {
      default: 0,
    },
  },
};
