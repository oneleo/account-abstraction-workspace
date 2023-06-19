import hre from "hardhat";
import {
  BigNumber,
  Overrides,
  PayableOverrides,
  ContractTransaction,
  utils,
} from "ethers";

// Import contract ABIs.
import {
  abi as abiContractStorage,
  bytecode as bytecodeContractStorage,
} from "../artifacts/contracts/ContractStorage.sol/ContractStorage.json";
import { abi as abiErc20 } from "@openzeppelin/contracts/build/contracts/ERC20.json";
import {
  abi as abiErc1967Proxy,
  bytecode as bytecodeErc1967Proxy,
} from "@openzeppelin/contracts/build/contracts/ERC1967Proxy.json";
import abiAggregatorV2V3Interface from "@chainlink/contracts/abi/v0.8/AggregatorV2V3Interface.json";
import {
  abi as abiUsdtOracle,
  bytecode as bytecodeUsdtOracle,
} from "../artifacts/contracts/UsdtOracle.sol/UsdtOracle.json";
import {
  abi as abiEntryPoint,
  bytecode as bytecodeEntryPoint,
} from "@account-abstraction/contracts/artifacts/EntryPoint.json";
import {
  abi as abiPaymaster,
  bytecode as bytecodePaymaster,
} from "@account-abstraction/contracts/artifacts/DepositPaymaster.json";
import {
  abi as abiAccountFactory,
  bytecode as bytecodeAccountFactory,
} from "@account-abstraction/contracts/artifacts/SimpleAccountFactory.json";
import {
  abi as abiAccount,
  bytecode as bytecodeAccount,
} from "@account-abstraction/contracts/artifacts/SimpleAccount.json";
import {
  abi as abiUniswapSwapRouter,
  bytecode as bytecodeSwapRouter,
} from "@uniswap/v3-periphery/artifacts/contracts/SwapRouter.sol/SwapRouter.json";

const debug = false;
const hardhatForkNet: string = "goerli";

const WETH_ADDRESS =
  hardhatForkNet === "mainnet"
    ? "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
    : "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6";

const USDT_ADDRESS =
  hardhatForkNet === "mainnet"
    ? "0xdAC17F958D2ee523a2206206994597C13D831ec7"
    : "0xC2C527C0CACF457746Bd31B2a698Fe89de2b6d49";

const USDC_ADDRESS =
  hardhatForkNet === "mainnet"
    ? "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
    : "0x07865c6E87B9F70255377e024ace6630C1Eaa37F";

// https://docs.uniswap.org/contracts/v3/reference/deployments
const UNISWAP_SWAP_ROUTER_ADDRESS =
  hardhatForkNet === "mainnet"
    ? "0xE592427A0AEce92De3Edee1F18E0157C05861564"
    : "0xE592427A0AEce92De3Edee1F18E0157C05861564";
const UNISWAP_POOL_FEE = 3000; // 0.3% expressed in hundredths of a bip

// https://docs.chain.link/data-feeds/price-feeds/addresses
const ETH_USD_GOERLI_CHAINLINK = "0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e";
const USDT_ETH_CHAINLINK =
  hardhatForkNet === "mainnet"
    ? "0xEe9F2375b4bdF6387aa8265dD4FB8F16512A1d46"
    : ETH_USD_GOERLI_CHAINLINK;
const USDC_ETH_CHAINLINK =
  hardhatForkNet === "mainnet"
    ? "0x986b5E1e1755e3C2440e960477f25201B0a8bbD4"
    : ETH_USD_GOERLI_CHAINLINK;

const SALT = BigNumber.from(333666999);
const DATA = String("0x");
// Get the Hatdhat network name.
const networkName = hre.network.name;

async function main() {
  let writeTransaction: ContractTransaction;

  // Get the signers and timestamp from Hardhat accounts.
  const signers = await hre.ethers.getSigners();
  const aAOwner = signers[9];
  const paymasterOwner = signers[8];
  const storageOwner = signers[7];
  const user = signers[0];
  const blockTimeStamp = (
    await hre.ethers.provider.getBlock(
      await hre.ethers.provider.getBlockNumber()
    )
  ).timestamp;
  console.log(
    `+ EOA addresses:\n`,
    `  ↳ The AA contract owner's address is ${aAOwner.address}.\n`,
    `  ↳ The AA user's address is ${user.address}.\n`,
    `  ↳ The Paymaster owner's address is ${paymasterOwner.address}.`,
    `  ↳ The block timestamp is ${blockTimeStamp}.`
  );

  // Declare the gas overrides argument.
  const gasOverrides: Overrides =
    networkName === "localhost"
      ? {}
      : {
          gasLimit: BigNumber.from(5000000),
          maxFeePerGas:
            (await hre.ethers.provider.getFeeData()).maxFeePerGas ||
            BigNumber.from(0),
          maxPriorityFeePerGas:
            (await hre.ethers.provider.getFeeData()).maxPriorityFeePerGas ||
            BigNumber.from(0),
        };

  // Declare the gas overrides argument.
  const value10Overrides: PayableOverrides = {
    ...gasOverrides,
    value: hre.ethers.utils.parseEther("10"),
  };

  // Deploy the ContractStorage contract on localhost.
  const contractStorage = await (
    await hre.ethers.getContractFactory(
      abiContractStorage,
      bytecodeContractStorage,
      storageOwner
    )
  ).deploy(gasOverrides);
  writeTransaction = await contractStorage.setSigner(
    9,
    aAOwner.address,
    gasOverrides
  ); // Store the address
  writeTransaction = await contractStorage.setSigner(
    8,
    paymasterOwner.address,
    gasOverrides
  ); // Store the address
  writeTransaction = await contractStorage.setSigner(
    7,
    storageOwner.address,
    gasOverrides
  ); // Store the address
  writeTransaction = await contractStorage.setSigner(
    6,
    signers[6].address,
    gasOverrides
  ); // Store the address
  writeTransaction = await contractStorage.setSigner(
    5,
    signers[5].address,
    gasOverrides
  ); // Store the address
  writeTransaction = await contractStorage.setSigner(
    4,
    signers[4].address,
    gasOverrides
  ); // Store the address
  writeTransaction = await contractStorage.setSigner(
    3,
    signers[3].address,
    gasOverrides
  ); // Store the address
  writeTransaction = await contractStorage.setSigner(
    2,
    signers[2].address,
    gasOverrides
  ); // Store the address
  writeTransaction = await contractStorage.setSigner(
    1,
    signers[1].address,
    gasOverrides
  ); // Store the address
  writeTransaction = await contractStorage.setSigner(
    0,
    user.address,
    gasOverrides
  ); // Store the address
  console.log(
    `+ ContractStorage deployed to the address ${contractStorage.address} on the ${networkName}.`
  );

  // Get the USDT contract instance.
  const contractUsdc = await hre.ethers.getContractAt(abiErc20, USDC_ADDRESS); // Read-only contract instance
  const usdtAggregator = await hre.ethers.getContractAt(
    abiAggregatorV2V3Interface,
    USDC_ETH_CHAINLINK
  ); // Read-only contract instance

  // Deploy the UsdtOracle contract on localhost.
  const contractUsdtOracle = await (
    await hre.ethers.getContractFactory(
      abiUsdtOracle,
      bytecodeUsdtOracle,
      aAOwner
    )
  ).deploy(usdtAggregator.address, gasOverrides);
  writeTransaction = await contractStorage.setUsdtOracleAddress(
    contractUsdtOracle.address,
    gasOverrides
  ); // Store the address
  writeTransaction = await contractStorage.setContractOwner(
    contractUsdtOracle.address,
    aAOwner.address,
    gasOverrides
  ); // Store the address
  console.log(
    `+ UsdtOracle deployed to the address ${contractUsdtOracle.address} on the ${networkName}.`
  );

  // Deploy the EntryPoint contract on localhost.
  const contractEntryPoint = await (
    await hre.ethers.getContractFactory(
      abiEntryPoint,
      bytecodeEntryPoint,
      aAOwner
    )
  ).deploy(gasOverrides);
  writeTransaction = await contractStorage.setEntryPointAddress(
    contractEntryPoint.address,
    gasOverrides
  ); // Store the address
  writeTransaction = await contractStorage.setContractOwner(
    contractEntryPoint.address,
    aAOwner.address,
    gasOverrides
  ); // Store the address
  console.log(
    `+ EntryPoint deployed to the address ${contractEntryPoint.address} on the ${networkName}.`
  );

  // Deploy the Paymaster contract on localhost.
  const contractPaymaster = await (
    await hre.ethers.getContractFactory(
      abiPaymaster,
      bytecodePaymaster,
      paymasterOwner
    )
  ).deploy(contractEntryPoint.address, gasOverrides);
  // Add the USDT token to the Paymaster contract.
  writeTransaction = await contractPaymaster
    .connect(paymasterOwner)
    .addToken(contractUsdc.address, contractUsdtOracle.address, gasOverrides);
  if (debug) {
    console.log(
      `// [debug] Paymaster.addToken():`,
      JSON.stringify(writeTransaction)
    );
  }
  // Deposit ether(s) from the Paymaster contract to the EntryPoint.
  writeTransaction = await contractPaymaster
    .connect(paymasterOwner)
    .deposit(value10Overrides);
  if (debug) {
    console.log(
      `// [debug] Paymaster.deposit():`,
      JSON.stringify(writeTransaction)
    );
  }
  // To obtain the ether(s) deposited from the Paymaster contract to the EntryPoint.
  const depositsAmountFromPaymaster = await contractEntryPoint.deposits(
    contractPaymaster.address
  );
  writeTransaction = await contractStorage.setPaymasterAddress(
    contractPaymaster.address,
    gasOverrides
  ); // Store the address
  writeTransaction = await contractStorage.setContractOwner(
    contractPaymaster.address,
    paymasterOwner.address,
    gasOverrides
  ); // Store the address
  console.log(
    `+ Paymaster deployed to the address ${contractPaymaster.address} on the ${networkName}.\n`,
    `  ↳ The ether(s) deposited from the Paymaster contract to the EntryPoint: ${depositsAmountFromPaymaster[0]}.`
  );

  // Deploy the AccountFactory contract on localhost.
  const contractAccountFactory = await (
    await hre.ethers.getContractFactory(
      abiAccountFactory,
      bytecodeAccountFactory,
      aAOwner
    )
  ).deploy(contractEntryPoint.address);
  writeTransaction = await contractStorage.setAccountFactoryAddress(
    contractAccountFactory.address,
    gasOverrides
  ); // Store the address
  writeTransaction = await contractStorage.setContractOwner(
    contractAccountFactory.address,
    aAOwner.address,
    gasOverrides
  ); // Store the address
  console.log(
    `+ AccountFactory deployed to the address ${contractAccountFactory.address} on the ${networkName}.`
  );

  // Deploy the ERC1967Proxy contract on localhost.
  const contractErc1967Proxy = await (
    await hre.ethers.getContractFactory(
      abiErc1967Proxy,
      bytecodeErc1967Proxy,
      aAOwner
    )
  ).deploy(contractAccountFactory.address, DATA, gasOverrides);
  writeTransaction = await contractStorage.setAccountFactoryProxyAddress(
    contractErc1967Proxy.address,
    gasOverrides
  ); // Store the address
  writeTransaction = await contractStorage.setContractOwner(
    contractErc1967Proxy.address,
    aAOwner.address,
    gasOverrides
  ); // Store the address
  console.log(
    `+ ERC1967Proxy deployed to the address ${contractErc1967Proxy.address} on the ${networkName}.`
  );

  // To obtain an instance of the ERC1967Proxy contract using the AccountFactory ABI.
  const contractAccountFactoryProxy = await hre.ethers.getContractAt(
    abiAccountFactory,
    contractErc1967Proxy.address
  );

  // Deploy the Account contract using the AccountFactory on the localhost.
  // Note: When a function changes the state of a contract, it will return a ContractTransaction object.
  writeTransaction = await contractAccountFactoryProxy.createAccount(
    user.address,
    SALT,
    gasOverrides
  );
  if (debug) {
    console.log(
      `// [debug] AccountFactoryProxy.createAccount():`,
      JSON.stringify(writeTransaction)
    );
  }
  // To obtain the address of the deployed Account.
  const contractAccountAddress = await contractAccountFactoryProxy.getAddress(
    user.address,
    SALT
  );
  // To obtain the instance of the deployed Account.
  const contractAccount = await hre.ethers.getContractAt(
    abiAccount,
    contractAccountAddress
  ); // Read-only contract instance
  // The user sends ethers to the Account contract
  writeTransaction = await user.sendTransaction({
    to: contractAccount.address,
    ...value10Overrides,
  });
  if (debug) {
    console.log(
      `// [debug] The sser sends ethers to Account:`,
      JSON.stringify(writeTransaction)
    );
  }
  // Deposit ether(s) from the Account contract to the EntryPoint.
  writeTransaction = await contractAccount
    .connect(user)
    .addDeposit(value10Overrides);
  if (debug) {
    console.log(
      `// [debug] Account.addDeposit():`,
      JSON.stringify(writeTransaction)
    );
  }
  // To obtain the ether(s) deposited from the Account contract to the EntryPoint.
  const depositsAmountFromAccount = await contractEntryPoint.deposits(
    contractAccount.address
  );
  if (debug) {
    console.log(
      `// [debug] EntryPoint.deposits():`,
      JSON.stringify(depositsAmountFromAccount)
    );
  }

  // The user exchanges ethers for USDT, which are then transferred to the Account contract.
  const contractUniswapSwapRouter = new hre.ethers.Contract(
    UNISWAP_SWAP_ROUTER_ADDRESS,
    abiUniswapSwapRouter,
    user
  ); // Writable contract instance

  writeTransaction = await contractUniswapSwapRouter.exactInputSingle(
    {
      tokenIn: WETH_ADDRESS,
      tokenOut: USDC_ADDRESS,
      fee: UNISWAP_POOL_FEE,
      recipient: contractAccount.address, // The Account
      deadline: BigNumber.from(blockTimeStamp + 600),
      amountIn: value10Overrides.value,
      amountOutMinimum: BigNumber.from(0),
      sqrtPriceLimitX96: 0,
    },
    value10Overrides
  );

  writeTransaction = await contractUniswapSwapRouter.exactInputSingle(
    {
      tokenIn: WETH_ADDRESS,
      tokenOut: USDC_ADDRESS,
      fee: UNISWAP_POOL_FEE,
      recipient: user.address, // The User
      deadline: BigNumber.from(blockTimeStamp + 600),
      amountIn: value10Overrides.value,
      amountOutMinimum: BigNumber.from(0),
      sqrtPriceLimitX96: 0,
    },
    value10Overrides
  );

  // writeTransaction = await contractUniswapSwapRouter.exactInputSingle({
  //     tokenIn: WETH_ADDRESS,
  //     tokenOut: USDC_ADDRESS,
  //     fee: UNISWAP_POOL_FEE,
  //     recipient: signers[7].address, // The signer7
  //     deadline: BigNumber.from(blockTimeStamp + 600),
  //     amountIn: value10Overrides.value,
  //     amountOutMinimum: BigNumber.from(0),
  //     sqrtPriceLimitX96: 0,
  // }, value10Overrides);

  writeTransaction = await contractStorage.setAccount(
    user.address,
    SALT,
    contractAccount.address,
    gasOverrides
  ); // Store the address
  writeTransaction = await contractStorage.setContractOwner(
    contractAccount.address,
    user.address,
    gasOverrides
  ); // Store the address
  console.log(
    `+ Account deployed to the address ${contractAccount.address} on the ${networkName}.\n`,
    `  ↳ The ether(s) sent from the User EOA to the Account contract: ${await hre.ethers.provider.getBalance(
      contractAccount.address
    )}\n`,
    `  ↳ The ether(s) deposited from the Account contract to the EntryPoint: ${
      depositsAmountFromAccount[0] as BigNumber
    }.\n`,
    `  ↳ The USDC sent from the User EOA to the Account contract: ${await contractUsdc.balanceOf(
      contractAccount.address
    )}.\n`,
    `  ↳ The USDC sent from the User EOA to the User: ${await contractUsdc.balanceOf(
      user.address
    )}.\n`,
    `  ↳ The USDC sent from the User EOA to the Signer7: ${await contractUsdc.balanceOf(
      signers[7].address
    )}.\n`,
    `+ ContractStorage deployed to the address ${contractStorage.address} on the ${networkName}.\n`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
