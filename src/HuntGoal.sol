// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

interface Bank {
    function upgrade(address user, uint level) external;
}

// value & level are readable using bytecode analysis, not explicitely exposed because data is stored on API directly
contract HuntGoal {
    uint value;
    uint level;
    bytes32 targetHash; // hash of the nonce to find 
    address payable gameMaster;
    Bank bank;
    bool claimed;

    // game master trusted to provide a correct bank address
    // can't provide nonce in constructor since it would be part of deployment data
    constructor(uint _value, uint _level, bytes32 _targetHash, address payable _gameMaster, address _bank) {
        value = _value; claimed = false; level = _level; targetHash = _targetHash;
        gameMaster = _gameMaster;
        bank = Bank(_bank);
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
    // vulnerable to eavstropping + front-running, but this risk is preferred compared to central authority
    // Assumes adversary has no advantage to try front-running every single attempt (as fee is at his charge)
    function claim(uint nonce) external returns (bool) {
        require(keccak256(abi.encode(nonce)) == targetHash);
        bank.upgrade(msg.sender, level); // reverts if user has wrong level

        if (!claimed) {
            emit GoalClaimed(address(this), msg.sender);
            (bool success,) = msg.sender.call{value: value}("");
            if (success) {
                claimed = true;
            }
            return success;
        }
        return false;
    }

    // TODO: REMOVE FROM DEPLOYMENT !! Will use developpement
    function set_bank_address(address a) external {
        require(msg.sender == gameMaster);
        bank = Bank(a);
    }
}