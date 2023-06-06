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

// 不能放在 UserOperation 函數裡，不然每次 ReRender 時都會產生一個新的、預設值的 UserOperation
const defaultBuilder = new UserOp.UserOperationBuilder()

export const UserOperation = () => {
    const [builder, setBuilder] = React.useState<UserOp.UserOperationBuilder>(defaultBuilder)
    const [error, setError] = React.useState<string>("")

    const handleAddress = async () => {
        if (!window.ethereum) {
            return
        }

        // 如果按下 handleAddress 鈕，將 builder 設為 Address 的預設值
        defaultBuilder.resetOp()
        defaultBuilder.setPartial({
            sender: Addresses.Account,
        })

        const provider = new Ethers5.providers.Web3Provider(window.ethereum)
        const signer = provider.getSigner()
        // 參考：https://github.com/stackup-wallet/userop.js/blob/main/src/preset/builder/simpleAccount.ts#L86-L88
        // 注意：使用 signMessage() 簽名時，會自動將 hash 加入「\x19Ethereum Signed Message:\n32」字串，重新 hash 後，再進行簽名
        // const data = await signer.signMessage(
        //     Ethers5.utils.arrayify(Ethers5.utils.keccak256("0xdead")),
        // )
        const userOpHash = new UserOp.UserOperationMiddlewareCtx(
            defaultBuilder.getOp(),
            Addresses.signers7,
            await provider.getSigner().getChainId(), //1337
        ).getUserOpHash()

        console.log(`userOpHash: ${userOpHash}`)

        // const userOpHashEth = Ethers5.utils.keccak256(
        //     Ethers5.utils.solidityPack(
        //         ["string", "bytes32"],
        //         ["\x19Ethereum Signed Message:\n32", userOpHash],
        //     ),
        // )
        // const userOpHashEth2 = Ethers5.utils.solidityKeccak256(
        //     ["string", "bytes32"],
        //     ["\x19Ethereum Signed Message:\n32", userOpHash],
        // )
        // console.log(`userOpHashEth: ${userOpHashEth}`)
        // console.log(`userOpHashEth2: ${userOpHashEth2}`)

        const sig = await signer.signMessage(Ethers5.utils.arrayify(userOpHash))

        defaultBuilder.setPartial({
            sender: Addresses.Account,
            signature: sig,
        })

        const newBuilder = new UserOp.UserOperationBuilder().setPartial({
            ...defaultBuilder.getOp(),
        })
        setBuilder(newBuilder)

        debugConsoleLogUserOp(builder.getOp())
    }

    const handleTransfer = async () => {
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
        // console.log(`callData: ${callData}`)

        // const test = defaultBuilder.useMiddleware(UserOp.Presets.Middleware.EOASignature(signer))
        // const test = defaultBuilder.console.log("test", UserOp.Utils.OpToJSON(test.getOp()))

        // const userOpHashEth1 = Ethers5.utils.keccak256(
        //     Ethers5.utils.solidityPack(
        //         ["string", "bytes32"],
        //         ["\x19Ethereum Signed Message:\n32", userOpHash],
        //     ),
        // )
        // const userOpHashEth2 = Ethers5.utils.solidityKeccak256(["bytes32"], [userOpHash])

        // console.log(`userOpHashEth1: ${userOpHashEth1}`)
        // console.log(`userOpHashEth2: ${userOpHashEth2}`)

        // 注意：使用 signMessage() 簽名時，會自動將 hash 加入「\x19Ethereum Signed Message:\n32」字串，重新 hash 後，再進行簽名

        // 如果按下 handleAddress 鈕，將 builder 設為 Transfer 的預設值
        const builder = defaultBuilder.resetOp().setPartial({
            sender: Addresses.Account,
            callData: callData,
        })

        debugConsoleLogUserOp(builder.getOp())

        const userOp = await builder.buildOp(
            Addresses.EntryPoint,
            await provider.getSigner().getChainId(),
        )

        const userOpHash = new UserOp.UserOperationMiddlewareCtx(
            //userOp,
            builder.getOp(),
            Addresses.EntryPoint,
            await provider.getSigner().getChainId(),
        ).getUserOpHash()

        console.log(`userOpHash: ${userOpHash}`)
        const sig = await signer.signMessage(Ethers5.utils.arrayify(userOpHash))
        console.log(`sig: ${sig}`)
        // const op = await UserOp.Client.buildUserOperation(builder)

        builder.setPartial({
            signature: sig,
        })

        const newBuilder = new UserOp.UserOperationBuilder().setPartial({
            ...builder.getOp(),
        })

        setBuilder(newBuilder)

        // const ifaceEntryPoint = TypesEntryPointFactory.EntryPoint__factory.createInterface()
        // const funcEntryPoint = ifaceEntryPoint.functions

        // const sigExecute = ifaceAccount.getSighash(ifaceAccount.getFunction("execute"))
        // const test = ifaceAccount.getFunction("execute")

        // debugConsoleLogUserOp(builder.getOp())
    }
    const handleDryRun = async () => {
        if (!window.ethereum) {
            return
        }
        const provider = new Ethers5.providers.Web3Provider(window.ethereum)
        const signer = provider.getSigner()
        console.log("URL:", provider.connection.url)
        // Copy from https://github.com/stackup-wallet/erc-4337-examples/blob/4300f4e4cf42bc17be7b2a98f2eea04e3f3e3da5/scripts/simpleAccount/transfer.ts#L14-L32
        const rpcUrl = "http://127.0.0.1:8545/"

        const simpleAccount = await UserOp.Presets.Builder.SimpleAccount.init(
            signer,
            rpcUrl,
            Addresses.EntryPoint,
            Addresses.AccountFactoryProxy,
        )
        console.log("111")

        const client = await UserOp.Client.init(rpcUrl, Addresses.EntryPoint)
        console.log("222")
        let res
        try {
            res = await client.sendUserOperation(
                simpleAccount.execute(
                    Addresses.signers7,
                    Ethers5.utils.parseEther("0.5"),
                    Ethers5.utils.arrayify("0x"),
                ),
                {
                    dryRun: true,
                    onBuild: (op) => {
                        console.log("333")
                        const newBuilder = new UserOp.UserOperationBuilder().setPartial({
                            ...op,
                        })
                        setBuilder(newBuilder)
                        console.log("Signed UserOperation:", op)
                    },
                },
            )
        } catch (e) {}
        console.log(`UserOpHash: ${res?.userOpHash}`)

        debugConsoleLogUserOp(builder.getOp())
    }
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
        }

        const userOp: TypesEntryPoint.UserOperationStruct = { ...builder.getOp() }

        debugConsoleLogUserOp(userOp)

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

        // if (debug) {
        //     console.log(`// [debug] Paymaster.deposit():`, JSON.stringify(writeTransaction))
        // }
    }

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = event.target
        try {
            switch (id) {
                case "sender":
                    defaultBuilder.setPartial({
                        sender: value.toString(),
                    })
                    break
                case "nonce":
                    defaultBuilder.setPartial({
                        nonce: BigInt(value),
                    })
                    break
                case "initCode":
                    defaultBuilder.setPartial({
                        initCode: Ethers5.utils.arrayify(value.toString()),
                    })
                    break
                case "callData":
                    defaultBuilder.setPartial({
                        callData: Ethers5.utils.arrayify(value.toString()),
                    })
                    break
                case "callGasLimit":
                    defaultBuilder.setPartial({
                        callGasLimit: BigInt(value),
                    })
                    break
                case "verificationGasLimit":
                    defaultBuilder.setPartial({
                        verificationGasLimit: BigInt(value),
                    })
                    break
                case "preVerificationGas":
                    defaultBuilder.setPartial({
                        preVerificationGas: BigInt(value),
                    })
                    break
                case "maxFeePerGas":
                    defaultBuilder.setPartial({
                        maxFeePerGas: BigInt(value),
                    })
                    break
                case "maxPriorityFeePerGas":
                    defaultBuilder.setPartial({
                        maxPriorityFeePerGas: BigInt(value),
                    })
                    break
                case "paymasterAndData":
                    defaultBuilder.setPartial({
                        paymasterAndData: Ethers5.utils.arrayify(value.toString()),
                    })
                    break
                case "signature":
                    defaultBuilder.setPartial({
                        signature: Ethers5.utils.arrayify(value.toString()),
                    })
                    break
                default:
                    break
            }
            setError("") // 清除先前的錯誤訊息
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : String(err)) // 設置錯誤訊息狀態
            return
        }
        const newBuilder = new UserOp.UserOperationBuilder().setPartial({
            ...defaultBuilder.getOp(),
        })
        setBuilder(newBuilder)

        debugConsoleLogUserOp(builder.getOp())
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
                <button onClick={() => handleAddress()}>Simple Account Address</button>
                <button onClick={() => handleTransfer()}>Simple Account Transfer</button>
                <button onClick={() => handleDryRun()}>Simple Account DryRun</button>
            </div>
            <div>{builder && aaForm(builder.getOp())}</div>
        </div>
    )
}

const debugConsoleLogUserOp = (userOp: UserOp.IUserOperation) => {
    if (debug) {
        console.log(`// [Debug Log] UserOp: ${JSON.stringify(userOp)}`)
    }
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
