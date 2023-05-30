import hre from "hardhat";
import { BigNumber, Overrides } from "ethers"

// Import contract ABIs.
import { abi as abiTest, bytecode as bytecodeTest } from "../artifacts/contracts/Lock.sol/Lock.json"
import { abi as abiIerc20 } from "@openzeppelin/contracts/build/contracts/IERC20.json"
import abiAggregatorV2V3Interface from "@chainlink/contracts/abi/v0.8/AggregatorV2V3Interface.json"
import { abi as abiUsdtOracle, bytecode as bytecodeUsdtOracle } from "../artifacts/contracts/UsdtOracle.sol/UsdtOracle.json"
import { abi as abiEntryPoint, bytecode as bytecodeEntryPoint } from "@account-abstraction/contracts/artifacts/EntryPoint.json"
import { abi as abiDepositPaymaster, bytecode as bytecodeDepositPaymaster } from "@account-abstraction/contracts/artifacts/DepositPaymaster.json"
import { abi as abiSimpleAccountFactory, bytecode as bytecodeSimpleAccountFactory } from "@account-abstraction/contracts/artifacts/SimpleAccountFactory.json"
import { abi as abiSimpleAccount, bytecode as bytecodeSimpleAccount } from "@account-abstraction/contracts/artifacts/SimpleAccount.json"

async function main() {
    // Get the Hatdhat network name.
    const networkName = hre.network.name

    // Declare the gas overrides argument.
    const gasOverrides: Overrides = (networkName === "ganache" || networkName === "localhost") ? {} : {
        gasLimit: BigNumber.from(5000000),
        maxFeePerGas: (await hre.ethers.provider.getFeeData()).maxFeePerGas || BigNumber.from(0),
        maxPriorityFeePerGas: (await hre.ethers.provider.getFeeData()).maxPriorityFeePerGas || BigNumber.from(0),
    }

    // Get the signers from Hardhat accounts.
    const signers = await hre.ethers.getSigners()
    const contractOwner = signers[9]

    console.log(`The AA contract owner's address is ${contractOwner.address}.`)

    // Deploy the EntryPoint contract on localhost.
    const contractEntryPoint = await (
        await hre.ethers.getContractFactory(abiEntryPoint, bytecodeEntryPoint, contractOwner)
    ).deploy(gasOverrides)

    console.log(
        `EntryPoint deployed to the address ${contractEntryPoint.address} on the ${networkName}.`
    );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
