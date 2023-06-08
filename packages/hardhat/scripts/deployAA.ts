import hre from "hardhat";
import { BigNumber, Overrides, PayableOverrides, ContractTransaction } from "ethers"

// Import contract ABIs.
import { abi as abiTest, bytecode as bytecodeTest } from "../artifacts/contracts/Lock.sol/Lock.json"
import { abi as abiIErc20 } from "@openzeppelin/contracts/build/contracts/IERC20.json"
import { abi as abiErc1967Proxy, bytecode as bytecodeErc1967Proxy } from "@openzeppelin/contracts/build/contracts/ERC1967Proxy.json"
import abiAggregatorV2V3Interface from "@chainlink/contracts/abi/v0.8/AggregatorV2V3Interface.json"
import { abi as abiUsdtOracle, bytecode as bytecodeUsdtOracle } from "../artifacts/contracts/UsdtOracle.sol/UsdtOracle.json"
import { abi as abiEntryPoint, bytecode as bytecodeEntryPoint } from "@account-abstraction/contracts/artifacts/EntryPoint.json"
import { abi as abiPaymaster, bytecode as bytecodePaymaster } from "@account-abstraction/contracts/artifacts/DepositPaymaster.json"
import { abi as abiAccountFactory, bytecode as bytecodeAccountFactory } from "@account-abstraction/contracts/artifacts/SimpleAccountFactory.json"
import { abi as abiAccount, bytecode as bytecodeAccount } from "@account-abstraction/contracts/artifacts/SimpleAccount.json"
import { abi as abiUniswapSwapRouter, bytecode as bytecodeSwapRouter } from "@uniswap/v3-periphery/artifacts/contracts/SwapRouter.sol/SwapRouter.json"
const debug = true

const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
const USDT_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7"

const UNISWAP_SWAP_ROUTER_ADDRESS = "0xE592427A0AEce92De3Edee1F18E0157C05861564"
const UNISWAP_POOL_FEE = 3000 // 0.3% expressed in hundredths of a bip

const USDT_ETH_CHAINLINK = "0xEe9F2375b4bdF6387aa8265dD4FB8F16512A1d46"
const SALT = BigNumber.from(333666999)
const DATA = String('0x')
// Get the Hatdhat network name.
const networkName = hre.network.name

async function main() {
    let writeTransaction: ContractTransaction


    // Get the signers and timestamp from Hardhat accounts.
    const signers = await hre.ethers.getSigners()
    const aAOwner = signers[9]
    const paymasterOwner = signers[8]
    const user = signers[0]
    const blockTimeStamp = (await hre.ethers.provider.getBlock(await hre.ethers.provider.getBlockNumber())).timestamp
    console.log(
        `+ EOA addresses:\n`,
        `  ↳ The AA contract owner's address is ${aAOwner.address}.\n`,
        `  ↳ The AA user's address is ${user.address}.\n`,
        `  ↳ The Paymaster owner's address is ${paymasterOwner.address}.`,
        `  ↳ The block timestamp is ${blockTimeStamp}.`,
    )

    // Declare the gas overrides argument.
    const gasOverrides: Overrides = (networkName === "localhost") ? {
    } : {
        gasLimit: BigNumber.from(5000000),
        maxFeePerGas: (await hre.ethers.provider.getFeeData()).maxFeePerGas || BigNumber.from(0),
        maxPriorityFeePerGas: (await hre.ethers.provider.getFeeData()).maxPriorityFeePerGas || BigNumber.from(0),
    }

    // Declare the gas overrides argument.
    const value10Overrides: PayableOverrides = {
        ...gasOverrides,
        value: hre.ethers.utils.parseEther("10"),
    }


    const contractUsdt = await hre.ethers.getContractAt(abiIErc20, USDT_ADDRESS); // Read contract
    const usdtAggregator = await hre.ethers.getContractAt(abiAggregatorV2V3Interface, USDT_ETH_CHAINLINK) // Read contract

    // Deploy the UsdtOracle contract on localhost.
    const contractUsdtOracle = await (
        await hre.ethers.getContractFactory(abiUsdtOracle, bytecodeUsdtOracle, aAOwner)
    ).deploy(usdtAggregator.address, gasOverrides)
    console.log(
        `+ UsdtOracle deployed to the address ${contractUsdtOracle.address} on the ${networkName}.`
    )

    // Deploy the EntryPoint contract on localhost.
    const contractEntryPoint = await (
        await hre.ethers.getContractFactory(abiEntryPoint, bytecodeEntryPoint, aAOwner)
    ).deploy(gasOverrides)
    console.log(`+ EntryPoint deployed to the address ${contractEntryPoint.address} on the ${networkName}.`)

    // Deploy the Paymaster contract on localhost.
    const contractPaymaster = await (
        await hre.ethers.getContractFactory(abiPaymaster, bytecodePaymaster, paymasterOwner)
    ).deploy(contractEntryPoint.address, gasOverrides)
    // Add the USDT token to the Paymaster contract.
    writeTransaction = await contractPaymaster.connect(paymasterOwner).addToken(contractUsdt.address, contractUsdtOracle.address, gasOverrides)
    if (debug) {
        console.log(`// [debug] Paymaster.addToken():`, JSON.stringify(writeTransaction))
    }
    // Deposit ether(s) from the Paymaster contract to the EntryPoint.
    writeTransaction = await contractPaymaster.connect(paymasterOwner).deposit(value10Overrides)
    if (debug) {
        console.log(`// [debug] Paymaster.deposit():`, JSON.stringify(writeTransaction))
    }
    // To obtain the ether(s) deposited from the Paymaster contract to the EntryPoint.
    const depositsPaymaster = await contractEntryPoint.deposits(contractPaymaster.address)
    console.log(
        `+ Paymaster deployed to the address ${contractPaymaster.address} on the ${networkName}.\n`,
        `  ↳ The ether(s) deposited from the Paymaster contract to the EntryPoint: ${depositsPaymaster[0]}.`,
    )

    // Deploy the AccountFactory contract on localhost.
    const contractAccountFactory = await (
        await hre.ethers.getContractFactory(abiAccountFactory, bytecodeAccountFactory, aAOwner)
    ).deploy(contractEntryPoint.address)
    console.log(
        `+ AccountFactory deployed to the address ${contractAccountFactory.address} on the ${networkName}.`
    )

    // Deploy the ERC1967Proxy contract on localhost.
    const contractErc1967Proxy = await (
        await hre.ethers.getContractFactory(abiErc1967Proxy, bytecodeErc1967Proxy, aAOwner)
    ).deploy(contractAccountFactory.address, DATA, gasOverrides)
    console.log(
        `+ ERC1967Proxy deployed to the address ${contractErc1967Proxy.address} on the ${networkName}.`
    )
    // To obtain an instance of the ERC1967Proxy contract using the AccountFactory ABI.
    const contractAccountFactoryProxy = await hre.ethers.getContractAt(abiAccountFactory, contractErc1967Proxy.address);

    // Deploy the Account contract using the AccountFactory on the localhost.
    // Note: When a function changes the state of a contract, it will return a ContractTransaction object.
    writeTransaction = await contractAccountFactoryProxy.createAccount(user.address, SALT, gasOverrides)
    if (debug) {
        console.log(`// [debug] AccountFactoryProxy.createAccount():`, JSON.stringify(writeTransaction))
    }
    // To obtain the address of the deployed Account.
    const contractAccountAddress = await contractAccountFactoryProxy.getAddress(user.address, SALT)
    // To obtain the instance of the deployed Account.
    const contractAccount = await hre.ethers.getContractAt(abiAccount, contractAccountAddress);
    // The user sends ethers to the Account contract
    writeTransaction = await user.sendTransaction({ to: contractAccount.address, ...value10Overrides })
    if (debug) {
        console.log(`// [debug] The sser sends ethers to Account:`, JSON.stringify(writeTransaction))
    }
    // Deposit ether(s) from the Account contract to the EntryPoint.
    writeTransaction = await contractAccount.connect(user).addDeposit(value10Overrides)
    if (debug) {
        console.log(`// [debug] Account.addDeposit():`, JSON.stringify(writeTransaction))
    }
    // To obtain the ether(s) deposited from the Paymaster contract to the EntryPoint.
    const depositsAccount = await contractEntryPoint.deposits(contractAccount.address)
    if (debug) {
        console.log(`// [debug] EntryPoint.deposits():`, JSON.stringify(depositsAccount))
    }

    // The user exchanges ethers for USDT, which are then transferred to the Account contract.
    const contractUniswapSwapRouter = new hre.ethers.Contract(UNISWAP_SWAP_ROUTER_ADDRESS, abiUniswapSwapRouter, user); // Write contract

    writeTransaction = await contractUniswapSwapRouter.exactInputSingle({
        tokenIn: WETH_ADDRESS,
        tokenOut: USDT_ADDRESS,
        fee: UNISWAP_POOL_FEE,
        recipient: contractAccount.address,
        deadline: BigNumber.from(blockTimeStamp + 600),
        amountIn: value10Overrides.value,
        amountOutMinimum: BigNumber.from(0),
        sqrtPriceLimitX96: 0,
    }, value10Overrides);

    console.log(`test`)

    console.log(
        `+ Account deployed to the address ${contractAccount.address} on the ${networkName}.\n`,
        `  ↳ The ether(s) sent from the User EOA to the Account contract: ${await hre.ethers.provider.getBalance(contractAccount.address)}\n`,
        `  ↳ The ether(s) deposited from the Account contract to the EntryPoint: ${depositsAccount[0] as BigNumber}.\n`,
        `  ↳ The USDT sent from the User EOA to the Account contract:: ${await contractUsdt.balanceOf(contractAccount.address)}.`,
    )
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
