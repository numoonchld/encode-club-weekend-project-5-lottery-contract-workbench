import { Lottery } from '../typechain-types'
import { LotteryToken } from '../typechain-types'
import { ethers } from 'hardhat'
import { expect } from 'chai'
import { BigNumber } from 'ethers'

describe('Lottery', () => {
  let lotteryContract: Lottery
  let lotteryTokenContract: LotteryToken

  let BET_PRICE: Number
  let BET_FEE: Number

  let BET_PRICE_DEPLOY_FRIENDLY_FORMAT: BigNumber
  let BET_FEE_DEPLOY_FRIENDLY_FORMAT: BigNumber

  before(async () => {
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
        lotteryContract.startLottery(closingEpochInSeconds),
      ).to.be.revertedWith('Lottery: Closing time must be in the future')
    })

    it('Define a block timestamp target (for closing lottery bets), upon lottery start by Owner', async () => {
      const currentEpochInSeconds = Math.floor(new Date().getTime() / 1000.0)
      const closingEpochInSeconds = currentEpochInSeconds + 3 * 60

      expect(await lotteryContract.lotteryOpen()).to.be.false

      await lotteryContract.startLottery(closingEpochInSeconds)

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
        .sellLotteryTokens({ value: ethers.utils.parseEther('1') })

      expect(await lotteryTokenContract.balanceOf(playerA.address)).to.eq(
        ethers.utils.parseEther('1'),
      )

      expect(await ethers.provider.getBalance(lotteryContract.address)).to.eq(
        ethers.utils.parseEther('1'),
      )
    })
  })
  describe('Players pay ERC20 to bet, Only possible before block timestamp met', () => {})
  describe('Anyone can roll the lottery, Only after block timestamp target is met', () => {})
  describe('Winner receives the pooled ERC20 minus fee', () => {})
  describe('Owner can withdraw fees and restart lottery', () => {})
  describe('Players can burn ERC20 tokens and redeem ETH', () => {})
})
