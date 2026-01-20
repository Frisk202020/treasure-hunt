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
    event UnsufficientFunds(address user, uint value);

    // for users to prove an error occured
    event RefundFailed(address user, uint sentAmmount);
    function deposit() internal {
        if (msg.value < entryFee) {
            emit UnsufficientFunds(msg.sender, msg.value);
            (bool refund_success,) = msg.sender.call{value: msg.value}("");
            if (!refund_success) {
                emit RefundFailed(msg.sender, msg.value);
            }
        }

        granted[msg.sender] = 1;
        emit TicketCreated(msg.sender);
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