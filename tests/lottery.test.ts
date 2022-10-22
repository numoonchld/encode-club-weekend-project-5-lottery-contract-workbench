import { Lottery } from '../typechain-types'
import { ethers } from 'hardhat'
import { expect } from 'chai'
import { BigNumber, ethers } from 'ethers'

describe('Lottery', () => {
  let lotteryContract: Lottery
  let BET_PRICE: BigNumber
  let BET_FEE: BigNumber

  before(async () => {
    BET_PRICE = ethers.utils.parseEther('0.5')
    BET_FEE = ethers.utils.parseEther('0.01')

    const lotteryContractFactory = await ethers.getContractFactory('Lottery')
    lotteryContract = await lotteryContractFactory.deploy(BET_PRICE, BET_FEE)
    await lotteryContract.deployed()
  })

  describe('Owner start lottery and define betting duration and fee', () => {
    it('check owner, betPrice and betFee', async () => {
      const [deployer] = await ethers.getSigners()

      expect(await lotteryContract.owner()).to.eq(deployer.address)
      expect(await lotteryContract.betPrice()).to.eq(BET_PRICE)
      expect(await lotteryContract.betFee()).to.eq(BET_FEE)
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

  describe('Players must buy an ERC20 with ETH', () => {})
  describe('Players pay ERC20 to bet, Only possible before block timestamp met', () => {})
  describe('Anyone can roll the lottery, Only after block timestamp target is met', () => {})
  describe('Winner receives the pooled ERC20 minus fee', () => {})
  describe('Owner can withdraw fees and restart lottery', () => {})
  describe('Players can burn ERC20 tokens and redeem ETH', () => {})
})
