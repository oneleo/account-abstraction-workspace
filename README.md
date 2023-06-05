# account-abstraction-workspace

## 1. Initialize

```shell
% pnpm install
```

## 2. Install and start Hardhat node on localhost

- Set Hardhat environment

```shell
% cp .env.example .env
% code .env

### Edit .env
ALCHEMY_TOKEN="Created_by_https://www.alchemy.com/"
###
```

- Start Hardhat node and deploy AA contracts

```
% PKG1="hardhat" && pnpm --filter ${PKG1} start:aa
```

It will start up at [http://localhost:8545](http://localhost:8545).

- The list of AA contracts owned by Hardhat default signers[9]

| Contract Name       | Contract Address                           | Owner      |
| ------------------- | ------------------------------------------ | ---------- |
| UsdtOracle          | 0xe1DA8919f262Ee86f9BE05059C9280142CF23f48 | signers[9] |
| EntryPoint          | 0x0C8E79F3534B00D9a3D4a856B665Bf4eBC22f2ba | signers[9] |
| Paymaster           | 0xDd8cb59289bF7e324a37F74f8abB16D9F133cb2e | signers[8] |
| AccountFactory      | 0xeD1DB453C3156Ff3155a97AD217b3087D5Dc5f6E | signers[9] |
| AccountFactoryProxy | 0xf7Cd8fa9b94DB2Aa972023b379c7f72c65E4De9D | signers[9] |

- The Account contract owned by Hardhat default signers[0]

| Contract Name | Contract Address                           | Owner      |
| ------------- | ------------------------------------------ | ---------- |
| Account       | 0xF16D0B4a4332237454D0ee4278968188739C6eED | signers[0] |

## 4. Webapp

- Start a React service on localhost

```shell
% pnpm --filter ${PKG1} typechain
% PKG1="webapp" && pnpm --filter ${PKG1} dev
```

It will start up at [http://localhost:3000/account-abstraction](http://localhost:3000/account-abstraction).

:notebook_with_decorative_cover: Please note that it is necessary to install the [Metamask](https://metamask.io/download/) extension on your browser.
