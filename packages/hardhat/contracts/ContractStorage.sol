// SPDX-License-Identifier: MIT
pragma solidity >=0.7.6 <0.9.0;

contract ContractStorage {
    address public usdtOracle;
    address public entryPoint;
    address public paymaster;
    address public accountFactory;
    address public accountFactoryProxy;
    mapping(address => mapping(uint256 => address)) public account;
    mapping(address => address) public contractOwner;
    address[10] public signers;

    address public owner;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    function setUsdtOracleAddress(address _usdtOracle) external onlyOwner {
        usdtOracle = _usdtOracle;
    }

    function setEntryPointAddress(address _entryPoint) external onlyOwner {
        entryPoint = _entryPoint;
    }

    function setPaymasterAddress(address _paymaster) external onlyOwner {
        paymaster = _paymaster;
    }

    function setAccountFactoryAddress(address _accountFactory) external onlyOwner {
        accountFactory = _accountFactory;
    }

    function setAccountFactoryProxyAddress(address _accountFactoryProxy) external onlyOwner {
        accountFactoryProxy = _accountFactoryProxy;
    }

    function setAccount(address accountOwner, uint256 salt, address accountAddress) external onlyOwner {
        account[accountOwner][salt] = accountAddress;
    }

    function setContractOwner(address contractAddress, address ownerAddress) external onlyOwner {
        contractOwner[contractAddress] = ownerAddress;
    }

    function setSigner(uint256 index, address signerAddress) external onlyOwner {
        require(index < 10, "Index out of range");
        signers[index] = signerAddress;
    }
}
