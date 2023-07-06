import { expect } from 'chai'
import { ethers } from 'hardhat'
import { Guardian, Guardian__factory, TSPAccount, TSPAccountFactory, } from '../typechain'
import { createTSPAccount } from './tsp-utils.test'

describe('TSPAccount Extension Functions Test', function () {
  let accounts: string[]

  before(async function () {
    // load accounts
    accounts = await ethers.provider.listAccounts()
  })
  describe('CreateAccount Test', function () {
    const ethersSigner = ethers.provider.getSigner()
    const mockEntryPoint = '0x'.padEnd(42, '2')
    const firstCode = 'firstReferralCode'
    let guardian: Guardian
    let factory: TSPAccountFactory
    let firstAccount: TSPAccount
    before(async function () {
      guardian = await new Guardian__factory(ethersSigner).deploy()
      const res = await createTSPAccount(ethersSigner, accounts[0], mockEntryPoint, guardian, firstCode)
      factory = res.accountFactory
      firstAccount = res.proxy
    })
    it('#referral code should been set successfully', async () => {
      expect(ethers.utils.parseBytes32String(await factory.referralCodes(firstAccount.address))).equals(firstCode)
      expect(await factory.codeOwners(ethers.utils.formatBytes32String(firstCode))).equals(firstAccount.address)
    })
    it('#inviter should to be zero address', async () => {
      expect(await factory.inviters(firstAccount.address)).equals(ethers.constants.AddressZero)
    })
    it('#should revert when code is invalid', async () => {
      await expect(createTSPAccount(ethersSigner, accounts[0], mockEntryPoint, guardian, ''))
        .to.be.revertedWith('TSPAccountFactory: invalid referralCode')
    })
    it('#should revert when code exists', async () => {
      await expect(createTSPAccount(ethersSigner, accounts[0], mockEntryPoint, guardian, firstCode, '', factory))
        .to.be.revertedWith('TSPAccountFactory: referralCode exists')
    })
    it('#should revert when inviters code not exists', async () => {
      await expect(createTSPAccount(ethersSigner, accounts[0], mockEntryPoint, guardian, 'code', 'code1', factory))
        .to.be.revertedWith('TSPAccountFactory: inviterReferralCode not exists')
    })
    it('#Invite event should be emitted when inviter is setting successfully', async () => {
      const eventFilter = factory.filters.Invite(ethers.constants.AddressZero, firstAccount.address)
      const events = await factory.queryFilter(eventFilter)
      expect(events.length).to.be.equals(1)
    })
    it('#SetReferralCode event should be emitted when referral code is setting successfully', async () => {
      const zeroBytes32 = ethers.utils.formatBytes32String('')
      const referralCode = ethers.utils.formatBytes32String(firstCode)
      const eventFilter = factory.filters.SetReferralCode(firstAccount.address, zeroBytes32, referralCode)
      const events = await factory.queryFilter(eventFilter)
      expect(events.length).to.be.equals(1)
    })
  })
  describe('Inviter Test', function () {
    const ethersSigner = ethers.provider.getSigner()
    const firstCode = 'firstReferralCode'
    const mockEntryPoint = '0x'.padEnd(42, '2')
    let guardian: Guardian
    let factory: TSPAccountFactory
    let firstAccount: TSPAccount

    before(async function () {
      // deploy guardian
      guardian = await new Guardian__factory(ethersSigner).deploy()
      // create first tsp account, owner is accounts[0]
      const res = await createTSPAccount(ethersSigner, accounts[0], mockEntryPoint, guardian, firstCode)
      firstAccount = res.proxy
      factory = res.accountFactory
    })
    it('#inviter should be set successfully', async () => {
      // create second tsp account, owner is accounts[1]
      const { proxy: secondAccount } = await createTSPAccount(ethersSigner, accounts[1], mockEntryPoint, guardian, 'code1', firstCode, factory)
      expect(await factory.inviters(secondAccount.address)).to.be.equals(firstAccount.address)
    })
    it('#Invite event should be emitted when inviter is setting successfully', async () => {
      const { proxy: secondAccount } = await createTSPAccount(ethersSigner, accounts[1], mockEntryPoint, guardian, 'code2', firstCode, factory)
      const eventFilter = factory.filters.Invite(firstAccount.address, secondAccount.address)
      const events = await factory.queryFilter(eventFilter)
      expect(events.length).to.be.equals(1)
    })
  })
  describe('SetReferralCode Test', function () {
    const ethersSigner = ethers.provider.getSigner()
    const firstCode = 'firstReferralCode'
    const mockEntryPoint = '0x'.padEnd(42, '2')
    let guardian: Guardian
    let factory: TSPAccountFactory
    let firstAccount: TSPAccount

    before(async function () {
      // deploy guardian
      guardian = await new Guardian__factory(ethersSigner).deploy()
      // create first tsp account, owner is accounts[0]
      const res = await createTSPAccount(ethersSigner, accounts[0], mockEntryPoint, guardian, firstCode)
      firstAccount = res.proxy
      factory = res.accountFactory
    })
    it('#referral code should be set successfully', async () => {
      const newCode = 'newCode'
      // sign transaction
      const populatedTransaction = await factory.populateTransaction.setReferralCode(ethers.utils.formatBytes32String(newCode))
      // send by aa account
      await firstAccount.execute(factory.address, ethers.constants.Zero, populatedTransaction.data!)
      // new code should be set
      expect(ethers.utils.parseBytes32String(await factory.referralCodes(firstAccount.address))).equals(newCode)
      // new code owner should be first account
      expect(await factory.codeOwners(ethers.utils.formatBytes32String(newCode))).equals(firstAccount.address)
      // old code should be zero
      expect(await factory.codeOwners(ethers.utils.formatBytes32String(firstCode))).equals(ethers.constants.AddressZero)
    })
    it('#SetReferralCode event should be emitted when referral code is setting successfully', async () => {
      const zeroBytes32 = ethers.utils.formatBytes32String('')
      const referralCode = ethers.utils.formatBytes32String(firstCode)
      const eventFilter = factory.filters.SetReferralCode(firstAccount.address, zeroBytes32, referralCode)
      const events = await factory.queryFilter(eventFilter)
      expect(events.length).to.be.equals(1)
    })
  })
  describe('Metadata Test', function () {
    const firstCode = 'referralCode'
    const mockEntryPoint = '0x'.padEnd(42, '2')
    const ethersSigner = ethers.provider.getSigner()
    let firstTspAccount: TSPAccount
    let guardian: Guardian

    before(async function () {
      // deploy guardian
      guardian = await new Guardian__factory(ethersSigner).deploy()
      // create first tsp account, owner is accounts[0]
      const creatRes = await createTSPAccount(ethersSigner, accounts[0], mockEntryPoint, guardian, firstCode)
      firstTspAccount = creatRes.proxy
    })
    it('#SetMetadata event will be emitted when metadata is setting successfully', async () => {
      // As an extension test, we can assume that its basic logic has been tested and passed elsewhere. So we will only test its extended functionality here
      await firstTspAccount.setMetadata('testKey', 'testValue')
      const eventFilter = firstTspAccount.filters.SetMetadata('testKey', 'testValue')
      const events = await firstTspAccount.queryFilter(eventFilter)
      expect(events.length).to.be.equals(1)
    })
  })
})
