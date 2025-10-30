// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

contract HuntTicket {
    address owner;
    uint level;

    // Enter the contest
    // The ticket identifies and authenticates the user 
    constructor() {
        owner = msg.sender;
        level = 0;
    }

    function readOwner() public view returns (address) {
        return owner;
    }

    // Level is introduced to emphasize completing hunt levels in order
    function readLevel() public view returns (uint) {
        return level;
    }
    function setLevel(uint value) public {
        level = value;
    }
}