// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

/*
    Fail events are not tested (RefundFailed, WithdrawFailed)
*/

contract TicketBank {
    uint entryFee;
    address payable gameMaster;

    constructor(uint _entryFee, address payable _gameMaster) {
        entryFee = _entryFee; gameMaster = _gameMaster;
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