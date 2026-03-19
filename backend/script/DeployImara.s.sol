// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {Imara} from "../src/Imara.sol";

contract DeployImaraScript is Script {
    function run() external returns (Imara imara) {
        vm.startBroadcast();
        imara = new Imara();
        vm.stopBroadcast();
    }
}
