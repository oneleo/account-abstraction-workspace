import * as Ethers5 from "ethers";
import * as UserOp from "userop";
import * as UniswapSdk from "@uniswap/v3-sdk";

// Avoid using "as" to prevent errors related to "Should not import the named export 'xxx' (imported as 'xxx') from default-exporting module (only default export is available soon)".
import jsonErc20 from "@openzeppelin/contracts/build/contracts/ERC20.json";
import jsonUniswapSwapRouterV2 from "@uniswap/v2-periphery/build/UniswapV2Router02.json";
import jsonUniswapSwapRouterV3 from "@uniswap/v3-periphery/artifacts/contracts/SwapRouter.sol/SwapRouter.json";

export const NETWORK_NAME: string = "goerli";

// To prevent the "Property 'ethereum' does not exist on type 'Window & typeof globalThis'." error.
declare global {
  interface Window {
    ethereum: any;
  }
}

// Bundler 選項
export enum bundlerRpc {
  imTokenUnSafe,
  imTokenSafe,
  alchemySafe,
}

// Fee 的支付選項
export enum feeOptions {
  freeQuota,
  withUsdc,
  withEth,
}

// Token 的轉送行為
export enum tokenActions {
  sendEth,
  sendUsdc,
  sendUsdcEth,
  swapUsdcToEth,
}

// 欲請 Account 執行的指令
export type ExecuteArgs = {
  dest: string;
  value: Ethers5.BigNumber;
  func: Uint8Array;
};

// imToken AA Server
export const ETHERSPOT_SAFE_BUNDLER_URL =
  "https://goerli-bundler.etherspot.io/";
export const IMTOKEN_UNSAFE_BUNDLER_URL =
  "http://bundler.dev.rivo.network/unsafe/rpc"; // Stackup Unsafe Bundler
export const IMTOKEN_SAFE_BUNDLER_URL =
  "http://bundler.dev.rivo.network/safe/rpc"; // Stackup Safe Bundler
export const ALCHEMY_BUNDLER_URL = process.env.ALCHEMY_BUNDLER_URL; // Alchemy

// Uniswap Contract Addresses
export const UNISWAP_SWAP_ROUTER_V3_ADDRESS =
  NETWORK_NAME === "mainnet"
    ? "0xE592427A0AEce92De3Edee1F18E0157C05861564"
    : "0xE592427A0AEce92De3Edee1F18E0157C05861564";

export const UNISWAP_SWAP_ROUTER_V2_ADDRESS =
  NETWORK_NAME === "mainnet"
    ? "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"
    : "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";

// Token Addresses
export const WETH_ADDRESS =
  NETWORK_NAME === "mainnet"
    ? "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
    : "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6";

export const USDC_ADDRESS =
  NETWORK_NAME === "mainnet"
    ? "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
    : "0x07865c6E87B9F70255377e024ace6630C1Eaa37F";

// imToken AA Contracts on Goerli Testnet
export const ENTRY_POINT_ADDRESS =
  NETWORK_NAME === "mainnet"
    ? ""
    : "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";

export const ACCOUNT_FACTORY_PROXY_ADDRESS =
  NETWORK_NAME === "mainnet"
    ? ""
    : "0xF3A26E979977053fb8D3bd6cCcd74A8f71BDddD1";

export const ONBOARDING_PAYMASTER_ADDRESS =
  NETWORK_NAME === "mainnet"
    ? ""
    : "0x491B26ed23Bb85D23CC9e5428F99A6EE25320025";

export const PIMLICO_PAYMASTER_ADDRESS =
  NETWORK_NAME === "mainnet"
    ? ""
    : "0xEc43912D8C772A0Eba5a27ea5804Ba14ab502009";

// Metamask Signer Address
export const METAMASK_ADDRESS = [
  "0x5704Cf1BaeAb8e893d8FF493E0d8CF711E4BDE99",
  "0x05168c17d72e5E5d89243B26942ADDDC692dfB70",
  "0x1935B14D6b74444383724229C0fB3449fa7e4C2f",
  "0xD20Ac2d18A06E7E8248027856F32d4C00447Df39",
  "0xbfeA97f38Da881D997Ae28924Af223aaa165EfA9",
  "0xb6B4ac292B14e046DBEf91EB8308bC8Cb3211c92",
  "0x81578FBe3Ca2941e50404Ec4E713625169C33e53",
  "0xf4fE3D5e739ade5f870CF421521A6fFDb18D1EE5",
  "0x875C1086703a4C307AC352F2908b436AF647cE8e",
  "0x31F957f8e5BeCDD476f284187fAf088CC7A5DB67",
];

export const logUserOp = (userOp: UserOp.IUserOperation) => {
  console.log(`// [Log] UserOp:\n`);
  console.log(`sender: ${userOp.sender}\n`);
  console.log(`nonce: ${userOp.nonce}\n`);
  console.log(`initCode: ${userOp.initCode}\n`);
  console.log(`callData: ${userOp.callData}\n`);
  console.log(`callGasLimit: ${userOp.callGasLimit}\n`);
  console.log(`verificationGasLimit: ${userOp.verificationGasLimit}\n`);
  console.log(`preVerificationGas: ${userOp.preVerificationGas}\n`);
  console.log(`maxFeePerGas: ${userOp.maxFeePerGas}\n`);
  console.log(`maxPriorityFeePerGas: ${userOp.maxPriorityFeePerGas}\n`);
  console.log(`paymasterAndData: ${userOp.paymasterAndData}\n`);
  console.log(`signature: ${userOp.signature}\n`);
};

export const encodeAANonce = (
  key: Ethers5.BigNumberish,
  seq: Ethers5.BigNumberish
) => {
  const maxUint192 = Ethers5.BigNumber.from("0xffffffffffffffffffffffff");
  const maxUint64 = Ethers5.BigNumber.from("0xffffffffffffffff");
  const shiftedKey = Ethers5.BigNumber.from(key).and(maxUint192).shl(64);
  const combinedValue = shiftedKey.or(
    Ethers5.BigNumber.from(seq).and(maxUint64)
  );
  const uint256Value = Ethers5.utils.hexZeroPad(
    combinedValue.toHexString(),
    32
  );

  return Ethers5.BigNumber.from(uint256Value);
};

export const decodeAANonce = (nonce: Ethers5.BigNumberish) => {
  const maxUint192 = Ethers5.BigNumber.from("0xffffffffffffffffffffffff");
  const maxUint64 = Ethers5.BigNumber.from("0xffffffffffffffff");

  const uint256Value = Ethers5.utils.hexZeroPad(
    Ethers5.BigNumber.from(nonce).toHexString(),
    32
  );
  const combinedValue = Ethers5.BigNumber.from(uint256Value);

  const seq = combinedValue.and(maxUint64);
  const shiftedKey = combinedValue.shr(64).and(maxUint192);

  return {
    key: shiftedKey,
    seq: seq,
  };
};

export const resolveAAErrorMsg = (err: Error) => {
  const message = err.message.toString();
  const regex = /return data: (0x[0-9a-fA-F]+)/;
  const match = message.match(regex);
  const data = match ? match[1] : "";

  const method = Ethers5.utils.hexDataSlice(data, 0, 4);
  const parms = Ethers5.utils.hexDataSlice(data, 4);

  const errorExecutionResult = Ethers5.utils
    .id("ExecutionResult(uint256,uint256,uint48,uint48,bool,bytes)")
    .substring(0, 10); // 0x8b7ac980
  const errorFailedOp = Ethers5.utils
    .id("FailedOp(uint256,string)")
    .substring(0, 10); // 0x220266b6

  let output;
  switch (method.toString()) {
    case errorExecutionResult:
      output = Ethers5.utils.defaultAbiCoder.decode(
        ["uint256", "uint256", "uint48", "uint48", "bool", "bytes"],
        parms
      );
      break;
    case errorFailedOp:
      output = Ethers5.utils.defaultAbiCoder.decode(
        ["uint256", "string"],
        parms
      );
      break;
    default:
      // 如果前缀不匹配任何情况，则执行其他操作
      output = parms;
      break;
  }

  console.log(`// [Error] ${JSON.stringify(output)}`);
};

export const bundlerUserOpTransaction = async (
  bundlerUrl: string,
  userOpHash: string
) => {
  // 採用 eth_getUserOperationByHash 方法
  const opsUserOpTransaction = {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "eth_getUserOperationByHash",
      params: [userOpHash],
    }),
  };
  // 向 Bundler 發送並取得結果
  return (await (await fetch(bundlerUrl, opsUserOpTransaction)).json()).result;
};

export const bundlerUserOpReceipt = async (
  bundlerUrl: string,
  userOpHash: string
) => {
  // 採用 eth_getUserOperationReceipt 方法
  const opsUserOpReceipt = {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "eth_getUserOperationReceipt",
      params: [userOpHash],
    }),
  };
  // 向 Bundler 發送並取得結果
  return (await (await fetch(bundlerUrl, opsUserOpReceipt)).json()).result;
};

// Approve USDC
export const usdcApproveCalldata = (
  spender: Ethers5.BytesLike,
  amount?: Ethers5.BigNumberish
) => {
  const ifaceErc20 = new Ethers5.utils.Interface(jsonErc20.abi);
  return ifaceErc20.encodeFunctionData("approve", [
    spender,
    amount ? Ethers5.BigNumber.from(amount) : Ethers5.constants.MaxUint256,
  ]);
};

// 此 WETH Withdraw 函數未測試過
export const wethWithdrawCalldata = (amount: Ethers5.BigNumberish) => {
  const WETH_WITHDRAW_ABI = [
    {
      constant: false,
      inputs: [
        {
          name: "wad",
          type: "uint256",
        },
      ],
      name: "withdraw",
      outputs: [],
      payable: false,
      stateMutability: "nonpayable",
      type: "function",
    },
  ];
  const ifaceWeth = new Ethers5.utils.Interface(WETH_WITHDRAW_ABI);
  return ifaceWeth.encodeFunctionData("withdraw", [
    Ethers5.BigNumber.from(amount),
  ]);
};

// Uniswap V3 只支援 Token 換成 WETH，但不支援 Token 換成 ETH
export const uniswapSwapV3Calldata = (
  tokenIn: Ethers5.BytesLike,
  tokenOut: Ethers5.BytesLike,
  recipient: Ethers5.BytesLike,
  amountIn: Ethers5.BigNumberish
) => {
  const ifaceUniswapSwapRouterV3 = new Ethers5.utils.Interface(
    jsonUniswapSwapRouterV3.abi
  );
  return ifaceUniswapSwapRouterV3.encodeFunctionData("exactInputSingle", [
    tokenIn.toString(), // tokenIn: address
    tokenOut.toString(), // tokenOut: address
    UniswapSdk.FeeAmount.MEDIUM, // fee: uint24
    recipient.toString(), // recipient: address
    Ethers5.BigNumber.from(Math.floor(Date.now() / 1000) + 600), // deadline: uint256
    Ethers5.BigNumber.from(amountIn), // amountIn: uint256
    Ethers5.BigNumber.from(0), // amountOutMinimum: uint256
    0, // sqrtPriceLimitX96: uint160
  ]);
};

// Uniswap V2 支援 Token 直接換成 ETH
export const uniswapSwapV2Calldata = (
  amountIn: Ethers5.BigNumberish,
  tokenIn: Ethers5.BytesLike,
  tokenOut: Ethers5.BytesLike,
  to: Ethers5.BytesLike
) => {
  const ifaceUniswapSwapRouterV2 = new Ethers5.utils.Interface(
    jsonUniswapSwapRouterV2.abi
  );
  return ifaceUniswapSwapRouterV2.encodeFunctionData("swapExactTokensForETH", [
    Ethers5.BigNumber.from(amountIn), // amountIn: uint256
    Ethers5.BigNumber.from(0), // amountOutMin: uint256
    [tokenIn.toString(), tokenOut.toString()], // path: address[] calldata
    to.toString(), // to: address
    Ethers5.BigNumber.from(Math.floor(Date.now() / 1000) + 600), // deadline: uint256 → 需符合「秒」級 timestamp 格式，如：1687654321
  ]);
};
