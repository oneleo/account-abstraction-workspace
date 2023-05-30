// SPDX-License-Identifier: MIT
pragma solidity >=0.7.6 <0.9.0;

import "forge-std/Test.sol";
import "forge-std/console2.sol";

import "../src/UsdtOracle.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV2V3Interface.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "@account-abstraction/contracts/core/EntryPoint.sol";
import "@account-abstraction/contracts/samples/IOracle.sol";
import "@account-abstraction/contracts/samples/SimpleAccount.sol";
import "@account-abstraction/contracts/samples/DepositPaymaster.sol";
import "@account-abstraction/contracts/samples/SimpleAccountFactory.sol";

contract AddressTest is Test {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    IERC20 public usdt;
    AggregatorV2V3Interface public usdtAggregator;
    UsdtOracle public usdtOracle;

    EntryPoint public entryPoint;
    DepositPaymaster public paymaster;
    SimpleAccountFactory public accountFactory;
    SimpleAccount public account;

    uint256 salt = uint256(369);

    uint256 oracleOwnerKey = uint256(1);
    uint256 entryPointOwnerKey = uint256(2);
    uint256 paymasterOwnerKey = uint256(3);
    uint256 accountFactoryOwnerKey = uint256(4);
    uint256 accountOwnerKey = uint256(5);

    address oracleOwner = vm.addr(oracleOwnerKey);
    address entryPointOwner = vm.addr(entryPointOwnerKey);
    address paymasterOwner = vm.addr(paymasterOwnerKey);
    address accountFactoryOwner = vm.addr(accountFactoryOwnerKey);
    address accountOwner = vm.addr(accountOwnerKey);

    function setUp() public {
        usdt = IERC20(vm.envAddress("USDT_ADDRESS"));
        usdtAggregator = AggregatorV2V3Interface(
            vm.envAddress("USDT_ETH_CHAINLINK")
        );

        // deploy the UsdtOracle contract
        vm.startPrank(oracleOwner, oracleOwner);
        usdtOracle = new UsdtOracle(usdtAggregator);
        vm.stopPrank();

        // deploy the EntryPoint contract
        vm.startPrank(entryPointOwner, entryPointOwner);
        entryPoint = new EntryPoint();
        vm.stopPrank();

        // deploy the Paymaster contract
        vm.startPrank(paymasterOwner, paymasterOwner);
        paymaster = new DepositPaymaster(entryPoint);
        paymaster.addToken(usdt, usdtOracle);
        vm.stopPrank();

        // deploy the AccountFactory contract
        vm.startPrank(accountFactoryOwner, accountFactoryOwner);
        accountFactory = new SimpleAccountFactory(entryPoint);
        vm.stopPrank();

        // deploy the Account contract
        vm.startPrank(accountOwner, accountOwner);
        account = accountFactory.createAccount(accountOwner, salt);
        vm.stopPrank();
    }

    function testUsdtOracles() public view {
        address o = address(usdtOracle.usdtAggregator());
        console2.logAddress(o);
        console2.logUint(usdtOracle.latestAnswer());
    }

    function testEntryPoint() public {
        uint256 e = entryPoint.SIG_VALIDATION_FAILED();
        assertEq(e, 1);
    }

    function testPaymaster() public view {
        IOracle o = paymaster.oracles(usdt);
        UsdtOracle uo = UsdtOracle(address(o));
        console2.logUint(uo.decimals());
        console2.logUint(
            o.getTokenValueOfEth(uint256(10).mul(10 ** uint256(uo.decimals())))
        );
    }

    function testAccount() public view {
        address a = account.owner();
        console2.logAddress(address(account));
        console2.logAddress(a);
        console2.logAddress(accountOwner);
    }
}
