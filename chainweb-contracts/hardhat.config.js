require("@nomicfoundation/hardhat-toolbox");
require('@kadena/hardhat-chainweb');
require('@kadena/hardhat-kadena-create2');
require("hardhat-switch-network");
require("@nomicfoundation/hardhat-verify");
require('dotenv').config();

const { readFileSync } = require("fs");

const devnetAccounts = JSON.parse(
  readFileSync("./devnet-accounts.json", "utf-8")
);

 if (!process.env.DEPLOYER_PRIVATE_KEY) {
  throw new Error("DEPLOYER_PRIVATE_KEY is not set in .env");
}

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1000,
          },
          evmVersion: "prague",
        },
      },
      {
        version: "0.8.30",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1,
          },
          evmVersion: "prague",
          viaIR: true,
        },
      }
    ]
  },
  chainweb: {
    hardhat: {
      chains: 5,
      chainwebChainIdOffset: 20,
    },
    sandbox: {
      type: 'external',
      chains: 5,
      accounts: devnetAccounts.accounts.map((account) => account.privateKey),
      chainIdOffset: 1789,
      chainwebChainIdOffset: 20,
      externalHostUrl: "http://localhost:1848/chainweb/0.0/evm-development",
       etherscan: {
        apiKey: 'abc', // Any non-empty string works for Blockscout
        apiURLTemplate: 'http://chain-{cid}.evm.kadena.internal:8000/api/',
        browserURLTemplate: 'http://chain-{cid}.evm.kadena.internal:8000/',
      },
    },
    testnet: {
      type: 'external',
      chains: 5,
      accounts: [process.env.DEPLOYER_PRIVATE_KEY],
      chainIdOffset: 5920,
      chainwebChainIdOffset: 20,
      externalHostUrl:
        "https://evm-testnet.chainweb.com/chainweb/0.0/evm-testnet",
      etherscan: {
        apiKey: 'abc', // Any non-empty string works for Blockscout
        apiURLTemplate: "https://chain-{cid}.evm-testnet-blockscout.chainweb.com/api/",
        browserURLTemplate: "https://chain-{cid}.evm-testnet-blockscout.chainweb.com"
      },
    },
  },
  mocha: {
    timeout: 300000
  },
  etherscan: {
    apiKey: {
      chainweb_testnet20: 'abc',
      chainweb_testnet21: 'abc',
      chainweb_testnet22: 'abc',
      chainweb_testnet23: 'abc',
      chainweb_testnet24: 'abc'
    },
    customChains: [
      {
        network: "chainweb_testnet20",
        chainId: 5920,
        urls: {
          apiURL: "https://chain-20.evm-testnet-blockscout.chainweb.com/api",
          browserURL: "https://chain-20.evm-testnet-blockscout.chainweb.com"
        }
      },
      {
        network: "chainweb_testnet21",
        chainId: 5921,
        urls: {
          apiURL: "https://chain-21.evm-testnet-blockscout.chainweb.com/api",
          browserURL: "https://chain-21.evm-testnet-blockscout.chainweb.com"
        }
      },
      {
        network: "chainweb_testnet22",
        chainId: 5922,
        urls: {
          apiURL: "https://chain-22.evm-testnet-blockscout.chainweb.com/api",
          browserURL: "https://chain-22.evm-testnet-blockscout.chainweb.com"
        }
      },
      {
        network: "chainweb_testnet23",
        chainId: 5923,
        urls: {
          apiURL: "https://chain-23.evm-testnet-blockscout.chainweb.com/api",
          browserURL: "https://chain-23.evm-testnet-blockscout.chainweb.com"
        }
      },
      {
        network: "chainweb_testnet24",
        chainId: 5924,
        urls: {
          apiURL: "https://chain-24.evm-testnet-blockscout.chainweb.com/api",
          browserURL: "https://chain-24.evm-testnet-blockscout.chainweb.com"
        }
      }
    ]
  }

};
