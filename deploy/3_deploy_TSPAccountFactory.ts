import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { ethers } from 'hardhat'

const deployTSPAccountFactory: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const provider = ethers.provider
  const from = await provider.getSigner().getAddress()
  const network = await provider.getNetwork()
  // only deploy on local test network.
  if (network.chainId !== 31337 && network.chainId !== 1337) {
    return
  }

  const entrypoint = await hre.deployments.get('EntryPoint')
  const ret = await hre.deployments.deploy(
    'TSPAccountFactory', {
      from,
      args: [entrypoint.address],
      gasLimit: 4e8,
      deterministicDeployment: true
    })
  console.log('==TSPAccountFactory addr=', ret.address)
  console.log('gas', ret.receipt?.cumulativeGasUsed)
}

export default deployTSPAccountFactory
