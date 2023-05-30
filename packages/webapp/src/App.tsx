import "./App.global.css"
// import styles from "./App.module.css"

import { Navigation } from "./components/Navigation/Navigation"
import { Display } from "./components/Display/Display"
import { MetaMaskError } from "./components/MetaMaskError/MetaMaskError"
import { DeployAA } from "./components/DeployAA/DeployAA"
import { MetaMaskContextProvider } from "./hooks/useMetaMask"

export const App = () => {
    return (
        <MetaMaskContextProvider>
            {/* <div className={styles.appContainer}> */}
            <div className="App">
                <Navigation />
                <Display />
                <MetaMaskError />
                <DeployAA />
            </div>
        </MetaMaskContextProvider>
    )
}

export default App
