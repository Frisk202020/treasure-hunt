// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

/*
    Fail events are not tested (RefundFailed, WithdrawFailed)
*/

contract TicketBank {
    uint entryFee;
    address payable gameMaster;
    mapping (address=>uint) granted;
    address[] goals;

    constructor(uint _entryFee, address payable _gameMaster) {
        entryFee = _entryFee; gameMaster = _gameMaster;
    }

    // checks both goal belongs to the hunt, and is correct goal to claim from this user 
    function validate_goal(address user, uint level) private view {
        for (uint i = 0; i < goals.length; i++) {
            if (goals[i] == msg.sender) { require(level == granted[user], "Invalid level"); return; }
        }

        // don't need to worry about non-honest level value since un-authorized goals are rejected
        revert("Unauthorized");
    }

    function upgrade(address user, uint level) external {
        validate_goal(user, level);
        granted[user]++;
    } 
    
    // Game master is trusted to provide correct goal (no duplicates, correct contract instance)
    function authorize_goal(address goal) external {
        require(msg.sender == gameMaster, "Forbidden");
        goals.push(goal);
    }

    // captured by API
    event TicketCreated(address user);

    // for users to prove an error occured
    function deposit() internal {
        require(msg.value == entryFee, "Please send the exact entry fee");

        uint lvl = granted[msg.sender];
        require(lvl == 0, "Already claimed");

        granted[msg.sender] = 1;
        emit TicketCreated(msg.sender);
    }

    receive() payable external { deposit(); }
    fallback() payable external { deposit(); }

    function withdraw() external {
        require(msg.sender == gameMaster, "Forbidden");

        address a = address(this);
        (bool success,) = msg.sender.call{value: a.balance}("");
        require(success, "Fail");
    } 
}