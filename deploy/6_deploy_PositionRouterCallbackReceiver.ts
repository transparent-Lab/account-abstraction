import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { ethers } from 'hardhat'

const deployPositionRouterCallbackReceiver: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const provider = ethers.provider
  const from = await provider.getSigner().getAddress()

  const ret = await hre.deployments.deploy(
    'PositionRouterCallbackReceiver', {
      from,
      args: [],
      gasLimit: 2e6,
      deterministicDeployment: true
    })
  console.log('==PositionRouterCallbackReceiver addr=', ret.address)
  console.log('gas', ret.receipt?.cumulativeGasUsed)
}

export default deployPositionRouterCallbackReceiver
