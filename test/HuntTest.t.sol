// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test} from "forge-std/Test.sol";
import {console} from "forge-std/console.sol";
import {HuntGoal} from "../src/HuntGoal.sol";
import {HuntAPI} from "../src/HuntAPI.sol";

contract HuntTest is Test {
    function setUp() public {}

    function testIntegrity() public {
        HuntGoal goalObj = new HuntGoal(1, 1);
        HuntGoal goalObj2 = new HuntGoal(2, 2);

        address[] memory goals = new address[](2);
        address goal = address(goalObj);
        address goal2 = address(goalObj2);
        goals[0] = goal;
        goals[1] = goal2;

        HuntAPI api = new HuntAPI(goals);
        address user = address(1);

        /* TEST : cannot have multiple tickets for same wallet */
        assert(api.createTicket(user)); 
        assert(!api.createTicket(user));

        /* 
            TEST : claim goals
            @fails :
                - Claim malicious goal
                - Claim with malicious ticket
                - Claim goals in wrong order or claim twice 
        */
        assertEq(api.claimGoal(goal, user), 2, "First time goal is claimed");
        assertEq(api.claimGoal(goal, user), 0, "User can't claim same goal twice");

        address unauthenticatedUser = address(11);
        assertEq(api.claimGoal(goal, unauthenticatedUser), 0, "This ticket isn't registered");

        address user2 = address(2);
        api.createTicket(user2);
        assertEq(api.claimGoal(goal2, user2), 0, "User2 should claim first goal before");
        assertEq(api.claimGoal(goal, user2), 1, "User2 claimed goal 1 but prize has already been claimed");
        assertEq(api.claimGoal(goal2, user2), 2, "Now User2 can claim goal 2");

        HuntGoal unauthenticatedGoal = new HuntGoal(3, 3);
        assertEq(api.claimGoal(address(unauthenticatedGoal), user2), 0, "Goal is malicious");

        console.logUint(user.balance);
    }
}