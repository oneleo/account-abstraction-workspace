# account-abstraction-workspace

## 1. Initialize

```shell
% pnpm install
```

## 2. Install and start Hardhat node on localhost

- Set Hardhat environment

```shell
% PKG1="hardhat" && cp packages/${PKG1}/.env.example packages/${PKG1}/.env
% code packages/${PKG1}/.env

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
| UsdtOracle          | 0x010500B4fA17a2350104D825e155c1bC93bfB1Be | signers[9] |
| EntryPoint          | 0x3Fe10E5Bf9809abBD60953032C4996DD7bf07D5c | signers[9] |
| Paymaster           | 0xFA312E29C8C864036E0e702b453f55f6088E4Ea1 | signers[8] |
| AccountFactory      | 0x70f33E1Caacc99a98F1D1995Aa9095255F0de0B4 | signers[9] |
| AccountFactoryProxy | 0xE0Cc10b05bD1d78950A9D065f080E2Aa308839a6 | signers[9] |

- The Account contract owned by Hardhat default signers[0]

| Contract Name | Contract Address                           | Owner      |
| ------------- | ------------------------------------------ | ---------- |
| Account       | 0x40fDEaDE1360334b60218959fE077d94d85bAa3F | signers[0] |

- The signers list

| Contract Name | Contract Address                           |
| ------------- | ------------------------------------------ |
| signers[0]    | 0x5704Cf1BaeAb8e893d8FF493E0d8CF711E4BDE99 |
| signers[1]    | 0x05168c17d72e5E5d89243B26942ADDDC692dfB70 |
| signers[2]    | 0x1935B14D6b74444383724229C0fB3449fa7e4C2f |
| signers[3]    | 0xD20Ac2d18A06E7E8248027856F32d4C00447Df39 |
| signers[4]    | 0xbfeA97f38Da881D997Ae28924Af223aaa165EfA9 |
| signers[5]    | 0xb6B4ac292B14e046DBEf91EB8308bC8Cb3211c92 |
| signers[6]    | 0x81578FBe3Ca2941e50404Ec4E713625169C33e53 |
| signers[7]    | 0xf4fE3D5e739ade5f870CF421521A6fFDb18D1EE5 |
| signers[8]    | 0x875C1086703a4C307AC352F2908b436AF647cE8e |
| signers[9]    | 0x31F957f8e5BeCDD476f284187fAf088CC7A5DB67 |

## 4. Webapp

- Start a React service on localhost

```shell
% PKG2="webapp" && pnpm --filter ${PKG2} typechain
% pnpm --filter ${PKG2} dev
```

It will start up at [http://localhost:3000/account-abstraction](http://localhost:3000/account-abstraction).

:notebook_with_decorative_cover: Please note that it is necessary to install the [Metamask](https://metamask.io/download/) extension on your browser.

| Add a network manually | Connect MetaMask with Hardhat Network |
| ---------------------- | ------------------------------------- |
| Network name           | Hardhat Node                          |
| New RPC URL            | http://127.0.0.1:8545                 |
| Chain ID               | 1337                                  |
| Currency symbol        | ETH                                   |
