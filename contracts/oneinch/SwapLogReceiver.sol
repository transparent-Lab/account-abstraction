// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

interface ISwapLogReceiver {
    function oneInchLogReceiver(address tokenIn, address tokenOut, uint256 amount) external;
}

contract SwapLogReceiver is ISwapLogReceiver {
    event OneInchSwap(
        address tokenIn,
        address tokenOut,
        uint256 amount
    );

    function oneInchLogReceiver(address tokenIn, address tokenOut, uint256 amount) override external {
        emit OneInchSwap(tokenIn, tokenOut, amount);
    }
}
