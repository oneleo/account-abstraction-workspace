// src/pages/index.tsx
import Head from "next/head"
import { useState, useEffect } from "react"
import { ethers } from "ethers"

// To prevent the "Property 'ethereum' does not exist on type 'Window & typeof globalThis'." error.
declare global {
    interface Window {
        ethereum: any
    }
}

export const Metamask = () => {
    const [balance, setBalance] = useState<string | undefined>()
    const [currentAccount, setCurrentAccount] = useState<string | undefined>()
    const [chainId, setChainId] = useState<bigint | undefined>()
    const [chainname, setChainName] = useState<string | undefined>()

    useEffect(() => {
        //get ETH balance and network info only when having currentAccount
        if (!currentAccount || !ethers.utils.isAddress(currentAccount)) return

        //client side code
        if (!window.ethereum) {
            console.log("please install MetaMask")
            return
        }

        const provider = new ethers.providers.Web3Provider(window.ethereum)
        provider
            .getBalance(currentAccount)
            .then((result) => {
                setBalance(ethers.utils.formatEther(result))
            })
            .catch((e) => console.log(e))

        provider
            .getNetwork()
            .then((result) => {
                setChainId(BigInt(result.chainId))
                setChainName(result.name)
            })
            .catch((e) => console.log(e))
    }, [currentAccount])

    //click connect
    const onClickConnect = () => {
        //client side code
        if (!window.ethereum) {
            console.log("please install MetaMask")
            return
        }
        /*
    //change from window.ethereum.enable() which is deprecated
    //call window.ethereum.request() directly
    window.ethereum.request({ method: 'eth_requestAccounts' })
    .then((accounts:any)=>{
      if(accounts.length>0) setCurrentAccount(accounts[0])
    })
    .catch('error',console.error)
    */

        //we can do it using ethers.js
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        provider
            .send("eth_requestAccounts", [])
            .then((accounts) => {
                if (accounts.length > 0) setCurrentAccount(accounts[0])
            })
            .catch((e) => console.log(e))
    }

    //click disconnect
    const onClickDisconnect = () => {
        console.log("onClickDisConnect")
        setBalance(undefined)
        setCurrentAccount(undefined)
    }

    return (
        <>
            <Head>
                <title>My DAPP</title>
            </Head>
            <h3>Explore Web3</h3>
            <div>
                <div>
                    <button type="button" onClick={() => onClickDisconnect()}>
                        Account: {currentAccount}
                    </button>
                </div>
                <div>
                    <button type="button" onClick={() => onClickConnect()}>
                        Connect MetaMask
                    </button>
                </div>
            </div>
            <div>
                <div>
                    <h4>Account info</h4>
                    <p>ETH Balance of current account: {balance}</p>
                    <p>{`Chain Info: ChainId ${chainId} name ${chainname}`}</p>
                </div>
            </div>
        </>
    )
}
