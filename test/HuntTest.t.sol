// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test} from "forge-std/Test.sol";
import {console} from "forge-std/console.sol";
import {HuntGoal} from "../src/HuntGoal.sol";
import {HuntAPI} from "../src/HuntAPI.sol";

/*
 TODO :
    - Try automatic ETH delivery (use vm.deal on API)
    - Check BalanceError events
*/
contract HuntTest is Test {
    address[] bank;
    HuntAPI api;
    uint160 nextAddress;

    function setUp() public {
        HuntGoal firstGoal = new HuntGoal(1, 1);
        address firstGoalAddress = address(firstGoal);

        HuntGoal secondGoal = new HuntGoal(2, 2);
        address secondGoalAddress = address(secondGoal);

        bank = new address[](2);
        bank[0] = firstGoalAddress;
        bank[1] = secondGoalAddress;

        api = new HuntAPI(bank);
        vm.deal(address(api), 1);
        nextAddress = 1000;
    }

    function createUser() public returns (address payable) {
        nextAddress++;
        address payable user = payable(address(nextAddress));
        api.createTicket(user);
        return user;
    }

    function test_cannotCreateTicketTwice() public {
        address payable user = createUser(); // creates a ticket for that user
        assert(!api.createTicket(user));
    }

    function test_needTicketToClaim() public {
        address payable user = createUser(); // creates ticket
        address payable userNoTicket = payable(address(2));
        assert(api.claimGoal(bank[0], user) > 0);
        assertEq(api.claimGoal(bank[0], userNoTicket), 0);
    }

    function test_cannotClaimUnofficialGoal() public {
        address payable user = createUser();
        assert(api.claimGoal(bank[0], user) > 0);

        HuntGoal goal = new HuntGoal(2, 2); // setting level 2 because user
        assertEq(api.claimGoal(address(goal), user), 0);
    }

    function test_goalOrder() public {
        address payable user = createUser();
        assertEq(api.claimGoal(bank[1], user), 0); // can't claim second goal first
        assert(api.claimGoal(bank[0], user) > 0);
        assertEq(api.claimGoal(bank[0], user), 0); // can't claim twice
        assert(api.claimGoal(bank[1], user) > 0);
    }

    function test_rewardOwnership() public {
        address payable winner = createUser();
        address payable loser = createUser();
        assertEq(api.claimGoal(bank[0], winner), 2);
        assertEq(api.claimGoal(bank[0], loser), 1);
    }

    function test_etherTransfer() public {
        address payable user = createUser();
        api.claimGoal(bank[0], user);
        assertEq(user.balance, 1);
        assertEq(address(api).balance, 0); // initialized at 1
    }

    function test_balanceErrorEvent() public {
        address payable user = createUser();
        api.claimGoal(bank[0], user);

        /*
            Topic[0] : hash(BalanceEvent(.))
            Topic[1] : First indexed parameter (wallet)
            Topic[2] : Second indexed parameter (amount)
            Data : ABI-encoded message
        */
        vm.expectEmit(true, true, true, true);
        emit HuntAPI.BalanceError(user, 2);
        api.claimGoal(bank[1], user);
    }
}