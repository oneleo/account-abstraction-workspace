import * as React from "react"
import * as Ethers5 from "ethers"
import * as UserOp from "userop"
import * as Addresses from "./addressea"
import * as TypesFactoryEntryPoint from "@/../typechain-types/@account-abstraction/contracts/factories/EntryPoint__factory"
import * as TypesFactoryAccount from "@/../typechain-types/@account-abstraction/contracts/factories/SimpleAccount__factory"
import * as TypesFactoryErc20 from "@/../typechain-types/@openzeppelin/contracts/factories/ERC20__factory"
import * as TypesFactoryAccountFactory from "@/../typechain-types/@account-abstraction/contracts/factories/SimpleAccountFactory__factory"

import * as TypesEntryPoint from "@/../typechain-types/@account-abstraction/contracts/EntryPoint"

// Avoid using "as" to prevent errors related to "Should not import the named export 'xxx' (imported as 'xxx') from default-exporting module (only default export is available soon)".
import jsonEntryPoint from "@account-abstraction/contracts/artifacts/EntryPoint.json"
import jsonAccount from "@account-abstraction/contracts/artifacts/SimpleAccount.json"
import jsonErc20 from "@openzeppelin/contracts/build/contracts/ERC20.json"

// If CSS is imported here, it will generate an error related to "The resource <URL> was preloaded using link preload but not used within a few seconds from the window’s load event. Please make sure it has an appropriate as value and it is preloaded intentionally.".
import "./aa.css"

const debug = false

const AA_DEFAULT_NONCE_KEY = 18
const AA_DEFAULT_DEPLOY_SALT = Ethers5.BigNumber.from(999666333)
// const AA_DEFAULT_DEPLOY_SALT = Ethers5.BigNumber.from(333666999)

const USDT_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7"

const encodeAANonce = (key: Ethers5.BigNumberish, seq: Ethers5.BigNumberish) => {
    const maxUint192 = Ethers5.BigNumber.from("0xffffffffffffffffffffffff")
    const maxUint64 = Ethers5.BigNumber.from("0xffffffffffffffff")
    const shiftedKey = Ethers5.BigNumber.from(key).and(maxUint192).shl(64)
    const combinedValue = shiftedKey.or(Ethers5.BigNumber.from(seq).and(maxUint64))
    const uint256Value = Ethers5.utils.hexZeroPad(combinedValue.toHexString(), 32)

    return Ethers5.BigNumber.from(uint256Value)
}

const decodeAANonce = (nonce: Ethers5.BigNumberish) => {
    const maxUint192 = Ethers5.BigNumber.from("0xffffffffffffffffffffffff")
    const maxUint64 = Ethers5.BigNumber.from("0xffffffffffffffff")

    const uint256Value = Ethers5.utils.hexZeroPad(Ethers5.BigNumber.from(nonce).toHexString(), 32)
    const combinedValue = Ethers5.BigNumber.from(uint256Value)

    const seq = combinedValue.and(maxUint64)
    const shiftedKey = combinedValue.shr(64).and(maxUint192)

    return {
        key: shiftedKey,
        seq: seq,
    }
}

const defaultUserOp: UserOp.IUserOperation = {
    sender: Ethers5.constants.AddressZero,
    nonce: encodeAANonce(AA_DEFAULT_NONCE_KEY, 0),
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

    const [tokenSymbol, setTokenSymbol] = React.useState<string>("ETH")
    const [toAddress, setToAddress] = React.useState<string>(Addresses.signer6)
    const [tokenAmount, setTokenAmount] = React.useState<Ethers5.BigNumberish>(
        Ethers5.BigNumber.from("1000000000000000000"),
    )

    const [metamaskAddress, setMetamaskAddress] = React.useState<string>("")
    const [metamaskBalanceEth, setMetamaskBalanceEth] = React.useState<Ethers5.BigNumberish>(
        Ethers5.BigNumber.from(0),
    )
    const [metamaskBalanceUsdt, setMetamaskBalanceUsdt] = React.useState<Ethers5.BigNumberish>(
        Ethers5.BigNumber.from(0),
    )
    const [aAAccountAddress, setAAAccountAddress] = React.useState<string>("")
    const [aABalanceEth, setAABalanceEth] = React.useState<Ethers5.BigNumberish>(
        Ethers5.BigNumber.from(0),
    )
    const [aABalanceEthInEntryPoint, setAABalanceEthInEntryPoint] =
        React.useState<Ethers5.BigNumberish>(Ethers5.BigNumber.from(0))
    const [aABalanceUsdt, setAABalanceUsdt] = React.useState<Ethers5.BigNumberish>(
        Ethers5.BigNumber.from(0),
    )
    const [aANonce, setAANonce] = React.useState<Ethers5.BigNumberish>(
        encodeAANonce(AA_DEFAULT_NONCE_KEY, 0),
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

    // useEffect 處理 timer
    React.useEffect(() => {
        // Get ETH balance and network info only when having currentAccount
        if (!metamaskAddress || !Ethers5.utils.isAddress(metamaskAddress)) {
            return
        }
        if (!window.ethereum) {
            return
        }
        const provider = new Ethers5.providers.Web3Provider(window.ethereum)
        // const signer = provider.getSigner()
        const contractUsdt = TypesFactoryErc20.ERC20__factory.connect(USDT_ADDRESS, provider)
        const contractAccountFactoryProxy =
            TypesFactoryAccountFactory.SimpleAccountFactory__factory.connect(
                Addresses.AccountFactoryProxy,
                provider,
            )
        // 非同步函數
        const getBalanceAndAccountNonce = async () => {
            // 取得 User 的 ETH 及 USDT 餘額
            setMetamaskBalanceEth(await provider.getBalance(metamaskAddress))

            setMetamaskBalanceUsdt(await contractUsdt.balanceOf(metamaskAddress))

            // 透過 User 取得 Account 地址
            const accountAddress = await contractAccountFactoryProxy.getAddress(
                metamaskAddress,
                AA_DEFAULT_DEPLOY_SALT,
            )

            // 偵測是否已部署 Account 合約
            if ((await provider.getCode(accountAddress)) !== "0x") {
                setAAAccountAddress(accountAddress)

                setAABalanceEth(await provider.getBalance(accountAddress))

                setAABalanceUsdt(await contractUsdt.balanceOf(accountAddress))

                const contractEntryPoint = TypesFactoryEntryPoint.EntryPoint__factory.connect(
                    Addresses.EntryPoint,
                    provider,
                )

                setAANonce(
                    encodeAANonce(
                        AA_DEFAULT_NONCE_KEY,
                        await contractEntryPoint.getNonce(accountAddress, AA_DEFAULT_NONCE_KEY),
                    ),
                )
                setAABalanceEthInEntryPoint((await contractEntryPoint.deposits(accountAddress))[0])
            }
        }

        // 設置計數器
        let id = setInterval(() => {
            getBalanceAndAccountNonce().catch((e) => console.log(e))
        }, 1000)

        // 若此 useEffect 執行第 2 次，則先將先前的計數器刪除
        return function () {
            clearInterval(id)
        }
    }, [metamaskAddress]) // 當與 Metamask 連接，並取得帳號地址時啟動

    // ----------------------
    // -- React 一般按鈕事件 --
    // ----------------------

    // Click connect
    const onClickConnect = () => {
        //client side code
        if (!window.ethereum) {
            console.log("please install MetaMask")
            return
        }

        // We can do it using ethers.js
        const provider = new Ethers5.providers.Web3Provider(window.ethereum)
        provider
            .send("eth_requestAccounts", [])
            .then((accounts) => {
                if (accounts.length > 0) setMetamaskAddress(accounts[0])
            })
            .catch((e) => console.log(e))
    }

    // Click disconnect
    const onClickDisconnect = () => {
        console.log("onClickDisConnect")
        setMetamaskAddress("")
        setMetamaskBalanceEth(Ethers5.BigNumber.from(0))
        setMetamaskBalanceUsdt(Ethers5.BigNumber.from(0))
        setAAAccountAddress("")
        setAABalanceEth(Ethers5.BigNumber.from(0))
        setAABalanceEthInEntryPoint(Ethers5.BigNumber.from(0))
        setAABalanceUsdt(Ethers5.BigNumber.from(0))
        setAANonce(Ethers5.BigNumber.from(0))
    }

    // 透過 AccountFactory 部署 Account 合約
    const handleDeployAccount = async () => {
        if (!window.ethereum) {
            return
        }

        const provider = new Ethers5.providers.Web3Provider(window.ethereum)
        const signer = provider.getSigner()
        // Declare the gas overrides argument.
        const gasOverrides: Ethers5.Overrides = {
            gasLimit: Ethers5.BigNumber.from(5000000),
            gasPrice: (await provider.getFeeData()).gasPrice || Ethers5.BigNumber.from(0),
            nonce: Ethers5.BigNumber.from(9),
            // maxFeePerGas: (await provider.getFeeData()).maxFeePerGas || Ethers5.BigNumber.from(0),
            // maxPriorityFeePerGas:
            //     (await provider.getFeeData()).maxPriorityFeePerGas || Ethers5.BigNumber.from(0),
        }
        const contractAccountFactoryProxy =
            TypesFactoryAccountFactory.SimpleAccountFactory__factory.connect(
                Addresses.AccountFactoryProxy,
                signer,
            )
        let writeTransaction: Ethers5.ContractTransaction

        // 部署新的 Account
        writeTransaction = await contractAccountFactoryProxy.createAccount(
            metamaskAddress,
            AA_DEFAULT_DEPLOY_SALT,
            gasOverrides,
        )
    }

    // 轉 10 ETH、10 USDT 給 Account，為 Account 在 EntryPoint 存入 10 ETH
    const handleDepositAccount = async () => {
        if (!window.ethereum) {
            return
        }
        const provider = new Ethers5.providers.Web3Provider(window.ethereum)
        const signer = provider.getSigner()

        // Declare the gas overrides argument.
        const gasOverrides: Ethers5.Overrides = {
            gasLimit: Ethers5.BigNumber.from(5000000),
            gasPrice: (await provider.getFeeData()).gasPrice || Ethers5.BigNumber.from(0),
            nonce: Ethers5.BigNumber.from(9),
            // maxFeePerGas: (await provider.getFeeData()).maxFeePerGas || Ethers5.BigNumber.from(0),
            // maxPriorityFeePerGas:
            //     (await provider.getFeeData()).maxPriorityFeePerGas || Ethers5.BigNumber.from(0),
        }
        // Declare the gas overrides argument.
        const value10Overrides: Ethers5.PayableOverrides = {
            ...gasOverrides,
            value: Ethers5.utils.parseEther("10"),
        }

        let writeTransaction: Ethers5.ContractTransaction
        // 轉 10 ETH 至 Account
        writeTransaction = await signer.sendTransaction({
            to: aAAccountAddress,
            ...value10Overrides,
        })

        // 轉 10 USDT 至 Account
        const contractUsdt = TypesFactoryErc20.ERC20__factory.connect(USDT_ADDRESS, signer)
        contractUsdt.transfer(aAAccountAddress, Ethers5.BigNumber.from(10000000))

        // 轉 10 ETH 從 Account 至 EntryPoint
        const contractAccount = TypesFactoryAccount.SimpleAccount__factory.connect(
            aAAccountAddress,
            signer,
        )
        writeTransaction = await contractAccount.addDeposit(value10Overrides)
    }

    // Reset userOp
    const handleResetUserOp = () => {
        setUserOp(defaultUserOp)
    }

    const handleAANonceSeqPluseOne = () => {
        setUserOp({
            ...userOp,
            nonce: encodeAANonce(
                AA_DEFAULT_NONCE_KEY,
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

    // ---------------------------------------------
    // --------------- React 按鈕事件 ---------------
    // -- 指定 Hook 就位後會建新 func instance 來執行 --
    // ---------------------------------------------

    // Button Handler: Set the Transferred type and Sign
    const handleSigATransfer = React.useCallback(async () => {
        if (!window.ethereum) {
            return
        }

        const provider = new Ethers5.providers.Web3Provider(window.ethereum)
        const signer = provider.getSigner()

        const contractEntryPoint = TypesFactoryEntryPoint.EntryPoint__factory.connect(
            Addresses.EntryPoint,
            provider,
        )

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
                nonce: encodeAANonce(
                    AA_DEFAULT_NONCE_KEY,
                    await contractEntryPoint.getNonce(aAAccountAddress, AA_DEFAULT_NONCE_KEY),
                ),
                sender: aAAccountAddress, // Set the sender, callData
                callData: callData,
            })
            .useMiddleware(UserOp.Presets.Middleware.EOASignature(signer))
        const userOpWithSig = await builder.buildOp(
            Addresses.EntryPoint,
            await provider.getSigner().getChainId(),
        )

        // Update the value to userOpTemp
        setUserOp(formatUserOp(userOpWithSig))
    }, [userOp, aAAccountAddress, tokenSymbol, toAddress, tokenAmount])

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

        const contractEntryPoint = TypesFactoryEntryPoint.EntryPoint__factory.connect(
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
                            <label>To（預設為 Signer 7）：</label>
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
                            <label>Sender（無法更動）：</label>
                            <input
                                type="text"
                                id="sender"
                                placeholder="請點選輸入"
                                value={`${userOp.sender}`}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <label>Nonce（無法更動）：</label>
                            <input
                                type="text"
                                id="nonce"
                                placeholder="請點選輸入"
                                value={`${userOp.nonce}`}
                                onChange={handleChange}
                            />
                            <label>{`→ Key=${
                                decodeAANonce(Ethers5.BigNumber.from(userOp.nonce)).key
                            }、Seq=${
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
                            <label>Call Data（無法更動） ：</label>
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
                            <label>Signature（無法更動） ：</label>
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
        <>
            <h3>Explore Account Abstraction</h3>
            <div>
                <div></div>
                <div>
                    <button
                        disabled={!!aAAccountAddress}
                        type="button"
                        onClick={() => onClickConnect()}
                    >
                        Connect MetaMask
                    </button>
                    |
                    <button
                        disabled={!aAAccountAddress}
                        type="button"
                        onClick={() => onClickDisconnect()}
                    >
                        Disconnect MetaMask
                    </button>
                    <p>Metamask address: {metamaskAddress.toString()}</p>
                    <p>ETH Balance of Metamask address: {metamaskBalanceEth.toString()}</p>
                    <p>USDT Balance of Metamask address: {metamaskBalanceUsdt.toString()}</p>
                </div>
                <div>
                    <button
                        disabled={!!aAAccountAddress || !metamaskAddress} // 當 Metamask 尚未連線或 Account 沒有地址時不可點擊
                        type="button"
                        onClick={() => handleDeployAccount()}
                    >
                        Deploy a AA Account
                    </button>
                    |
                    <button
                        disabled={!aAAccountAddress} // 當 Metamask 尚未連線或 Account 沒有地址時不可點擊
                        type="button"
                        onClick={() => handleDepositAccount()}
                    >
                        Deposit to AA Account
                    </button>
                    <p>Address of AA Account: {aAAccountAddress.toString()}</p>
                    <p>
                        Nonce of AA Account（Seq = 0 ~ 2 時可免費轉帳）：
                        {`Key=${decodeAANonce(aANonce).key.toString()}、Seq=${decodeAANonce(
                            aANonce,
                        ).seq.toString()}`}
                    </p>
                    <p>ETH Balance of AA Account: {aABalanceEth.toString()}</p>
                    <p>USDT Balance of AA Account: {aABalanceUsdt.toString()}</p>
                    <p>
                        ETH Balance deposit to EntryPoint from AA Account:{" "}
                        {aABalanceEthInEntryPoint.toString()}
                    </p>
                </div>
                <div>----------</div>
                <div>
                    <div>
                        <button onClick={() => handleSigATransfer()}>
                            Sign an ETH/USDT transform transaction
                        </button>
                    </div>
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
        </>
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
