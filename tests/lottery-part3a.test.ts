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

  describe('Winner receives the pooled ERC20 minus fee', () => {
    /* 
    although Solidity is turing complete, 
    it currently doesn't have capacity to facilities simple-to-implement division
    https://blog.b9lab.com/the-joy-of-minimalism-in-smart-contract-design-2303010c8b09
    */

    it('returns zero address if no players', async () => {
      const [deployer] = await ethers.getSigners()

      lotteryStartEpochInSeconds = currentEpoch()

      const lotteryEndEpochInSeconds =
        lotteryStartEpochInSeconds + LOTTERY_DURATION_IN_SECONDS

      // https://ethereum.stackexchange.com/a/112809
      const newTimestampInSeconds =
        lotteryStartEpochInSeconds + LOTTERY_DURATION_IN_SECONDS * 2

      await lotteryContract.startLottery(
        lotteryEndEpochInSeconds,
        BASE_WINNING_FEE_DEPLOY_FRIENDLY_FORMAT,
      )

      await ethers.provider.send('evm_mine', [newTimestampInSeconds])

      await lotteryContract.connect(deployer).endLottery()

      expect(await lotteryContract.latestLotteryWinner()).to.eq(
        ethers.constants.AddressZero,
      )
    })
  })
})
