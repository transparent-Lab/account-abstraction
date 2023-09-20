import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { ethers } from 'hardhat'

const deploySwapLogReceiver: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const provider = ethers.provider
  const from = await provider.getSigner().getAddress()
  console.log('==addr=', from)
  const ret = await hre.deployments.deploy(
    'SwapLogReceiver', {
      from,
      args: [],
      gasLimit: 2e6,
      deterministicDeployment: true
    })
  console.log('==SwapLogReceiver addr=', ret.address)
  console.log('gas', ret.receipt?.cumulativeGasUsed)
}

export default deploySwapLogReceiver
