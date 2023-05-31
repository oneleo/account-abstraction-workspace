import hre from "hardhat";
import { BigNumber, Overrides, ContractTransaction } from "ethers"

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

const USDT_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7"
const USDT_ETH_CHAINLINK = "0xEe9F2375b4bdF6387aa8265dD4FB8F16512A1d46"
const SALT = BigNumber.from(333666999)
const DATA = String('0x')

async function main() {
    // Get the Hatdhat network name.
    const networkName = hre.network.name

    // Declare the gas overrides argument.
    const gasOverrides: Overrides = (networkName === "localhost") ? {} : {
        gasLimit: BigNumber.from(5000000),
        maxFeePerGas: (await hre.ethers.provider.getFeeData()).maxFeePerGas || BigNumber.from(0),
        maxPriorityFeePerGas: (await hre.ethers.provider.getFeeData()).maxPriorityFeePerGas || BigNumber.from(0),
    }

    // Get the signers from Hardhat accounts.
    const signers = await hre.ethers.getSigners()
    const aAOwner = signers[9]
    const user = signers[0]
    console.log(`The AA contract owner's address is ${aAOwner.address}.`)
    console.log(`The AA user's address is ${aAOwner.address}.`)

    const contractUsdt = await hre.ethers.getContractAt(abiIErc20, USDT_ADDRESS);
    const usdtAggregator = await hre.ethers.getContractAt(abiAggregatorV2V3Interface, USDT_ETH_CHAINLINK)

    // Deploy the UsdtOracle contract on localhost.
    const contractUsdtOracle = await (
        await hre.ethers.getContractFactory(abiUsdtOracle, bytecodeUsdtOracle, aAOwner)
    ).deploy(usdtAggregator.address)
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
        await hre.ethers.getContractFactory(abiPaymaster, bytecodePaymaster, aAOwner)
    ).deploy(contractEntryPoint.address)
    await contractPaymaster.connect(aAOwner).addToken(contractUsdt.address, contractUsdtOracle.address)
    console.log(`+ Paymaster deployed to the address ${contractPaymaster.address} on the ${networkName}.`)

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
    ).deploy(contractAccountFactory.address, DATA)
    console.log(
        `+ ERC1967Proxy deployed to the address ${contractErc1967Proxy.address} on the ${networkName}.`
    )

    const contractAccountFactoryProxy = await hre.ethers.getContractAt(abiAccountFactory, contractErc1967Proxy.address);

    // Deploy the Account contract using the AccountFactory on the localhost.
    // Note: When a function changes the state of a contract, it will return a ContractTransaction object.
    const creatingAccount: ContractTransaction = await (await contractAccountFactoryProxy.createAccount(user.address, SALT)).wait()
    console.log(`The executing 'createAccount' transaction's 'from' address: ${creatingAccount.from}`)

    const contractAccountAddress = await contractAccountFactoryProxy.getAddress(user.address, SALT)

    const contractAccount = await hre.ethers.getContractAt(abiAccount, contractAccountAddress);

    console.log(
        `+ Account deployed to the address ${contractAccount.address} on the ${networkName}.`
    )
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
