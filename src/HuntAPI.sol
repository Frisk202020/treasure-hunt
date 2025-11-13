// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

interface IGoal {
    function readLevel() external view returns (uint);
    function readValue() external view returns (uint);
    function claim() external returns (bool);
}

// Immutable list of all authenticated contracts by the organizer
contract HuntAPI {
    address[] goals;
    mapping(address => uint) tickets; // all keys are initialized with value 0

    constructor(address[] memory _goals) {
        goals = _goals;
    }

    function createTicket(address payable wallet) external returns (bool) {
        if (tickets[wallet] > 0) { return false; } // this wallet already has a ticket

        tickets[wallet] = 1;
        return true;
    }

    function authenticateGoal(address goal) private view returns (bool) {
        // basically this.goals.contains(goal)
        for (uint i = 0; i < goals.length; i++) {
            if (goals[i] == goal) { return true; }
        }

        return false;
    }

    function claimGoal(address goal, address payable wallet) external returns (uint) {
        if (!authenticateGoal(goal)) { return 0; }

        IGoal goalObj = IGoal(goal);
        if (goalObj.readLevel() != tickets[wallet]) { return 0; }

        tickets[wallet]++;
        if (goalObj.claim()) {
            send(wallet, goalObj.readValue());
            return 2;
        } 
        return 1; 
    }

    function deposit() payable external {}
    function send(address payable wallet, uint amount) private {
        if (address(this).balance < amount) { emit BalanceError(wallet, amount); return; }
        wallet.transfer(amount);
    } 
    event BalanceError(address indexed winner, uint indexed amount);
}