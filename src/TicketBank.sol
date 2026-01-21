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
    function is_correct_goal(address user, uint level) private view returns (bool) {
        for (uint i = 0; i < goals.length; i++) {
            if (goals[i] == msg.sender) { return level == granted[user]; }
        }

        // don't need to worry about non-honest level value since un-authorized goals are rejected
        return false;
    }

    function upgrade(address user, uint level) external {
        require(is_correct_goal(user, level));
        granted[user]++;
    } 
    
    // Game master is trusted to provide correct goal (no duplicates, correct contract instance)
    function authorize_goal(address goal) external {
        require(msg.sender == gameMaster);
        goals.push(goal);
    }

    // captured by API
    event TicketCreated(address user);
    event AlreadyClaimed(address user, uint level);
    event UnsufficientFunds(address user, uint value);

    // for users to prove an error occured
    function deposit() internal {
        uint lvl = granted[msg.sender];
        if (lvl > 0) {
            emit AlreadyClaimed(msg.sender, lvl);
            refund();
            return;
        }
        if (msg.value < entryFee) {
            emit UnsufficientFunds(msg.sender, msg.value);
            refund();
            return;
        }

        granted[msg.sender] = 1;
        emit TicketCreated(msg.sender);
    }

    event RefundFailed(address user, uint sentAmmount);
    function refund() internal {
        (bool success,) = msg.sender.call{value: msg.value}("");
        if (!success) {
            emit RefundFailed(msg.sender, msg.value);
        }
        return;
    }
    receive() payable external { deposit(); }
    fallback() payable external { deposit(); }

    event WithdrawFailed(uint available_funds);
    function withdraw() external {
        require(msg.sender == gameMaster);

        address a = address(this);
        (bool success,) = msg.sender.call{value: a.balance}("");
        if (!success) {
            emit WithdrawFailed(a.balance);
        }
    } 
}