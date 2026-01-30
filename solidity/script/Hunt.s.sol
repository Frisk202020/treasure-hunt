// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {HuntAPI} from "../src/HuntAPI.sol";
import {Script} from "forge-std/Script.sol";

contract HuntScript is Script {
    HuntAPI public api;

    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        api = new HuntAPI(new address[](0));

        vm.stopBroadcast();
    }
}
