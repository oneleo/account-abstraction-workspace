# account-abstraction-workspace

## 1. Initialize

```shell
% pnpm install
```

## 2. Install and start Ganache on localhost

- Install Ganache CLI

```shell
% pnpm add --global ganache-cli
```

- Start Ganache on the localhost

```
% MAINNET_NODE_RPC_URL="https://eth-mainnet.alchemyapi.io/v2/<YOUR_ALCHEMY_KEY>" && echo $MAINNET_NODE_RPC_URL

% BLOCKN_UMBER="16666666" && echo $BLOCKN_UMBER

% MNEMONIC="test test test test test test test test test test test junk" && echo $MNEMONIC

% ganache-cli --fork "$MAINNET_NODE_RPC_URL"@"$BLOCKN_UMBER" --mnemonic "$MNEMONIC"
```

## 3. Deploy AA contracts to the localhost node

```
% pnpm --filter hardhat hardhat run scripts/deployAA.ts --network ganache
```

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
