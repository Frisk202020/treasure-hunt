// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test} from "forge-std/Test.sol";
import {HuntGoalBank} from "../src/HuntGoalBank.sol";
import {HuntGoal} from "../src/HuntGoal.sol";
import {HuntTicket} from "../src/HuntTicket.sol";

contract HuntTest is Test {
    function setUp() public {}

    function testClaim() public {
        HuntGoal goal = new HuntGoal(0, 1);
        HuntTicket ticket = new HuntTicket();
        goal.claim(ticket);
        
        HuntTicket other = new HuntTicket();
        goal.claim(other);
        assertEq(ticket.readOwner(), goal.readPrizeOwner(), "Expect first contestant to be the owner of prize");

        vm.expectRevert("This ticket can't claim this goal"); // because already claimed this goal
        goal.claim(ticket);

        HuntGoal nextLevel = new HuntGoal(0, 2);
        HuntTicket lateEntry = new HuntTicket();

        nextLevel.claim(ticket);
        assertEq(2, ticket.readLevel(), "Claim level 2");

        vm.expectRevert("This ticket can't claim this goal"); // because level 1 should be found first
        nextLevel.claim(lateEntry);
    }

    function testGoalIntegrity() public {
        HuntGoal[] memory genuineGoals = new HuntGoal[](1);
        HuntGoal genuineGoal = new HuntGoal(0, 0);
        genuineGoals[0] = genuineGoal;
        HuntGoalBank bank = new HuntGoalBank(genuineGoals);

        HuntGoal adversaryGoal = new HuntGoal(0, 0);
        assertEq(bank.authenticate(genuineGoal), true, "Authenticate genuine goal");
        assertEq(bank.authenticate(adversaryGoal), false, "Reject adversary goal");
    }
}