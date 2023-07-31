// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

interface IPositionRouterCallbackReceiver {
    function gmxPositionCallback(bytes32 positionKey, bool isExecuted, bool isIncrease) external;
}

contract PositionRouterCallbackReceiver is IPositionRouterCallbackReceiver {
    event CallbackCalled(
        bytes32 positionKey,
        bool isExecuted,
        bool isIncrease
    );

    function gmxPositionCallback(bytes32 positionKey, bool isExecuted, bool isIncrease) override external {
        emit CallbackCalled(positionKey, isExecuted, isIncrease);
    }
}
