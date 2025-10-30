// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {HuntGoalBank} from "../src/HuntGoalBank.sol";
import {HuntGoal} from "../src/HuntGoal.sol";
import {Script} from "forge-std/Script.sol";

contract HuntScript is Script {
    HuntGoalBank public bank;

    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        bank = new HuntGoalBank(new HuntGoal[](0));

        vm.stopBroadcast();
    }
}
