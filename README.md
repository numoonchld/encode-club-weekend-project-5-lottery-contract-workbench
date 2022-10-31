# local node and deploy scripts

- open two terminals
- in the first, run: `npx hardhat node`
  - to get the local ethereum node started
- in the second, run: `npx hardhat run --network localhost scripts/deploy/localHardhatNode.ts`

  - this is the deploy script for the lottery and its token contracts

- note the address of these contracts
  - and add it to the `contracts.json` file on the frontend repo

## goerli deployment with hardhat

- update `hardhat.config.ts`

  - with node API key (Alchemy for instance) and
  - deploying account's private key

  ```javascript
  import dotenv from "dotenv";
  dotenv.config();

  const config: HardhatUserConfig = {
    networks: {
      goerli: {
        url: `https://eth-goerli.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
        accounts: [`${process.env.GOERLI_PRIVATE_KEY}`],
      },
    },
    solidity: {
      version: "0.8.17",
      settings: {
        optimizer: {
          enabled: true,
          runs: 4000,
        },
      },
    },
    paths: { tests: "tests" },
  };
  ```

- update `.dotenv` with these fields

  ```
  ALCHEMY_API_KEY=""
  GOERLI_PRIVATE_KEY=""
  ```

- setup the deploy script with `hardhat` variant of `ethers`

  - example:

    ```javascript
    import { ethers as hardhatEthers } from "hardhat";
    import { ethers } from "ethers";

    async function main() {
      console.log("Deploying Lottery contract --------------------------\n");

      const BET_PRICE = ethers.utils.parseEther("0.5");
      const BET_FEE = ethers.utils.parseEther("0.01");

      const lotteryContractFactory = await hardhatEthers.getContractFactory(
        "Lottery"
      );
      const lotteryContract = await lotteryContractFactory.deploy(
        BET_PRICE,
        BET_FEE,
        "G11 Lottery Token",
        "G11LT"
      );

      await lotteryContract.deployed();

      console.log("LOTTERY CONTRACT ADDRESS: -------------------");
      console.log(lotteryContract.address);

      const lotteryTokenAddress = await lotteryContract.lotteryTxnToken();

      const lotteryTokenContractFactory =
        await hardhatEthers.getContractFactory("LotteryToken");

      lotteryTokenContractFactory.attach(lotteryTokenAddress);

      console.log("LOTTERY TOKEN CONTRACT ADDRESS: -------------------");
      console.log(lotteryTokenAddress);
    }

    main().catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
    ```

- in the CLI, at project root, run:
  ```bash
  npx hardhat run --network goerli scripts/deploy/deployGoerliViaHardhat.ts
  ```
