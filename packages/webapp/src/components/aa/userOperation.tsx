import * as React from "react"
import * as Ethers5 from "ethers"
import * as UserOp from "userop"
import * as Addresses from "./addressea"
import * as TypesEntryPointFactory from "@/../typechain-types/@account-abstraction/contracts/factories/EntryPoint__factory"
import * as TypesAccountFactory from "@/../typechain-types/@account-abstraction/contracts/factories/SimpleAccount__factory"
import * as TypesErc20Factory from "@/../typechain-types/@openzeppelin/contracts/factories/ERC20__factory"

import * as TypesEntryPoint from "@/../typechain-types/@account-abstraction/contracts/EntryPoint"

// Avoid using "as" to prevent errors related to "Should not import the named export 'xxx' (imported as 'xxx') from default-exporting module (only default export is available soon)".
import jsonEntryPoint from "@account-abstraction/contracts/artifacts/EntryPoint.json"
import jsonAccount from "@account-abstraction/contracts/artifacts/SimpleAccount.json"
import jsonErc20 from "@openzeppelin/contracts/build/contracts/ERC20.json"

// If CSS is imported here, it will generate an error related to "The resource <URL> was preloaded using link preload but not used within a few seconds from the window’s load event. Please make sure it has an appropriate as value and it is preloaded intentionally.".
import "./aa.css"

const debug = false

const USDT_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7"

const AA_NONCE_KEY = 18

const encodeAANonce = (key: Ethers5.BigNumberish, seq: Ethers5.BigNumberish) => {
    const maxUint192 = Ethers5.BigNumber.from("0xffffffffffffffffffffffff")
    const maxUint64 = Ethers5.BigNumber.from("0xffffffffffffffff")
    const shiftedKey = Ethers5.BigNumber.from(key).and(maxUint192).shl(64)
    const combinedValue = shiftedKey.or(Ethers5.BigNumber.from(seq).and(maxUint64))
    const uint256Value = Ethers5.utils.hexZeroPad(combinedValue.toHexString(), 32)

    return Ethers5.BigNumber.from(uint256Value)
}

import { BigNumber, utils } from "ethers"

const decodeAANonce = (nonce: Ethers5.BigNumberish) => {
    const maxUint192 = Ethers5.BigNumber.from("0xffffffffffffffffffffffff")
    const maxUint64 = Ethers5.BigNumber.from("0xffffffffffffffff")

    const uint256Value = utils.hexZeroPad(Ethers5.BigNumber.from(nonce).toHexString(), 32)
    const combinedValue = Ethers5.BigNumber.from(uint256Value)

    const seq = combinedValue.and(maxUint64)
    const shiftedKey = combinedValue.shr(64).and(maxUint192)

    return {
        key: shiftedKey,
        seq: seq,
    }
}

const usdtBalance = async (address: string) => {}

const defaultUserOp: UserOp.IUserOperation = {
    sender: Ethers5.constants.AddressZero,
    nonce: encodeAANonce(AA_NONCE_KEY, 0),
    initCode: "0x",
    callData: "0x",
    callGasLimit: 70000,
    verificationGasLimit: 70000,
    preVerificationGas: 23000,
    maxFeePerGas: Ethers5.utils.parseUnits("20", "gwei"),
    maxPriorityFeePerGas: Ethers5.utils.parseUnits("1", "gwei"),
    paymasterAndData: "0x",
    signature: "0x",
}

export const UserOperation = () => {
    // -----------------
    // -- React Hooks --
    // -----------------
    const [userOp, setUserOp] = React.useState<UserOp.IUserOperation>(defaultUserOp)
    const [userOpTemp, setUserOpTemp] = React.useState<UserOp.IUserOperation>(defaultUserOp)

    const [tokenSymbol, setTokenSymbol] = React.useState<string>("ETH")
    const [toAddress, setToAddress] = React.useState<string>(Addresses.signer7)
    const [tokenAmount, setTokenAmount] = React.useState<Ethers5.BigNumberish>(
        Ethers5.BigNumber.from("1000000000000000000"),
    )

    const [error, setError] = React.useState<string>("")

    // -------------
    // -- 一般函數 --
    // -------------
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

    // ----------------------
    // -- React Use Effect --
    // ----------------------
    React.useEffect(() => {
        if (debug) {
            logUserOp(userOp)
        }
    }, [userOp])

    React.useEffect(() => {
        setUserOp(userOpTemp)
    }, [userOpTemp])

    // ----------------------
    // -- React 一般按鈕事件 --
    // ----------------------
    // Reset userOp
    const handleResetUserOp = () => {
        setUserOp(defaultUserOp)
    }

    const handleAANonceSeqPluseOne = () => {
        setUserOp({
            ...userOp,
            nonce: encodeAANonce(
                AA_NONCE_KEY,
                decodeAANonce(Ethers5.BigNumber.from(userOp.nonce)).seq.add(1),
            ),
        })
    }

    const handleListenEvent = () => {
        if (!window.ethereum) {
            console.log("MetaMask 未連接，無法監聽事件")
            return
        }
        const provider = new Ethers5.providers.Web3Provider(window.ethereum)
        const signer = provider.getSigner()

        const contractEntryPoint = new Ethers5.Contract(
            Addresses.EntryPoint,
            jsonEntryPoint.abi,
            provider,
        ) // Writable contract instance

        contractEntryPoint.on("BeforeExecution", () => {
            console.log("BeforeExecution")
        })
        contractEntryPoint.on("SignatureAggregatorChanged", () => {
            console.log("SignatureAggregatorChanged")
        })
        contractEntryPoint.on("UserOperationRevertReason", () => {
            console.log("UserOperationRevertReason")
        })
        contractEntryPoint.on("AccountDeployed", () => {
            console.log("AccountDeployed")
        })
        contractEntryPoint.on(
            "UserOperationEvent",
            (
                userOpHash,
                sender,
                paymaster,
                nonce,
                success,
                actualGasCost,
                actualGasUsed,
                event,
            ) => {
                const transferEvent = {
                    userOpHash: userOpHash,
                    sender: sender,
                    paymaster: paymaster,
                    nonce: nonce,
                    success: success,
                    actualGasCost: actualGasCost,
                    actualGasUsed: actualGasUsed,
                    event: event,
                }
                console.log(`UserOperationEvent: ${JSON.stringify(transferEvent, null, 4)}`)
            },
        )

        const contractErc20 = new Ethers5.Contract(USDT_ADDRESS, jsonErc20.abi, provider) // Writable contract instance

        contractErc20.on("Transfer", (from, to, value, event) => {
            const transferEvent = {
                from: from,
                to: to,
                value: value,
                eventData: event,
            }
            console.log(`Transfer: ${JSON.stringify(transferEvent, null, 4)}`)
        })
        console.log(`正在監聽事件`)
    }

    // ----------------------------------------
    // -- React 按鈕事件（指定 Hook 就位後執行） --
    // ----------------------------------------

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

        // Update the value to userOpTemp
        setUserOpTemp(formatUserOp(userOpWithSig))
    }, [userOp, tokenSymbol, toAddress, tokenAmount])

    // Button Handler: Set the Transferred type and Sign
    const handleTransfer = React.useCallback(async () => {
        if (!window.ethereum) {
            return
        }

        const provider = new Ethers5.providers.Web3Provider(window.ethereum)
        const signer = provider.getSigner()

        let executeArgs: any[] = []
        if (tokenSymbol === "ETH") {
            executeArgs = [
                Ethers5.utils.getAddress(toAddress), // dest
                Ethers5.utils.parseEther("1"), // value
                Ethers5.utils.arrayify("0x"), // func
            ]
            if (debug) {
                console.log(`tokenSymbol: ${tokenSymbol}`)
                console.log(`executeArgs: ${executeArgs}`)
            }
        }

        if (tokenSymbol === "USDT") {
            const ifaceErc20 = new Ethers5.utils.Interface(jsonErc20.abi)

            const encodeTransfer = ifaceErc20.encodeFunctionData("transfer", [
                Ethers5.utils.getAddress(toAddress),
                Ethers5.BigNumber.from(tokenAmount),
            ])
            executeArgs = [
                Ethers5.utils.getAddress(USDT_ADDRESS), // dest
                Ethers5.BigNumber.from(0), // value
                encodeTransfer, // func
            ]
            if (debug) {
                console.log(`tokenSymbol: ${tokenSymbol}`)
                console.log(`encodeTransfer: ${encodeTransfer}`)
                console.log(`executeArgs: ${executeArgs}`)
            }
        }

        const ifaceAccount = new Ethers5.utils.Interface(jsonAccount.abi)
        const callData = ifaceAccount.encodeFunctionData("execute", executeArgs)

        // Get userOp sig by Builder
        const builder = new UserOp.UserOperationBuilder()
            .setPartial({
                ...userOp,
                sender: Addresses.Account, // Set the sender, callData
                callData: callData,
            })
            .useMiddleware(UserOp.Presets.Middleware.EOASignature(signer))
        const userOpWithSig = await builder.buildOp(
            Addresses.EntryPoint,
            await provider.getSigner().getChainId(),
        )

        console.log()

        // Update the value to userOpTemp
        setUserOpTemp(formatUserOp(userOpWithSig))

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
            const contractAccount = TypesAccountFactory.SimpleAccount__factory.connect(
                Addresses.Account,
                signer,
            )

            console.log(`// [debug] Signer Address: ${await signer.getAddress()}`)
            console.log(`// [debug] Chain Id: ${await signer.getChainId()}`)
            console.log(`Account Owner: ${await contractAccount.owner()}`)

            try {
                await contractEntryPoint.handleOps(
                    [userOpWithSig as TypesEntryPoint.UserOperationStructOutput],
                    await signer.getAddress(),
                    gasOverrides,
                )
            } catch (err: unknown) {
                resolveErrorMsg(err as Error)
            }
        }
    }, [userOp, tokenSymbol, toAddress, tokenAmount])

    // Button Handler: Set the Transferred with Middleware type and Sign
    const handleTransferWithCtx = React.useCallback(async () => {
        if (!window.ethereum) {
            return
        }

        const provider = new Ethers5.providers.Web3Provider(window.ethereum)
        const signer = provider.getSigner()
        const ifaceAccount = new Ethers5.utils.Interface(jsonAccount.abi)
        const callData = ifaceAccount.encodeFunctionData("execute", [
            Addresses.signer7,
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

        // Update the value to userOpTemp
        setUserOpTemp(
            formatUserOp({
                ...userOp,
                sender: Addresses.Account,
                callData: callData,
                signature: sig,
            }),
        )
    }, [userOp, tokenSymbol, toAddress, tokenAmount])

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
            console.log(`// [debug] Signer Address: ${addrSigner}`)
            console.log(`// [debug] Chain Id: ${await signer.getChainId()}`)
            console.log(`// [debug] EntryPoint Address: ${contractEntryPoint.address}`)

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
                [userOp as TypesEntryPoint.UserOperationStructOutput],
                addrSigner,
                gasOverrides,
            )
        } catch (err: unknown) {
            resolveErrorMsg(err as Error)
        }
    }

    const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { id, value } = event.target
        try {
            switch (id) {
                case "tokenSymbol":
                    try {
                        setTokenSymbol(value.toString())
                        if (value.toString() === "ETH") {
                            setTokenAmount(Ethers5.BigNumber.from("1000000000000000000"))
                        }
                        if (value.toString() === "USDT") {
                            setTokenAmount(Ethers5.BigNumber.from(1000000))
                        }
                        setError("")
                    } catch (err: unknown) {
                        setError(err instanceof Error ? err.message : String(err))
                    }
                    break
                case "toAddress":
                    try {
                        setToAddress(Ethers5.utils.getAddress(value))
                        setError("")
                    } catch (err: unknown) {
                        setError(err instanceof Error ? err.message : String(err))
                    }
                    break
                case "tokenAmount":
                    try {
                        setTokenAmount(Ethers5.BigNumber.from(value))
                        setError("")
                    } catch (err: unknown) {
                        setError(err instanceof Error ? err.message : String(err))
                    }
                    break
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
                        <label>[Transfer token]</label>
                        <div>
                            <label>Token:</label>
                            <select
                                id="tokenSymbol"
                                value={`${tokenSymbol}`}
                                onChange={handleChange}
                            >
                                <option value="ETH">ETH</option>
                                <option value="USDT">USDT</option>
                            </select>
                        </div>
                        <div>
                            <label>To(default: signers 7): </label>
                            <input
                                type="text"
                                id="toAddress"
                                placeholder="請點選輸入"
                                value={`${toAddress}`}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <label>Amount(default: 1 unit):</label>
                            <input
                                type="text"
                                id="tokenAmount"
                                placeholder="請點選輸入"
                                value={`${tokenAmount}`}
                                onChange={handleChange}
                            />
                        </div>
                        <label>[UserOp]</label>
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
                            <label>{`→ key: ${
                                decodeAANonce(Ethers5.BigNumber.from(userOp.nonce)).key
                            } seq: ${
                                decodeAANonce(Ethers5.BigNumber.from(userOp.nonce)).seq
                            }`}</label>
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
                        <div>----------</div>
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
                {/* <div>
                    <button onClick={() => handleAddress()}>Sign a nothing transaction</button>
                </div> */}
                <div>
                    <button onClick={() => handleTransfer()}>
                        Sign an ETH/USDT transform transaction
                    </button>
                </div>
                {/* <div>
                    <button onClick={() => handleTransferWithCtx()}>
                        (Test) Sign a test tx with Ctx
                    </button>
                </div> */}
                <div>----------</div>
                <div>
                    <button onClick={() => handleAANonceSeqPluseOne()}>AA Nonce Seq + 1</button>
                </div>
                <div>
                    <button onClick={() => handleListenEvent()}>AA Listen Event On</button>
                </div>
                <div>----------</div>
            </div>
            <div>{userOp && aaForm(userOp)}</div>
        </div>
    )
}

const logUserOp = (userOp: UserOp.IUserOperation) => {
    console.log(`// [Log] UserOp: ${JSON.stringify(userOp)}`)
}

const resolveErrorMsg = (err: Error) => {
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
