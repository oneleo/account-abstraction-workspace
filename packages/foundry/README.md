# AA Foundry Test

-   Set environment variables and run the Foundry test

```shell
% MAINNET_NODE_RPC_URL="https://eth-mainnet.alchemyapi.io/v2/<YOUR_ALCHEMY_KEY>" && echo $MAINNET_NODE_RPC_URL

% source packages/foundry/envrc

% pnpm --filter foundry foundry-test --match-path 'test/Account.t.sol' --fork-block-number 16666666 --fork-url $MAINNET_NODE_RPC_URL
```
