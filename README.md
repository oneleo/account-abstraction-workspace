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
% pnpm --filter hardhat start:aa
```

- The list of AA contracts owned by Hardhat default signers[9]

| Contract Name       | Contract Address                           |
| ------------------- | ------------------------------------------ |
| UsdtOracle          | 0xe1DA8919f262Ee86f9BE05059C9280142CF23f48 |
| EntryPoint          | 0x0C8E79F3534B00D9a3D4a856B665Bf4eBC22f2ba |
| Paymaster           | 0xeD1DB453C3156Ff3155a97AD217b3087D5Dc5f6E |
| AccountFactory      | 0x12975173B87F7595EE45dFFb2Ab812ECE596Bf84 |
| AccountFactoryProxy | 0x82Dc47734901ee7d4f4232f398752cB9Dd5dACcC |

- The Account contract owned by Hardhat default signers[0]

| Contract Name | Contract Address                           |
| ------------- | ------------------------------------------ |
| Account       | 0x4FBF49dd7A7c07a89Ddf0AD6C5Dc449786BD12Ed |

## 4. Foundry Test

- Set environment variables and run the Foundry test

```shell
% MAINNET_NODE_RPC_URL="https://eth-mainnet.alchemyapi.io/v2/<YOUR_ALCHEMY_KEY>" && echo $MAINNET_NODE_RPC_URL

% source packages/contract/envrc

% pnpm --filter contract foundry-test --match-path 'test/Account.t.sol' --fork-block-number 16666666 --fork-url $MAINNET_NODE_RPC_URL
```

- The output is:

```shell
[⠢] Compiling...
No files changed, compilation skipped

Running 4 tests for test/Account.t.sol:AddressTest
[PASS] testAccount() (gas: 18372)
Logs:
  0xA18Fbbe22499CCFAf71D64bd6a5D3ec60a91A8E8
  0xe1AB8145F7E55DC933d51a18c793F901A3A0b276
  0xe1AB8145F7E55DC933d51a18c793F901A3A0b276

[PASS] testEntryPoint() (gas: 5418)
[PASS] testPaymaster() (gas: 35517)
Logs:
  18
  16660

[PASS] testUsdtOracles() (gas: 26936)
Logs:
  0xEe9F2375b4bdF6387aa8265dD4FB8F16512A1d46
  600211950628254
```

## 3. Webapp

- Not yet finished.
