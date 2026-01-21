// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test} from "forge-std/Test.sol";
import {HuntGoal} from "../src/HuntGoal.sol";
import {TicketBank} from "../src/TicketBank.sol";

contract HuntTest is Test {
    address payable gameMaster;
    address goal;
    address payable ticketBank;
    uint160 nextAddress;
    uint constant FEE = 10;
    bytes32 constant HASH = keccak256(abi.encode(0));

    function setUp() public {
        gameMaster = payable(address(1000));
        ticketBank = payable(address(new TicketBank(FEE, gameMaster)));
        HuntGoal _goal = new HuntGoal(100, 1, HASH, gameMaster, ticketBank);
        goal = address(_goal);
        nextAddress = 1001;     

        vm.prank(gameMaster);
        (bool success,) = ticketBank.call(abi.encodeWithSignature("authorize_goal(address)", goal));
        assert(success);
    }
    function authorize(address g) private returns (bool) {
        (bool success,) = ticketBank.call(abi.encodeWithSignature("authorize_goal(address)", g));
        return success;
    } function claim(address g, uint n) private returns (bool) {
        (bool success,) = g.call(abi.encodeWithSignature("claim(uint256)", n));
        return success;
    }

    function createUser() public returns (address payable) {
        nextAddress++;
        address payable user = payable(address(nextAddress));
        vm.deal(user, FEE);
        return user;
    }

    function test_send_less_than_fee() public {
        address payable user = createUser();
        vm.prank(user);

        // Ensure ticket claim is refused
        vm.expectEmit(true, true, true, true);
        emit TicketBank.UnsufficientFunds(user, 8);
        (bool success,) = ticketBank.call{value: 8}("");
        assert(success);

        // Ensure user gets refunded
        assertEq(user.balance, FEE);
        assertEq(ticketBank.balance, 0);
    }

    function test_claim_ticket() public {
        address payable user = createUser();
        vm.startPrank(user);

        // Ensure correct claim
        vm.expectEmit(true, true, true, true);
        emit TicketBank.TicketCreated(user);
        (bool success,) = ticketBank.call{value: FEE}("");
        assert(success);
        
        // Ensure user paid
        assertEq(user.balance, 0);
        assertEq(ticketBank.balance, FEE);

        // Ensure user can't claim twice
        vm.deal(user, FEE);
        vm.expectEmit(true,true,true,true);
        emit TicketBank.AlreadyClaimed(user, 1);
        (success,) = ticketBank.call{value: FEE}("");
        assert(success);

        // Ensure user gets refunded
        assertEq(user.balance, FEE);
        assertEq(ticketBank.balance, FEE);

        vm.startPrank(gameMaster);
        (bool withdraw_success,) = ticketBank.call{value: 0}(abi.encodeWithSignature("withdraw()"));
        assert(withdraw_success);
        assertEq(ticketBank.balance, 0);
        assertEq(gameMaster.balance, FEE);
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

    function test_claim_goal() public {
        address g = address(new HuntGoal(0, 1, HASH, gameMaster, ticketBank));

        // ensure attacker can't authorize a forged goal
        assert(!authorize(goal));

        address user = createUser();
        vm.startPrank(user);
        (bool success,) = ticketBank.call{value: FEE}("");
        assert(success);

        // ensure a call to unauthorized goal fails (level is ok so the issue is authentification)
        assert(!claim(g, 0));

        // add new goal
        address g2 = address(new HuntGoal(1, 2, HASH, gameMaster, ticketBank));
        vm.startPrank(gameMaster);
        assert(authorize(g2)); 

        // ensure can't claim in wrong order
        vm.startPrank(user);
        assert(!claim(g2, 0));

        // ensure can't claim with invalid nonce
        assert(!claim(goal, 1));

        // ensure correct claim order works
        vm.deal(goal, 100);
        vm.expectEmit(true,true,true,true);
        emit HuntGoal.GoalClaimed(goal, user);
        success = claim(goal, 0);
        assert(success);

        vm.expectEmit(true,true,true,true);
        emit HuntGoal.GoalClaimed(g2, user);
        success = claim(g2, 0);
        assert(success);

        // ensure correct fund rewards
        assertEq(user.balance, 100);

        address u2 = createUser();
        vm.startPrank(u2);
        (success,) = ticketBank.call{value: FEE}("");
        assert(success);

        vm.recordLogs();
        success = claim(g, 0);
        assertEq(u2.balance, 0);
        assertEq(vm.getRecordedLogs().length, 0); 
    }
}