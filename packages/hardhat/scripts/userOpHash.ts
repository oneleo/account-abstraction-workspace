import * as Hardhat from "hardhat";
import * as Ethers5 from "ethers"
import * as UserOp from "userop"

import "dotenv/config"

import { abi as abiErc1967Proxy, bytecode as bytecodeErc1967Proxy } from "@openzeppelin/contracts/build/contracts/ERC1967Proxy.json"
import { abi as abiEntryPoint, bytecode as bytecodeEntryPoint } from "@account-abstraction/contracts/artifacts/EntryPoint.json"
import { abi as abiAccountFactory, bytecode as bytecodeAccountFactory } from "@account-abstraction/contracts/artifacts/SimpleAccountFactory.json"

const debug = true

const ALCHEMY_TOKEN = process.env.ALCHEMY_TOKEN || ""
const rpcUrl = `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_TOKEN}`

const networkName = Hardhat.network.name
const chainId = Hardhat.network.config["chainId"]

const SALT = Ethers5.BigNumber.from(333666999)
const DATA = Ethers5.utils.arrayify("0x")

const signers7 = "0x14dC79964da2C08b23698B3D3cc7Ca32193d9955"

const main = async () => {
    const provider = Hardhat.ethers.provider
    const signer = provider.getSigner()

    if (debug) {
        console.log("URL:", rpcUrl)
        console.log("Chain ID:", chainId)
    }

    // Declare the gas overrides argument.
    const gasOverrides: Ethers5.Overrides = (networkName === "hardhat") ? {
    } : {
        gasLimit: Ethers5.BigNumber.from(5000000),
        maxFeePerGas: (await Hardhat.ethers.provider.getFeeData()).maxFeePerGas || Ethers5.BigNumber.from(0),
        maxPriorityFeePerGas: (await Hardhat.ethers.provider.getFeeData()).maxPriorityFeePerGas || Ethers5.BigNumber.from(0),
    }

    // Deploy the EntryPoint contract on localhost.
    const contractEntryPoint = await (
        await Hardhat.ethers.getContractFactory(abiEntryPoint, bytecodeEntryPoint, signer)
    ).deploy(gasOverrides)
    console.log(`+ EntryPoint deployed to the address ${contractEntryPoint.address} on the ${networkName}.`)


    // Deploy the AccountFactory contract on localhost.
    const contractAccountFactory = await (
        await Hardhat.ethers.getContractFactory(abiAccountFactory, bytecodeAccountFactory, signer)
    ).deploy(contractEntryPoint.address)
    console.log(
        `+ AccountFactory deployed to the address ${contractAccountFactory.address} on the ${networkName}.`
    )

    // Deploy the ERC1967Proxy contract on localhost.
    const contractErc1967Proxy = await (
        await Hardhat.ethers.getContractFactory(abiErc1967Proxy, bytecodeErc1967Proxy, signer)
    ).deploy(contractAccountFactory.address, DATA, gasOverrides)
    console.log(
        `+ ERC1967Proxy deployed to the address ${contractErc1967Proxy.address} on the ${networkName}.`
    )
    // To obtain an instance of the ERC1967Proxy contract using the AccountFactory ABI.
    const contractAccountFactoryProxy = await Hardhat.ethers.getContractAt(abiAccountFactory, contractErc1967Proxy.address);

    console.log("000")

    const simpleAccount = await UserOp.Presets.Builder.SimpleAccount.init(
        signer,
        rpcUrl,
        contractEntryPoint.address,
        contractErc1967Proxy.address,
    )
    console.log("111")

    const client = await UserOp.Client.init(rpcUrl, contractEntryPoint.address)
    console.log("222")
    let res
    try {
        res = await client.sendUserOperation(
            simpleAccount.execute(
                signers7,
                Ethers5.utils.parseEther("0.5"), \
                Ethers5.utils.arrayify("0x"),
            ),
            {
                dryRun: true,
                onBuild: (op) => {
                    console.log("333")
                    console.log("Signed UserOperation:", op)
                },
            },
        )
    } catch (e) { }
    console.log(`UserOpHash: ${res?.userOpHash}`)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});