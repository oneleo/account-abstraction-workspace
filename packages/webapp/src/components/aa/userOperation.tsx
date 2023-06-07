import * as React from "react"
import * as Ethers5 from "ethers"
import * as UserOp from "userop"
import * as Addresses from "./addressea"
import * as TypesEntryPointFactory from "@/../typechain-types/@account-abstraction/contracts/factories/EntryPoint__factory"
import * as TypesEntryPoint from "@/../typechain-types/@account-abstraction/contracts/EntryPoint"

import {
    abi as abiAccount,
    bytecode as bytecodeAccount,
} from "@account-abstraction/contracts/artifacts/SimpleAccount.json"

import "./aa.css"

const debug = true
const defaultUserOp: UserOp.IUserOperation = {
    sender: Ethers5.constants.AddressZero,
    nonce: 0,
    initCode: "0x",
    callData: "0x",
    callGasLimit: 35000,
    verificationGasLimit: 70000,
    preVerificationGas: 23000,
    maxFeePerGas: Ethers5.utils.parseUnits("20", "gwei"),
    maxPriorityFeePerGas: Ethers5.utils.parseUnits("1", "gwei"),
    paymasterAndData: "0x",
    signature: "0x",
}

export const UserOperation = () => {
    const [userOp, setUserOp] = React.useState<UserOp.IUserOperation>(defaultUserOp)

    const [error, setError] = React.useState<string>("")

    React.useEffect(() => {
        if (debug) {
            logUserOp(userOp)
        }
    }, [userOp])

    // Reset userOp
    const handleResetUserOp = () => {
        setUserOp(defaultUserOp)
    }

    const createAANonce = (key: Ethers5.BigNumberish, seq: Ethers5.BigNumberish) => {
        const maxUint192 = Ethers5.BigNumber.from("0xffffffffffffffffffffffffffffffffffffffff")
        const maxUint64 = Ethers5.BigNumber.from("0xffffffffffffffff")
        const shiftedKey = Ethers5.BigNumber.from(key).and(maxUint192).shl(64)
        const combinedValue = shiftedKey.or(Ethers5.BigNumber.from(seq).and(maxUint64))
        const uint256Value = Ethers5.utils.hexZeroPad(combinedValue.toHexString(), 32)

        return Ethers5.BigNumber.from(uint256Value)
    }

    const formatUserOp = (up: UserOp.IUserOperation) => {
        return {
            sender: Ethers5.utils.getAddress(up.sender),
            nonce: Ethers5.BigNumber.from(up.nonce),
            initCode: Ethers5.utils.hexlify(up.initCode),
            callData: Ethers5.utils.hexlify(up.callData),
            callGasLimit: Ethers5.BigNumber.from(up.callGasLimit),
            verificationGasLimit: Ethers5.BigNumber.from(up.verificationGasLimit),
            preVerificationGas: Ethers5.BigNumber.from(up.preVerificationGas),
            maxFeePerGas: Ethers5.BigNumber.from(up.maxFeePerGas),
            maxPriorityFeePerGas: Ethers5.BigNumber.from(up.maxPriorityFeePerGas),
            paymasterAndData: Ethers5.utils.hexlify(up.paymasterAndData),
            signature: Ethers5.utils.hexlify(up.signature),
        }
    }

    // Button Handler: Set the Address type and Sign
    const handleAddress = React.useCallback(async () => {
        if (!window.ethereum) {
            return
        }
        const provider = new Ethers5.providers.Web3Provider(window.ethereum)
        const signer = provider.getSigner()

        // Get userOp sig with Middleware
        const builder = new UserOp.UserOperationBuilder()
            .setPartial({
                ...userOp,
                sender: Addresses.Account, // Set the sender
            })
            .useMiddleware(UserOp.Presets.Middleware.EOASignature(signer))
        const userOpWithSig = await builder.buildOp(
            Addresses.EntryPoint,
            await provider.getSigner().getChainId(),
        )

        // Update the value on the webpage.
        // setUserOp(formatUserOp(userOpWithSig))
    }, [userOp])

    // Button Handler: Set the Transferred type and Sign
    const handleTransfer = React.useCallback(async () => {
        if (!window.ethereum) {
            return
        }

        const provider = new Ethers5.providers.Web3Provider(window.ethereum)
        const signer = provider.getSigner()
        const ifaceAccount = new Ethers5.utils.Interface(abiAccount)
        const callData = ifaceAccount.encodeFunctionData("execute", [
            Addresses.signers7,
            Ethers5.utils.parseEther("0.5"),
            Ethers5.utils.arrayify("0x"),
        ])

        // Get userOp sig by Builder
        const builder = new UserOp.UserOperationBuilder()
            .setPartial({
                ...userOp,
                // nonce: createAANonce(3, 1), // AA25 invalid account nonce
                nonce: createAANonce(3, 0),
                sender: Addresses.Account, // Set the sender, callData
                callData: callData,
            })
            .useMiddleware(UserOp.Presets.Middleware.EOASignature(signer))
        const userOpWithSig = await builder.buildOp(
            Addresses.EntryPoint,
            await provider.getSigner().getChainId(),
        )

        // Update the value on the webpage.
        // setUserOp(formatUserOp(userOpWithSig))

        //----------------------
        // -- Test: handleOps --
        //----------------------
        if (debug) {
            // Send userOp to EntryPoint directly
            const gasOverrides: Ethers5.Overrides = {
                gasLimit: Ethers5.BigNumber.from(5000000),
                gasPrice: (await provider.getFeeData()).gasPrice || Ethers5.BigNumber.from(0),
                nonce: Ethers5.BigNumber.from(9),
            }
            const contractEntryPoint = TypesEntryPointFactory.EntryPoint__factory.connect(
                Addresses.EntryPoint,
                signer,
            )

            const entryPointNonce = await contractEntryPoint.getNonce(
                Addresses.Account,
                3,
                gasOverrides,
            )
            console.log(
                `Are the Account and EntryPoint nonce equal? ${entryPointNonce.eq(
                    userOpWithSig.nonce,
                )}`,
            )

            try {
                await contractEntryPoint.handleOps(
                    [userOpWithSig],
                    await signer.getAddress(),
                    gasOverrides,
                )
            } catch (err: unknown) {
                resolveErrorMsg(err as Error)
            }
        }
    }, [userOp])

    // Button Handler: Set the Transferred with Middleware type and Sign
    const handleTransferWithCtx = React.useCallback(async () => {
        if (!window.ethereum) {
            return
        }

        const provider = new Ethers5.providers.Web3Provider(window.ethereum)
        const signer = provider.getSigner()
        const ifaceAccount = new Ethers5.utils.Interface(abiAccount)
        const callData = ifaceAccount.encodeFunctionData("execute", [
            Addresses.signers7,
            Ethers5.utils.parseEther("0.5"),
            Ethers5.utils.arrayify("0x"),
        ])

        // Get userOp hash by Ctx
        const userOpHash = new UserOp.UserOperationMiddlewareCtx(
            {
                ...userOp,
                sender: Addresses.Account, // Set the sender, callData
                callData: callData,
            },
            Addresses.EntryPoint,
            await provider.getSigner().getChainId(),
        ).getUserOpHash()
        const sig = await signer.signMessage(Ethers5.utils.arrayify(userOpHash))

        // Update the value on the webpage.
        // setUserOp(formatUserOp({ ...userOp, signature: sig }))
    }, [userOp])

    // Send transaction to EntryPoint.handleOps
    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (!window.ethereum) {
            return
        }

        const provider = new Ethers5.providers.Web3Provider(window.ethereum)
        const signer = provider.getSigner()
        const addrSigner = await signer.getAddress()

        // Declare the gas overrides argument.
        const gasOverrides: Ethers5.Overrides = {
            gasLimit: Ethers5.BigNumber.from(5000000),
            gasPrice: (await provider.getFeeData()).gasPrice || Ethers5.BigNumber.from(0),
            nonce: Ethers5.BigNumber.from(9),
            // maxFeePerGas: (await provider.getFeeData()).maxFeePerGas || Ethers5.BigNumber.from(0),
            // maxPriorityFeePerGas:
            //     (await provider.getFeeData()).maxPriorityFeePerGas || Ethers5.BigNumber.from(0),
        }

        const contractEntryPoint = TypesEntryPointFactory.EntryPoint__factory.connect(
            Addresses.EntryPoint,
            signer,
        )

        if (debug) {
            console.log(`// [debug] EntryPoint Address: ${contractEntryPoint.address}`)
            console.log(`// [debug] Signer Address: ${addrSigner}`)
            console.log(`// [debug] Chain Id: ${await signer.getChainId()}`)
            logUserOp(userOp)
        }

        let writeTransaction: Ethers5.ContractTransaction

        // try {
        //     writeTransaction = await contractEntryPoint.simulateHandleOp(
        //         userOp,
        //         addrSigner,
        //         "0x",
        //         gasOverrides,
        //     )
        // } catch (err: unknown) {
        //     resolveErrorMsg(err as Error)
        // }

        try {
            writeTransaction = await contractEntryPoint.handleOps(
                [userOp],
                addrSigner,
                gasOverrides,
            )
        } catch (err: unknown) {
            resolveErrorMsg(err as Error)
        }
    }

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = event.target
        try {
            switch (id) {
                case "sender":
                    try {
                        setUserOp({
                            ...userOp,
                            sender: Ethers5.utils.getAddress(value),
                        })
                        setError("")
                    } catch (err: unknown) {
                        setError(err instanceof Error ? err.message : String(err))
                    }
                    break
                case "nonce":
                    try {
                        setUserOp({
                            ...userOp,
                            nonce: Ethers5.BigNumber.from(value),
                        })
                        setError("")
                    } catch (err: unknown) {
                        setError(err instanceof Error ? err.message : String(err))
                    }
                    break
                case "initCode":
                    try {
                        setUserOp({
                            ...userOp,
                            initCode: Ethers5.utils.hexlify(value),
                        })
                        setError("")
                    } catch (err: unknown) {
                        setError(err instanceof Error ? err.message : String(err))
                    }
                    break
                case "callData":
                    try {
                        setUserOp({
                            ...userOp,
                            callData: Ethers5.utils.hexlify(value),
                        })
                        setError("")
                    } catch (err: unknown) {
                        setError(err instanceof Error ? err.message : String(err))
                    }
                    break
                case "callGasLimit":
                    try {
                        setUserOp({
                            ...userOp,
                            callGasLimit: Ethers5.BigNumber.from(value),
                        })
                        setError("")
                    } catch (err: unknown) {
                        setError(err instanceof Error ? err.message : String(err))
                    }
                    break
                case "verificationGasLimit":
                    try {
                        setUserOp({
                            ...userOp,
                            verificationGasLimit: Ethers5.BigNumber.from(value),
                        })
                        setError("")
                    } catch (err: unknown) {
                        setError(err instanceof Error ? err.message : String(err))
                    }
                    break
                case "preVerificationGas":
                    try {
                        setUserOp({
                            ...userOp,
                            preVerificationGas: Ethers5.BigNumber.from(value),
                        })
                        setError("")
                    } catch (err: unknown) {
                        setError(err instanceof Error ? err.message : String(err))
                    }
                    break
                case "maxFeePerGas":
                    try {
                        setUserOp({
                            ...userOp,
                            maxFeePerGas: Ethers5.BigNumber.from(value),
                        })
                        setError("")
                    } catch (err: unknown) {
                        setError(err instanceof Error ? err.message : String(err))
                    }
                    break
                case "maxPriorityFeePerGas":
                    try {
                        setUserOp({
                            ...userOp,
                            maxPriorityFeePerGas: Ethers5.BigNumber.from(value),
                        })
                        setError("")
                    } catch (err: unknown) {
                        setError(err instanceof Error ? err.message : String(err))
                    }
                    break
                case "paymasterAndData":
                    try {
                        setUserOp({
                            ...userOp,
                            paymasterAndData: Ethers5.utils.hexlify(value),
                        })
                        setError("")
                    } catch (err: unknown) {
                        setError(err instanceof Error ? err.message : String(err))
                    }
                    break
                case "signature":
                    try {
                        setUserOp({
                            ...userOp,
                            signature: Ethers5.utils.hexlify(value),
                        })
                        setError("")
                    } catch (err: unknown) {
                        setError(err instanceof Error ? err.message : String(err))
                    }
                    break
                default:
                    break
            }
            setError("") // 清除先前的錯誤訊息
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : String(err)) // 設置錯誤訊息狀態
            return
        }
    }

    const aaForm = (userOp: UserOp.IUserOperation) => {
        return (
            <>
                <form onSubmit={handleSubmit}>
                    <div className="form-input">
                        <div>
                            <label>Sender:</label>
                            <input
                                type="text"
                                id="sender"
                                placeholder="請點選輸入"
                                value={`${userOp.sender}`}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <label>Nonce:</label>
                            <input
                                type="text"
                                id="nonce"
                                placeholder="請點選輸入"
                                value={`${userOp.nonce}`}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <label>Init Code:</label>
                            <input
                                type="text"
                                id="initCode"
                                placeholder="請點選輸入"
                                value={`${userOp.initCode}`}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <label>Call Data:</label>
                            <input
                                type="text"
                                id="callData"
                                placeholder="請點選輸入"
                                value={`${userOp.callData}`}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <label>Call Gas Limit:</label>
                            <input
                                type="text"
                                id="callGasLimit"
                                placeholder="請點選輸入"
                                value={`${userOp.callGasLimit}`}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <label>Verification Gas Limit:</label>
                            <input
                                type="text"
                                id="verificationGasLimit"
                                placeholder="請點選輸入"
                                value={`${userOp.verificationGasLimit}`}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <label>Pre-Verification Gas:</label>
                            <input
                                type="text"
                                id="preVerificationGas"
                                placeholder="請點選輸入"
                                value={`${userOp.preVerificationGas}`}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <label>Max Fee Per Gas:</label>
                            <input
                                type="text"
                                id="maxFeePerGas"
                                placeholder="請點選輸入"
                                value={`${userOp.maxFeePerGas}`}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <label>Max Priority Fee Per Gas:</label>
                            <input
                                type="text"
                                id="maxPriorityFeePerGas"
                                placeholder="請點選輸入"
                                value={`${userOp.maxPriorityFeePerGas}`}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <label>Paymaster and Data:</label>
                            <input
                                type="text"
                                id="paymasterAndData"
                                placeholder="請點選輸入"
                                value={`${userOp.paymasterAndData}`}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <label>Signature:</label>
                            <input
                                type="text"
                                id="signature"
                                placeholder="請點選輸入"
                                value={`${userOp.signature}`}
                                onChange={handleChange}
                            />
                        </div>
                        {error && <text className="Error">{`error: ${error}`}</text>}
                    </div>
                    <div>
                        <div>
                            <input disabled={!!error} type="submit" value="Submit" />
                        </div>
                    </div>
                </form>
                <div>
                    <button onClick={() => handleResetUserOp()}>Reset the UserOp</button>
                </div>
            </>
        )
    }

    return (
        <div>
            <div>
                <div>
                    <button onClick={() => handleAddress()}>Set the Address type and Sign</button>
                </div>
                <div>
                    <button onClick={() => handleTransfer()}>
                        Set the Transferred type and Sign
                    </button>
                </div>
                <div>
                    <button onClick={() => handleTransferWithCtx()}>
                        Set the Transferred type with Ctx and Sign
                    </button>
                </div>
            </div>
            <div>{userOp && aaForm(userOp)}</div>
        </div>
    )
}

const logUserOp = (userOp: UserOp.IUserOperation) => {
    console.log(`// [Log] UserOp: ${JSON.stringify(userOp)}`)
}

const resolveErrorMsg = (err: Error) => {
    if (debug) {
        const message = err.message.toString()
        const regex = /return data: (0x[0-9a-fA-F]+)/
        const match = message.match(regex)
        const data = match ? match[1] : ""

        const method = Ethers5.utils.hexDataSlice(data, 0, 4)
        const parms = Ethers5.utils.hexDataSlice(data, 4)

        const errorExecutionResult = Ethers5.utils
            .id("ExecutionResult(uint256,uint256,uint48,uint48,bool,bytes)")
            .substring(0, 10) // 0x8b7ac980
        const errorFailedOp = Ethers5.utils.id("FailedOp(uint256,string)").substring(0, 10) // 0x220266b6

        let output
        switch (method.toString()) {
            case errorExecutionResult:
                output = Ethers5.utils.defaultAbiCoder.decode(
                    ["uint256", "uint256", "uint48", "uint48", "bool", "bytes"],
                    parms,
                )
                break
            case errorFailedOp:
                output = Ethers5.utils.defaultAbiCoder.decode(["uint256", "string"], parms)
                break
            default:
                // 如果前缀不匹配任何情况，则执行其他操作
                output = parms
                break
        }

        console.log(`// [Error] ${JSON.stringify(output)}`)
    }
}
