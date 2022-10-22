import { Lottery } from '../typechain-types'
import { ethers } from 'hardhat'

describe('Lottery', () => {
  let lotteryContract: Lottery

  beforeEach(async () => {
    const BET_PRICE = ethers.utils.parseEther('0.5')
    const BET_FEE = ethers.utils.parseEther('0.01')

    const lotteryContractFactory = await ethers.getContractFactory('Lottery')
    lotteryContract = await lotteryContractFactory.deploy(BET_PRICE, BET_FEE)
    await lotteryContract.deployed()
  })

  describe('Owner start lottery and define betting duration and fee', () => {
    it('Define a block timestamp target', async () => {})
  })

  describe('Players must buy an ERC20 with ETH')
  describe('Players pay ERC20 to bet, Only possible before block timestamp met')
  describe(
    'Anyone can roll the lottery, Only after block timestamp target is met',
  )
  describe('Winner receives the pooled ERC20 minus fee')
  describe('Owner can withdraw fees and restart lottery')
  describe('Players can burn ERC20 tokens and redeem ETH')
})
