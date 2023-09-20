import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { ethers } from 'hardhat'

const deploySwapLogReceiver: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const provider = ethers.provider
  const from = await provider.getSigner().getAddress()
  console.log('==addr=', from)
  const entrypoint = await hre.deployments.get('EntryPoint')
  const ret = await hre.deployments.deploy(
    'TSPAccount', {
      from,
      args: [entrypoint.address],
      gasLimit: 8e8,
      deterministicDeployment: true
    })
  console.log('==TSPAccount addr=', ret.address)
  console.log('gas', ret.receipt?.cumulativeGasUsed)
}

export default deploySwapLogReceiver
