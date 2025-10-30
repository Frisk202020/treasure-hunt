// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {HuntPrize} from "./HuntPrize.sol";
import {HuntTicket} from "./HuntTicket.sol";

contract HuntGoal {
    HuntPrize prize;
    uint level;
    bool claimed;

    constructor(uint goalValue, uint _level) {
        prize = new HuntPrize(goalValue);
        claimed = false;
        level = _level;
    }

    event alertClaim(address winner);
    function claim(HuntTicket contestant) external {
        require(contestant.readLevel() == level - 1, "This ticket can't claim this goal");
        contestant.setLevel(level);

        if (!claimed) {
            claimed = true;
            address claimAddress = contestant.readOwner();
            prize.setFirstOwner(claimAddress);
            emit alertClaim(claimAddress);
        }
    }

    function readPrizeOwner() external view returns (address) {
        return prize.readOwner();
    }
}