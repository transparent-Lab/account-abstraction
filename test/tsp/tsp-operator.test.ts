import { Signer } from 'ethers'
import { ethers } from 'hardhat'
import { expect } from 'chai'
import { Guardian, Guardian__factory } from '../../typechain'
import {
  ONE_ETH,
  TWO_ETH,
  createTSPAccount
} from './tsp-utils.test'
import { parseEther } from 'ethers/lib/utils'

describe('TSPAccount', function () {
  const inviter = '0x'.padEnd(42, '0')
  const entryPoint = '0x'.padEnd(42, '2')
  let accounts: string[]
  let accountOperator: Signer
  const ethersSigner = ethers.provider.getSigner()
  let guardian: Guardian

  before(async function () {
    accounts = await ethers.provider.listAccounts()
    // ignore in geth.. this is just a sanity test. should be refactored to use a single-account mode..
    if (accounts.length < 2) this.skip()
    accountOperator = (await ethers.getSigners())[1]
    guardian = await new Guardian__factory(ethersSigner).deploy()
  })

  it('owner should be able to call transfer', async () => {
    const { proxy: account } = await createTSPAccount(ethers.provider.getSigner(), accounts[0], entryPoint, guardian, inviter)
    await ethersSigner.sendTransaction({ from: accounts[0], to: account.address, value: parseEther('2') })
    await account.execute(accounts[2], ONE_ETH, '0x')
  })

  it('account operator should be able to call transfer', async () => {
    const { proxy: account } = await createTSPAccount(ethers.provider.getSigner(), accounts[5], entryPoint, guardian, inviter)
    TWO_ETH
    await ethersSigner.sendTransaction({ from: accounts[0], to: account.address, value: TWO_ETH })
    const operatorAddress = await accountOperator.getAddress()
    await account.connect(ethers.provider.getSigner(5)).changeOperator(operatorAddress)
    expect(await account.getOperator()).to.equal(operatorAddress)
    await account.connect(accountOperator).execute(accounts[2], ONE_ETH, '0x', { gasLimit: 10000000 })
  })

  it('other account should not be able to call transfer', async () => {
    const { proxy: account } = await createTSPAccount(ethers.provider.getSigner(), accounts[6], entryPoint, guardian, inviter)
    await expect(account.connect(ethers.provider.getSigner(2)).execute(accounts[2], ONE_ETH, '0x'))
      .to.be.revertedWith('account: not Owner or EntryPoint')
  })

  // it('should pack in js the same as solidity', async () => {
  //   const op = await fillUserOpDefaults({ sender: accounts[0] })
  //   const packed = packUserOp(op)
  //   expect(await testUtil.packUserOp(op)).to.equal(packed)
  // })

  // describe('#validateUserOp', () => {
  //   let account: TSPAccount
  //   let userOp: UserOperation
  //   let userOpHash: string
  //   let preBalance: number
  //   let expectedPay: number

  //   const actualGasPrice = 1e9

  //   before(async () => {
  //     // that's the account of ethersSigner
  //     const entryPoint = accounts[2]
  //     ({ proxy: account } = await createAccount(await ethers.getSigner(entryPoint), accountOwner.address, entryPoint))
  //     await ethersSigner.sendTransaction({ from: accounts[0], to: account.address, value: parseEther('0.2') })
  //     const callGasLimit = 200000
  //     const verificationGasLimit = 100000
  //     const maxFeePerGas = 3e9
  //     const chainId = await ethers.provider.getNetwork().then(net => net.chainId)

  //     userOp = signUserOp(fillUserOpDefaults({
  //       sender: account.address,
  //       callGasLimit,
  //       verificationGasLimit,
  //       maxFeePerGas
  //     }), accountOwner, entryPoint, chainId)

  //     userOpHash = await getUserOpHash(userOp, entryPoint, chainId)

  //     expectedPay = actualGasPrice * (callGasLimit + verificationGasLimit)

  //     preBalance = await getBalance(account.address)
  //     const ret = await account.validateUserOp(userOp, userOpHash, expectedPay, { gasPrice: actualGasPrice })
  //     await ret.wait()
  //   })

  //   it('should pay', async () => {
  //     const postBalance = await getBalance(account.address)
  //     expect(preBalance - postBalance).to.eql(expectedPay)
  //   })

  //   it('should increment nonce', async () => {
  //     expect(await account.nonce()).to.equal(1)
  //   })

  //   it('should reject same TX on nonce error', async () => {
  //     await expect(account.validateUserOp(userOp, userOpHash, 0)).to.revertedWith('invalid nonce')
  //   })

  //   it('should return NO_SIG_VALIDATION on wrong signature', async () => {
  //     const userOpHash = HashZero
  //     const deadline = await account.callStatic.validateUserOp({ ...userOp, nonce: 1 }, userOpHash, 0)
  //     expect(deadline).to.eq(1)
  //   })
  // })
  // context('TSPAccountFactory', () => {
  //   it('sanity: check deployer', async () => {
  //     const ownerAddr = createAddress()
  //     const deployer = await new TSPAccountFactory__factory(ethersSigner).deploy(entryPoint)
  //     const target = await deployer.callStatic.createAccount(ownerAddr, 1234)
  //     expect(await isDeployed(target)).to.eq(false)
  //     await deployer.createAccount(ownerAddr, 1234)
  //     expect(await isDeployed(target)).to.eq(true)
  //   })
  // })
})
