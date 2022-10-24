# local node and deploy scripts

- open two terminals
- in the first, run: `npx hardhat node`
  - to get the local ethereum node started
- in the second, run: `npx hardhat run --network localhost scripts/deploy/localHardhatNode.ts`

  - this is the deploy script for the lottery and its token contracts

- note the address of these contracts
  - and add it to the `contracts.json` file on the frontend repo
