/* NOTE: 
- Run all tests one at a time in Mocha Test Explorer
- Running all tests at once (in CLI or Mocha Test Explorer) will fail tests involving `evm_mine`
*/

import { Lottery } from '../typechain-types'
import { LotteryToken } from '../typechain-types'
import { ethers } from 'hardhat'
import { expect } from 'chai'
import { BigNumber } from 'ethers'
import currentEpoch from '../scripts/helpers/currentEpoch'
import calculateWinningFee from '../scripts/helpers/calculateWinningFee'

describe('Lottery', () => {
  let lotteryContract: Lottery
  let lotteryTokenContract: LotteryToken

  let BET_PRICE: Number
  let BET_FEE: Number

  let BET_PRICE_DEPLOY_FRIENDLY_FORMAT: BigNumber
  let BET_FEE_DEPLOY_FRIENDLY_FORMAT: BigNumber

  const LOTTERY_DURATION_IN_SECONDS = 180
  let lotteryStartEpochInSeconds: number

  const BASE_WINNING_FEE_DEPLOY_FRIENDLY_FORMAT = ethers.utils.parseEther(
    '0.05',
  )

  beforeEach(async () => {
    // ether values in string type
    // BET_PRICE = ethers.utils.parseEther('0.5')
    // BET_FEE = ethers.utils.parseEther('0.01')

    // ether value in Number type
    BET_PRICE = 0.5
    BET_FEE = 0.01
    BET_PRICE_DEPLOY_FRIENDLY_FORMAT = ethers.utils.parseEther(
      BET_PRICE.toFixed(18),
    )
    BET_FEE_DEPLOY_FRIENDLY_FORMAT = ethers.utils.parseEther(
      BET_FEE.toFixed(18),
    )

    const lotteryContractFactory = await ethers.getContractFactory('Lottery')
    lotteryContract = await lotteryContractFactory.deploy(
      BET_PRICE_DEPLOY_FRIENDLY_FORMAT,
      BET_FEE_DEPLOY_FRIENDLY_FORMAT,
      'Lottery Token',
      'LT',
    )
    await lotteryContract.deployed()

    const lotteryTokenAddress = await lotteryContract.lotteryTxnToken()

    const lotteryTokenContractFactory = await ethers.getContractFactory(
      'LotteryToken',
    )

    lotteryTokenContract = lotteryTokenContractFactory.attach(
      lotteryTokenAddress,
    )
  })

  describe('Owner can withdraw fees and restart lottery', () => {})
})
