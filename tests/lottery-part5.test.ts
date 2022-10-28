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

  describe('Players can burn ERC20 tokens and redeem ETH', () => {
    it('validate one lottery lifecycle run and burn lottery tokens to ETH in player wallets', async () => {
      const [
        deployer,
        playerA,
        playerB,
        playerC,
        playerD,
      ] = await ethers.getSigners()

      lotteryStartEpochInSeconds = currentEpoch()

      const lotteryEndEpochInSeconds =
        lotteryStartEpochInSeconds + LOTTERY_DURATION_IN_SECONDS

      // https://ethereum.stackexchange.com/a/112809
      const newTimestampInSeconds =
        lotteryStartEpochInSeconds + LOTTERY_DURATION_IN_SECONDS * 2

      await lotteryContract
        .connect(playerA)
        .sellLotteryTokens({ value: ethers.utils.parseEther('10') })

      await lotteryTokenContract
        .connect(playerA)
        .approve(
          lotteryContract.address,
          await lotteryTokenContract.balanceOf(playerA.address),
        )

      await lotteryContract
        .connect(playerB)
        .sellLotteryTokens({ value: ethers.utils.parseEther('15') })

      await lotteryTokenContract
        .connect(playerB)
        .approve(
          lotteryContract.address,
          await lotteryTokenContract.balanceOf(playerB.address),
        )

      await lotteryContract
        .connect(playerC)
        .sellLotteryTokens({ value: ethers.utils.parseEther('20') })
      await lotteryTokenContract
        .connect(playerC)
        .approve(
          lotteryContract.address,
          await lotteryTokenContract.balanceOf(playerC.address),
        )

      await lotteryContract
        .connect(playerD)
        .sellLotteryTokens({ value: ethers.utils.parseEther('25') })

      await lotteryTokenContract
        .connect(playerD)
        .approve(
          lotteryContract.address,
          await lotteryTokenContract.balanceOf(playerD.address),
        )

      const playerAddresses = [
        playerA.address,
        playerB.address,
        playerC.address,
        playerD.address,
      ]

      await lotteryContract.startLottery(
        lotteryEndEpochInSeconds,
        BASE_WINNING_FEE_DEPLOY_FRIENDLY_FORMAT,
      )

      await lotteryContract.connect(playerA).bet()
      await lotteryContract.connect(playerB).bet()
      await lotteryContract.connect(playerC).bet()
      await lotteryContract.connect(playerA).bet()
      await lotteryContract.connect(playerD).bet()
      await lotteryContract.connect(playerC).bet()
      await lotteryContract.connect(playerB).bet()

      await ethers.provider.send('evm_mine', [newTimestampInSeconds])

      await lotteryContract.connect(deployer).endLottery()

      const winnerAddress = await lotteryContract.latestLotteryWinner()
      const winningAccount = await ethers.getSigner(winnerAddress)
      const winnerAccountBalanceLotteryBeforeLotteryTokenBurn = await winningAccount.getBalance()

      const unclaimedWinningAmount = await lotteryContract.winningStash(
        winnerAddress,
      )

      const [
        winningAmountAfterFeeDeduction,
        calculatedWinningFee,
      ] = calculateWinningFee(unclaimedWinningAmount)

      const winnerTokenBalanceBeforeClaim = await lotteryTokenContract.balanceOf(
        winnerAddress,
      )
      await lotteryContract
        .connect(winningAccount)
        .withdrawWinning(winningAmountAfterFeeDeduction, calculatedWinningFee)

      const winnerTokenBalanceAfterClaim = await lotteryTokenContract.balanceOf(
        winnerAddress,
      )

      expect(winnerTokenBalanceAfterClaim.gt(winnerTokenBalanceBeforeClaim)).to
        .be.true

      const amountToBurn = winnerTokenBalanceAfterClaim

      await lotteryContract
        .connect(winningAccount)
        .trackLatestBurn(amountToBurn)

      await lotteryTokenContract.connect(winningAccount).burn(amountToBurn)

      await lotteryContract.connect(winningAccount).withdrawLastBurnToEther()

      const winnerAccountBalanceLotteryAfterLotteryTokenBurn = await winningAccount.getBalance()

      expect(
        winnerAccountBalanceLotteryAfterLotteryTokenBurn.gt(
          winnerAccountBalanceLotteryBeforeLotteryTokenBurn,
        ),
      ).to.be.true
    })
  })
})
