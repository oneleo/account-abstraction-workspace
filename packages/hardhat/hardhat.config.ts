import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config"

const accounts = {
  mnemonic: process.env.MNEMONIC || "test test test test test test test test test test test junk",
}
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || ""
const ALCHEMY_TOKEN = process.env.ALCHEMY_TOKEN || ""

const config: HardhatUserConfig = {
  solidity: "0.8.18",
  networks: {
    mainnet: {
      url: `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_TOKEN}`,
      chainId: 1,
      accounts,
    },
    goerli: {
      url: `https://eth-goerli.alchemyapi.io/v2/${ALCHEMY_TOKEN}`,
      chainId: 5,
      accounts,
    },
    // Running Hardhat node with the following settings.
    hardhat: {
      chainId: 1337,
      accounts,
      forking: {
        url: `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_TOKEN}`,
        blockNumber: 16666666,
      },
    },
    localhost: {
      url: `http://127.0.0.1:8545`,
      chainId: 1337,
      accounts,
    },
  },
  etherscan: {
    apiKey: `${ETHERSCAN_API_KEY}`,
  },
};

export default config;
