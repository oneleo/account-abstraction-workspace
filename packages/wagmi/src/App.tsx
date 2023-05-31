// CSS
import "./App.css"
// Components
import { Provider } from "./components/Provider"
// Wagmi Components
import { configureChains, createConfig, createStorage, WagmiConfig } from "wagmi"
import { localhost } from "wagmi/chains"
import { InjectedConnector } from "wagmi/connectors/injected"
import { jsonRpcProvider } from "wagmi/providers/jsonRpc"
import { publicProvider } from "wagmi/providers/public"

// Chains and Chains Providers
const { chains, publicClient, webSocketPublicClient } = configureChains(
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
const config = createConfig({
    autoConnect: true,
    publicClient,
    webSocketPublicClient,
    connectors: [new InjectedConnector({ chains })],
    storage: createStorage({ storage: window.localStorage }),
})

const App = () => {
    return (
        <>
            <WagmiConfig config={config}>
                <Provider />
            </WagmiConfig>
        </>
    )
}

export default App
