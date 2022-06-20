/**
 * @type import('hardhat/config').HardhatUserConfig
 */

require("@nomiclabs/hardhat-waffle");
require('@nomiclabs/hardhat-ethers');
require('dotenv').config();

/* This loads the variables in your .env file to `process.env` */

const { DEPLOYER_PRIVATE_KEY, BSCSCAN_API_KEY } = process.env;

module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.5.16",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        }
      },
      {
        version: "0.8.14",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        }
      }
    ]
  },
  defaultNetwork: "hardhat",
  networks: {
    localhost: {
        url: "http://127.0.0.1:8545"
    },
    hardhat: {
    },
    bsctest: {
      url: "https://data-seed-prebsc-1-s1.binance.org:8545/",
      chainId: 97,
      gasPrice: 20000000000,
      accounts: [DEPLOYER_PRIVATE_KEY]
    },
    bsc: {
      url: "https://bsc-dataseed.binance.org/",
      chainId: 56,
      gasPrice: 20000000000,
      accounts: [DEPLOYER_PRIVATE_KEY]
    }
  },
  etherscan: {
    apiKey: BSCSCAN_API_KEY
  },
  mocha: {
    timeout: 999999
 }
};
