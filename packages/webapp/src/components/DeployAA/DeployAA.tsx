import { useState, useCallback, useEffect } from "react"
import { useMetaMask } from "../../hooks/useMetaMask"
import { ethers, ContractFactory, Contract, ZeroAddress, BigNumberish } from "ethers"
// Import contract ABIs.
import { abi as abiIERC20 } from "@openzeppelin/contracts/build/contracts/IERC20.json"
import * as abiAggregatorV2V3Interface from "@chainlink/contracts/abi/v0.8/AggregatorV2V3Interface.json"
import { abi as abiUsdtOracle, deployedBytecode as bytecodeUsdtOracle } from "../../abi/UsdtOracle.json"
import { abi as abiEntryPoint, deployedBytecode as bytecodeEntryPoint } from "@account-abstraction/contracts/artifacts/EntryPoint.json"
import { abi as abiDepositPaymaster, deployedBytecode as bytecodeDepositPaymaster } from "@account-abstraction/contracts/artifacts/DepositPaymaster.json"
import {
    abi as abiSimpleAccountFactory,
    deployedBytecode as bytecodeSimpleAccountFactory,
} from "@account-abstraction/contracts/artifacts/SimpleAccountFactory.json"
import { abi as abiSimpleAccount, deployedBytecode as bytecodeSimpleAccount } from "@account-abstraction/contracts/artifacts/SimpleAccount.json"
export const DeployAA = () => {
    const { wallet, isConnecting, connectMetaMask } = useMetaMask()
    const [contractOwner, setContractOwner] = useState<string>(ZeroAddress)
    const [test, setTest] = useState<string>("123")

    // // useCallback ensures that you don't uselessly recreate the _updateWallet function on every render
    // const _deployAccount = useCallback(async (provider: ethers.BrowserProvider) => {
    //     const usdt0amount = await usdtContract.balanceOf(ZeroAddress)
    //     setTest(usdt0amount)
    // }, [])

    // const deployAccount = useCallback((provider: ethers.BrowserProvider) => _deployAccount(provider), [_deployAccount])

    const deployAA = async () => {
        // if (!window.ethereum?.isMetaMask || wallet.accounts.length < 1) {
        //     return
        // }

        const usdtEthChainlink = "0xEe9F2375b4bdF6387aa8265dD4FB8F16512A1d46"
        const usdtAddress = "0xdAC17F958D2ee523a2206206994597C13D831ec7"

        // Get the browser provider
        const provider = new ethers.BrowserProvider(window.ethereum)
        const admin = await provider.getSigner()

        const usdtAggregatorContract = new ethers.Contract(usdtEthChainlink, abiAggregatorV2V3Interface, provider)
        console.log(abiAggregatorV2V3Interface)
        // let factory = new ContractFactory(abiUsdtOracle, bytecodeUsdtOracle.object, admin)

        // const usdtOracleContract = (await factory.deploy(usdtAggregatorContract)) as ethers.Contract

        // const usdtPrice = await usdtOracleContract.latestAnswer()

        // const usdtContract = new ethers.Contract("0xdAC17F958D2ee523a2206206994597C13D831ec7", abiIERC20, provider)

        // 调用 balanceOf 方法
        // const balance: BigNumberish = await usdtContract.balanceOf(ZeroAddress)
        // console.log("balance:", balance.toString())
        // // 更新状态
        setTest(abiUsdtOracle.toString())
    }

    // console.log("isMetamask:", window.ethereum?.isMetaMask)
    // console.log("accounts:", wallet.accounts.length < 1)

    // if (window.ethereum?.isMetaMask && wallet.accounts.length >= 1) {
    //     const provider = new ethers.BrowserProvider(window.ethereum)
    //     provider.getSigner().then((signer: ethers.JsonRpcSigner) => {
    //         const usdtContract = new ethers.Contract("0xdAC17F958D2ee523a2206206994597C13D831ec7", IERC20ABI, signer)
    //         usdtContract.balanceOf(ZeroAddress).then((usdt0amount: number) => {
    //             setTest(usdt0amount)
    //         })
    //     })
    // }

    return (
        // <div className={styles.display}>
        <div className="display">
            <h1>
                {window.ethereum?.isMetaMask} test = {test}
            </h1>
            <button onClick={deployAA}>Get Balance</button>
            <h1>{wallet.accounts.length < 1}</h1>
        </div>
    )
}
