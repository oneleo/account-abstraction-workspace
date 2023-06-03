"use client"

// Components
import { Provider } from "@/components/AA/Provider"
// Wagmi: React Hooks for Ethereum
import * as Wagmi from "wagmi"
import { WagmiConfig } from "wagmi"
import { localhost } from "wagmi/chains"
import { publicProvider } from "wagmi/providers/public"
import { jsonRpcProvider } from "wagmi/providers/jsonRpc"
import { MetaMaskConnector } from "wagmi/connectors/metaMask"
import { InjectedConnector } from "wagmi/connectors/injected"
import { WalletConnectConnector } from "wagmi/connectors/walletConnect"
import { CoinbaseWalletConnector } from "wagmi/connectors/coinbaseWallet"

// Chains and Chains Providers
const { chains, publicClient, webSocketPublicClient } = Wagmi.configureChains(
    [localhost],
    [
        jsonRpcProvider({
            rpc: () => ({
                http: `http://localhost:8545`,
            }),
        }),
        publicProvider(),
    ],
)

// Chains Config
const config = Wagmi.createConfig({
    autoConnect: true,
    publicClient,
    webSocketPublicClient,
    connectors: [
        new MetaMaskConnector({ chains }),
        new CoinbaseWalletConnector({
            chains,
            options: {
                appName: "wagmi",
            },
        }),
        new WalletConnectConnector({
            chains,
            options: {
                projectId: "...",
            },
        }),
        new InjectedConnector({
            chains,
            options: {
                name: "Injected",
                shimDisconnect: true,
            },
        }),
    ],
    storage: Wagmi.createStorage({ storage: window.localStorage }),
})
export const AA = () => {
    return (
        <>
            <WagmiConfig config={config}>
                <Provider />
            </WagmiConfig>
        </>
    )
}
