import * as Ethers5 from "ethers"
import * as UserOp from "userop"

// To prevent the "Property 'ethereum' does not exist on type 'Window & typeof globalThis'." error.
declare global {
    interface Window {
        ethereum: any
    }
}

export const logUserOp = (userOp: UserOp.IUserOperation) => {
    console.log(`// [Log] UserOp:\n`)
    console.log(`sender: ${userOp.sender}\n`)
    console.log(`nonce: ${userOp.nonce}\n`)
    console.log(`initCode: ${userOp.initCode}\n`)
    console.log(`callData: ${userOp.callData}\n`)
    console.log(`callGasLimit: ${userOp.callGasLimit}\n`)
    console.log(`verificationGasLimit: ${userOp.verificationGasLimit}\n`)
    console.log(`preVerificationGas: ${userOp.preVerificationGas}\n`)
    console.log(`maxFeePerGas: ${userOp.maxFeePerGas}\n`)
    console.log(`maxPriorityFeePerGas: ${userOp.maxPriorityFeePerGas}\n`)
    console.log(`paymasterAndData: ${userOp.paymasterAndData}\n`)
    console.log(`signature: ${userOp.signature}\n`)
}

export const encodeAANonce = (key: Ethers5.BigNumberish, seq: Ethers5.BigNumberish) => {
    const maxUint192 = Ethers5.BigNumber.from("0xffffffffffffffffffffffff")
    const maxUint64 = Ethers5.BigNumber.from("0xffffffffffffffff")
    const shiftedKey = Ethers5.BigNumber.from(key).and(maxUint192).shl(64)
    const combinedValue = shiftedKey.or(Ethers5.BigNumber.from(seq).and(maxUint64))
    const uint256Value = Ethers5.utils.hexZeroPad(combinedValue.toHexString(), 32)

    return Ethers5.BigNumber.from(uint256Value)
}

export const decodeAANonce = (nonce: Ethers5.BigNumberish) => {
    const maxUint192 = Ethers5.BigNumber.from("0xffffffffffffffffffffffff")
    const maxUint64 = Ethers5.BigNumber.from("0xffffffffffffffff")

    const uint256Value = Ethers5.utils.hexZeroPad(Ethers5.BigNumber.from(nonce).toHexString(), 32)
    const combinedValue = Ethers5.BigNumber.from(uint256Value)

    const seq = combinedValue.and(maxUint64)
    const shiftedKey = combinedValue.shr(64).and(maxUint192)

    return {
        key: shiftedKey,
        seq: seq,
    }
}

export const resolveAAErrorMsg = (err: Error) => {
    const message = err.message.toString()
    const regex = /return data: (0x[0-9a-fA-F]+)/
    const match = message.match(regex)
    const data = match ? match[1] : ""

    const method = Ethers5.utils.hexDataSlice(data, 0, 4)
    const parms = Ethers5.utils.hexDataSlice(data, 4)

    const errorExecutionResult = Ethers5.utils
        .id("ExecutionResult(uint256,uint256,uint48,uint48,bool,bytes)")
        .substring(0, 10) // 0x8b7ac980
    const errorFailedOp = Ethers5.utils.id("FailedOp(uint256,string)").substring(0, 10) // 0x220266b6

    let output
    switch (method.toString()) {
        case errorExecutionResult:
            output = Ethers5.utils.defaultAbiCoder.decode(
                ["uint256", "uint256", "uint48", "uint48", "bool", "bytes"],
                parms,
            )
            break
        case errorFailedOp:
            output = Ethers5.utils.defaultAbiCoder.decode(["uint256", "string"], parms)
            break
        default:
            // 如果前缀不匹配任何情况，则执行其他操作
            output = parms
            break
    }

    console.log(`// [Error] ${JSON.stringify(output)}`)
}
