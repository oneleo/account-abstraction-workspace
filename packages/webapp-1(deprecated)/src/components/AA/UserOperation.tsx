import * as React from "react"
import * as Ethers6 from "ethers"
import * as UserOp from "userop"
import * as Debounce from "use-debounce"
import * as Wagmi from "wagmi"
import * as Viem from "viem"

// Contracts ABIs
import {
    abi as abiEntryPoint,
    bytecode as bytecodeEntryPoint,
} from "@account-abstraction/contracts/artifacts/EntryPoint.json"

const title = "User Operation"

// AA Contract Addresses
const EntryPointAddress = "0x0C8E79F3534B00D9a3D4a856B665Bf4eBC22f2ba"

export const UserOperation = () => {
    // -----------------------
    // -- React State Hooks --
    // -----------------------

    // -----------------------
    // -- Set State Hooks --
    // -----------------------

    // --------------------
    // -- State Debounce --
    // --------------------

    // -----------------
    // -- Wagmi Hooks --
    // -----------------
    const { address, isConnected } = Wagmi.useAccount()
    if (isConnected && address) {
        const builder = new UserOp.UserOperationBuilder().useDefaults({
            sender: address,
            signature: Ethers6.solidityPackedKeccak256(["bytes"], ["0xdead"]),
        })
        console.log(`op: ${JSON.stringify(builder.getOp())}`)
    }

    return (
        <>
            {/* <h1>{title}</h1>
            <form className="form-input">
                <div>
                    <label>Sender:</label>
                    <input type="text" id="sender" placeholder="請點選輸入" value={address} />
                </div>
                <div>
                    <label>Nonce:</label>
                    <input type="text" id="nonce" placeholder="請點選輸入" value="" />
                </div>
                <div>
                    <label>Init Code:</label>
                    <input type="text" id="initCode" placeholder="請點選輸入" value="@" />
                </div>
                <div>
                    <label>Call Data:</label>
                    <input type="text" id="callData" placeholder="請點選輸入" value="@" />
                </div>
                <div>
                    <label>Call Gas Limit:</label>
                    <input type="text" id="callGasLimit" placeholder="請點選輸入" value="@" />
                </div>
                <div>
                    <label>Verification Gas Limit:</label>
                    <input
                        type="text"
                        id="verificationGasLimit"
                        placeholder="請點選輸入"
                        value="@"
                    />
                </div>
                <div>
                    <label>Pre-Verification Gas:</label>
                    <input type="text" id="preVerificationGas" placeholder="請點選輸入" value="@" />
                </div>
                <div>
                    <label>Max Fee Per Gas:</label>
                    <input type="text" id="maxFeePerGas" placeholder="請點選輸入" value="@" />
                </div>
                <div>
                    <label>Max Priority Fee Per Gas:</label>
                    <input
                        type="text"
                        id="maxPriorityFeePerGas"
                        placeholder="請點選輸入"
                        value="@"
                    />
                </div>
                <div>
                    <label>Paymaster and Data:</label>
                    <input type="text" id="paymasterAndData" placeholder="請點選輸入" value="@" />
                </div>
                <div>
                    <label>Signature:</label>
                    <input type="text" id="signature" placeholder="請點選輸入" value="@" />
                </div>
                <div>
                    <input type="submit" value="Submit" />
                </div>
            </form> */}
        </>
    )
}
