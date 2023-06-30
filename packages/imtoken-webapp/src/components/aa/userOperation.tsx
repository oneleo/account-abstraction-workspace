import * as React from "react";
import * as Ethers5 from "ethers";
import * as UserOp from "userop";

import {
  ImAccount,
  IBuilderOpts,
  OnboardingPaymasterGenerator,
  PimlicoPaymasterGenerator,
} from "@/../lib/account-abstraction/sdk";

// import * as Addresses from "./addressea"
import * as Utils from "./utils";

import * as TypesFactoryEntryPoint from "@/../typechain-types/@account-abstraction/contracts/factories/EntryPoint__factory";
import * as TypesFactoryErc20 from "@/../typechain-types/@openzeppelin/contracts/factories/ERC20__factory";
import * as TypesFactoryAccountFactory from "@/../typechain-types/@account-abstraction/contracts/factories/SimpleAccountFactory__factory";
import * as TypesFactoryOnboardingPaymaster from "@/../lib/account-abstraction/typechain-types/factories/src/paymaster/OnboardingPaymaster__factory";

// Avoid using "as" to prevent errors related to "Should not import the named export 'xxx' (imported as 'xxx') from default-exporting module (only default export is available soon)".
import jsonErc20 from "@openzeppelin/contracts/build/contracts/ERC20.json";

// If CSS is imported here, it will generate an error related to "The resource <URL> was preloaded using link preload but not used within a few seconds from the window’s load event. Please make sure it has an appropriate as value and it is preloaded intentionally.".
import "./aa.scss";

const debug: boolean = false;
const NETWORK_NAME = Utils.NETWORK_NAME;

const AA_DEFAULT_NONCE_KEY = 0;
const ONBOARDING_PAYMASTER_ACTIVETY_ID = 0;

// imToken AA Server
const ETHERSPOT_RPC_URL = "https://goerli-bundler.etherspot.io/";
const BUNDLER_RPC_URL = "http://bundler.dev.rivo.network/unsafe/rpc"; // Stackup Unsave
// const BUNDLER_RPC_URL = "http://bundler.dev.rivo.network/safe/rpc"; // Stackup Safe
// const BUNDLER_RPC_URL =
//   "https://eth-goerli.g.alchemy.com/v2/<YOUR_ALCHEMY_KEY>"; // Alchemy

const DEFAULT_REACT_USESTATE_PARAMS = {
  tokenAmount: 100000, // 1000000,
  salt: 9876543210, // 999666333, 1234567890,
};

// 欲請 Account 執行的指令
type ExecuteArgs = {
  dest: string;
  value: Ethers5.BigNumber;
  func: Uint8Array;
};

// UserOp 預設值
const defaultUserOp: UserOp.IUserOperation = {
  sender: Ethers5.constants.AddressZero,
  nonce: Utils.encodeAANonce(AA_DEFAULT_NONCE_KEY, 0),
  initCode: "0x",
  callData: "0x",
  callGasLimit: 35000,
  verificationGasLimit: 70000,
  preVerificationGas: 21000,
  maxFeePerGas: Ethers5.utils.parseUnits("20", "gwei"),
  maxPriorityFeePerGas: Ethers5.utils.parseUnits("1", "gwei"),
  paymasterAndData: "0x",
  signature: "0x",
};

export const UserOperation = () => {
  // -----------------
  // -- React Hooks --
  // -----------------
  // UserOp State
  const [userOp, setUserOp] =
    React.useState<UserOp.IUserOperation>(defaultUserOp);
  const [isUserOpVisible, setIsUserOpVisible] = React.useState(false);
  const [userOpHash, setUserOpHash] = React.useState<string>("");
  const [transactionHash, setTransactionHash] = React.useState<string>("");

  // Token State
  const [tokenSymbol, setTokenSymbol] = React.useState<string>("USDC");
  const [toAddress, setToAddress] = React.useState<string>(
    Utils.SIGNER6_ADDRESS
  );
  const [tokenAmount, setTokenAmount] = React.useState<Ethers5.BigNumberish>(
    Ethers5.BigNumber.from(DEFAULT_REACT_USESTATE_PARAMS.tokenAmount)
  );
  const [tokenDecimal, setTokenDecimal] = React.useState<number>(6);

  // Metamask State
  const [metamaskAddress, setMetamaskAddress] = React.useState<string>("");
  const [metamaskBalanceEth, setMetamaskBalanceEth] =
    React.useState<Ethers5.BigNumberish>(Ethers5.BigNumber.from(0));
  const [metamaskBalanceUsdc, setMetamaskBalanceUsdc] =
    React.useState<Ethers5.BigNumberish>(Ethers5.BigNumber.from(0));

  // AA Account State
  const [aADeploySalt, setAADeploySalt] = React.useState<Ethers5.BigNumberish>(
    Ethers5.BigNumber.from(DEFAULT_REACT_USESTATE_PARAMS.salt)
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
  const [aAOnboardingFreeQuota, setAAOnboardingFreeQuota] =
    React.useState<Ethers5.BigNumberish>(Ethers5.BigNumber.from(0));

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

    // 建立 USDC 合約實例
    const contractUsdc = TypesFactoryErc20.ERC20__factory.connect(
      Utils.USDC_ADDRESS,
      provider
    );

    // 建立 Account Factory 合約實例
    const contractAccountFactoryProxy =
      TypesFactoryAccountFactory.SimpleAccountFactory__factory.connect(
        Utils.ACCOUNT_FACTORY_PROXY_ADDRESS,
        provider
      );

    // 建立 Onboarding Paymaster 合約實例
    const contractOnboardingPaymaster =
      TypesFactoryOnboardingPaymaster.OnboardingPaymaster__factory.connect(
        Utils.ONBOARDING_PAYMASTER_ADDRESS,
        provider
      );

    // useEffect 內的非同步函數會放在這裡
    const getBalanceAndAccountNonce = async () => {
      // 取得 User 的 ETH 及 USDC 餘額
      setMetamaskBalanceEth(await provider.getBalance(metamaskAddress));
      setMetamaskBalanceUsdc(await contractUsdc.balanceOf(metamaskAddress));

      // 取得 Onboarding Paymaster 的 Activity 免費轉帳額度資訊
      setAAOnboardingFreeQuota(
        (
          await contractOnboardingPaymaster.getActivity(
            ONBOARDING_PAYMASTER_ACTIVETY_ID
          )
        ).config.quotaPerSender
      );

      // 透過當前 Metamask User 及指定 Salt 取得 Account 地址
      const accountAddress = await contractAccountFactoryProxy.getAddress(
        metamaskAddress,
        aADeploySalt
      );

      // 偵測鏈上是否已部署此 Account 合約：失敗
      if ((await provider.getCode(accountAddress)) === "0x") {
        setAAAccountAddress("");
        setAABalanceEth(Ethers5.BigNumber.from(0));
        setAABalanceUsdc(Ethers5.BigNumber.from(0));
        setAANonce(Utils.encodeAANonce(AA_DEFAULT_NONCE_KEY, 0));
        setAABalanceEthInEntryPoint(Ethers5.BigNumber.from(0));
      }

      // 偵測鏈上是否已部署此 Account 合約：成功
      if ((await provider.getCode(accountAddress)) !== "0x") {
        // 從 Metamask 讀取資訊
        setAAAccountAddress(accountAddress);
        setAABalanceEth(await provider.getBalance(accountAddress));
        setAABalanceUsdc(await contractUsdc.balanceOf(accountAddress));

        // 從 EntryPoint 讀取資訊
        const contractEntryPoint =
          TypesFactoryEntryPoint.EntryPoint__factory.connect(
            Utils.ENTRY_POINT_ADDRESS,
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

    provider.getFeeData().then((feeData) => {
      console.log(`fee data: ${JSON.stringify(feeData)}`);
    });
  };

  // Click disconnect
  const onClickDisconnect = () => {
    console.log("onClickDisConnect");
    setError("");
    setMetamaskAddress("");
    setMetamaskBalanceEth(Ethers5.BigNumber.from(0));
    setMetamaskBalanceUsdc(Ethers5.BigNumber.from(0));
    setAAAccountAddress("");
    setAABalanceEth(Ethers5.BigNumber.from(0));
    setAABalanceEthInEntryPoint(Ethers5.BigNumber.from(0));
    setAABalanceUsdc(Ethers5.BigNumber.from(0));
    setAANonce(Ethers5.BigNumber.from(0));
    setUserOpHash("");
    setTransactionHash("");
  };

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

  // ----------------------------------------------------------------
  // -------------------- Deploy Account 按鈕事件 --------------------
  // ------------------ 若對應 Salt 的 Account 為空 ------------------
  // -- 透過 onboardingPaymaster 向 AccountFactory 部署 Account 合約 --
  // ----------------------------------------------------------------

  const handleDeployAccount = React.useCallback(async () => {
    if (!window.ethereum) {
      return;
    }

    const provider = new Ethers5.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();

    // 在部署新 Account 的同時，進行 USDC 最大值的 Approve，以利後續向 PimlicoPaymaster 支付 USDC 手續費
    const executeArgs: ExecuteArgs = {
      dest: Ethers5.utils.getAddress(Utils.USDC_ADDRESS), // dest
      value: Ethers5.BigNumber.from(0), // value
      func: Ethers5.utils.arrayify(
        Utils.usdcApproveCalldata(Utils.PIMLICO_PAYMASTER_ADDRESS)
      ), // func
    };
    if (debug) {
      // 查看 executeArgs 內容
      console.log(`executeArgs: ${JSON.stringify(executeArgs)}`);
    }

    // 建立一個新的 ImAccount Via Onboarding Paymaster 實例
    const onboardingPaymasterGenerator = new OnboardingPaymasterGenerator(
      Utils.ONBOARDING_PAYMASTER_ADDRESS,
      ONBOARDING_PAYMASTER_ACTIVETY_ID
    );
    const imAccountOpts: IBuilderOpts = {
      entryPoint: Utils.ENTRY_POINT_ADDRESS,
      factory: Utils.ACCOUNT_FACTORY_PROXY_ADDRESS,
      paymasterMiddlewareGenerator: onboardingPaymasterGenerator,
      salt: aADeploySalt,
      overrideBundlerEstimateRpc: ETHERSPOT_RPC_URL,
      // useOriginMaxFeePerGasToEstimate: true,
    };
    const imAccount = await ImAccount.init(
      signer,
      BUNDLER_RPC_URL,
      imAccountOpts
    );

    // 使用 executeArgs 建立初始的 UserOp（無 gas 與 signature 內容）
    const imBuilder: UserOp.IUserOperationBuilder = imAccount.executeBatch(
      [executeArgs.dest],
      [executeArgs.value],
      [executeArgs.func]
    );

    // 送交易前，先更新前端 userOp 資訊
    setUserOp(formatUserOp(imBuilder.getOp()));

    // 送交易前，先將上一次的 userOpHash 及 error 資訊清空
    setUserOpHash("");
    setTransactionHash("");
    setError("");

    // 估算完 gas 後，Signer 並對 userOp 簽名，最後將組合完成的 userOp 傳送給 Bundler
    let res, ev;
    try {
      const client = await UserOp.Client.init(BUNDLER_RPC_URL);
      // 送交易前先更新前端 userOp 資訊
      setUserOp(formatUserOp(imBuilder.getOp()));
      res = await client.sendUserOperation(imBuilder, {
        onBuild: (op) => {
          // 送交易中再更新一次實際上鏈的 userOp 資訊
          setUserOp(formatUserOp(imAccount.getOp()));
          console.log("Signed UserOperation:", op);
        },
      });
      // 等待 Bundler 送出交易完成
      ev = await res.wait();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    }

    if (res) {
      if (res.userOpHash) {
        // 設置 userOpHash
        setUserOpHash(res.userOpHash);
      }
      // 給予 3 次 await res 的機會
      for (let checkTime = 3; checkTime > 0; checkTime--) {
        if (ev) {
          if (ev.transactionHash) {
            // 設置 transactionHash
            setTransactionHash(ev.transactionHash);
            break;
          }
        }
        if (!ev) {
          ev = await res.wait();
        }
        console.log(`checkTime: ${checkTime}`);
      }
    }
  }, [metamaskAddress, aADeploySalt]);

  // --------------------------------------
  // ---- Onboarding Paymaster 按鈕事件 ----
  // -- 對 UserOp 簽名後傳送給 Bundler 上鏈 --
  // --------- 轉送 ETH、USDC 交易 ---------
  // --------------------------------------
  const handleSigTransactionViaOnboarding = React.useCallback(async () => {
    if (!window.ethereum) {
      return;
    }

    const provider = new Ethers5.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();

    // 宣告一個空的 executeArgs
    let executeArgs: ExecuteArgs = {
      dest: Ethers5.utils.getAddress(Ethers5.constants.AddressZero), // dest
      value: Ethers5.BigNumber.from(0), // value
      func: Ethers5.utils.arrayify("0x"), // func
    };

    // 建立轉送 ETH 的 callData
    if (tokenSymbol === "ETH") {
      executeArgs = {
        dest: Ethers5.utils.getAddress(toAddress), // dest
        value: Ethers5.BigNumber.from(tokenAmount), // value
        func: Ethers5.utils.arrayify("0x"), // func
      };
    }

    // 建立轉送 USDC 的 callData
    if (tokenSymbol === "USDC") {
      const ifaceErc20 = new Ethers5.utils.Interface(jsonErc20.abi);
      const encodeUsdcTransfer = ifaceErc20.encodeFunctionData("transfer", [
        Ethers5.utils.getAddress(toAddress),
        Ethers5.BigNumber.from(tokenAmount),
      ]);
      executeArgs = {
        dest: Ethers5.utils.getAddress(Utils.USDC_ADDRESS), // dest
        value: Ethers5.BigNumber.from(0), // value
        func: Ethers5.utils.arrayify(encodeUsdcTransfer), // func
      };
    }

    if (debug) {
      // 查看 executeArgs 內容
      console.log(
        `tokenSymbol: ${tokenSymbol}\nexecuteArgs: ${JSON.stringify(
          executeArgs
        )}`
      );
    }

    // 建立一個新的 ImAccount Via OnboardingPaymaster 實例
    const onboardingPaymasterGenerator = new OnboardingPaymasterGenerator(
      Utils.ONBOARDING_PAYMASTER_ADDRESS,
      ONBOARDING_PAYMASTER_ACTIVETY_ID
    );
    const imAccountOpts: IBuilderOpts = {
      entryPoint: Utils.ENTRY_POINT_ADDRESS,
      factory: Utils.ACCOUNT_FACTORY_PROXY_ADDRESS,
      paymasterMiddlewareGenerator: onboardingPaymasterGenerator,
      salt: aADeploySalt,
      overrideBundlerEstimateRpc: ETHERSPOT_RPC_URL,
    };
    const imAccount = await ImAccount.init(
      signer,
      BUNDLER_RPC_URL,
      imAccountOpts
    );

    // 使用 executeArgs 建立初始的 UserOp（無 gas 與 signature 內容）
    const imBuilder: UserOp.IUserOperationBuilder = imAccount.executeBatch(
      [executeArgs.dest],
      [executeArgs.value],
      [executeArgs.func]
    );

    // 送交易前，先更新前端 userOp 資訊
    setUserOp(formatUserOp(imBuilder.getOp()));

    // 送交易前，先將上一次的 userOpHash 及 error 資訊清空
    setUserOpHash("");
    setTransactionHash("");
    setError("");

    // 估算完 gas 後，Signer 並對 userOp 簽名，最後將組合完成的 userOp 傳送給 Bundler
    let res, ev;
    try {
      const client = await UserOp.Client.init(BUNDLER_RPC_URL);
      // 簽名及送出交易給 Bundler
      res = await client.sendUserOperation(imBuilder, {
        onBuild: (op) => {
          // 送交易中再更新一次實際上鏈的 userOp 資訊
          setUserOp(formatUserOp(op));
          console.log("Signed UserOperation:", op);
        },
      });
      // 等待 Bundler 送出交易完成
      ev = await res.wait();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    }

    if (res) {
      if (res.userOpHash) {
        // 設置 userOpHash
        setUserOpHash(res.userOpHash);
      }
      // 給予 3 次 await res 的機會
      for (let checkTime = 3; checkTime > 0; checkTime--) {
        if (ev) {
          if (ev.transactionHash) {
            // 設置 transactionHash
            setTransactionHash(ev.transactionHash);
            break;
          }
        }
        if (!ev) {
          ev = await res.wait();
        }
        console.log(`checkTime: ${checkTime}`);
      }
    }
  }, [userOp, aADeploySalt, tokenSymbol, toAddress, tokenAmount, tokenDecimal]);

  // --------------------------------------
  // ------ Pimlico Paymaster 按鈕事件 ------
  // -- 對 UserOp 簽名後傳送給 Bundler 上鏈 --
  // ---------- 轉送 ETH、USDC 交易 ----------
  // --------------------------------------

  // -- 備註：在 PimlicoPaymaster 流程中 Approve USDC 是無作用，
  // -- 在 Validation 階段會因實際無 Approve USDC 而出現「AA33 reverted (or OOG)」錯誤
  const handleSigTransactionViaPimlico = React.useCallback(async () => {
    if (!window.ethereum) {
      return;
    }

    const provider = new Ethers5.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();

    // 宣告一個空的 executeArgs
    let executeArgs: ExecuteArgs = {
      dest: Ethers5.utils.getAddress(Ethers5.constants.AddressZero), // dest
      value: Ethers5.BigNumber.from(0), // value
      func: Ethers5.utils.arrayify("0x"), // func
    };

    // 建立轉送 ETH 的 callData
    if (tokenSymbol === "ETH") {
      executeArgs = {
        dest: Ethers5.utils.getAddress(toAddress), // dest
        value: Ethers5.BigNumber.from(tokenAmount), // value
        func: Ethers5.utils.arrayify("0x"), // func
      };
    }

    // 建立轉送 USDC 的 callData
    if (tokenSymbol === "USDC") {
      const ifaceErc20 = new Ethers5.utils.Interface(jsonErc20.abi);
      const encodeUsdcTransfer = ifaceErc20.encodeFunctionData("transfer", [
        Ethers5.utils.getAddress(toAddress),
        Ethers5.BigNumber.from(tokenAmount),
      ]);
      executeArgs = {
        dest: Ethers5.utils.getAddress(Utils.USDC_ADDRESS), // dest
        value: Ethers5.BigNumber.from(0), // value
        func: Ethers5.utils.arrayify(encodeUsdcTransfer), // func
      };
    }

    if (debug) {
      // 查看 executeArgs 內容
      console.log(
        `tokenSymbol: ${tokenSymbol}\nexecuteArgs: ${JSON.stringify(
          executeArgs
        )}`
      );
    }

    // 建立一個新的 ImAccount Via PimlicoPaymaster 實例
    const pimlicoPaymasterGenerator = new PimlicoPaymasterGenerator(
      provider,
      Utils.PIMLICO_PAYMASTER_ADDRESS
    );
    const imAccountOpts: IBuilderOpts = {
      entryPoint: Utils.ENTRY_POINT_ADDRESS,
      factory: Utils.ACCOUNT_FACTORY_PROXY_ADDRESS,
      paymasterMiddlewareGenerator: pimlicoPaymasterGenerator,
      salt: aADeploySalt,
      overrideBundlerEstimateRpc: ETHERSPOT_RPC_URL,
    };
    const imAccount = await ImAccount.init(
      signer,
      BUNDLER_RPC_URL,
      imAccountOpts
    );

    // 使用 executeArgs 建立初始的 UserOp（無 gas 與 signature 內容）
    const imBuilder: UserOp.IUserOperationBuilder = imAccount.executeBatch(
      [executeArgs.dest],
      [executeArgs.value],
      [executeArgs.func]
    );

    // 送交易前，先更新前端 userOp 資訊
    setUserOp(formatUserOp(imBuilder.getOp()));

    // 送交易前，先將上一次的 userOpHash 及 error 資訊清空
    setUserOpHash("");
    setTransactionHash("");
    setError("");

    // 估算完 gas 後，Signer 並對 userOp 簽名，最後將組合完成的 userOp 傳送給 Bundler
    let res, ev;
    try {
      const client = await UserOp.Client.init(BUNDLER_RPC_URL);
      // 簽名及送出交易給 Bundler
      res = await client.sendUserOperation(imBuilder, {
        onBuild: (op) => {
          // 送交易中再更新一次實際上鏈的 userOp 資訊
          setUserOp(formatUserOp(op));
          console.log("Signed UserOperation:", op);
        },
      });
      // 等待 Bundler 送出交易完成
      ev = await res.wait();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    }

    if (res) {
      if (res.userOpHash) {
        // 設置 userOpHash
        setUserOpHash(res.userOpHash);
      }
      // 給予 3 次 await res 的機會
      for (let checkTime = 3; checkTime > 0; checkTime--) {
        if (ev) {
          if (ev.transactionHash) {
            // 設置 transactionHash
            setTransactionHash(ev.transactionHash);
            break;
          }
        }
        if (!ev) {
          ev = await res.wait();
        }
        console.log(`checkTime: ${checkTime}`);
      }
    }
  }, [userOp, aADeploySalt, tokenSymbol, toAddress, tokenAmount, tokenDecimal]);

  // --------------------------------------
  // ---- Onboarding Paymaster 按鈕事件 ----
  // -- 對 UserOp 簽名後傳送給 Bundler 上鏈 --
  // --------- 用 USDC 換 ETH 交易 ---------
  // --------------------------------------
  const handleSwapUsdcToEthViaOnboarding = React.useCallback(async () => {
    if (!window.ethereum) {
      return;
    }
    // 因為這個函數是將 USDC 換成 ETH，所以要求使用者輸入明確的 USDC 數量
    if (tokenSymbol !== "USDC") {
      setError("Please select the USDC amount and try again.");
      return;
    }

    const provider = new Ethers5.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();

    // 建立一個新的 ImAccount Via OnboardingPaymaster 實例
    const onboardingPaymasterGenerator = new OnboardingPaymasterGenerator(
      Utils.ONBOARDING_PAYMASTER_ADDRESS,
      ONBOARDING_PAYMASTER_ACTIVETY_ID
    );
    const imAccountOpts: IBuilderOpts = {
      entryPoint: Utils.ENTRY_POINT_ADDRESS,
      factory: Utils.ACCOUNT_FACTORY_PROXY_ADDRESS,
      paymasterMiddlewareGenerator: onboardingPaymasterGenerator,
      salt: aADeploySalt,
      overrideBundlerEstimateRpc: ETHERSPOT_RPC_URL,
    };
    const imAccount = await ImAccount.init(
      signer,
      BUNDLER_RPC_URL,
      imAccountOpts
    );

    // executeArgs1：Approve USDC 給 Uniswap Swap Router 合約
    const executeArgs1: ExecuteArgs = {
      dest: Ethers5.utils.getAddress(Utils.USDC_ADDRESS), // dest
      value: Ethers5.BigNumber.from(0), // value
      func: Ethers5.utils.arrayify(
        Utils.usdcApproveCalldata(Utils.UNISWAP_SWAP_ROUTER_V2_ADDRESS)
      ), // func
    };

    // executeArgs2：透過 Uniswap Swap Router 合約 Swap USDC to ETH
    const executeArgs2: ExecuteArgs = {
      dest: Ethers5.utils.getAddress(Utils.UNISWAP_SWAP_ROUTER_V2_ADDRESS), // dest
      value: Ethers5.BigNumber.from(0), // value
      func: Ethers5.utils.arrayify(
        Utils.uniswapSwapV2Calldata(
          tokenAmount, // amountIn: uint256
          Utils.USDC_ADDRESS,
          Utils.WETH_ADDRESS,
          imAccount.getSender() // to: address
        )
      ), // func
    };

    if (debug) {
      // 查看 executeArgs 內容
      console.log(
        `executeArgs1: ${JSON.stringify(
          executeArgs1
        )}\nexecuteArgs2: ${JSON.stringify(executeArgs2)}`
      );
    }

    // 使用 executeArgs 建立初始的 UserOp（無 gas 與 signature 內容）
    const imBuilder: UserOp.IUserOperationBuilder = imAccount.executeBatch(
      [executeArgs1.dest, executeArgs2.dest],
      [executeArgs1.value, executeArgs2.value],
      [executeArgs1.func, executeArgs2.func]
    );

    // 送交易前，先更新前端 userOp 資訊
    setUserOp(formatUserOp(imBuilder.getOp()));

    // 送交易前，先將上一次的 userOpHash 及 error 資訊清空
    setUserOpHash("");
    setTransactionHash("");
    setError("");

    // 估算完 gas 後，Signer 並對 userOp 簽名，最後將組合完成的 userOp 傳送給 Bundler
    let res, ev;
    try {
      const client = await UserOp.Client.init(BUNDLER_RPC_URL);
      // 簽名及送出交易給 Bundler
      res = await client.sendUserOperation(imBuilder, {
        onBuild: (op) => {
          // 送交易中再更新一次實際上鏈的 userOp 資訊
          setUserOp(formatUserOp(op));
          console.log("Signed UserOperation:", op);
        },
      });
      // 等待 Bundler 送出交易完成
      ev = await res.wait();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    }

    if (res) {
      if (res.userOpHash) {
        // 設置 userOpHash
        setUserOpHash(res.userOpHash);
      }
      // 給予 3 次 await res 的機會
      for (let checkTime = 3; checkTime > 0; checkTime--) {
        if (ev) {
          if (ev.transactionHash) {
            // 設置 transactionHash
            setTransactionHash(ev.transactionHash);
            break;
          }
        }
        if (!ev) {
          ev = await res.wait();
        }
        console.log(`checkTime: ${checkTime}`);
      }
    }
  }, [userOp, aADeploySalt, tokenSymbol, toAddress, tokenAmount, tokenDecimal]);

  // --------------------------------------
  // ------ Pimlico Paymaster 按鈕事件 ------
  // -- 對 UserOp 簽名後傳送給 Bundler 上鏈 --
  // ---------- 用 USDC 換 ETH 交易 ----------
  // --------------------------------------
  const handleSwapUsdcToEthViaPimlico = React.useCallback(async () => {
    if (!window.ethereum) {
      return;
    }
    // 因為這個函數是將 USDC 換成 ETH，所以要求使用者輸入明確的 USDC 數量
    if (tokenSymbol !== "USDC") {
      setError("Please select the USDC amount and try again.");
      return;
    }

    const provider = new Ethers5.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();

    // 建立一個新的 ImAccount Via PimlicoPaymaster 實例
    const pimlicoPaymasterGenerator = new PimlicoPaymasterGenerator(
      provider,
      Utils.PIMLICO_PAYMASTER_ADDRESS
    );
    const imAccountOpts: IBuilderOpts = {
      entryPoint: Utils.ENTRY_POINT_ADDRESS,
      factory: Utils.ACCOUNT_FACTORY_PROXY_ADDRESS,
      paymasterMiddlewareGenerator: pimlicoPaymasterGenerator,
      salt: aADeploySalt,
      overrideBundlerEstimateRpc: ETHERSPOT_RPC_URL,
    };
    const imAccount = await ImAccount.init(
      signer,
      BUNDLER_RPC_URL,
      imAccountOpts
    );

    // executeArgs1：Approve USDC 給 Uniswap Swap Router 合約
    const executeArgs1: ExecuteArgs = {
      dest: Ethers5.utils.getAddress(Utils.USDC_ADDRESS), // dest
      value: Ethers5.BigNumber.from(0), // value
      func: Ethers5.utils.arrayify(
        Utils.usdcApproveCalldata(Utils.UNISWAP_SWAP_ROUTER_V2_ADDRESS)
      ), // func
    };

    // executeArgs2：透過 Uniswap Swap Router 合約 Swap USDC to ETH
    const executeArgs2: ExecuteArgs = {
      dest: Ethers5.utils.getAddress(Utils.UNISWAP_SWAP_ROUTER_V2_ADDRESS), // dest
      value: Ethers5.BigNumber.from(0), // value
      func: Ethers5.utils.arrayify(
        Utils.uniswapSwapV2Calldata(
          tokenAmount, // amountIn: uint256
          Utils.USDC_ADDRESS,
          Utils.WETH_ADDRESS,
          imAccount.getSender() // to: address
        )
      ), // func
    };

    if (debug) {
      // 查看 executeArgs 內容
      console.log(
        `executeArgs1: ${JSON.stringify(
          executeArgs1
        )}\nexecuteArgs2: ${JSON.stringify(executeArgs2)}`
      );
    }

    // 使用 executeArgs 建立初始的 UserOp（無 gas 與 signature 內容）
    const imBuilder: UserOp.IUserOperationBuilder = imAccount.executeBatch(
      [executeArgs1.dest, executeArgs2.dest],
      [executeArgs1.value, executeArgs2.value],
      [executeArgs1.func, executeArgs2.func]
    );

    // 送交易前先更新前端 userOp 資訊
    setUserOp(formatUserOp(imBuilder.getOp()));

    // 送交易前，先將上一次的 userOpHash 及 error 資訊清空
    setUserOpHash("");
    setTransactionHash("");
    setError("");

    // 估算完 gas 後，Signer 並對 userOp 簽名，最後將組合完成的 userOp 傳送給 Bundler
    let res, ev;
    try {
      const client = await UserOp.Client.init(BUNDLER_RPC_URL);
      // 簽名及送出交易給 Bundler
      res = await client.sendUserOperation(imBuilder, {
        onBuild: (op) => {
          // 送交易中再更新一次實際上鏈的 userOp 資訊
          setUserOp(formatUserOp(op));
          console.log("Signed UserOperation:", op);
        },
      });
      // 等待 Bundler 送出交易完成
      ev = await res.wait();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    }

    if (res) {
      if (res.userOpHash) {
        // 設置 userOpHash
        setUserOpHash(res.userOpHash);
      }
      // 給予 3 次 await res 的機會
      for (let checkTime = 3; checkTime > 0; checkTime--) {
        if (ev) {
          if (ev.transactionHash) {
            // 設置 transactionHash
            setTransactionHash(ev.transactionHash);
            break;
          }
        }
        if (!ev) {
          ev = await res.wait();
        }
        console.log(`checkTime: ${checkTime}`);
      }
    }
  }, [userOp, aADeploySalt, tokenSymbol, toAddress, tokenAmount, tokenDecimal]);

  // ---------------------------------------------
  // ------------- React 改變更新事件 -------------
  // ----- 使用者改變輸入值時，將對應用 Hook 更新 -----
  // ---------------------------------------------

  // 當使用者輸入新的 Salt 值時，更新 React Hook：aADeploySalt 內容
  const handleAADeploySaltChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    // 清空 userOpHash 及 error 資訊
    setUserOpHash("");
    setTransactionHash("");
    setError("");

    // 更新 React Hook：aADeploySalt
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

  // 當使用者輸入新的 Token、To、Amount 值時，更新對應的 React Hook：tokenSymbol、toAddress、tokenAmount 內容
  // 當使用者輸入新的 UserOp 值時，更新 Hook：aADeploySalt 內容
  const handleUserOpAndTokenFormChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { id, value } = event.target;
      try {
        switch (id) {
          case "tokenSymbol":
            setTokenSymbol(value.toString());
            if (value.toString() === "ETH") {
              setTokenAmount(Ethers5.BigNumber.from("100000000000000000"));
              setTokenDecimal(18);
            }
            if (value.toString() === "USDC") {
              setTokenAmount(Ethers5.BigNumber.from(100000));
              setTokenDecimal(6);
            }
            setError("");
            break;
          case "toAddress":
            setToAddress(Ethers5.utils.getAddress(value));
            setError("");
            break;
          case "tokenAmount":
            const realAmount = Ethers5.utils.parseUnits(value, tokenDecimal);
            setTokenAmount(realAmount);
            console.log(`RealAmount: ${realAmount}`);
            setError("");
            break;
          case "sender":
            setUserOp({
              ...userOp,
              sender: Ethers5.utils.getAddress(value),
            });
            setError("");
            break;
          case "nonce":
            setUserOp({
              ...userOp,
              nonce: Ethers5.BigNumber.from(value),
            });
            setError("");
            break;
          case "initCode":
            setUserOp({
              ...userOp,
              initCode: Ethers5.utils.hexlify(value),
            });
            setError("");
            break;
          case "callData":
            setUserOp({
              ...userOp,
              callData: Ethers5.utils.hexlify(value),
            });
            setError("");
            break;
          case "callGasLimit":
            setUserOp({
              ...userOp,
              callGasLimit: Ethers5.BigNumber.from(value),
            });
            setError("");
            break;
          case "verificationGasLimit":
            setUserOp({
              ...userOp,
              verificationGasLimit: Ethers5.BigNumber.from(value),
            });
            setError("");
            break;
          case "preVerificationGas":
            setUserOp({
              ...userOp,
              preVerificationGas: Ethers5.BigNumber.from(value),
            });
            setError("");
            break;
          case "maxFeePerGas":
            setUserOp({
              ...userOp,
              maxFeePerGas: Ethers5.BigNumber.from(value),
            });
            setError("");
            break;
          case "maxPriorityFeePerGas":
            setUserOp({
              ...userOp,
              maxPriorityFeePerGas: Ethers5.BigNumber.from(value),
            });
            setError("");
            break;
          case "paymasterAndData":
            setUserOp({
              ...userOp,
              paymasterAndData: Ethers5.utils.hexlify(value),
            });
            setError("");
            break;
          case "signature":
            setUserOp({
              ...userOp,
              signature: Ethers5.utils.hexlify(value),
            });
            setError("");
            break;
          default:
            break;
        }
        setError(""); // 清除先前的錯誤訊息
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : String(err)); // 設置錯誤訊息狀態
      }
    },
    [tokenSymbol, toAddress, tokenAmount, tokenDecimal]
  );

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
                <td>
                  {`${Ethers5.utils
                    .formatUnits(metamaskBalanceEth, 18)
                    .toString()} ETH`}
                </td>
              </tr>
              <tr>
                <td>Balance(USDC):</td>
                <td>
                  {`${Ethers5.utils
                    .formatUnits(metamaskBalanceUsdc, 6)
                    .toString()} USDC`}
                </td>
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
                    Deploy an Account via Onboarding
                  </button>
                </td>
              </tr>
            </tbody>
          </table>

          <table>
            <tbody>
              <tr>
                <td>AA Account Address:</td>
                <td>{aAAccountAddress.toString()}</td>
              </tr>
              <tr>
                <td>AA Account Nonce:</td>
                <td>{`Key[${Utils.decodeAANonce(
                  aANonce
                ).key.toString()}] = ${Utils.decodeAANonce(
                  aANonce
                ).seq.toString()} = Seq (Free Quota = ${Ethers5.BigNumber.from(
                  aAOnboardingFreeQuota
                )
                  .sub(Utils.decodeAANonce(aANonce).seq)
                  .toString()})`}</td>
              </tr>
              <tr>
                <td>Account Balance(ETH):</td>
                <td>
                  {`${Ethers5.utils
                    .formatUnits(aABalanceEth, 18)
                    .toString()} ETH`}
                </td>
              </tr>
              <tr>
                <td>Account Balance(USDC):</td>
                <td>
                  {`${Ethers5.utils
                    .formatUnits(aABalanceUsdc, 6)
                    .toString()} USDC`}
                </td>
              </tr>
              <tr>
                <td>Balance(ETH) in EntryPoint:</td>
                <td>
                  {`${Ethers5.utils
                    .formatUnits(aABalanceEthInEntryPoint, 18)
                    .toString()} ETH`}
                </td>
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
                    onChange={handleUserOpAndTokenFormChange}
                  >
                    <option value="ETH">ETH</option>
                    <option value="USDC">USDC</option>
                  </select>
                </td>
                <td></td>
              </tr>
              <tr>
                <td>To:</td>
                <td>
                  <input
                    type="text"
                    id="toAddress"
                    value={`${toAddress}`}
                    onChange={handleUserOpAndTokenFormChange}
                  />{" "}
                  Or this Account address itself when swapping USDC to ETH
                </td>
                <td></td>
              </tr>
              <tr>
                <td>Amount:</td>
                <td>
                  <input
                    type="text"
                    id="tokenAmount"
                    value={`${Ethers5.utils.formatUnits(
                      tokenAmount,
                      tokenDecimal
                    )}`}
                    onChange={handleUserOpAndTokenFormChange}
                  />
                </td>
                <td></td>
              </tr>
            </tbody>
          </table>
          <div>
            <button onClick={() => handleSigTransactionViaOnboarding()}>
              Transfer ETH/USDC via OnboardingPaymaster
            </button>
            <button onClick={() => handleSigTransactionViaPimlico()}>
              Transfer ETH/USDC via PimlicoPaymaster
            </button>
            <button onClick={() => handleSwapUsdcToEthViaOnboarding()}>
              Swap USDC → ETH via OnboardingPaymaster
            </button>
            <button onClick={() => handleSwapUsdcToEthViaPimlico()}>
              Swap USDC → ETH via PimlicoPaymaster
            </button>
          </div>
        </div>
      </>
    );
  };

  const formTransferGas = () => {
    return (
      <>
        <div className="transfer-gas-form">
          <table>
            <tbody>
              {transactionHash && (
                <>
                  <tr>
                    <td>TransactionHash:</td>
                    <td>
                      <a
                        href={`https://goerli.etherscan.io/tx/${transactionHash}`}
                        target="_blank"
                      >{`${transactionHash}`}</a>
                    </td>
                  </tr>
                </>
              )}
              <tr>
                <td>userOpHash:</td>
                <td>{`${userOpHash}`}</td>
              </tr>
              <tr>
                <td>userOpScan:</td>
                <td>
                  <a
                    href={`https://4337.blocknative.com/ops/${userOpHash}/0`}
                    target="_blank"
                  >{`Blocknative`}</a>
                  、
                  <a
                    href={`https://www.jiffyscan.xyz/userOpHash/${userOpHash}?network=goerli`}
                    target="_blank"
                  >{`Jiffyscan`}</a>
                </td>
              </tr>
            </tbody>
          </table>
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
                        onChange={handleUserOpAndTokenFormChange}
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
                        onChange={handleUserOpAndTokenFormChange}
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
                        onChange={handleUserOpAndTokenFormChange}
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
                        onChange={handleUserOpAndTokenFormChange}
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
                        onChange={handleUserOpAndTokenFormChange}
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
                        onChange={handleUserOpAndTokenFormChange}
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
                        onChange={handleUserOpAndTokenFormChange}
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
                        onChange={handleUserOpAndTokenFormChange}
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
                        onChange={handleUserOpAndTokenFormChange}
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
                        onChange={handleUserOpAndTokenFormChange}
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
                        onChange={handleUserOpAndTokenFormChange}
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
        <div>{userOpHash && formTransferGas()}</div>
        <div>{formUserOp(userOp)}</div>
      </div>
    </>
  );
};
