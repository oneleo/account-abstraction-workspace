import * as React from "react"
// import * as Ethers5 from "ethers"
import ethers from "ethers"
import { solidityPackedKeccak256 } from "ethers"
import * as UserOp from "userop"
// import { useDebounce } from "use-debounce"
import * as Wagmi from "wagmi"
import * as Viem from "viem"
import {
    abi as abiEntryPoint,
    bytecode as bytecodeEntryPoint,
} from "@account-abstraction/contracts/artifacts/EntryPoint.json"

// console.log(solidityPackedKeccak256(["bytes"], ["0xdead"]))
// console.log(keccak256("0xdead"))
console.log(ethers)

const EntryPointAddress = "0x0C8E79F3534B00D9a3D4a856B665Bf4eBC22f2ba"
export const UserOperation = () => {
    const title = "Create Account"

    // const [recoveredAddress, setRecoveredAddress] = React.useState<string>()
    // const { data, error, isLoading, signMessage, variables } = Wagmi.useSignMessage()

    // const { config } = Wagmi.usePrepareContractWrite({
    //     address: EntryPointAddress,
    //     // abi: abiEntryPoint,
    //     functionName: "handleOps",
    // })

    // -----------------------
    // -- React State Hooks --
    // -----------------------
    // const [sender, setSender] = React.useState<string>("0x")
    // const [nonce, setNonce] = React.useState<string>(Ethers6.ZeroAddress)
    // const [initCode, setInitCode] = React.useState<string>(Ethers6.ZeroAddress)
    // const [callData, setCallData] = React.useState<string>(Ethers6.ZeroAddress)
    // const [callGasLimit, setCallGasLimit] = React.useState<string>(Ethers6.ZeroAddress)
    // const [verificationGasLimit, setVerificationGasLimit] = React.useState<string>(
    //     Ethers6.ZeroAddress,
    // )
    // const [preVerificationGas, setPreVerificationGas] = React.useState<string>(Ethers6.ZeroAddress)
    // const [maxFeePerGas, setMaxFeePerGas] = React.useState<string>(Ethers6.ZeroAddress)
    // const [maxPriorityFeePerGas, setMaxPriorityFeePerGas] = React.useState<string>(
    //     Ethers6.ZeroAddress,
    // )
    // const [paymasterAndData, setPaymasterAndData] = React.useState<string>(Ethers6.ZeroAddress)
    // const [signature, setSignature] = React.useState<string>(Ethers6.ZeroAddress)
    // -----------------------
    // -- Set State Hooks --
    // -----------------------

    // --------------------
    // -- State Debounce --
    // --------------------
    // -----------------
    // -- Wagmi Hooks --
    // -----------------
    const { address, isConnected } = Wagmi.useAccount({
        onConnect({ address, connector, isReconnected }) {
            console.log("Connected", { address, connector, isReconnected })
        },
        onDisconnect() {
            console.log("Disconnected")
        },
    })
    if (isConnected && address) {
        // setSender(address.toString())
        // signMessage({ message:  })

        // React.useEffect(() => {
        //     ;(async () => {
        //         if (variables?.message && data) {
        //             const recoveredAddress = await Viem.recoverMessageAddress({
        //                 message: variables?.message,
        //                 signature: data,
        //             })
        //             setRecoveredAddress(recoveredAddress)
        //         }
        //     })()
        // }, [data, variables?.message])

        const builder = new UserOp.UserOperationBuilder().useDefaults({
            sender: address,
            // signature: data,
        })
        console.log(
            `sender: ${builder.getSender()}\n`,
            `nonce: ${builder.getNonce()}\n`,
            `initCode: ${builder.getInitCode()}\n`,
            `callData: ${builder.getCallData()}\n`,
            `callGasLimit: ${builder.getCallGasLimit()}\n`,
            `verificationGasLimit: ${builder.getVerificationGasLimit()}\n`,
            `preVerificationGas: ${builder.getPreVerificationGas()}\n`,
            `maxFeePerGas: ${builder.getMaxFeePerGas()}\n`,
            `maxPriorityFeePerGas: ${builder.getMaxPriorityFeePerGas()}\n`,
            `paymasterAndData: ${builder.getPaymasterAndData()}\n`,
            `signature: ${builder.getSignature()}\n`,
            `op: ${JSON.stringify(builder.getOp())}\n`,
        )
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
