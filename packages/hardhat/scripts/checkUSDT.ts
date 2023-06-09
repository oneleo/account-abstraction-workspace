import hre from "hardhat";
import { BigNumber, utils } from "ethers"

import { abi as abiErc20 } from "@openzeppelin/contracts/build/contracts/ERC20.json"
import { abi as abiAccount, bytecode as bytecodeAccount } from "@account-abstraction/contracts/artifacts/SimpleAccount.json"

const debug = true

const USDT_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7"

const SIGNER6_ADDRESS = "0x976EA74026E726554dB657fA54763abd0C3a0aa9"
const SIGNER7_ADDRESS = "0x14dC79964da2C08b23698B3D3cc7Ca32193d9955"
const ACCOUNT_ADDRESS = "0xF16D0B4a4332237454D0ee4278968188739C6eED"

async function main() {
    const contractUsdt = await hre.ethers.getContractAt(abiErc20, USDT_ADDRESS); // Read contract
    console.log(
        `↳ The Account's USDT amount: ${await contractUsdt.balanceOf(ACCOUNT_ADDRESS)}.\n`,
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

        const toAddress = "0x14dC79964da2C08b23698B3D3cc7Ca32193d9955" // Signer7
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
