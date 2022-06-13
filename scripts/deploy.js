const hre = require("hardhat"); //import the hardhat

async function main() {
    const [deployer] = await ethers.getSigners(); //get the account to deploy the contract

    console.log("Deploying contracts with the account:", deployer.address);

    const Borrow = await hre.ethers.getContractFactory("Borrow"); // Getting the Contract
    let contract = await Borrow.deploy(); //deploying the contract
    console.log("Borrow Contract deployed to:", contract.address);

    const Deposit = await hre.ethers.getContractFactory("Deposit"); // Getting the Contract
    contract = await Deposit.deploy(); //deploying the contract
    console.log("Deposit Contract deployed to:", contract.address);

    const Comptroller = await hre.ethers.getContractFactory("Unitroller");
    const ComptrollerContract = await Comptroller.deploy();
    console.log("Comptroller address:", ComptrollerContract.address);

    const WhitePaperInterestRateModel = await hre.ethers.getContractFactory("WhitePaperInterestRateModel");
    const WhitePaperInterestRateModelContract = await WhitePaperInterestRateModel.deploy("20000000000000000", "100000000000000000");//baseRatePerYear, multiplierPerYear
    console.log("InterestRateModel address:", WhitePaperInterestRateModelContract.address);


    //implementation address
    const CErc20Delegate = await hre.ethers.getContractFactory("CErc20Delegate");
    const CErc20DelegateContract = await CErc20Delegate.deploy();
    console.log("Implementation address", CErc20DelegateContract.address);

    const addr = CErc20DelegateContract.address;

    const CBnb = await hre.ethers.getContractFactory("CBNB");
    const CBnbContract = await CBnb.deploy(
        ComptrollerContract.address,
        WhitePaperInterestRateModelContract.address,
        "200000000000000000000000000",
        "CompoundBnb",
        "cBNB",
        "8",
        deployer.address
    );
    console.log("CBNB address:", CBnbContract.address);

    //testnet addresses
    const underlyingAddresses = {
        USDT: "0x377533D0E68A22CF180205e9c9ed980f74bc5050",
        USDC: "0x64544969ed7EBf5f083679233325356EbE738930",
        BUSD: "0xF62428599bD9dE9c57bBA020E35A3097678b2754",
        LTA: "0xB39EB294ce2F0177045A8A6c40641DbBc584e5C8",
    };

    // add token address of bsc testnet in underlyingAddresses such as shib, doge, eth ..., put weth address instead of eth on bsc

    let CErc20Delegator = await hre.ethers.getContractFactory("CErc20Delegator");
    let CErc20DelegatorContract = await CErc20Delegator.deploy(
        underlyingAddresses.USDT,
        ComptrollerContract.address,
        WhitePaperInterestRateModelContract.address,
        "200000000000000000000000000",
        "CompoundUSDT",
        "cUSDT",
        "8",
        deployer.address,
        addr,
        "0x00"
    );
    console.log("cUSDT address", CErc20DelegatorContract.address);
    const cUSDTAddress = CErc20DelegateContract.address;

    CErc20Delegator = await hre.ethers.getContractFactory("CErc20Delegator");
    CErc20DelegatorContract = await CErc20Delegator.deploy(
        underlyingAddresses.USDC,
        ComptrollerContract.address,
        WhitePaperInterestRateModelContract.address,
        "200000000000000000000000000",
        "CompoundUSDC",
        "cUSDC",
        "8",
        deployer.address,
        addr,
        "0x00"
    );
    console.log("cUSDC address", CErc20DelegatorContract.address);
    const cUSDCAddress = CErc20DelegateContract.address;

    CErc20Delegator = await hre.ethers.getContractFactory("CErc20Delegator");
    CErc20DelegatorContract = await CErc20Delegator.deploy(
        underlyingAddresses.BUSD,
        ComptrollerContract.address,
        WhitePaperInterestRateModelContract.address,
        "200000000000000000000000000",
        "CompoundBUSD",
        "cBUSD",
        "8",
        deployer.address,
        addr,
        "0x00"
    );
    console.log("cBUSD address", CErc20DelegatorContract.address);
    const cBUSDAddress = CErc20DelegateContract.address;

    CErc20Delegator = await hre.ethers.getContractFactory("CErc20Delegator");
    CErc20DelegatorContract = await CErc20Delegator.deploy(
        underlyingAddresses.LTA,
        ComptrollerContract.address,
        WhitePaperInterestRateModelContract.address,
        "200000000000000000000000000",
        "CompoundLTA",
        "cLTA",
        "8",
        deployer.address,
        addr,
        "0x00"
    );
    console.log("cLTA address", CErc20DelegatorContract.address);
    //const cLTAAddress = CErc20DelegateContract.address;

    const Comp = await hre.ethers.getContractFactory("Comp");
    const CompContract = await Comp.deploy(deployer.address);
    console.log("Comp address:", CompContract.address);

    const Timelock = await hre.ethers.getContractFactory("Timelock");
    const TimelockContract = await Timelock.deploy(deployer.address, "60");
    console.log("Timelock address:", TimelockContract.address);

    const GovernanceBravoDelegator = await hre.ethers.getContractFactory("GovernorBravoDelegator");
    const GovernorBravoDelegatorContract = await GovernanceBravoDelegator.deploy(
        TimelockContract.address,
        CompContract.address,
        deployer.address,
        addr,
        "17280",
        "1",
        "100000000000000000000000"
    );
    console.log("Governance address:", GovernorBravoDelegatorContract.address);

    LockDrop = await hre.ethers.getContractFactory("LockDrop");
    LockDropContract = await LockDrop.deploy(
        cUSDTAddress
    );
    console.log("cUSDT Lockdrop address:", LockDropContract.address);

    //LockDrop = await hre.ethers.getContractFactory("LockDrop");
    LockDropContract = await LockDrop.deploy(
        cUSDCAddress
    );
    console.log("cUSDC Lockdrop address:", LockDropContract.address);

    //LockDrop = await hre.ethers.getContractFactory("LockDrop");
    LockDropContract = await LockDrop.deploy(
        cBUSDAddress
    );
    console.log("cBUSD Lockdrop address:", LockDropContract.address);

}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); // Calling the function to deploy the contract 