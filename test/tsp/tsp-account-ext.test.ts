import { expect } from 'chai'
import { ethers } from 'hardhat'
import { Guardian, Guardian__factory, TSPAccount } from '../../typechain'
import { createTSPAccount } from './tsp-utils.test'

describe('TSPAccount Extension Functions Test', function () {
  let accounts: string[]

  before(async function () {
    // load accounts
    accounts = await ethers.provider.listAccounts()
  })
  describe('Inviter Test', function () {
    const defaultInviter = '0x'.padEnd(42, '0')
    const mockEntryPoint = '0x'.padEnd(42, '2')
    const ethersSigner = ethers.provider.getSigner()
    let firstTspAccount: TSPAccount
    let guardian: Guardian

    before(async function () {
      // deploy guardian
      guardian = await new Guardian__factory(ethersSigner).deploy()
      // create first tsp account, owner is accounts[0]
      const creatRes = await createTSPAccount(ethersSigner, accounts[0], mockEntryPoint, guardian, defaultInviter)
      firstTspAccount = creatRes.proxy
    })
    it('#inviter can be set as aa successfully', async () => {
      // create second tsp account, owner is accounts[1]
      const { proxy: tspAccount } = await createTSPAccount(ethersSigner, accounts[1], mockEntryPoint, guardian, firstTspAccount.address)
      expect(await tspAccount.getInviter()).to.be.equals(firstTspAccount.address)
    })
    it('#inviter can be set as normal contract address successfully(acceptable bug)', async () => {
      // create second tsp account, owner is accounts[1]
      const { proxy: tspAccount } = await createTSPAccount(ethersSigner, accounts[1], mockEntryPoint, guardian, guardian.address)
      expect(await tspAccount.getInviter()).to.be.equals(guardian.address)
    })
    it('#InviterInitialized event will be emitted when inviter is setting successfully', async () => {
      const eventFilter = firstTspAccount.filters.InviterInitialized(defaultInviter, firstTspAccount.address)
      const events = await firstTspAccount.queryFilter(eventFilter)
      expect(events.length).to.be.equals(1)
    })
  })
  describe('Metadata Test', function () {
    const defaultInviter = '0x'.padEnd(42, '0')
    const mockEntryPoint = '0x'.padEnd(42, '2')
    const ethersSigner = ethers.provider.getSigner()
    let firstTspAccount: TSPAccount
    let guardian: Guardian

    before(async function () {
      // deploy guardian
      guardian = await new Guardian__factory(ethersSigner).deploy()
      // create first tsp account, owner is accounts[0]
      const creatRes = await createTSPAccount(ethersSigner, accounts[0], mockEntryPoint, guardian, defaultInviter)
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
