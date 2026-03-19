// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

contract HelloWorld {
    string private greeting = "hello world";

    function hello() public view returns (string memory) {
        return greeting;
    }

    function setTextMemory(string memory newGreeting) public {
        greeting = newGreeting;
    }

    function setTextCalldata(string calldata newGreeting) public {
        greeting = newGreeting;
    }
}
