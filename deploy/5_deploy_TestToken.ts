import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { ethers } from 'hardhat'

const deployTestToken: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const provider = ethers.provider
  const from = await provider.getSigner().getAddress()
  const network = await provider.getNetwork()
  if (network.chainId === 42161) { // return if Arbitrum One
    console.log('==deployTestToken skipped on Arbitrum One')
    return
  }
  const ret = await hre.deployments.deploy(
    'TestToken', {
      from,
      args: [],
      gasLimit: 2e6,
      deterministicDeployment: true
    })
  console.log('==TestToken addr=', ret.address)
  console.log('gas', ret.receipt?.cumulativeGasUsed)
}

export default deployTestToken
