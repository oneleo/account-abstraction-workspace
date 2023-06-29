import * as Ethers5 from "ethers";
import * as UserOp from "userop";
import * as UniswapSdk from "@uniswap/v3-sdk";
import * as UniswapCore from "@uniswap/sdk-core";

// Avoid using "as" to prevent errors related to "Should not import the named export 'xxx' (imported as 'xxx') from default-exporting module (only default export is available soon)".
import jsonErc20 from "@openzeppelin/contracts/build/contracts/ERC20.json";
import jsonIUniswapV3Pool from "@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json";
import jsonUniswapSwapRouterV2 from "@uniswap/v2-periphery/build/UniswapV2Router02.json";
import jsonUniswapSwapRouterV3 from "@uniswap/v3-periphery/artifacts/contracts/SwapRouter.sol/SwapRouter.json";

export const NETWORK_NAME: string = "goerli";

// To prevent the "Property 'ethereum' does not exist on type 'Window & typeof globalThis'." error.
declare global {
  interface Window {
    ethereum: any;
  }
}

// Uniswap Contract Addresses
export const UNISWAP_FACTORY_V3_ADDRESS =
  NETWORK_NAME === "mainnet"
    ? "0x1F98431c8aD98523631AE4a59f267346ea31F984"
    : "0x1F98431c8aD98523631AE4a59f267346ea31F984";

export const UNISWAP_QUOTER_V3_ADDRESS =
  NETWORK_NAME === "mainnet"
    ? "0x61fFE014bA17989E743c5F6cB21bF9697530B21e"
    : "0x61fFE014bA17989E743c5F6cB21bF9697530B21e";

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

// Other Address
export const SIGNER6_ADDRESS = "0x81578FBe3Ca2941e50404Ec4E713625169C33e53"; // to or dest address

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

export const UsdcApproveCalldata = (
  spender: Ethers5.BytesLike,
  amount?: Ethers5.BigNumberish
) => {
  const ifaceErc20 = new Ethers5.utils.Interface(jsonErc20.abi);
  return ifaceErc20.encodeFunctionData("approve", [
    spender,
    amount ? Ethers5.BigNumber.from(amount) : Ethers5.constants.MaxUint256,
  ]);
};

export const WethWithdrawCalldata = (amount: Ethers5.BigNumberish) => {
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
export const UniswapSwapV3Calldata = (
  tokenIn: Ethers5.BytesLike,
  tokenOut: Ethers5.BytesLike,
  recipient: Ethers5.BytesLike,
  amountIn: Ethers5.BigNumberish
) => {
  const ifaceUniswapSwapRouterV3 = new Ethers5.utils.Interface(
    jsonUniswapSwapRouterV3.abi
  );
  return ifaceUniswapSwapRouterV3.encodeFunctionData("exactInputSingle", [
    USDC_ADDRESS, // tokenIn: address
    WETH_ADDRESS, // tokenOut: address
    UniswapSdk.FeeAmount.MEDIUM, // fee: uint24
    recipient.toString(), // recipient: address
    Ethers5.BigNumber.from(Math.floor(Date.now() / 1000) + 600), // deadline: uint256
    Ethers5.BigNumber.from(amountIn), // amountIn: uint256
    Ethers5.BigNumber.from(0), // amountOutMinimum: uint256
    0, // sqrtPriceLimitX96: uint160
  ]);
};

// Uniswap V2 支援 Token 直接換成 ETH
export const UniswapSwapV2Calldata = (
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
    Ethers5.BigNumber.from(Math.floor(Date.now() / 1000) + 600), // deadline: uint256 → 符合格式（至秒）：1687955738
  ]);
};

export const getPoolInfo = async (
  tokenIn: UniswapCore.Token,
  tokenOut: UniswapCore.Token,
  provider: Ethers5.providers.Provider,
  poolFee: UniswapSdk.FeeAmount
) => {
  const currentPoolAddress = UniswapSdk.computePoolAddress({
    factoryAddress: UNISWAP_FACTORY_V3_ADDRESS,
    tokenA: tokenIn,
    tokenB: tokenOut,
    fee: poolFee,
  });

  const poolContract = new Ethers5.Contract(
    currentPoolAddress,
    jsonIUniswapV3Pool.abi,
    provider
  );

  const [token0, token1, fee, tickSpacing, liquidity, slot0] =
    await Promise.all([
      poolContract.token0(),
      poolContract.token1(),
      poolContract.fee(),
      poolContract.tickSpacing(),
      poolContract.liquidity(),
      poolContract.slot0(),
    ]);

  return {
    token0,
    token1,
    fee,
    tickSpacing,
    liquidity,
    sqrtPriceX96: slot0[0],
    tick: slot0[1],
  };
};

export const fromReadableAmount = (amount: number, decimals: number) => {
  return Ethers5.utils.parseUnits(amount.toString(), decimals);
};

// Helper Quoting and Pool Functions
export const getOutputQuote = async (
  route: UniswapSdk.Route<UniswapCore.Currency, UniswapCore.Currency>,
  provider: Ethers5.providers.Provider,
  tokenIn: UniswapCore.Token,
  amountIn: number
) => {
  const { calldata } = UniswapSdk.SwapQuoter.quoteCallParameters(
    route,
    UniswapCore.CurrencyAmount.fromRawAmount(
      tokenIn,
      fromReadableAmount(amountIn, tokenIn.decimals).toString()
    ),
    UniswapCore.TradeType.EXACT_INPUT,
    {
      useQuoterV2: true,
    }
  );

  const quoteCallReturnData = await provider.call({
    to: UNISWAP_QUOTER_V3_ADDRESS,
    data: calldata,
  });

  return Ethers5.utils.defaultAbiCoder.decode(
    ["uint256"],
    quoteCallReturnData
  )[0];
};

export const createTradePair = async (
  tokenIn: UniswapCore.Token,
  tokenOut: UniswapCore.Token,
  amountIn: number,
  provider: Ethers5.providers.Provider,
  poolFee?: UniswapSdk.FeeAmount
) => {
  const poolInfo = await getPoolInfo(
    tokenIn,
    tokenOut,
    provider,
    poolFee || UniswapSdk.FeeAmount.HIGH
  );

  const pool = new UniswapSdk.Pool(
    tokenIn,
    tokenOut,
    poolInfo.fee,
    poolInfo.sqrtPriceX96.toString(),
    poolInfo.liquidity.toString(),
    poolInfo.tick
  );

  const swapRoute = new UniswapSdk.Route([pool], tokenIn, tokenOut);
  const amountOut = await getOutputQuote(swapRoute, provider, tokenIn, 15);

  const uncheckedTrade = UniswapSdk.Trade.createUncheckedTrade({
    route: swapRoute,
    inputAmount: UniswapCore.CurrencyAmount.fromRawAmount(
      tokenIn,
      fromReadableAmount(amountIn, tokenIn.decimals).toString()
    ),
    outputAmount: UniswapCore.CurrencyAmount.fromRawAmount(
      tokenOut,
      // JSBI.BigInt(amountOut),
      amountOut.toString()
    ),
    tradeType: UniswapCore.TradeType.EXACT_INPUT,
  });

  return uncheckedTrade;
};
