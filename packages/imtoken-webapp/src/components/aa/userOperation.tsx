import * as React from "react";
import * as Ethers5 from "ethers";
import * as UserOp from "userop";

import {
  ImAccount,
  IBuilderOpts,
  IMiddlewareGenerator,
  GasLimitMiddlewareGenerator,
  OnboardingPaymasterGenerator,
  PimlicoPaymasterGenerator,
} from "@/../lib/account-abstraction/sdk";

import {
  ImAccountFactory__factory,
  ImAccountFactory,
  OnboardingPaymaster__factory,
  OnboardingPaymaster,
} from "@/../lib/account-abstraction/typechain-types";

// import * as Addresses from "./addressea"
import * as Utils from "./utils";

import * as TypesFactoryEntryPoint from "@/../typechain-types/@account-abstraction/contracts/factories/EntryPoint__factory";
import * as TypesFactoryAccount from "@/../typechain-types/@account-abstraction/contracts/factories/SimpleAccount__factory";
import * as TypesFactoryErc20 from "@/../typechain-types/@openzeppelin/contracts/factories/ERC20__factory";
import * as TypesFactoryAccountFactory from "@/../typechain-types/@account-abstraction/contracts/factories/SimpleAccountFactory__factory";

import * as TypesEntryPoint from "@/../typechain-types/@account-abstraction/contracts/EntryPoint";

// Avoid using "as" to prevent errors related to "Should not import the named export 'xxx' (imported as 'xxx') from default-exporting module (only default export is available soon)".
import jsonEntryPoint from "@account-abstraction/contracts/artifacts/EntryPoint.json";
import jsonAccount from "@account-abstraction/contracts/artifacts/SimpleAccount.json";
import jsonErc20 from "@openzeppelin/contracts/build/contracts/ERC20.json";

// If CSS is imported here, it will generate an error related to "The resource <URL> was preloaded using link preload but not used within a few seconds from the window’s load event. Please make sure it has an appropriate as value and it is preloaded intentionally.".
import "./aa.scss";

const debug = false;
const hardhatForkNet: string = "goerli";

const AA_DEFAULT_NONCE_KEY = 0;

let executeArgs: {
  dest: string;
  value: Ethers5.BigNumber;
  func: Uint8Array;
} = {
  dest: Ethers5.utils.getAddress(Ethers5.constants.AddressZero), // dest
  value: Ethers5.utils.parseEther("0"), // value
  func: Ethers5.utils.arrayify("0x"), // func
};

// My AA Contracts on Hardhat Node
// const ENTRY_POINT_ADDRESS = "0x3Fe10E5Bf9809abBD60953032C4996DD7bf07D5c"
// const ACCOUNT_FACTORY_PROXY_ADDRESS = "0xE0Cc10b05bD1d78950A9D065f080E2Aa308839a6"

// imToken AA Contracts on Goerli Testnet
const ENTRY_POINT_ADDRESS = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";
const ACCOUNT_FACTORY_PROXY_ADDRESS =
  "0xF3A26E979977053fb8D3bd6cCcd74A8f71BDddD1";

const ONBOARDING_PAYMASTER_ADDRESS =
  "0x491B26ed23Bb85D23CC9e5428F99A6EE25320025";
const PIMLICO_PAYMASTER_ADDRESS = "0xEc43912D8C772A0Eba5a27ea5804Ba14ab502009";

const BUNDLER_RPC_URL = "http://bundler.dev.rivo.network/unsafe/rpc";

const SIGNER6_ADDRESS = "0x81578FBe3Ca2941e50404Ec4E713625169C33e53";

const USDT_ADDRESS =
  hardhatForkNet === "mainnet"
    ? "0xdAC17F958D2ee523a2206206994597C13D831ec7"
    : "0xC2C527C0CACF457746Bd31B2a698Fe89de2b6d49";

const USDC_ADDRESS =
  hardhatForkNet === "mainnet"
    ? "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
    : "0x07865c6E87B9F70255377e024ace6630C1Eaa37F";

const defaultUserOp: UserOp.IUserOperation = {
  sender: Ethers5.constants.AddressZero,
  nonce: Utils.encodeAANonce(AA_DEFAULT_NONCE_KEY, 0),
  initCode: "0x",
  callData: "0x",
  callGasLimit: 70000,
  verificationGasLimit: 70000,
  preVerificationGas: 23000,
  maxFeePerGas: Ethers5.utils.parseUnits("20", "gwei"),
  maxPriorityFeePerGas: Ethers5.utils.parseUnits("1", "gwei"),
  paymasterAndData: "0x",
  signature: "0x",
};

export const UserOperation = () => {
  // -----------------
  // -- React Hooks --
  // -----------------
  const [userOp, setUserOp] =
    React.useState<UserOp.IUserOperation>(defaultUserOp);
  const [isUserOpVisible, setIsUserOpVisible] = React.useState(false);

  const [tokenSymbol, setTokenSymbol] = React.useState<string>("USDC");
  const [toAddress, setToAddress] = React.useState<string>(SIGNER6_ADDRESS);
  const [tokenAmount, setTokenAmount] = React.useState<Ethers5.BigNumberish>(
    Ethers5.BigNumber.from("1000000")
  );
  // Metamask State
  const [metamaskAddress, setMetamaskAddress] = React.useState<string>("");
  const [metamaskBalanceEth, setMetamaskBalanceEth] =
    React.useState<Ethers5.BigNumberish>(Ethers5.BigNumber.from(0));
  const [metamaskBalanceUsdc, setMetamaskBalanceUsdc] =
    React.useState<Ethers5.BigNumberish>(Ethers5.BigNumber.from(0));

  // AA Account State and
  const [aADeploySalt, setAADeploySalt] = React.useState<Ethers5.BigNumberish>(
    Ethers5.BigNumber.from(999666333)
  );
  const [aAAccountAddress, setAAAccountAddress] = React.useState<string>("");
  const [aABalanceEth, setAABalanceEth] = React.useState<Ethers5.BigNumberish>(
    Ethers5.BigNumber.from(0)
  );
  const [aABalanceEthInEntryPoint, setAABalanceEthInEntryPoint] =
    React.useState<Ethers5.BigNumberish>(Ethers5.BigNumber.from(0));
  const [aABalanceUsdc, setAABalanceUsdc] =
    React.useState<Ethers5.BigNumberish>(Ethers5.BigNumber.from(0));
  const [aANonce, setAANonce] = React.useState<Ethers5.BigNumberish>(
    Utils.encodeAANonce(AA_DEFAULT_NONCE_KEY, 0)
  );

  // const [imAccount, setImAccount] = React.useState<ImAccount | null>(null);

  // Other State
  const [error, setError] = React.useState<string>("");

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
    };
  };

  // ----------------------
  // -- React Use Effect --
  // ----------------------
  React.useEffect(() => {
    if (debug) {
      Utils.logUserOp(userOp);
    }
  }, [userOp]);

  // useEffect 處理 timer
  React.useEffect(() => {
    // Get ETH balance and network info only when having currentAccount
    if (!metamaskAddress || !Ethers5.utils.isAddress(metamaskAddress)) {
      return;
    }
    if (!window.ethereum) {
      return;
    }
    const provider = new Ethers5.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contractUsdc = TypesFactoryErc20.ERC20__factory.connect(
      USDC_ADDRESS,
      provider
    );
    const contractAccountFactoryProxy =
      TypesFactoryAccountFactory.SimpleAccountFactory__factory.connect(
        ACCOUNT_FACTORY_PROXY_ADDRESS,
        provider
      );
    // 非同步函數
    const getBalanceAndAccountNonce = async () => {
      // 取得 User 的 ETH 及 USDC 餘額
      setMetamaskBalanceEth(await provider.getBalance(metamaskAddress));
      setMetamaskBalanceUsdc(await contractUsdc.balanceOf(metamaskAddress));

      // 透過 User 取得 Account 地址
      const accountAddress = await contractAccountFactoryProxy.getAddress(
        metamaskAddress,
        aADeploySalt
      );

      // 偵測是否已部署 Account 合約
      if ((await provider.getCode(accountAddress)) === "0x") {
        setAAAccountAddress("");
        setAABalanceEth(Ethers5.BigNumber.from(0));
        setAABalanceUsdc(Ethers5.BigNumber.from(0));
        setAANonce(Utils.encodeAANonce(AA_DEFAULT_NONCE_KEY, 0));
        setAABalanceEthInEntryPoint(Ethers5.BigNumber.from(0));
      }

      // 偵測到此 Salt 有部署過 Account 合約
      if ((await provider.getCode(accountAddress)) !== "0x") {
        // 從 Metamask 讀取資訊
        setAAAccountAddress(accountAddress);
        setAABalanceEth(await provider.getBalance(accountAddress));
        setAABalanceUsdc(await contractUsdc.balanceOf(accountAddress));

        // 從 EntryPoint 讀取資訊
        const contractEntryPoint =
          TypesFactoryEntryPoint.EntryPoint__factory.connect(
            ENTRY_POINT_ADDRESS,
            provider
          );
        setAANonce(
          Utils.encodeAANonce(
            AA_DEFAULT_NONCE_KEY,
            await contractEntryPoint.getNonce(
              accountAddress,
              AA_DEFAULT_NONCE_KEY
            )
          )
        );
        setAABalanceEthInEntryPoint(
          (await contractEntryPoint.deposits(accountAddress))[0]
        );
      }
    };

    // 設置計數器
    let id = setInterval(() => {
      getBalanceAndAccountNonce().catch((e) => console.log(e));
    }, 1000);

    // 若此 useEffect 執行第 2 次，則先將先前的計數器刪除
    return function () {
      clearInterval(id);
    };
  }, [metamaskAddress, aADeploySalt]); // 當與 Metamask 連接，並取得帳號地址時啟動

  // ----------------------
  // -- React 一般按鈕事件 --
  // ----------------------

  // Click connect
  const onClickConnect = () => {
    //client side code
    if (!window.ethereum) {
      console.log("please install MetaMask");
      return;
    }
    // We can do it using ethers.js
    const provider = new Ethers5.providers.Web3Provider(window.ethereum);
    provider
      .send("eth_requestAccounts", [])
      .then((accounts) => {
        if (accounts.length > 0) setMetamaskAddress(accounts[0]);
      })
      .catch((e) => console.log(e));
  };

  // Click disconnect
  const onClickDisconnect = () => {
    console.log("onClickDisConnect");
    setMetamaskAddress("");
    setMetamaskBalanceEth(Ethers5.BigNumber.from(0));
    setMetamaskBalanceUsdc(Ethers5.BigNumber.from(0));
    setAAAccountAddress("");
    setAABalanceEth(Ethers5.BigNumber.from(0));
    setAABalanceEthInEntryPoint(Ethers5.BigNumber.from(0));
    setAABalanceUsdc(Ethers5.BigNumber.from(0));
    setAANonce(Ethers5.BigNumber.from(0));
  };

  // 透過 AccountFactory 部署 Account 合約
  const handleDeployAccount = React.useCallback(async () => {
    if (!window.ethereum) {
      return;
    }

    const provider = new Ethers5.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    // // Declare the gas overrides argument.
    // const gasOverrides: Ethers5.Overrides = {
    //   gasLimit: Ethers5.BigNumber.from(5000000),
    //   gasPrice:
    //     (await provider.getFeeData()).gasPrice || Ethers5.BigNumber.from(0),
    //   nonce: Ethers5.BigNumber.from(9),
    // };
    // const contractAccountFactoryProxy =
    //   TypesFactoryAccountFactory.SimpleAccountFactory__factory.connect(
    //     ACCOUNT_FACTORY_PROXY_ADDRESS,
    //     signer
    //   );
    // let writeTransaction: Ethers5.ContractTransaction;

    // // 部署新的 Account
    // writeTransaction = await contractAccountFactoryProxy.createAccount(
    //   metamaskAddress,
    //   aADeploySalt,
    //   gasOverrides
    // );

    const activityId = 0;
    const onboardingPaymasterGenerator = new OnboardingPaymasterGenerator(
      ONBOARDING_PAYMASTER_ADDRESS,
      activityId
    );

    const imAccountOpts: IBuilderOpts = {
      entryPoint: ENTRY_POINT_ADDRESS,
      factory: ACCOUNT_FACTORY_PROXY_ADDRESS,
      paymasterMiddlewareGenerator: onboardingPaymasterGenerator,
      salt: aADeploySalt,
    };

    const imAccount = await ImAccount.init(
      signer,
      BUNDLER_RPC_URL,
      imAccountOpts
    );

    const ifaceErc20 = new Ethers5.utils.Interface(jsonErc20.abi);

    const encodeUsdcApprove = ifaceErc20.encodeFunctionData("approve", [
      Ethers5.utils.getAddress(PIMLICO_PAYMASTER_ADDRESS),
      Ethers5.constants.MaxUint256,
    ]);

    executeArgs = {
      dest: Ethers5.utils.getAddress(USDC_ADDRESS), // dest
      value: Ethers5.BigNumber.from(0), // value
      func: Ethers5.utils.arrayify(encodeUsdcApprove), // func
    };

    const imBuilder: UserOp.IUserOperationBuilder = imAccount.executeBatch(
      [executeArgs.dest],
      [executeArgs.value],
      [executeArgs.func]
    );

    const client = await UserOp.Client.init(BUNDLER_RPC_URL);

    const res = await client.sendUserOperation(imBuilder, {
      onBuild: (op) => {
        // Update the value to userOpTemp
        // setUserOp(formatUserOp(userOpWithSig));
        setUserOp(formatUserOp(imAccount.getOp()));
        console.log("Signed UserOperation:", op);
      },
    });

    const ev = await res.wait();
  }, [metamaskAddress, aADeploySalt]);

  const handleShowHideUserOp = () => {
    if (isUserOpVisible) {
      setIsUserOpVisible(false);
    }

    if (!isUserOpVisible) {
      setIsUserOpVisible(true);
    }
  };

  // ---------------------------------------------
  // --------------- React 按鈕事件 ---------------
  // -- 指定 Hook 就位後會建新 func instance 來執行 --
  // ---------------------------------------------

  // Button Handler: Set the Transferred type and Sign
  const handleSigTransactionViaOnboarding = React.useCallback(async () => {
    if (!window.ethereum) {
      return;
    }

    const provider = new Ethers5.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();

    if (tokenSymbol === "ETH") {
      executeArgs = {
        dest: Ethers5.utils.getAddress(toAddress), // dest
        value: Ethers5.utils.parseEther("1"), // value
        func: Ethers5.utils.arrayify("0x"), // func
      };
      if (debug) {
        console.log(`tokenSymbol: ${tokenSymbol}`);
        console.log(`executeArgs: ${executeArgs}`);
      }
    }

    if (tokenSymbol === "USDC") {
      const ifaceErc20 = new Ethers5.utils.Interface(jsonErc20.abi);

      const encodeUsdcTransfer = ifaceErc20.encodeFunctionData("transfer", [
        Ethers5.utils.getAddress(toAddress),
        Ethers5.BigNumber.from(tokenAmount),
      ]);
      executeArgs = {
        dest: Ethers5.utils.getAddress(USDC_ADDRESS), // dest
        value: Ethers5.BigNumber.from(0), // value
        func: Ethers5.utils.arrayify(encodeUsdcTransfer), // func
      };
      if (debug) {
        console.log(`tokenSymbol: ${tokenSymbol}`);
        console.log(`encodeTransfer: ${encodeUsdcTransfer}`);
        console.log(`executeArgs: ${executeArgs}`);
      }
    }

    const activityId = 0;
    const onboardingPaymasterGenerator = new OnboardingPaymasterGenerator(
      ONBOARDING_PAYMASTER_ADDRESS,
      activityId
    );

    const imAccountOpts: IBuilderOpts = {
      entryPoint: ENTRY_POINT_ADDRESS,
      factory: ACCOUNT_FACTORY_PROXY_ADDRESS,
      paymasterMiddlewareGenerator: onboardingPaymasterGenerator,
      salt: aADeploySalt,
    };

    const imAccount = await ImAccount.init(
      signer,
      BUNDLER_RPC_URL,
      imAccountOpts
    );

    const imBuilder: UserOp.IUserOperationBuilder = imAccount.executeBatch(
      [executeArgs.dest],
      [executeArgs.value],
      [executeArgs.func]
    );

    const client = await UserOp.Client.init(BUNDLER_RPC_URL);

    let res = await client.sendUserOperation(imBuilder, {
      onBuild: (op) => {
        // Update the value to userOpTemp
        // setUserOp(formatUserOp(userOpWithSig));
        setUserOp(formatUserOp(imBuilder.getOp()));
        console.log("Signed UserOperation:", op);
      },
    });

    let ev = await res.wait();
  }, [userOp, aAAccountAddress, tokenSymbol, toAddress, tokenAmount]);

  // Button Handler: Set the Transferred type and Sign
  const handleSigTransactionViaPimlico = React.useCallback(async () => {
    if (!window.ethereum) {
      return;
    }

    const provider = new Ethers5.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();

    if (tokenSymbol === "ETH") {
      executeArgs = {
        dest: Ethers5.utils.getAddress(toAddress), // dest
        value: Ethers5.utils.parseEther("1"), // value
        func: Ethers5.utils.arrayify("0x"), // func
      };
      if (debug) {
        console.log(`tokenSymbol: ${tokenSymbol}`);
        console.log(`executeArgs: ${executeArgs}`);
      }
    }

    if (tokenSymbol === "USDC") {
      const ifaceErc20 = new Ethers5.utils.Interface(jsonErc20.abi);

      const encodeUsdcTransfer = ifaceErc20.encodeFunctionData("transfer", [
        Ethers5.utils.getAddress(toAddress),
        Ethers5.BigNumber.from(tokenAmount),
      ]);
      executeArgs = {
        dest: Ethers5.utils.getAddress(USDC_ADDRESS), // dest
        value: Ethers5.BigNumber.from(0), // value
        func: Ethers5.utils.arrayify(encodeUsdcTransfer), // func
      };
      if (debug) {
        console.log(`tokenSymbol: ${tokenSymbol}`);
        console.log(`encodeTransfer: ${encodeUsdcTransfer}`);
        console.log(`executeArgs: ${executeArgs}`);
      }
    }

    const pimlicoPaymasterGenerator = new PimlicoPaymasterGenerator(
      provider,
      PIMLICO_PAYMASTER_ADDRESS
    );

    const imAccountOpts: IBuilderOpts = {
      entryPoint: ENTRY_POINT_ADDRESS,
      factory: ACCOUNT_FACTORY_PROXY_ADDRESS,
      paymasterMiddlewareGenerator: pimlicoPaymasterGenerator,
      salt: aADeploySalt,
    };

    const imAccount = await ImAccount.init(
      signer,
      BUNDLER_RPC_URL,
      imAccountOpts
    );

    const imBuilder: UserOp.IUserOperationBuilder = imAccount.executeBatch(
      [executeArgs.dest],
      [executeArgs.value],
      [executeArgs.func]
    );

    const client = await UserOp.Client.init(BUNDLER_RPC_URL);

    let res = await client.sendUserOperation(imBuilder, {
      onBuild: (op) => {
        // Update the value to userOpTemp
        // setUserOp(formatUserOp(userOpWithSig));
        setUserOp(formatUserOp(imBuilder.getOp()));
        console.log("Signed UserOperation:", op);
      },
    });

    let ev = await res.wait();
  }, [userOp, aAAccountAddress, tokenSymbol, toAddress, tokenAmount]);

  const handleAADeploySaltChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { id, value } = event.target;
    switch (id) {
      case "aADeploySalt":
        setAADeploySalt(Ethers5.BigNumber.from(value));
        break;
      default:
        setAADeploySalt(Ethers5.BigNumber.from(0));
        break;
    }
  };

  const handleUserOpFormChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { id, value } = event.target;
    try {
      switch (id) {
        case "tokenSymbol":
          try {
            setTokenSymbol(value.toString());
            if (value.toString() === "ETH") {
              setTokenAmount(Ethers5.BigNumber.from("1000000000000000000"));
            }
            if (value.toString() === "USDC") {
              setTokenAmount(Ethers5.BigNumber.from(1000000));
            }
            setError("");
          } catch (err: unknown) {
            setError(err instanceof Error ? err.message : String(err));
          }
          break;
        case "toAddress":
          try {
            setToAddress(Ethers5.utils.getAddress(value));
            setError("");
          } catch (err: unknown) {
            setError(err instanceof Error ? err.message : String(err));
          }
          break;
        case "tokenAmount":
          try {
            setTokenAmount(Ethers5.BigNumber.from(value));
            setError("");
          } catch (err: unknown) {
            setError(err instanceof Error ? err.message : String(err));
          }
          break;
        case "sender":
          try {
            setUserOp({
              ...userOp,
              sender: Ethers5.utils.getAddress(value),
            });
            setError("");
          } catch (err: unknown) {
            setError(err instanceof Error ? err.message : String(err));
          }
          break;
        case "nonce":
          try {
            setUserOp({
              ...userOp,
              nonce: Ethers5.BigNumber.from(value),
            });
            setError("");
          } catch (err: unknown) {
            setError(err instanceof Error ? err.message : String(err));
          }
          break;
        case "initCode":
          try {
            setUserOp({
              ...userOp,
              initCode: Ethers5.utils.hexlify(value),
            });
            setError("");
          } catch (err: unknown) {
            setError(err instanceof Error ? err.message : String(err));
          }
          break;
        case "callData":
          try {
            setUserOp({
              ...userOp,
              callData: Ethers5.utils.hexlify(value),
            });
            setError("");
          } catch (err: unknown) {
            setError(err instanceof Error ? err.message : String(err));
          }
          break;
        case "callGasLimit":
          try {
            setUserOp({
              ...userOp,
              callGasLimit: Ethers5.BigNumber.from(value),
            });
            setError("");
          } catch (err: unknown) {
            setError(err instanceof Error ? err.message : String(err));
          }
          break;
        case "verificationGasLimit":
          try {
            setUserOp({
              ...userOp,
              verificationGasLimit: Ethers5.BigNumber.from(value),
            });
            setError("");
          } catch (err: unknown) {
            setError(err instanceof Error ? err.message : String(err));
          }
          break;
        case "preVerificationGas":
          try {
            setUserOp({
              ...userOp,
              preVerificationGas: Ethers5.BigNumber.from(value),
            });
            setError("");
          } catch (err: unknown) {
            setError(err instanceof Error ? err.message : String(err));
          }
          break;
        case "maxFeePerGas":
          try {
            setUserOp({
              ...userOp,
              maxFeePerGas: Ethers5.BigNumber.from(value),
            });
            setError("");
          } catch (err: unknown) {
            setError(err instanceof Error ? err.message : String(err));
          }
          break;
        case "maxPriorityFeePerGas":
          try {
            setUserOp({
              ...userOp,
              maxPriorityFeePerGas: Ethers5.BigNumber.from(value),
            });
            setError("");
          } catch (err: unknown) {
            setError(err instanceof Error ? err.message : String(err));
          }
          break;
        case "paymasterAndData":
          try {
            setUserOp({
              ...userOp,
              paymasterAndData: Ethers5.utils.hexlify(value),
            });
            setError("");
          } catch (err: unknown) {
            setError(err instanceof Error ? err.message : String(err));
          }
          break;
        case "signature":
          try {
            setUserOp({
              ...userOp,
              signature: Ethers5.utils.hexlify(value),
            });
            setError("");
          } catch (err: unknown) {
            setError(err instanceof Error ? err.message : String(err));
          }
          break;
        default:
          break;
      }
      setError(""); // 清除先前的錯誤訊息
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err)); // 設置錯誤訊息狀態
      return;
    }
  };

  const formMetaMask = () => {
    return (
      <>
        <div className="metamask-form">
          <button
            disabled={!(metamaskAddress === "")}
            type="button"
            onClick={() => onClickConnect()}
          >
            Connect MetaMask
          </button>
          <button
            disabled={!(metamaskAddress !== "")}
            type="button"
            onClick={() => onClickDisconnect()}
          >
            Disconnect MetaMask
          </button>
          <table>
            <tbody>
              <tr>
                <td>Metamask_Signer:</td>
                <td>{metamaskAddress.toString()}</td>
              </tr>
              <tr>
                <td>Balance(ETH):</td>
                <td>{metamaskBalanceEth.toString()}</td>
              </tr>
              <tr>
                <td>Balance(USDC):</td>
                <td>{metamaskBalanceUsdc.toString()}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </>
    );
  };

  const formAADeploy = () => {
    return (
      <>
        <div className="aa-deploy-form">
          <table>
            <tbody>
              <tr>
                <td>Salt:</td>
                <td>
                  <input
                    type="text"
                    id="aADeploySalt"
                    value={`${aADeploySalt}`}
                    onChange={handleAADeploySaltChange}
                  />
                </td>
              </tr>
              <tr>
                <td>Action:</td>
                <td>
                  {" "}
                  <button
                    disabled={
                      !(metamaskAddress !== "" && aAAccountAddress === "")
                    } // 當 Metamask 已連線，且 Account 沒有地址時才可點擊
                    type="button"
                    onClick={() => handleDeployAccount()}
                  >
                    Deploy a AA Account
                  </button>
                </td>
              </tr>
            </tbody>
          </table>

          <table>
            <tbody>
              <tr>
                <td>AA_Address:</td>
                <td>{aAAccountAddress.toString()}</td>
              </tr>
              <tr>
                <td>AA_Nonce:</td>
                <td>{`Key[${Utils.decodeAANonce(
                  aANonce
                ).key.toString()}] = ${Utils.decodeAANonce(
                  aANonce
                ).seq.toString()} = Seq`}</td>
              </tr>
              <tr>
                <td>Balance(ETH):</td>
                <td>{aABalanceEth.toString()}</td>
              </tr>
              <tr>
                <td>Balance(USDC):</td>
                <td>{aABalanceUsdc.toString()}</td>
              </tr>
              <tr>
                <td>Balance(ETH) in EntryPoint:</td>
                <td>{aABalanceEthInEntryPoint.toString()}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </>
    );
  };

  const formTransferToken = () => {
    return (
      <>
        <div className="transfer-token-form">
          <table>
            <tbody>
              <tr>
                <td>Token:</td>
                <td>
                  <select
                    id="tokenSymbol"
                    value={`${tokenSymbol}`}
                    onChange={handleUserOpFormChange}
                  >
                    <option value="ETH">ETH</option>
                    <option value="USDC">USDC</option>
                  </select>
                </td>
              </tr>
              <tr>
                <td>To:</td>
                <td>
                  <input
                    type="text"
                    id="toAddress"
                    value={`${toAddress}`}
                    onChange={handleUserOpFormChange}
                  />
                </td>
              </tr>
              <tr>
                <td>Amount:</td>
                <td>
                  <input
                    type="text"
                    id="tokenAmount"
                    value={`${tokenAmount}`}
                    onChange={handleUserOpFormChange}
                  />
                </td>
              </tr>
            </tbody>
          </table>
          <div>
            <button onClick={() => handleSigTransactionViaOnboarding()}>
              Sign ETH/USDC transaction via OnboardingPaymaster
            </button>
            <button onClick={() => handleSigTransactionViaPimlico()}>
              Sign ETH/USDC transaction via PimlicoPaymaster
            </button>
          </div>
        </div>
      </>
    );
  };

  const formUserOp = (userOp: UserOp.IUserOperation) => {
    return (
      <>
        <div className="user-op-form">
          <button onClick={() => handleShowHideUserOp()}>
            Show/Hide UserOp
          </button>
          {isUserOpVisible && (
            <>
              <table>
                <tbody>
                  <tr>
                    <td>sender:</td>
                    <td>
                      <input
                        type="text"
                        id="sender"
                        value={`${userOp.sender}`}
                        onChange={handleUserOpFormChange}
                        disabled={true}
                      />
                    </td>
                    <td></td>
                  </tr>
                  <tr>
                    <td>nonce:</td>
                    <td>
                      <input
                        type="text"
                        id="nonce"
                        value={`${userOp.nonce}`}
                        onChange={handleUserOpFormChange}
                        disabled={true}
                      />
                    </td>
                    <td>{`Key[${
                      Utils.decodeAANonce(Ethers5.BigNumber.from(userOp.nonce))
                        .key
                    }] = ${
                      Utils.decodeAANonce(Ethers5.BigNumber.from(userOp.nonce))
                        .seq
                    } = Seq`}</td>
                  </tr>
                  <tr>
                    <td>initCode:</td>
                    <td>
                      <input
                        type="text"
                        id="initCode"
                        value={`${userOp.initCode}`}
                        onChange={handleUserOpFormChange}
                        disabled={true}
                      />
                    </td>
                    <td></td>
                  </tr>
                  <tr>
                    <td>callData:</td>
                    <td>
                      <input
                        type="text"
                        id="callData"
                        value={`${userOp.callData}`}
                        onChange={handleUserOpFormChange}
                        disabled={true}
                      />
                    </td>
                    <td></td>
                  </tr>
                  <tr>
                    <td>callGasLimit:</td>
                    <td>
                      <input
                        type="text"
                        id="callGasLimit"
                        value={`${userOp.callGasLimit}`}
                        onChange={handleUserOpFormChange}
                        disabled={true}
                      />
                    </td>
                    <td></td>
                  </tr>
                  <tr>
                    <td>verificationGasLimit:</td>
                    <td>
                      <input
                        type="text"
                        id="verificationGasLimit"
                        value={`${userOp.verificationGasLimit}`}
                        onChange={handleUserOpFormChange}
                        disabled={true}
                      />
                    </td>
                    <td></td>
                  </tr>
                  <tr>
                    <td>preVerificationGas:</td>
                    <td>
                      <input
                        type="text"
                        id="preVerificationGas"
                        value={`${userOp.preVerificationGas}`}
                        onChange={handleUserOpFormChange}
                        disabled={true}
                      />
                    </td>
                    <td></td>
                  </tr>
                  <tr>
                    <td>maxFeePerGas:</td>
                    <td>
                      <input
                        type="text"
                        id="maxFeePerGas"
                        value={`${userOp.maxFeePerGas}`}
                        onChange={handleUserOpFormChange}
                        disabled={true}
                      />
                    </td>
                    <td></td>
                  </tr>
                  <tr>
                    <td>maxPriorityFeePerGas:</td>
                    <td>
                      <input
                        type="text"
                        id="maxPriorityFeePerGas"
                        value={`${userOp.maxPriorityFeePerGas}`}
                        onChange={handleUserOpFormChange}
                        disabled={true}
                      />
                    </td>
                    <td></td>
                  </tr>
                  <tr>
                    <td>paymasterAndData:</td>
                    <td>
                      <input
                        type="text"
                        id="paymasterAndData"
                        value={`${userOp.paymasterAndData}`}
                        onChange={handleUserOpFormChange}
                        disabled={true}
                      />
                    </td>
                    <td></td>
                  </tr>
                  <tr>
                    <td>signature:</td>
                    <td>
                      <input
                        type="text"
                        id="signature"
                        value={`${userOp.signature}`}
                        onChange={handleUserOpFormChange}
                        disabled={true}
                      />
                    </td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </>
          )}
          <div>
            {error && <text className="Error">{`error: ${error}`}</text>}
          </div>
        </div>
      </>
    );
  };

  return (
    <>
      <h3>Explore Account Abstraction</h3>
      <div>
        <div>{formMetaMask()}</div>
        <div>{metamaskAddress && formAADeploy()}</div>
        <div>{aAAccountAddress && formTransferToken()}</div>
        <div>{formUserOp(userOp)}</div>
      </div>
    </>
  );
};
