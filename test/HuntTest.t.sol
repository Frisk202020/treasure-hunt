// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test} from "forge-std/Test.sol";
import {console} from "forge-std/console.sol";
import {HuntGoal} from "../src/HuntGoal.sol";
import {TicketBank} from "../src/TicketBank.sol";

/*
 TODO :
    - Try automatic ETH delivery (use vm.deal on API)
    - Check BalanceError events
*/
contract HuntTest is Test {
    address payable gameMaster;
    address goal;
    address payable ticketBank;
    uint160 nextAddress;

    function setUp() public {
        gameMaster = payable(address(1000));
        HuntGoal _goal = new HuntGoal(100, 1, gameMaster);
        goal = address(_goal);

        nextAddress = 1001;
        ticketBank = payable(address(new TicketBank(10, gameMaster)));
    }

    function createUser() public returns (address payable) {
        nextAddress++;
        address payable user = payable(address(nextAddress));
        vm.deal(user, 10);
        return user;
    }

    function test_send_less_than_fee() public {
        address payable user = createUser();
        vm.prank(user);
 
        vm.expectEmit(true, true, true, true);
        emit TicketBank.UnsufficientFunds(user, 8);
        (bool success,) = ticketBank.call{value: 8}("");
        assert(success);

        assertEq(user.balance, 10);
        assertEq(ticketBank.balance, 0);
    }

    function test_claim_ticket() public {
        address payable user = createUser();
        vm.prank(user);

        vm.expectEmit(true, true, true, true);
        emit TicketBank.TicketCreated(user);
        (bool success,) = ticketBank.call{value: 10}("");
        assert(success);

        assertEq(user.balance, 0);
        assertEq(ticketBank.balance, 10);

        vm.prank(gameMaster);
        (bool withdraw_success,) = ticketBank.call{value: 0}(abi.encodeWithSignature("withdraw()"));
        assert(withdraw_success);
        assertEq(ticketBank.balance, 0);
        assertEq(gameMaster.balance, 10);
    }

    function test_goal_funding() public {
        vm.deal(gameMaster, 120);
        vm.startPrank(gameMaster); 
        vm.recordLogs();

        (bool s1,) = goal.call{value: 80}("");
        assert(s1);
        assertEq(vm.getRecordedLogs().length, 0);
        
        vm.expectEmit(true, true, true, true);
        emit HuntGoal.GoalReady(goal);
        (bool s2,) = goal.call{value: 40}("");
        assert(s2);
        assertEq(goal.balance, 100);
        assertEq(gameMaster.balance, 20); // expect overflow to be refunded
    }

    // API checks beforehand user is at the correct level and has a ticket. This is not tested here, 
    // as message is trusted because it is signed by gameMaster
    function test_claim_goal() public {
        address payable user = createUser();
        vm.startPrank(gameMaster);
        vm.deal(goal, 100);
        
        vm.expectEmit(true, true, true, true);
        emit HuntGoal.GoalClaimed(goal, user);
        bytes memory callData = abi.encodeWithSignature("claim(address)", user);
        (bool s1,) = goal.call{value: 0}(callData);
        assert(s1);
        assertEq(goal.balance, 0);
        assertEq(user.balance, 110); // user hasn't spent fee (skipped ticket claim)

        vm.recordLogs();
        (bool s2,) = goal.call{value: 0}(callData);
        assert(s2);
        assertEq(vm.getRecordedLogs().length, 0);
    }
}