// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

contract HuntPrize {
    address owner;
    uint value; // value of the token

    constructor(uint _value) {
        owner = address(0);
        value = _value;
    }

    function readOwner() external view returns (address) {
        return owner;
    }
    function readValue() external view returns (uint) {
        return value;
    }

    function getHash() external view returns (bytes32 hash) {
        assembly {
            mstore(0x00, sload(owner.slot)) // 20 bytes but mstore pads to 32 bytes
            mstore(0x20, sload(value.slot)) // 32 bytes
            hash := keccak256(0x00, 0x40)
        }
    }

    function setFirstOwner(address _owner) public {
        require(owner == address(0));
        owner = _owner;
    }

    function passOwnership(address newOwner, uint8 r, bytes32 v, bytes32 s) external {
        address recovered = ecrecover(this.getHash(), r, v, s);
        require(recovered == owner);
        owner = newOwner;
    }
}