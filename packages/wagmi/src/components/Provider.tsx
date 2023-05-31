import { useAccount, useConnect, useDisconnect, useEnsName, useBalance } from "wagmi"
import { InjectedConnector } from "wagmi/connectors/injected"

export const Provider = () => {
    // -----------------
    // -- Wagmi Hooks --
    // -----------------

    // useAccount hook
    const { address, isConnected, isDisconnected } = useAccount({
        onConnect({ address, connector, isReconnected }) {
            console.log("Connected", { address, connector, isReconnected })
        },
        onDisconnect() {
            console.log("Disconnected")
        },
    })
    // useEnsName hook
    const { data: ensName } = useEnsName({
        address: address,
        // Chain "Localhost" does not support contract "ensUniversalResolver".
        enabled: false,
    })
    // useBalance hook
    const { data, isError, isLoading } = useBalance({
        address: address,
    })
    // useConnect hook
    const { connect } = useConnect({
        connector: new InjectedConnector(),
    })
    // useDisconnect hook
    const { disconnect } = useDisconnect()

    // -----------------------
    // -- Wagmi Hooks Value --
    // -----------------------

    // When connected to InjectedConnector
    if (isConnected) {
        return (
            <>
                <div>Connected to {ensName ?? address}</div>
                <div>
                    Balance: {}
                    {isLoading
                        ? "Loading..."
                        : isError
                        ? "Error fetching balance"
                        : `${data?.formatted} ${data?.symbol}`}
                </div>
                <button onClick={() => disconnect()}>Disconnect Wallet</button>
            </>
        )
    }
    // When the provider is disconnected
    if (isDisconnected) {
        return (
            <>
                <button onClick={() => connect()}>Connect Wallet</button>
            </>
        )
    }
    // Otherwise, reconnect the provider.
    return (
        <>
            <button onClick={() => connect()}>Connect Wallet</button>
        </>
    )
}
