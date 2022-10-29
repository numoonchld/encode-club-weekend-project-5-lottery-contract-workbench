import { ethers as hardhatEthers } from 'hardhat'
import { ethers } from 'ethers'

async function main() {
  console.log('Deploying Lottery contract --------------------------\n')

  const BET_PRICE = ethers.utils.parseEther('0.5')
  const BET_FEE = ethers.utils.parseEther('0.01')

  const lotteryContractFactory = await hardhatEthers.getContractFactory(
    'Lottery',
  )
  const lotteryContract = await lotteryContractFactory.deploy(
    BET_PRICE,
    BET_FEE,
    'G11 Lottery Token',
    'G11LT',
  )

  await lotteryContract.deployed()

  console.log('LOTTERY CONTRACT ADDRESS: -------------------')
  console.log(lotteryContract.address)

  const lotteryTokenAddress = await lotteryContract.lotteryTxnToken()

  const lotteryTokenContractFactory = await hardhatEthers.getContractFactory(
    'LotteryToken',
  )

  lotteryTokenContractFactory.attach(lotteryTokenAddress)

  console.log('LOTTERY TOKEN CONTRACT ADDRESS: -------------------')
  console.log(lotteryTokenAddress)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
