import * as React from "react"
import * as Ethers6 from "ethers"
import * as UserOp from "userop"
import * as Address from "./addressea"

const debug = false

// 不能放在 UserOperation 函數裡，不然每次 ReRender 時都會產生一個新的、預設值的 UserOperation
const defaultBuilder = new UserOp.UserOperationBuilder()

export const UserOperation = () => {
    const [builder, setBuilder] = React.useState<UserOp.UserOperationBuilder>(defaultBuilder)
    const [error, setError] = React.useState<string>("")

    const handleAddress = async () => {
        if (!window.ethereum) {
            return
        }

        const provider = new Ethers6.BrowserProvider(window.ethereum)
        const signer = await provider.getSigner()
        // 參考：https://github.com/stackup-wallet/userop.js/blob/main/src/preset/builder/simpleAccount.ts#L86-L88
        const data = await signer.signMessage(Ethers6.getBytes(Ethers6.keccak256("0xdead")))
        // 如果按下 handleAddress 鈕，將 builder 設為 Address 的預設值
        defaultBuilder.resetOp()
        defaultBuilder.setPartial({
            sender: Address.Account,
            signature: data,
        })

        const newBuilder = new UserOp.UserOperationBuilder().setPartial({
            ...defaultBuilder.getOp(),
        })
        setBuilder(newBuilder)

        debugConsoleLog(builder.getOp())
    }

    const handleTransfer = async () => {
        if (!window.ethereum) {
            return
        }
        const provider = new Ethers6.BrowserProvider(window.ethereum)
        const signer = await provider.getSigner()
        const data = await signer.signMessage(Ethers6.getBytes(Ethers6.keccak256("0xdead")))
        // 如果按下 handleAddress 鈕，將 builder 設為 Transfer 的預設值
        defaultBuilder.resetOp()
        defaultBuilder.setPartial({
            sender: Address.Account,
            signature: data,
        })

        const newBuilder = new UserOp.UserOperationBuilder().setPartial({
            ...defaultBuilder.getOp(),
        })
        setBuilder(newBuilder)

        debugConsoleLog(builder.getOp())
    }

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()

        // 執行相應的處理函數
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
                        initCode: Ethers6.getBytes(value.toString()),
                    })
                    break
                case "callData":
                    defaultBuilder.setPartial({
                        callData: Ethers6.getBytes(value.toString()),
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
                        paymasterAndData: Ethers6.getBytes(value.toString()),
                    })
                    break
                case "signature":
                    defaultBuilder.setPartial({
                        signature: Ethers6.getBytes(value.toString()),
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

        debugConsoleLog(builder.getOp())
    }

    const aaForm = (userOp: UserOp.IUserOperation) => {
        return (
            <>
                <form onSubmit={handleSubmit}>
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

const debugConsoleLog = (userOp: UserOp.IUserOperation) => {
    if (debug === true) {
        console.log(`// [Debug Log] UserOp: ${JSON.stringify(userOp)}`)
    }
}
