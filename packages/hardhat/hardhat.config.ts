import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";

const accounts = {
  mnemonic:
    process.env.MNEMONIC ||
    "test test test test test test test test test test test tip",
};
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";
const ALCHEMY_TOKEN = process.env.ALCHEMY_TOKEN || "";
const MAINNET_URL = `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_TOKEN}`;
const GOERLI_URL = `https://eth-goerli.alchemyapi.io/v2/${ALCHEMY_TOKEN}`;

const hardhatForkNet: string = "goerli";

const hardhatForkId = hardhatForkNet === "mainnet" ? 1337 : 1337;
const hardhatForkUrl = hardhatForkNet === "mainnet" ? MAINNET_URL : GOERLI_URL;
const hardhatForkBlock = hardhatForkNet === "mainnet" ? 17444444 : 9200000;

const config: HardhatUserConfig = {
  solidity: "0.8.18",
  networks: {
    mainnet: {
      url: MAINNET_URL,
      chainId: 1,
      accounts: accounts,
    },
    goerli: {
      url: GOERLI_URL,
      chainId: 5,
      accounts: accounts,
    },
    // Running Hardhat node with the following settings.
    hardhat: {
      chainId: hardhatForkId,
      accounts: accounts,
      forking: {
        url: hardhatForkUrl,
        blockNumber: hardhatForkBlock,
      },
    },
    localhost: {
      url: `http://127.0.0.1:8545`,
      chainId: 1337,
      accounts: accounts,
    },
  },
  etherscan: {
    apiKey: `${ETHERSCAN_API_KEY}`,
  },
};

export default config;
