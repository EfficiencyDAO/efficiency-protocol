// test/Rematic.proxy.js
// Load dependencies
const { expect } = require("chai");
const { BigNumber } = require("ethers");

let LockdropContract;
let Lockdrop;

let Borrow;
let BorrowContract;

let Deposit;
let DepositContract;

let Comptroller;
let ComptrollerContract;

let WhitePaperInterestRateModel;
let WhitePaperInterestRateModelContract;

let CErc20Delegate;
let CErc20DelegateContract;

let CBnb;
let CBnbContract;

let CErc20Delegator;
let CErc20DelegatorContract;

let cUSDTAddress;
let cUSDCAddress;
let cBUSDAddress;

let Efficiency;
let EfficiencyContract;

let Timelock;
let TimelockContract; 

let owner;
let addr1;
let addr2;

const underlyingAddresses = {
  USDT: "0x377533D0E68A22CF180205e9c9ed980f74bc5050",
  USDC: "0x64544969ed7EBf5f083679233325356EbE738930",
  BUSD: "0xF62428599bD9dE9c57bBA020E35A3097678b2754",
  LTA: "0xB39EB294ce2F0177045A8A6c40641DbBc584e5C8",
};

const toBigNumberArray = (arr) => {
  const newArr = [];
  arr.map((item) => {
    newArr.push(BigNumber.from(item));
  })
  return newArr;
}

const delay = ms => new Promise(res => setTimeout(res, ms));

// Start test block
describe("Lockdrop", function () {
  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    Borrow = await ethers.getContractFactory("Borrow"); // Getting the Contract
    BorrowContract = await Borrow.deploy(); //deploying the contract
    console.log("Borrow Contract deployed to:", BorrowContract.address);

    Deposit = await ethers.getContractFactory("Deposit"); // Getting the Contract
    DepositContract = await Deposit.deploy(); //deploying the contract
    console.log("Deposit Contract deployed to:", DepositContract.address);

    Comptroller = await ethers.getContractFactory("Unitroller");
    ComptrollerContract = await Comptroller.deploy();
    console.log("Comptroller address:", ComptrollerContract.address);

    WhitePaperInterestRateModel = await ethers.getContractFactory("WhitePaperInterestRateModel");
    WhitePaperInterestRateModelContract = await WhitePaperInterestRateModel.deploy("20000000000000000", "100000000000000000");//baseRatePerYear, multiplierPerYear
    console.log("InterestRateModel address:", WhitePaperInterestRateModelContract.address);

    CErc20Delegate = await ethers.getContractFactory("CErc20Delegate");
    CErc20DelegateContract = await CErc20Delegate.deploy();
    console.log("Implementation address", CErc20DelegateContract.address);

    const addr = CErc20DelegateContract.address;

    CBnb = await ethers.getContractFactory("CBNB");
    CBnbContract = await CBnb.deploy(
        ComptrollerContract.address,
        WhitePaperInterestRateModelContract.address,
        "200000000000000000000000000",
        "CompoundBnb",
        "cBNB",
        "8",
        owner.address
    );
    console.log("CBNB address:", CBnbContract.address);

    CErc20Delegator = await ethers.getContractFactory("CErc20Delegator");
    CErc20DelegatorContract = await CErc20Delegator.deploy(
        underlyingAddresses.USDT,
        ComptrollerContract.address,
        WhitePaperInterestRateModelContract.address,
        "200000000000000000000000000",
        "CompoundUSDT",
        "cUSDT",
        "8",
        owner.address,
        addr,
        "0x00"
    );
    console.log("cUSDT address", CErc20DelegatorContract.address);
    cUSDTAddress = CErc20DelegateContract.address;

    CErc20Delegator = await ethers.getContractFactory("CErc20Delegator");
    CErc20DelegatorContract = await CErc20Delegator.deploy(
        underlyingAddresses.USDC,
        ComptrollerContract.address,
        WhitePaperInterestRateModelContract.address,
        "200000000000000000000000000",
        "CompoundUSDC",
        "cUSDC",
        "8",
        owner.address,
        addr,
        "0x00"
    );
    console.log("cUSDC address", CErc20DelegatorContract.address);
    cUSDCAddress = CErc20DelegateContract.address;

    CErc20Delegator = await ethers.getContractFactory("CErc20Delegator");
    CErc20DelegatorContract = await CErc20Delegator.deploy(
        underlyingAddresses.BUSD,
        ComptrollerContract.address,
        WhitePaperInterestRateModelContract.address,
        "200000000000000000000000000",
        "CompoundBUSD",
        "cBUSD",
        "8",
        owner.address,
        addr,
        "0x00"
    );
    console.log("cBUSD address", CErc20DelegatorContract.address);
    cBUSDAddress = CErc20DelegateContract.address;

    CErc20Delegator = await ethers.getContractFactory("CErc20Delegator");
    CErc20DelegatorContract = await CErc20Delegator.deploy(
        underlyingAddresses.LTA,
        ComptrollerContract.address,
        WhitePaperInterestRateModelContract.address,
        "200000000000000000000000000",
        "CompoundLTA",
        "cLTA",
        "8",
        owner.address,
        addr,
        "0x00"
    );
    console.log("cLTA address", CErc20DelegatorContract.address);
    //const cLTAAddress = CErc20DelegateContract.address;

    Efficiency = await ethers.getContractFactory("Efficiency");
    EfficiencyContract = await Efficiency.deploy(owner.address);
    console.log("Efficiency address:", EfficiencyContract.address);

    Timelock = await ethers.getContractFactory("Timelock");
    TimelockContract = await Timelock.deploy(owner.address, "60");
    console.log("Timelock address:", TimelockContract.address);

    GovernanceBravoDelegator = await ethers.getContractFactory("GovernorBravoDelegator");
    GovernorBravoDelegatorContract = await GovernanceBravoDelegator.deploy(
        TimelockContract.address,
        EfficiencyContract.address,
        owner.address,
        addr,
        "17280",
        "1",
        "100000000000000000000000"
    );
    console.log("Governance address:", GovernorBravoDelegatorContract.address);


    Lockdrop = await ethers.getContractFactory("LockDrop");
    LockdropContract = await Lockdrop.deploy(EfficiencyContract.address);
  });

  // Test case
  it("Basic Token Contract works correctly.", async function () {
    console.log("balance of the user: ",await EfficiencyContract.connect(owner).balanceOf(owner.address))
    await EfficiencyContract.connect(owner).approve(LockdropContract.address, BigNumber.from("10000000000000000000000000000"))
    await LockdropContract.connect(owner).deposit(0, BigNumber.from("1000000000000"))
    await LockdropContract.connect(owner).deposit(0, BigNumber.from("10000000000000"))
    await LockdropContract.connect(owner).deposit(0, BigNumber.from("10000000000000000000000"))
    expect(await LockdropContract.getBalance()).to.deep.equal(BigNumber.from("10000000011000000000000"));
    console.log(await LockdropContract.getBalance());
    console.log("start reward....")
    for(let i = 0; i < 11; i++) {
      await LockdropContract.depositFunds(10);
      await delay(1000);
      if(i % 10 !== 0) continue;
      const reward = await LockdropContract.connect(owner).getClaimableReward(0, 1, owner.address);
      const totalReward = await LockdropContract.connect(owner).getAllClaimableRewardOfTimeLock(0, owner.address);
      console.log(`${(i+1)} seconds: you can claim`, reward.toString())
      console.log(`\ntotal reward after ${(i+1)} seconds: you can claim`, totalReward.toString())
    }
  });
});
