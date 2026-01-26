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

    // goal should be funded by GameMaster
    function deposit() internal {
        address g = address(this);

        if (g.balance < value) { return; }
        if (g.balance > value) {
            uint overflow = g.balance - value;
            (bool success,) = msg.sender.call{value: overflow}("");
            require(success, "Aborted when trying to refund excess funds");
        }
        
        emit GoalReady(g);
    }  
    fallback() payable external { deposit(); }
    receive() payable external { deposit(); }

    // allows users to check if goal is claimed, and ensure winner is not gameMaster himself
    event GoalClaimed(address goal, address winner);
    event SendFundsFail(address goal, address winner);

    // API checks user has ticket first
    // vulnerable to eavstropping + front-running, but this risk is preferred compared to central authority
    // Assumes adversary has no advantage to try front-running every single attempt (as fee is at his charge)
    function claim(uint nonce) external {
        address g = address(this);
        require(g.balance >= value, "Missing funds");
        require(keccak256(abi.encode(nonce)) == targetHash, "Wrong");

        bank.upgrade(msg.sender, level); // reverts if user has wrong level or goal is malicious
        if (!claimed) {
            claimed = true; // even if this fails, no one other than msg.sender should be able to claim.
            (bool success,) = msg.sender.call{value: value}("");

            if (success) { emit GoalClaimed(g, msg.sender); }
            else { emit SendFundsFail(g, msg.sender); }
        }
    }

    function send_prize(address winner) external {
        require(msg.sender == gameMaster, "Forbidden");
        require(address(this).balance >= value, "Missing funds");

        (bool success,) = winner.call{value: value}("");
        require(success, "Send failed");
    } 

    // TODO: REMOVE FROM DEPLOYMENT !! Will use developpement
    function set_bank_address(address a) external {
        require(msg.sender == gameMaster);
        bank = Bank(a);
    }
}