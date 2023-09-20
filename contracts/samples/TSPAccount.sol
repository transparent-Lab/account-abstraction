// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

/* solhint-disable avoid-low-level-calls */
/* solhint-disable no-inline-assembly */
/* solhint-disable reason-string */

import "../interfaces/ITSPAccount.sol";
import "./SimpleAccount.sol";
import "../interfaces/IGuardian.sol";

/**
 * minimal account.
 *  this is sample minimal account.
 *  has execute, eth handling methods
 *  has a single signer that can send requests through the entryPoint.
 */
contract TSPAccount is SimpleAccount, ITSPAccount {
    // the operator can invoke the contract, but cannot modify the owner
    address public operator;

    // a guardian contract through which the owner can modify the guardian and multi-signature rules
    address public guardian;

    // the inviter of this account
    address public inviter;

    mapping(string => string) public metadata;

    event InviterInitialized(address indexed inviter, address indexed invitee);

    event SetMetadata(string indexed key, string indexed value);

    constructor(IEntryPoint anEntryPoint) SimpleAccount(anEntryPoint) {}

    function resetOwner(address newOwner) public {
        require(newOwner != address(0), "new owner is the zero address");
        _requireFromEntryPointOrOwnerOrGuardian();
        owner = newOwner;
        emit ResetOwner(address(this), owner, newOwner);
    }

    function changeOperator(address _operator) public {
        require(operator != address(0), "operator is the zero address");
        _requireFromEntryPointOrOwner();
        operator = _operator;
    }

    function getGuardian() public view returns (address) {
        return guardian;
    }

    function getOperator() public view returns (address) {
        return operator;
    }

    function getInviter() public view returns (address) {
        return inviter;
    }

    function _requireFromEntryPointOrOwnerOrGuardian() internal view {
        require(
            msg.sender == owner || msg.sender == guardian || msg.sender == address(entryPoint()),
            "account: not Owner or Guardian or EntryPoint"
        );
    }

    // Require the function call went through EntryPoint or owner or operator
    function _requireFromEntryPointOrOwnerOrOperator() internal view {
        require(
            msg.sender == address(entryPoint()) ||
                msg.sender == owner ||
                msg.sender == operator,
            "account: not Owner or EntryPoint or Operator"
        );
    }

    // Save the user's customized data
    function setMetadata(
        string memory key,
        string memory value
    ) public onlyOwner {
        bytes memory bytesStr = bytes(value);
        if (bytesStr.length == 0) {
            delete metadata[key];
        }
        metadata[key] = value;
        emit SetMetadata(key, value);
    }

    // Get user custom data
    function getMetadata(
        string memory key
    ) public view onlyOwner returns (string memory value) {
        value = metadata[key];
        if (bytes(value).length == 0) {
            return "";
        }
    }

    /**
     * @dev The _entryPoint member is immutable, to reduce gas consumption.  To upgrade EntryPoint,
     * a new implementation of SimpleAccount must be deployed with the new EntryPoint address, then upgrading
     * the implementation by calling `upgradeTo()`
     */
    function initialize(
        address anOwner,
        address _guardian,
        uint256 threshold,
        uint256 guardianDelay,
        address[] memory guardians,
        address _inviter
    ) public initializer {
        _initialize(anOwner);
        _changeGuardian(_guardian);
        IGuardian(_guardian).setConfig(
            address(this),
            IGuardian.GuardianConfig(guardians, threshold, guardianDelay)
        );
        if(_inviter != address(0)) {
            // self-invite is not allowed
            require(_inviter != address(this), "inviter is oneself");
        }
        inviter = _inviter;
        emit InviterInitialized(_inviter, address(this));
    }

    function changeGuardian(address _guardian) public onlyOwner {
        _changeGuardian(_guardian);
    }

    function _changeGuardian(address _guardian) internal {
        require(_guardian != address(0), "guardian is the zero address");
        guardian = _guardian;
    }

    /**
     * execute a transaction (called directly from owner, or by entryPoint)
     */
    function execute(
        address dest,
        uint256 value,
        bytes calldata func
    ) external override {
        _requireFromEntryPointOrOwnerOrOperator();
        _call(dest, value, func);
    }

    /**
     * execute a sequence of transactions
     */
    function executeBatch(address[] calldata dest, uint256[] calldata value, bytes[] calldata func)  external override {
        _requireFromEntryPointOrOwnerOrOperator();
        require(
            dest.length == func.length && dest.length == value.length,
            "wrong array lengths"
        );
        for (uint256 i = 0; i < dest.length; i++) {
            _call(dest[i], value[i], func[i]);
        }
    }

    function getVersion() public pure virtual returns (uint) {
        return 3;
    }
}
