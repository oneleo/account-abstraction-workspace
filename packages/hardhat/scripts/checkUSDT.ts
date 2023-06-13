import hre from "hardhat";
import { BigNumber, utils } from "ethers"

import { abi as abiErc20 } from "@openzeppelin/contracts/build/contracts/ERC20.json"
import { abi as abiAccount, bytecode as bytecodeAccount } from "@account-abstraction/contracts/artifacts/SimpleAccount.json"

const debug = false

const USDT_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7"

const USER_ADDRESS = "0x5704Cf1BaeAb8e893d8FF493E0d8CF711E4BDE99"
const SIGNER6_ADDRESS = "0x81578FBe3Ca2941e50404Ec4E713625169C33e53"
const SIGNER7_ADDRESS = "0xf4fE3D5e739ade5f870CF421521A6fFDb18D1EE5"
const ACCOUNT_ADDRESS = "0x40fDEaDE1360334b60218959fE077d94d85bAa3F"

async function main() {
    const contractUsdt = await hre.ethers.getContractAt(abiErc20, USDT_ADDRESS); // Read contract
    console.log(
        `↳ The Account's USDT amount: ${await contractUsdt.balanceOf(ACCOUNT_ADDRESS)}.\n`,
        `↳ The User's USDT amount: ${await contractUsdt.balanceOf(USER_ADDRESS)}.\n`,
        `↳ The Signer6's USDT amount: ${await contractUsdt.balanceOf(SIGNER6_ADDRESS)}.\n`,
        `↳ The Signer7's USDT amount: ${await contractUsdt.balanceOf(SIGNER7_ADDRESS)}.\n`,
    )

    // ------------------------
    // -- USDT Transfer Test --
    // ------------------------
    if (debug) {
        // The user exchanges ethers for USDT, which are then transferred to the Account contract.
        const signers = await hre.ethers.getSigners()
        const user = signers[0]

        const toAddress = SIGNER7_ADDRESS // Signer7
        const tokenAmount = BigNumber.from(1000000) // 1 USDT

        const contractAccountWrite = new hre.ethers.Contract(ACCOUNT_ADDRESS, abiAccount, user); // Write contract
        const ifaceErc20 = new utils.Interface(abiErc20)

        const encodeTransfer = ifaceErc20.encodeFunctionData("transfer", [
            utils.getAddress(toAddress),
            BigNumber.from(tokenAmount),
        ])
        await contractAccountWrite.connect(user).execute(
            utils.getAddress(USDT_ADDRESS), // dest
            BigNumber.from(0), // value
            encodeTransfer, // func
        )

        console.log(
            `  ↳ The Account's USDT amount: ${await contractUsdt.balanceOf(ACCOUNT_ADDRESS)}.\n`,
            `  ↳ The Signer6's USDT amount: ${await contractUsdt.balanceOf(SIGNER6_ADDRESS)}.\n`,
            `  ↳ The Signer7's USDT amount: ${await contractUsdt.balanceOf(SIGNER7_ADDRESS)}.\n`,
        )
    }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
