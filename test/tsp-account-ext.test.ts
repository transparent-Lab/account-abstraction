import { expect } from 'chai'
import { ethers } from 'hardhat'
import { Guardian, Guardian__factory, TSPAccount } from '../typechain'
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
    it('#inviter cant be set as eoa except 0x0..0', async () => {
      const eoaInviter = '0x'.padEnd(42, '1')
      // create second tsp account, owner is accounts[1]
      await expect(createTSPAccount(ethersSigner, accounts[1], mockEntryPoint, guardian, eoaInviter)).to.revertedWith('inviter is not a contract')
    })
  })
})
