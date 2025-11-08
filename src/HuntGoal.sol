// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

contract HuntGoal {
    uint value;
    uint level;
    bool claimed;

    constructor(uint _value, uint _level) {
        value = _value;
        claimed = false;
        level = _level;
    }

    function readLevel() external view returns (uint) {
        return level;
    }

    //event alertClaim(address winner);
    function claim() external returns (bool) {
        if (!claimed) {
            claimed = true;
            return true;
        }
        return false;
    }
}