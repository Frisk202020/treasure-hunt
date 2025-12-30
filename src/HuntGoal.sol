// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

// value & level are readable using bytecode analysis, not explicitely exposed because data is stored on API directly
contract HuntGoal {
    uint value;
    uint level;
    address payable gameMaster;
    bool claimed;

    constructor(uint _value, uint _level, address payable _gameMaster) {
        value = _value;
        claimed = false;
        level = _level;
        gameMaster = _gameMaster;
    }

    // users can verify a goal is properly funded
    event GoalReady(address goal);

    // notify goal funder
    event RefundFailed(address funder, uint overflow);

    // goal should be funded by GameMaster
    function deposit() internal {
        address g = address(this);

        if (g.balance < value) { return; }
        if (g.balance > value) {
            uint overflow = g.balance - value;
            (bool success,) = msg.sender.call{value: overflow}("");
            if (!success) {
                emit RefundFailed(msg.sender, overflow);
            }
        }
        
        emit GoalReady(g);
    }  
    fallback() payable external { deposit(); }
    receive() payable external { deposit(); }

    // allows users to check if goal is claimed, and ensure winner is not gameMaster himself
    event GoalClaimed(address goal, address winner);

    // API checks user has ticket first
    function claim(address payable user) external returns (bool) {
        require(msg.sender == gameMaster);

        if (!claimed) {
            emit GoalClaimed(address(this), user);
            (bool success,) = user.call{value: value}("");
            if (success) {
                claimed = true;
            }
            return success;
        }
        return false;
    }
}