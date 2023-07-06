// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/utils/Create2.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

import "./TSPAccount.sol";
import "./Guardian.sol";

/**
 * A sample factory contract for SimpleAccount
 * A UserOperations "initCode" holds the address of the factory, and a method call (to createAccount, in this sample factory).
 * The factory's createAccount returns the target account address even if it is already installed.
 * This way, the entryPoint.getSenderAddress() can be called either before or after the account is created.
 */
contract TSPAccountFactory {
    TSPAccount public immutable accountImplementation;

    mapping (address => bytes32) public referralCodes;
    mapping (bytes32 => address) public codeOwners;

    // invitee -> inviter
    mapping (address => address) public inviters;

    event SetReferralCode(address indexed owner, bytes32 indexed oldCode, bytes32 indexed newCode);
    event Invite(address indexed inviter, address indexed invitee);

    constructor(IEntryPoint _entryPoint) {
        accountImplementation = new TSPAccount(_entryPoint);
    }

    function setReferralCode(bytes32 code) external {
        require(code != bytes32(0), "TSPAccountFactory: invalid referralCode");
        require(referralCodes[msg.sender] != bytes32(0), "TSPAccountFactory: account not exists");
        require(codeOwners[code] == address(0), "TSPAccountFactory: code exists");

        // delete old code
        bytes32 oldCode = referralCodes[msg.sender];
        if(oldCode != bytes32(0)) {
            delete codeOwners[oldCode];
        }

        referralCodes[msg.sender] = code;
        codeOwners[code] = msg.sender;
        emit SetReferralCode(msg.sender, oldCode, code);
    }

    /**
     * create an account, and return its address.
     * returns the address even if the account is already deployed.
     * Note that during UserOperation execution, this method is called only if the account is not deployed.
     * This method returns an existing account address so that entryPoint.getSenderAddress() would work even after account creation
     */
    function createAccount(
        address owner,
        uint256 salt,
        address guardian,
        uint256 threshold,
        uint256 guardianDelay,
        address[] memory guardians,
        bytes32 referralCode,
        bytes32 inviterReferralCode
    ) public returns (TSPAccount ret) {
        // check referralCode
        require(referralCode != bytes32(0), "TSPAccountFactory: invalid referralCode");
        require(codeOwners[referralCode] == address(0), "TSPAccountFactory: referralCode exists");

        // check inviterReferralCode
        address inviter = address(0);
        if(inviterReferralCode != bytes32(0)) {
            require(codeOwners[inviterReferralCode] != address(0), "TSPAccountFactory: inviterReferralCode not exists");
            inviter = codeOwners[inviterReferralCode];
        }

        address addr = getAddress(
            owner,
            salt,
            guardian,
            threshold,
            guardianDelay,
            guardians
        );
        uint codeSize = addr.code.length;
        if (codeSize > 0) {
            return TSPAccount(payable(addr));
        }

        ret = TSPAccount(
            payable(
                new ERC1967Proxy{salt: bytes32(salt)}(
                    address(accountImplementation),
                    abi.encodeCall(
                        TSPAccount.initialize,
                        (owner, guardian, threshold, guardianDelay, guardians)
                    )
                )
            )
        );

        addr = address(ret);
        require(inviter != addr, "TSPAccountFactory: inviter is oneself");

        // set referralCode
        referralCodes[addr] = referralCode;
        // set codeOwners
        codeOwners[referralCode] = addr;
        // set inviter
        inviters[addr] = inviter;
        emit Invite(inviter, addr);
        emit SetReferralCode(addr, bytes32(0), referralCode);
    }

    /**
     * calculate the counterfactual address of this account as it would be returned by createAccount()
     */
    function getAddress(
        address owner,
        uint256 salt,
        address guardian,
        uint256 threshold,
        uint256 guardianDelay,
        address[] memory guardians
    ) public view returns (address) {
        return
            Create2.computeAddress(
                bytes32(salt),
                keccak256(
                    abi.encodePacked(
                        type(ERC1967Proxy).creationCode,
                        abi.encode(
                            address(accountImplementation),
                            abi.encodeCall(
                                TSPAccount.initialize,
                                (
                                    owner,
                                    guardian,
                                    threshold,
                                    guardianDelay,
                                    guardians
                                )
                            )
                        )
                    )
                )
            );
    }
}
