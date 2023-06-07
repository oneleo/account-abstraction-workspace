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
    const [sender, setSender] = React.useState<string>(defaultUserOp.sender)
    const [nonce, setNonce] = React.useState<Ethers5.BigNumberish>(defaultUserOp.nonce)
    const [initCode, setInitCode] = React.useState<Ethers5.BytesLike>(defaultUserOp.initCode)
    const [callData, setCallData] = React.useState<Ethers5.BytesLike>(defaultUserOp.callData)
    const [callGasLimit, setCallGasLimit] = React.useState<Ethers5.BigNumberish>(
        defaultUserOp.callGasLimit,
    )
    const [verificationGasLimit, setVerificationGasLimit] = React.useState<Ethers5.BigNumberish>(
        defaultUserOp.verificationGasLimit,
    )
    const [preVerificationGas, setPreVerificationGas] = React.useState<Ethers5.BigNumberish>(
        defaultUserOp.preVerificationGas,
    )
    const [maxFeePerGas, setMaxFeePerGas] = React.useState<Ethers5.BigNumberish>(
        defaultUserOp.maxFeePerGas,
    )
    const [maxPriorityFeePerGas, setMaxPriorityFeePerGas] = React.useState<Ethers5.BigNumberish>(
        defaultUserOp.maxPriorityFeePerGas,
    )
    const [paymasterAndData, setPaymasterAndData] = React.useState<Ethers5.BytesLike>(
        defaultUserOp.paymasterAndData,
    )
    const [signature, setSignature] = React.useState<Ethers5.BytesLike>(defaultUserOp.signature)

    const [userOp, setUserOp] = React.useState<UserOp.IUserOperation>(defaultUserOp)

    const [error, setError] = React.useState<string>("")

    // Update userOp when set the eledments
    React.useEffect(() => {
        try {
            setUserOp({
                sender: Ethers5.utils.getAddress(sender),
                nonce: Ethers5.BigNumber.from(nonce),
                initCode: Ethers5.utils.hexlify(initCode),
                callData: Ethers5.utils.hexlify(callData),
                callGasLimit: Ethers5.BigNumber.from(callGasLimit),
                verificationGasLimit: Ethers5.BigNumber.from(verificationGasLimit),
                preVerificationGas: Ethers5.BigNumber.from(preVerificationGas),
                maxFeePerGas: Ethers5.BigNumber.from(maxFeePerGas),
                maxPriorityFeePerGas: Ethers5.BigNumber.from(maxPriorityFeePerGas),
                paymasterAndData: Ethers5.utils.hexlify(paymasterAndData),
                signature: Ethers5.utils.hexlify(signature),
            })
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err))
        }
    }, [
        sender,
        nonce,
        initCode,
        callData,
        callGasLimit,
        verificationGasLimit,
        preVerificationGas,
        maxFeePerGas,
        maxPriorityFeePerGas,
        paymasterAndData,
        signature,
    ])

    // Reset userOp
    const resetUserOp = () => {
        setSender(defaultUserOp.sender)
        setNonce(defaultUserOp.nonce)
        setInitCode(defaultUserOp.initCode)
        setCallData(defaultUserOp.callData)
        setCallGasLimit(defaultUserOp.callGasLimit)
        setVerificationGasLimit(defaultUserOp.verificationGasLimit)
        setPreVerificationGas(defaultUserOp.preVerificationGas)
        setMaxFeePerGas(defaultUserOp.maxFeePerGas)
        setMaxPriorityFeePerGas(defaultUserOp.maxPriorityFeePerGas)
        setPaymasterAndData(defaultUserOp.paymasterAndData)
        setSignature(defaultUserOp.signature)
        console.log(`test`)
        logUserOp(userOp)
    }

    // Button Handler: Set the Address type and Sign
    const handleAddress = async () => {
        if (!window.ethereum) {
            return
        }
        // Reset userOp
        resetUserOp()
        setError("")

        const provider = new Ethers5.providers.Web3Provider(window.ethereum)
        const signer = provider.getSigner()

        // Set the sender, then update the userOp
        setSender(Addresses.Account)

        // Get userOp hash by Ctx
        const userOpHash = new UserOp.UserOperationMiddlewareCtx(
            userOp,
            Addresses.signers7,
            await provider.getSigner().getChainId(),
        ).getUserOpHash()

        const sig = await signer.signMessage(Ethers5.utils.arrayify(userOpHash))

        // Set signature and update userOp
        setSignature(sig)
        if (debug) {
            console.log(`userOpHash: ${userOpHash}`)
            logUserOp(userOp)
        }
    }

    // Button Handler: Set the Transferred type and Sign
    const handleTransfer = async () => {
        if (!window.ethereum) {
            return
        }
        // Reset userOp
        resetUserOp()
        setError("")

        const provider = new Ethers5.providers.Web3Provider(window.ethereum)
        const signer = provider.getSigner()

        const ifaceAccount = new Ethers5.utils.Interface(abiAccount)
        const callData = ifaceAccount.encodeFunctionData("execute", [
            Addresses.signers7,
            Ethers5.utils.parseEther("0.5"),
            Ethers5.utils.arrayify("0x"),
        ])

        // Set the sender, callData, then update the userOp
        setSender(Addresses.Account)
        setCallData(callData)

        // Get userOp hash by Ctx
        const userOpHash = new UserOp.UserOperationMiddlewareCtx(
            userOp,
            Addresses.EntryPoint,
            await provider.getSigner().getChainId(),
        ).getUserOpHash()
        const sig = await signer.signMessage(Ethers5.utils.arrayify(userOpHash))

        // Get userOp sig by Builder
        const builder = new UserOp.UserOperationBuilder()
            .setPartial(userOp)
            .useMiddleware(UserOp.Presets.Middleware.EOASignature(signer))

        const userOpWithSig = await builder.buildOp(
            Addresses.EntryPoint,
            await provider.getSigner().getChainId(),
        )

        // Set signature and update userOp
        setSignature(sig)
        if (debug) {
            logUserOp(userOp)
            console.log(`are sigs same? ${sig === userOpWithSig.signature.toString()}`)
        }
    }

    // Button Handler: Set the Transferred with Middleware type and Sign
    const handleDryRun = async () => {
        if (!window.ethereum) {
            return
        }
        // Reset userOp
        resetUserOp()
        setError("")

        const provider = new Ethers5.providers.Web3Provider(window.ethereum)
        const signer = provider.getSigner()

        const ifaceAccount = new Ethers5.utils.Interface(abiAccount)
        const callData = ifaceAccount.encodeFunctionData("execute", [
            Addresses.signers7,
            Ethers5.utils.parseEther("0.5"),
            Ethers5.utils.arrayify("0x"),
        ])

        // Set the sender, callData, then update the userOp
        setSender(Addresses.Account)
        setCallData(callData)

        // Get userOp sig by Builder
        const builder = new UserOp.UserOperationBuilder()
            .setPartial(userOp)
            .useMiddleware(UserOp.Presets.Middleware.EOASignature(signer))

        const userOpWithSig = await builder.buildOp(
            Addresses.EntryPoint,
            await provider.getSigner().getChainId(),
        )

        // Set the signature and update userOp
        setSignature(userOpWithSig.signature)
        if (debug) {
            logUserOp(userOp)
        }
    }

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
                    setSender(value.toString())
                    break
                case "nonce":
                    setNonce(value)
                    break
                case "initCode":
                    setInitCode(value.toString())
                    break
                case "callData":
                    setCallData(value.toString())
                    break
                case "callGasLimit":
                    setCallGasLimit(value)
                    break
                case "verificationGasLimit":
                    setVerificationGasLimit(value)
                    break
                case "preVerificationGas":
                    setPreVerificationGas(value)
                    break
                case "maxFeePerGas":
                    setMaxFeePerGas(value)
                    break
                case "maxPriorityFeePerGas":
                    setMaxPriorityFeePerGas(value)
                    break
                case "paymasterAndData":
                    setPaymasterAndData(value.toString())
                    break
                case "signature":
                    setSignature(value.toString())
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
                        <input type="submit" value="Submit" />
                    </div>
                </form>
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
                    <button onClick={() => handleDryRun()}>
                        Set the Transferred type with Middleware and Sign
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
