import { useState } from "react"
import { useMetaMask } from "../../hooks/useMetaMask"
// import { ethers, constants, providers } from "ethers"
import { ethers as ethers5 } from "ethers"
// Import contract ABIs.
// import { abi as abiIERC20 } from "@openzeppelin/contracts/build/contracts/IERC20.json"
// import abiAggregatorV2V3Interface from "@chainlink/contracts/abi/v0.8/AggregatorV2V3Interface.json"
// import { abi as abiUsdtOracle, bytecode as bytecodeUsdtOracle } from "../../abi/UsdtOracle.json"
// import { abi as abiEntryPoint, bytecode as bytecodeEntryPoint } from "@account-abstraction/contracts/artifacts/EntryPoint.json"
// import { abi as abiDepositPaymaster, bytecode as bytecodeDepositPaymaster } from "@account-abstraction/contracts/artifacts/DepositPaymaster.json"
// import { abi as abiSimpleAccountFactory, bytecode as bytecodeSimpleAccountFactory } from "@account-abstraction/contracts/artifacts/SimpleAccountFactory.json"
// import { abi as abiSimpleAccount, bytecode as bytecodeSimpleAccount } from "@account-abstraction/contracts/artifacts/SimpleAccount.json"

// const EntryPointAddress = "0x0C8E79F3534B00D9a3D4a856B665Bf4eBC22f2ba"
// const AccountAddress = "0x4FBF49dd7A7c07a89Ddf0AD6C5Dc449786BD12Ed"

export const HandleOps = () => {
    const { wallet } = useMetaMask()
    // const [contractOwner, setContractOwner] = useState<string>("0x0")
    const [test, setTest] = useState<string>("123")

    const handleOps = async () => {
        if (!window.ethereum?.isMetaMask || wallet.accounts.length < 1) {
            return
        }
        // Get the browser provider
        const provider = new ethers5.providers.Web3Provider(window.ethereum)
        const user = provider.getSigner()
        console.log(user.getAddress())

        // const contractEntryPoint: Contract = new ethers5.Contract(EntryPointAddress, abiEntryPoint, provider)

        setTest(await user.getAddress())
    }

    return (
        // <div className={styles.display}>
        <div className="display">
            <h1>
                {window.ethereum?.isMetaMask} test = {test}
            </h1>
            <button onClick={handleOps}>Get Balance</button>
            <h1>{wallet.accounts.length < 1}</h1>
        </div>
    )
}
