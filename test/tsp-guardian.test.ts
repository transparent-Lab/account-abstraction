import { expect } from 'chai'
import { Signer, Wallet } from 'ethers'
import { parseEther } from 'ethers/lib/utils'
import { ethers } from 'hardhat'
import {
  Guardian,
  Guardian__factory,
  TSPAccount
} from '../typechain'
import {
  DefaultDelayBlock, DefaultPlatformGuardian, DefaultThreshold,
  createAccountOwner,
  createTSPAccount,
  createTSPAccountAndRegister,
  rethrow
} from './tsp-utils.test'

describe('Guardian', function () {
  const inviter = '0x'.padEnd(42, '0')
  const entryPoint = '0x'.padEnd(42, '2')
  let accounts: string[]
  let guardian: Guardian
  let accountOwner: Wallet
  let tspAccount: TSPAccount
  let signers: Signer[]
  const ethersSigner = ethers.provider.getSigner()

  before(async function () {
    accounts = await ethers.provider.listAccounts()
    // console.log('accounts', accounts)
    // ignore in geth.. this is just a sanity test. should be refactored to use a single-account mode..
    if (accounts.length < 2) this.skip()
    signers = await ethers.getSigners()
    accountOwner = createAccountOwner()
    const _guardian = await new Guardian__factory(ethersSigner).deploy()
    guardian = await Guardian__factory.connect(_guardian.address, accountOwner)
    const act = await createTSPAccount(ethers.provider.getSigner(), accountOwner.address, entryPoint, guardian, inviter)
    tspAccount = act.proxy
    // console.log('tsp account', tspAccount.address)
    await ethersSigner.sendTransaction({ from: accounts[0], to: accountOwner.address, value: parseEther('2') })
    // await guardian.register(tspAccount.address, { gasLimit: 10000000 })
  })

  it('any address should be able to call register', async () => {
    // accounts[0] is owner, owner makes the platform its guardian
    const { proxy: account } = await createTSPAccount(ethers.provider.getSigner(), accounts[1], entryPoint, guardian, inviter)
    // await guardian.register(account.address, { gasLimit: 10000000 })
    const config = await guardian.getGuardianConfig(account.address)
    expect(config.guardians[0]).to.equals(await DefaultPlatformGuardian)
  })

  // it('an account cannot be registered multiple times', async () => {
  //   // stop 3 seconds
  //   // const g1: Guardian = await Guardian__factory.connect(guardian.address, accountOwner)
  //   // await expect(g1.register(tspAccount.address).catch(rethrow())).to.revertedWith('a TSP account can only be registered once')
  // })

  it('account owner should be able to config account guardians', async () => {
    const config = await guardian.getGuardianConfig(tspAccount.address)
    expect(config.guardians[0]).to.equals(await DefaultPlatformGuardian)
    const guardians = [...config.guardians, accounts[3]]
    await guardian.setConfig(tspAccount.address, { guardians: guardians, approveThreshold: DefaultThreshold, delay: DefaultDelayBlock })
    const newConfig = await guardian.getGuardianConfig(tspAccount.address)
    // console.log("new config", newConfig, accounts[3]);
    expect(newConfig.guardians[1]).to.equals(accounts[3])
  })

  describe('Guardian Approved', function () {
    let newAccount: TSPAccount
    let g1: Signer
    let g2: Signer
    let g3: Signer
    let newOwner: Signer
    before('create new account', async () => {
      g1 = signers[3]
      g2 = signers[4]
      g3 = signers[5]
      newOwner = signers[6]
      const act = await createTSPAccountAndRegister(ethersSigner, accounts[2], entryPoint, guardian, inviter)
      newAccount = act.proxy
      const guardians = [g1.getAddress(), g2.getAddress(), g3.getAddress()]
      await guardian.connect(signers[2]).setConfig(newAccount.address, { guardians: guardians, approveThreshold: guardians.length, delay: 100 }, { gasLimit: 10000000 })
    })

    it('account guardian should be able to approve reset', async () => {
      // const newConfig = await ownerGuardian.getGuardianConfig(newAccount.address)
      await guardian.connect(g1).approve(newAccount.address, newOwner.getAddress(), { gasLimit: 10000000 })
    })

    // it('other EOA should not be able to approve reset', async () => {
    //   const _guardian = await guardian.connect(signers[7])
    //   // await _guardian.approve(newAccount.address, newOwner.getAddress())
    //   await expect(_guardian.approve(newAccount.address, newOwner.getAddress()).catch(rethrow())).to.revertedWith('Error: Error(you are not a guardian)')
    // })

    it('any EOA should be able to reset account owner', async () => {
      const act = await createTSPAccountAndRegister(ethersSigner, accounts[2], entryPoint, guardian, inviter)
      const _account = act.proxy
      await _account.connect(ethers.provider.getSigner(2)).changeGuardian(guardian.address, { gasLimit: 10000000 })
      expect(await _account.getGuardian()).to.be.equals(guardian.address)
      const guardians = [g1.getAddress(), g2.getAddress(), g3.getAddress()]
      await guardian.connect(ethers.provider.getSigner(2)).setConfig(_account.address, { guardians: guardians, approveThreshold: 2, delay: 1 }, { gasLimit: 10000000 })
      const _newOwner = await newOwner.getAddress()
      await guardian.connect(g1).approve(_account.address, _newOwner, { gasLimit: 10000000 })
      await guardian.connect(g2).approve(_account.address, _newOwner, { gasLimit: 10000000 })
      await guardian.connect(g3).approve(_account.address, _newOwner, { gasLimit: 10000000 })
      await guardian.connect(signers[7]).resetAccountOwner(_account.address, { gasLimit: 10000000 })
      const _owner = await _account.owner()
      expect(_owner).to.equal(_newOwner)
    })

    it('the threshold value has not been reached, unable to reset the account', async () => {
      const act = await createTSPAccountAndRegister(ethersSigner, accounts[6], entryPoint, guardian, inviter)
      const _account = act.proxy
      await _account.connect(ethers.provider.getSigner(6)).changeGuardian(guardian.address, { gasLimit: 10000000 })
      const guardians = [g1.getAddress(), g2.getAddress(), g3.getAddress()]
      await guardian.connect(ethers.provider.getSigner(6)).setConfig(_account.address, { guardians: guardians, approveThreshold: 2, delay: 1 }, { gasLimit: 10000000 })
      await guardian.connect(g1).approve(_account.address, accounts[7], { gasLimit: 10000000 })
      await guardian.connect(g2).approve(_account.address, accounts[7], { gasLimit: 10000000 })
      const { progress } = await guardian.getApproveProgress(_account.address)
      expect(progress).to.equals(2)
      await guardian.connect(g2).resetAccountOwner(_account.address, { gasLimit: 10000000 })
      expect(accounts[7]).to.equals(await _account.owner())
    })

    it('only the account owner can be clean approves', async () => {
      const act = await createTSPAccountAndRegister(ethersSigner, accounts[7], entryPoint, guardian, inviter)
      const _account = act.proxy
      const guardians = [g1.getAddress(), g2.getAddress(), g3.getAddress()]
      await guardian.connect(ethers.provider.getSigner(7)).setConfig(_account.address, { guardians: guardians, approveThreshold: 2, delay: 100 }, { gasLimit: 10000000 })
      await guardian.connect(g1).approve(_account.address, accounts[8], { gasLimit: 10000000 })
      await guardian.connect(g2).approve(_account.address, accounts[8], { gasLimit: 10000000 })
      const { progress } = await guardian.getApproveProgress(_account.address)
      expect(progress).to.equals(2)
      await guardian.connect(ethers.provider.getSigner(7)).clearApproves(_account.address, { gasLimit: 10000000 })
      const { progress: progress2 } = await guardian.getApproveProgress(_account.address)
      expect(progress2).to.equals(0)
    })

    it('the owner cannot be reset for blocks that have not reached the delayed effect', async () => {
      const act = await createTSPAccountAndRegister(ethersSigner, accounts[9], entryPoint, guardian, inviter)
      const _account = act.proxy
      const guardians = [g1.getAddress(), g2.getAddress(), g3.getAddress()]
      await guardian.connect(ethers.provider.getSigner(9)).setConfig(_account.address, { guardians: guardians, approveThreshold: 2, delay: 100 }, { gasLimit: 10000000 })
      await guardian.connect(g1).approve(_account.address, accounts[10], { gasLimit: 10000000 })
      await guardian.connect(g2).approve(_account.address, accounts[10], { gasLimit: 10000000 })
      const { progress } = await guardian.getApproveProgress(_account.address)
      expect(progress).to.equals(2)
      await expect(guardian.resetAccountOwner(_account.address, { gasLimit: 10000000 }).catch(rethrow())).to.revertedWith('the delay reset time has not yet reached')
      for (let i = 0; i < 100; i++) {
        await ethers.provider.send('evm_mine', [])
      }
      const block = await guardian.closestReset(_account.address)
      const currentBlock = await ethers.provider.getBlockNumber()
      expect(block.toNumber()).lessThan(currentBlock)
      await guardian.resetAccountOwner(_account.address, { gasLimit: 10000000 })
      expect(accounts[10]).to.equals(await _account.owner())
    })
  })
})
