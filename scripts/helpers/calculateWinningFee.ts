import { ethers } from 'ethers'

export default (winningAmount: ethers.BigNumber): ethers.BigNumber[] => [
  winningAmount.sub(winningAmount.div(30)),
  winningAmount.div(30),
]
