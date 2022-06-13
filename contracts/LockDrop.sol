// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";


contract LockDrop is Ownable, ReentrancyGuard {
    using SafeMath for uint256;
    using Address for address;
    using SafeERC20 for IERC20;
    using EnumerableSet for EnumerableSet.UintSet;
    using EnumerableSet for EnumerableSet.AddressSet;

    struct StakeStruct {
        uint256 amount;
        uint256 depositAt; // deposit timestamp
    }

    struct StakeUser {
        address investor;
        EnumerableSet.UintSet itemIds;
        uint256 maxId;
        mapping(uint256 => StakeStruct) stakeItems;
        uint256 amount;
    }

    struct TimeLock {
        uint256 period;
        uint256 apr;
    }

    struct TimeLockStake {
        EnumerableSet.AddressSet investors;
        mapping(address => StakeUser) stakes;
        uint256 amount;
    }

    uint256 public percentRate = 10000;
    TimeLock[] public timeLocks;
    mapping(uint8 => TimeLockStake) private stakeFields;
    IERC20 stakingToken;

    constructor(address _stakingToken) {
        stakingToken = IERC20(_stakingToken);
        TimeLock memory timeLock1 = TimeLock(7 days, 13);
        timeLocks.push(timeLock1);
        TimeLock memory timeLock2 = TimeLock(30 days, 52);
        timeLocks.push(timeLock2);
        TimeLock memory timeLock3 = TimeLock(91 days, 156);
        timeLocks.push(timeLock3);
        TimeLock memory timeLock4 = TimeLock(182 days, 312);
        timeLocks.push(timeLock4);
        TimeLock memory timeLock5 = TimeLock(365 days, 624);
        timeLocks.push(timeLock5);
        TimeLock memory timeLock6 = TimeLock(547 days, 936);
        timeLocks.push(timeLock6);
        TimeLock memory timeLock7 = TimeLock(730 days, 1248);
        timeLocks.push(timeLock7);
        TimeLock memory timeLock8 = TimeLock(1095 days, 1872);
        timeLocks.push(timeLock8);
        TimeLock memory timeLock9 = TimeLock(1459 days, 2496);
        timeLocks.push(timeLock9);
        TimeLock memory timeLock10 = TimeLock(1824 days, 3120);
        timeLocks.push(timeLock10);
    }

    function setTimeLock(uint8 timeLockId, uint256 apr, uint256 period) external onlyOwner {
        require(apr > 0, "Need no zero apr");
        require (timeLockId < timeLocks.length, "Non existing timelock");
        TimeLock storage timeLock = timeLocks[timeLockId];
        timeLock.apr = apr;
        if (period != 0) timeLock.period = period * 1 days;
    }

    function addTimeLock(uint256 apr, uint256 period) external onlyOwner {
        require(apr > 0, "Need no zero apr");
        require(period > 0, "Need no zero period");
        TimeLock memory timeLock = TimeLock(apr, period);
        timeLocks.push(timeLock);
    }

    // deposit funds by user, add pool
    function deposit(uint8 timeLockId, uint256 amount) external {
        require(amount > 0, "you can deposit more than 0 snt");

        stakingToken.safeTransferFrom(msg.sender, address(this), amount);
        TimeLockStake storage stakeField = stakeFields[timeLockId];

        StakeStruct memory stakeItem = StakeStruct(
            amount,
            block.timestamp
        );

        StakeUser storage userData = stakeFields[timeLockId].stakes[msg.sender];

        if (!stakeField.investors.contains(msg.sender)) {
            stakeField.investors.add(msg.sender);
            userData.investor = msg.sender;
        }
        
        userData.itemIds.add(userData.maxId);
        userData.stakeItems[userData.maxId] = stakeItem;
        userData.maxId ++;
        userData.amount += amount;
        stakeField.amount += amount;
    }

    // claim reward by deposit id
    function claimReward(uint8 timeLockId, uint256 id) public nonReentrant {

        StakeStruct storage stakeItem = stakeFields[timeLockId].stakes[msg.sender].stakeItems[id];
        require(
            stakeItem.amount > 0,
            "No stake"
        );

        uint256 claimableReward = _getClaimableReward(timeLockId, id, msg.sender);
        require(claimableReward > 0, "your reward is zero");

        require(
            claimableReward <= stakingToken.balanceOf(address(this)),
            "no enough snt in pool"
        );

        // transfer reward to the user
        stakingToken.safeTransfer(msg.sender, claimableReward);

        stakeItem.depositAt = block.timestamp;
    }

    // claim all rewards of user
    function claimAllRewardOfTimeLock(uint8 timeLockId) public nonReentrant {
        StakeUser storage stakeUser = stakeFields[timeLockId].stakes[msg.sender];
        require(stakeUser.itemIds.length() > 0, "you can deposit one at least");

        uint256 allClaimableReward;
        for(uint256 i = 0; i < stakeUser.itemIds.length(); i ++) {
            uint256 itemId = stakeUser.itemIds.at(i);
            uint256 claimableReward = _getClaimableReward(timeLockId, itemId, msg.sender);
            if (claimableReward > 0) {
                stakeUser.stakeItems[itemId].depositAt = block.timestamp;
                allClaimableReward += _getClaimableReward(timeLockId, itemId, msg.sender);
            }
        }

        require(allClaimableReward <= stakingToken.balanceOf(address(this)), "No enough money on contract");

        // transfer reward to the user
        stakingToken.safeTransfer(msg.sender, allClaimableReward);
    }

    // calculate all claimable reward of the user
    function getAllClaimableRewardOfTimeLock(uint8 timeLockId, address investor) public view returns (uint256) {
        uint256 allClaimableReward;
        for(uint256 i = 0; i < stakeFields[timeLockId].stakes[investor].itemIds.length(); i ++) {
            uint256 itemId = stakeFields[timeLockId].stakes[investor].itemIds.at(i);
            allClaimableReward += _getClaimableReward(timeLockId, itemId, investor);
        }
        return allClaimableReward;
    }

    function _getClaimableReward(uint8 timeLockId, uint256 id, address investor) internal view returns (uint256) {
        StakeStruct memory stakeItem = stakeFields[timeLockId].stakes[investor].stakeItems[id];
        require(block.timestamp > stakeItem.depositAt, "Staking time error");
        uint256 stakingTime = block.timestamp - stakeItem.depositAt;
        uint256 stakingTimeLock = timeLocks[timeLockId].period;
        if (stakingTimeLock >= stakingTime) return 0;
        else {
            return timeLocks[timeLockId].apr.mul(stakeItem.amount).div(percentRate);
        }
    }
    // calculate claimable reward by deposit id
    function getClaimableReward(uint8 timeLockId, uint256 id, address investor) external view returns (uint256) {
        return _getClaimableReward(timeLockId, id, investor);
    }

    // withdraw capital by deposit id
    function withdrawAll(uint8 timeLockId) public nonReentrant {
        StakeUser storage stakeUser = stakeFields[timeLockId].stakes[msg.sender];
        require(stakeUser.investor == msg.sender, "Only owner can withdraw");

        uint256 totalAmount = 0;
        uint256 loopValue = 0;
        while (loopValue < stakeUser.itemIds.length()) {
            uint256 itemId = stakeUser.itemIds.at(loopValue);
            StakeStruct storage stakeItem = stakeUser.stakeItems[itemId];
            uint256 claimableReward = 0;
            if (block.timestamp - stakeItem.depositAt > timeLocks[timeLockId].period && stakeItem.amount > 0) {
                claimableReward = timeLocks[timeLockId].apr.mul(stakeItem.amount).div(percentRate);
                totalAmount += claimableReward;
                totalAmount += stakeItem.amount;
                stakeUser.amount = stakeUser.amount.sub(stakeItem.amount);
                stakeFields[timeLockId].amount = stakeFields[timeLockId].amount.sub(stakeItem.amount);
                delete stakeFields[timeLockId].stakes[msg.sender].stakeItems[itemId];
                stakeUser.itemIds.remove(itemId);
                if (stakeUser.itemIds.length() == 0) {
                    delete stakeFields[timeLockId].stakes[msg.sender];
                    stakeFields[timeLockId].investors.remove(msg.sender);
                }
                continue;
            }
            loopValue ++;
        }

        if (totalAmount > stakingToken.balanceOf(address(this))) totalAmount = stakingToken.balanceOf(address(this));

        // transfer capital to the user
        stakingToken.safeTransfer(msg.sender, totalAmount);
    }

    // withdraw capital by deposit id
    function withdraw(uint8 timeLockId, uint256 id) public nonReentrant {
        StakeUser storage stakeUser = stakeFields[timeLockId].stakes[msg.sender];
        require(stakeUser.investor == msg.sender, "Only owner can withdraw");

        require(
            stakeUser.itemIds.contains(id),
            "no stake"
        );

        StakeStruct storage stakeItem = stakeFields[timeLockId].stakes[msg.sender].stakeItems[id];
        
        require(
            block.timestamp - stakeItem.depositAt > timeLocks[timeLockId].period,
            "withdraw lock time is not finished yet"
        );
        require(stakeItem.amount > 0, "you already withdrawed capital");

        uint256 claimableReward = _getClaimableReward(timeLockId, id, msg.sender);

        require(
            stakeItem.amount + claimableReward <= stakingToken.balanceOf(address(this)),
            "no enough snt in pool"
        );

        // transfer capital to the user
        stakingToken.safeTransfer(msg.sender, stakeItem.amount + claimableReward);

        stakeUser.amount = stakeUser.amount.sub(stakeItem.amount);
        stakeFields[timeLockId].amount = stakeFields[timeLockId].amount.sub(stakeItem.amount);
        delete stakeFields[timeLockId].stakes[msg.sender].stakeItems[id];
        stakeUser.itemIds.remove(id);
        if (stakeUser.itemIds.length() == 0) {
            delete stakeFields[timeLockId].stakes[msg.sender];
            stakeFields[timeLockId].investors.remove(msg.sender);
        }
    }

    // if the address exists in current investors list
    function existInInvestors(uint8 timeLockId, address investor) public view returns(bool) {
        return stakeFields[timeLockId].investors.contains(investor);
    }

    function getTotalRewardsOfTimeLock(uint8 timeLockId) public view returns (uint256) {
        uint256 totalRewards;
        for(uint256 i = 0; i < stakeFields[timeLockId].investors.length(); i ++) {
            address investor = stakeFields[timeLockId].investors.at(i);
            totalRewards += getAllClaimableRewardOfTimeLock(timeLockId, investor);
        }
        return totalRewards;
    }

    function getRecentReward(uint8 timeLockId, address investor) public view returns (uint256 amount, uint256 remainedTime, uint256 itemId) {
        uint256 stakingTime = timeLocks[timeLockId].period;
        uint256 _timeTmp;
        uint256 _itemId;

        StakeUser storage stakeUser = stakeFields[timeLockId].stakes[investor];
        for(uint256 i = 0; i < stakeUser.itemIds.length(); i ++) {
            uint256 id = stakeUser.itemIds.at(i);
            StakeStruct memory stakeItem = stakeUser.stakeItems[id];
            uint256 withdrawTime = stakeItem.depositAt + stakingTime;
            if (withdrawTime > block.timestamp) {
                if (_timeTmp == 0) {
                    _timeTmp = withdrawTime;
                    _itemId = id;
                } else if (withdrawTime < _timeTmp) {
                    _timeTmp = withdrawTime;
                    _itemId = id;
                }
            }
        }
        if (_timeTmp != 0) {
            amount = stakeUser.stakeItems[_itemId].amount;
            remainedTime = _timeTmp - block.timestamp;
            itemId = _itemId;
        }
    }

    // calculate invests
    function getTotalInvestsOfUser(uint8 timeLockId, address investor) public view returns (uint256) {
        return stakeFields[timeLockId].stakes[investor].amount;
    }

    function getStakingData(uint8 timeLockId, address investor) public view returns (uint256 invests, uint256 availableInvests, uint256 rewards) {
        StakeUser storage stakeUser = stakeFields[timeLockId].stakes[investor];
        for (uint256 i = 0; i < stakeUser.itemIds.length(); i++) {
            uint256 itemId = stakeUser.itemIds.at(i);
            StakeStruct memory stakeItem = stakeUser.stakeItems[itemId];
            if (block.timestamp > stakeItem.depositAt && block.timestamp - stakeItem.depositAt > timeLocks[timeLockId].period) {
                rewards += timeLocks[timeLockId].apr.mul(stakeItem.amount).div(percentRate);
                availableInvests += stakeItem.amount;
            }
            invests += stakeItem.amount;
        }
    }

    // calculate total invests
    function getTotalInvests(uint8 timeLockId) public view returns (uint256) {
        return stakeFields[timeLockId].amount;
    }

    // calculate total invests
    function getTotalInvests() public view returns (uint256) {
        uint256 totalInvest = 0;
        for (uint8 id = 0; id < timeLocks.length; id ++) {
            totalInvest += stakeFields[id].amount;
        }
        return totalInvest;
    }

    // calculate total invests
    function getTotalInvestors(uint8 timeLockId) public view returns (uint256) {
        return stakeFields[timeLockId].investors.length();
    }

    function getOwnedStakes(uint8 timeLockId, address investor) public view returns (uint256[] memory) {
        return stakeFields[timeLockId].stakes[investor].itemIds.values();
    }

    function getStakeItem(uint8 timeLockId, address investor, uint256 itemId) public view returns (StakeStruct memory) {
        return stakeFields[timeLockId].stakes[investor].stakeItems[itemId];
    }

    function getTimeLockLength() external view returns(uint256) {
        return timeLocks.length;
    }

    function getBalance() external view returns(uint256) {
        return stakingToken.balanceOf(address(this));
    }

    // adding pool by owner
    function depositFunds(uint256 amount) external payable onlyOwner returns(bool) {
        require(amount > 0, "you can only deposit more than 0 snt");
        stakingToken.safeTransferFrom(msg.sender, address(this), amount);
        return true;
    }

    function withdrawFunds(uint256 amount) external onlyOwner nonReentrant {
        // transfer fund
        stakingToken.safeTransfer(msg.sender, amount);
    }
}
