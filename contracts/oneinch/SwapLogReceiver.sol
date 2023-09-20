// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

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
