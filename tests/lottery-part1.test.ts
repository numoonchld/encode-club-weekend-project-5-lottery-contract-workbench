/* NOTE: 
- splitting up files to keep only one evm_mine in each file
- if some test fails, then run it by itself, do not run the test by file or the whole describe block
- evm_mine only takes the test blockchain forward in time and cannot be taken back in time
- Running all tests at once in the same file (in CLI or Mocha Test Explorer) will fail tests involving `evm_mine`
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

  describe('Owner start lottery and define betting duration and fee', () => {
    it('validate owner, betPrice and betFee', async () => {
      const [deployer] = await ethers.getSigners()

      expect(await lotteryContract.owner()).to.eq(deployer.address)
      expect(await lotteryContract.betPrice()).to.eq(
        BET_PRICE_DEPLOY_FRIENDLY_FORMAT,
      )
      expect(await lotteryContract.betFee()).to.eq(
        BET_FEE_DEPLOY_FRIENDLY_FORMAT,
      )
    })

    it('Reverts when closing time is in the past', async () => {
      const currentEpochInSeconds = Math.floor(new Date().getTime() / 1000.0)
      const closingEpochInSeconds = currentEpochInSeconds - 3 * 60

      expect(await lotteryContract.lotteryOpen()).to.be.false

      await expect(
        lotteryContract.startLottery(
          closingEpochInSeconds,
          BASE_WINNING_FEE_DEPLOY_FRIENDLY_FORMAT,
        ),
      ).to.be.revertedWith('Lottery: Closing time must be in the future!')
    })

    it('Define a block timestamp target (for closing lottery bets), upon lottery start by Owner', async () => {
      const currentEpochInSeconds = Math.floor(new Date().getTime() / 1000.0)
      const closingEpochInSeconds = currentEpochInSeconds + 3 * 60

      expect(await lotteryContract.lotteryOpen()).to.be.false

      await lotteryContract.startLottery(
        closingEpochInSeconds,
        BASE_WINNING_FEE_DEPLOY_FRIENDLY_FORMAT,
      )

      expect(await lotteryContract.lotteryClosingEpochInSeconds()).to.eq(
        closingEpochInSeconds,
      )
      expect(await lotteryContract.lotteryOpen()).to.be.true
    })
  })

  describe('Players must buy ERC20 with ETH', () => {
    it('validates players buying lottery token', async () => {
      const [, playerA] = await ethers.getSigners()

      expect(await ethers.provider.getBalance(lotteryContract.address)).to.eq(
        ethers.utils.parseEther('0'),
      )

      await lotteryContract
        .connect(playerA)
        .sellLotteryTokens({ value: ethers.utils.parseEther('10') })

      expect(await lotteryTokenContract.balanceOf(playerA.address)).to.eq(
        ethers.utils.parseEther('10'),
      )

      expect(await ethers.provider.getBalance(lotteryContract.address)).to.eq(
        ethers.utils.parseEther('10'),
      )
    })
  })

  describe('Players pay ERC20 to bet, Only possible before block timestamp met', () => {
    it('reverts bet if lottery is not open yet', async () => {
      const [, playerA] = await ethers.getSigners()

      expect(await lotteryContract.currentLotteryPayoutPool()).to.eq(
        ethers.utils.parseEther('0'),
      )

      expect(await lotteryContract.feeCollection()).to.eq(
        ethers.utils.parseEther('0'),
      )

      await lotteryContract
        .connect(playerA)
        .sellLotteryTokens({ value: ethers.utils.parseEther('10') })

      expect(await lotteryTokenContract.balanceOf(playerA.address)).to.eq(
        ethers.utils.parseEther('10'),
      )

      await lotteryTokenContract
        .connect(playerA)
        .approve(
          lotteryContract.address,
          await lotteryTokenContract.balanceOf(playerA.address),
        )

      await expect(lotteryContract.connect(playerA).bet()).to.be.revertedWith(
        'Lottery: Not yet open for bets!',
      )
    })

    it('validates lottery bets placed by participants', async () => {
      const [, playerA] = await ethers.getSigners()

      expect(await lotteryContract.currentLotteryPayoutPool()).to.eq(
        ethers.utils.parseEther('0'),
      )

      expect(await lotteryContract.feeCollection()).to.eq(
        ethers.utils.parseEther('0'),
      )

      await lotteryContract
        .connect(playerA)
        .sellLotteryTokens({ value: ethers.utils.parseEther('10') })

      expect(await lotteryTokenContract.balanceOf(playerA.address)).to.eq(
        ethers.utils.parseEther('10'),
      )

      await lotteryTokenContract
        .connect(playerA)
        .approve(
          lotteryContract.address,
          await lotteryTokenContract.balanceOf(playerA.address),
        )

      lotteryStartEpochInSeconds = currentEpoch()
      const lotteryEndEpochInSeconds =
        lotteryStartEpochInSeconds + LOTTERY_DURATION_IN_SECONDS
      await lotteryContract.startLottery(
        lotteryEndEpochInSeconds,
        BASE_WINNING_FEE_DEPLOY_FRIENDLY_FORMAT,
      )

      await lotteryContract.connect(playerA).bet()

      expect(await lotteryContract.currentLotteryPayoutPool()).to.eq(
        BET_PRICE_DEPLOY_FRIENDLY_FORMAT,
      )

      expect(await lotteryContract.feeCollection()).to.eq(
        BET_FEE_DEPLOY_FRIENDLY_FORMAT,
      )

      expect(
        await lotteryTokenContract.balanceOf(lotteryContract.address),
      ).to.eq(
        BET_PRICE_DEPLOY_FRIENDLY_FORMAT.add(BET_FEE_DEPLOY_FRIENDLY_FORMAT),
      )
    })

    it('betting blocked after time window ends', async () => {
      lotteryStartEpochInSeconds = currentEpoch()

      const lotteryEndEpochInSeconds =
        lotteryStartEpochInSeconds + LOTTERY_DURATION_IN_SECONDS

      // https://ethereum.stackexchange.com/a/112809
      const newTimestampInSeconds =
        lotteryStartEpochInSeconds + LOTTERY_DURATION_IN_SECONDS * 2

      const [, , playerB] = await ethers.getSigners()

      await lotteryContract
        .connect(playerB)
        .sellLotteryTokens({ value: ethers.utils.parseEther('10') })

      expect(await lotteryTokenContract.balanceOf(playerB.address)).to.eq(
        ethers.utils.parseEther('10'),
      )

      await lotteryTokenContract
        .connect(playerB)
        .approve(
          lotteryContract.address,
          await lotteryTokenContract.balanceOf(playerB.address),
        )

      await lotteryContract.startLottery(
        lotteryEndEpochInSeconds,
        BASE_WINNING_FEE_DEPLOY_FRIENDLY_FORMAT,
      )
      await ethers.provider.send('evm_mine', [newTimestampInSeconds])

      await expect(lotteryContract.connect(playerB).bet()).to.be.revertedWith(
        'Lottery: Betting window closed!',
      )
    })

    it('does not allow owner betting', async () => {
      const [owner] = await ethers.getSigners()

      await lotteryContract
        .connect(owner)
        .sellLotteryTokens({ value: ethers.utils.parseEther('10') })

      expect(await lotteryTokenContract.balanceOf(owner.address)).to.eq(
        ethers.utils.parseEther('10'),
      )

      await lotteryTokenContract
        .connect(owner)
        .approve(
          lotteryContract.address,
          await lotteryTokenContract.balanceOf(owner.address),
        )

      lotteryStartEpochInSeconds = currentEpoch()
      const lotteryEndEpochInSeconds =
        lotteryStartEpochInSeconds + LOTTERY_DURATION_IN_SECONDS
      await lotteryContract.startLottery(
        lotteryEndEpochInSeconds,
        BASE_WINNING_FEE_DEPLOY_FRIENDLY_FORMAT,
      )

      await expect(lotteryContract.connect(owner).bet()).to.have.revertedWith(
        'Lottery: Owner not allowed to bet!',
      )
    })
  })
})
