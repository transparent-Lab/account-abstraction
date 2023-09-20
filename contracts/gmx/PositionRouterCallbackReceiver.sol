// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

interface IPositionRouterCallbackReceiver {
    function gmxPositionCallback(bytes32 positionKey, bool isExecuted, bool isIncrease) external;
}

contract PositionRouterCallbackReceiver is IPositionRouterCallbackReceiver {
    address public positionRouter = 0xb87a436B93fFE9D75c5cFA7bAcFff96430b09868;
    event CallbackCalled(
        bytes32 positionKey,
        bool isExecuted,
        bool isIncrease
    );

    function gmxPositionCallback(bytes32 positionKey, bool isExecuted, bool isIncrease) override external {
        require(msg.sender == positionRouter, "PositionRouterCallbackReceiver: forbidden");
        emit CallbackCalled(positionKey, isExecuted, isIncrease);
    }
}
