// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {HuntGoal} from "./HuntGoal.sol";

// Immutable list of all authenticated contracts by the organizer
contract HuntGoalBank {
    HuntGoal[] goals;

    constructor(HuntGoal[] memory _goals) {
        goals = _goals;
    }

    function authenticate(HuntGoal goal) external view returns (bool) {
        // basically this.goals.contains(goal)
        for (uint i = 0; i < goals.length; i++) {
            if (goals[i] == goal) { return true; }
        }

        return false;
    }
}