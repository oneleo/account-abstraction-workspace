// SPDX-License-Identifier: MIT
pragma solidity >=0.7.6 <0.9.0;

interface ICounter {
    function setNumber(uint256 newNumber) external;

    function increment() external;
}
