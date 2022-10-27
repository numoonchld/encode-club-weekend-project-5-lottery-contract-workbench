import { ethers } from 'ethers'

export default (winningAmount: ethers.BigNumber): ethers.BigNumber[] => {
  const feePercentage = 30
  return [
    winningAmount.mul(ethers.BigNumber.from(100 - feePercentage)),
    winningAmount.mul(ethers.BigNumber.from(feePercentage)),
  ]
}
