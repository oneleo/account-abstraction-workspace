import * as React from "react"
import * as Ethers5 from "ethers"
import * as UserOp from "userop"
import * as Addresses from "./addressea"
import * as TypesEntryPointFactory from "@/../typechain-types/@account-abstraction/contracts/factories/EntryPoint__factory"
import * as TypesEntryPoint from "@/../typechain-types/@account-abstraction/contracts/EntryPoint"

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

        const provider = new Ethers5.providers.Web3Provider(window.ethereum)
        const signer = await provider.getSigner()
        // 參考：https://github.com/stackup-wallet/userop.js/blob/main/src/preset/builder/simpleAccount.ts#L86-L88
        const data = await signer.signMessage(
            Ethers5.utils.arrayify(Ethers5.utils.keccak256("0xdead")),
        )
        // 如果按下 handleAddress 鈕，將 builder 設為 Address 的預設值
        defaultBuilder.resetOp()
        defaultBuilder.setPartial({
            sender: Addresses.Account,
            signature: data,
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
        const signer = await provider.getSigner()
        const data = await signer.signMessage(
            Ethers5.utils.arrayify(Ethers5.utils.keccak256("0xdead")),
        )
        // 如果按下 handleAddress 鈕，將 builder 設為 Transfer 的預設值
        defaultBuilder.resetOp()
        defaultBuilder.setPartial({
            sender: Addresses.Account,
            signature: data,
        })

        const newBuilder = new UserOp.UserOperationBuilder().setPartial({
            ...defaultBuilder.getOp(),
        })
        setBuilder(newBuilder)

        debugConsoleLogUserOp(builder.getOp())
    }

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (!window.ethereum) {
            return
        }

        const provider = new Ethers5.providers.Web3Provider(window.ethereum)
        const signer = await provider.getSigner()
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
            console.log(`// [debug] Signer Address:`, addrSigner)
            console.log(`// [debug] Chain Id:`, await signer.getChainId())
        }

        // const userOp: TypesEntryPoint.UserOperationStruct = {
        //     sender: builder.getSender(),
        //     nonce: builder.getNonce(),
        //     initCode: builder.getInitCode(),
        //     callData: builder.getCallData(),
        //     callGasLimit: builder.getCallGasLimit(),
        //     verificationGasLimit: builder.getVerificationGasLimit(),
        //     preVerificationGas: builder.getPreVerificationGas(),
        //     maxFeePerGas: builder.getMaxFeePerGas(),
        //     maxPriorityFeePerGas: builder.getMaxPriorityFeePerGas(),
        //     paymasterAndData: builder.getPaymasterAndData(),
        //     signature: builder.getSender(),
        // }

        const userOp: TypesEntryPoint.UserOperationStruct = { ...builder.getOp() }

        debugConsoleLogUserOp(userOp)

        const writeTransaction: Ethers5.ContractTransaction =
            await contractEntryPoint.simulateHandleOp(userOp, addrSigner, "0x", gasOverrides)

        // const writeTransaction: Ethers5.ContractTransaction = await contractEntryPoint.handleOps(
        //     [userOp],
        //     addrSigner,
        //     gasOverrides,
        // )

        if (debug) {
            console.log(`// [debug] Paymaster.deposit():`, JSON.stringify(writeTransaction))
        }
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
