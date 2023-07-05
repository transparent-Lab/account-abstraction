import { expect } from 'chai'
import { Signer } from 'ethers'
import { parseEther } from 'ethers/lib/utils'
import { ethers } from 'hardhat'
import {
  Guardian,
  Guardian__factory,
  TSPAccountFactory,
  TSPAccountFactory__factory,
  TSPAccountV2__factory,
  TSPAccount__factory
} from '../typechain'
import {
  DefaultDelayBlock, DefaultPlatformGuardian,
  DefaultThreshold,
  createAccountOwner
} from './tsp-utils.test'
describe('TSPAccount Upgrade', function () {
  const code1 = ethers.utils.formatBytes32String('referralCode1')
  const code2 = ethers.utils.formatBytes32String('referralCode2')
  // const inviter = '0x'.padEnd(42, '0')
  const entryPoint = '0x'.padEnd(42, '2')
  let accounts: string[]
  let factory: TSPAccountFactory
  let signer: Signer
  let guardian: Guardian
  before(async () => {
    accounts = await ethers.provider.listAccounts()
    signer = ethers.provider.getSigner()
    factory = await new TSPAccountFactory__factory(signer).deploy(entryPoint)
    guardian = await new Guardian__factory(signer).deploy()
  })

  it('can upgrade the TSPAccount contract 1', async () => {
    const inviterCode = ethers.constants.HashZero
    const accountOwner = createAccountOwner()
    await factory.createAccount(accountOwner.address, 0, guardian.address, DefaultThreshold, DefaultDelayBlock, [DefaultPlatformGuardian], code1, inviterCode)
    const addr1 = await factory.getAddress(accountOwner.address, 0, guardian.address, DefaultThreshold, DefaultDelayBlock, [DefaultPlatformGuardian])
    const account = TSPAccount__factory.connect(addr1, accountOwner)
    await signer.sendTransaction({ from: accounts[0], to: accountOwner.address, value: parseEther('1') })
    expect(await account.connect(signer).getVersion()).to.be.equals(1)
    const account2 = await new TSPAccountV2__factory(signer).deploy(entryPoint)
    await account.upgradeTo(account2.address)
    expect(await account.getVersion()).to.be.equals(2)
  })

  it('can upgrade the TSPAccount contract 2', async () => {
    const inviterCode = ethers.constants.HashZero
    const accountOwner = createAccountOwner()
    await factory.createAccount(accountOwner.address, 0, guardian.address, DefaultThreshold, DefaultDelayBlock, [DefaultPlatformGuardian], code2, inviterCode)
    const accountAddress = await factory.getAddress(accountOwner.address, 0, guardian.address, DefaultThreshold, DefaultDelayBlock, [DefaultPlatformGuardian])
    const account = TSPAccount__factory.connect(accountAddress, accountOwner)
    await signer.sendTransaction({ from: accounts[0], to: accountOwner.address, value: parseEther('1') })
    await signer.sendTransaction({ from: accounts[0], to: accountAddress, value: parseEther('5') })
    const _guardian = await new Guardian__factory(signer).deploy()
    await account.changeGuardian(_guardian.address, { gasLimit: 10000000 })
    // await guardian.connect(accountOwner).register(accountAddress)
    expect(await account.connect(signer).getVersion()).to.be.equals(1)

    const account2 = await new TSPAccountV2__factory(signer).deploy(entryPoint)
    await account.upgradeTo(account2.address)
    expect(await account.getGuardian()).to.be.equals(_guardian.address)
    expect(await ethers.provider.getBalance(account.address)).equals(parseEther('5'))
  })
})
