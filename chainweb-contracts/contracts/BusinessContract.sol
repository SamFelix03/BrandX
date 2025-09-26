// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title BusinessContract - Individual contract for each business
 * @dev Each business gets their own contract with full control over bounties, rewards, and members
 */
contract BusinessContract is ERC721, Ownable {
    
    // ==================== STRUCTS ====================
    
    enum RewardType {
        NONE,            // Points only, no direct reward
        WEB2_VOUCHER,    // Points + Mints voucher NFT
        TOKEN_AIRDROP,   // Points + Direct token transfer
        NFT_REWARD       // Points + Mint special NFT
    }
    
    struct RewardTemplate {
        uint256 id;
        string name;              // "10% off next purchase"
        string description;       // "Get 10% discount on your next order"
        RewardType rewardType;    
        uint256 pointsValue;      // Base points also awarded
        bool active;
        
        // Web2 specific
        string voucherMetadata;   // JSON with discount %, terms, etc.
        uint256 validityPeriod;   // How long voucher is valid (seconds)
        
        // Web3 specific  
        address tokenAddress;     // ERC20 token for airdrops
        uint256 tokenAmount;      // Amount to airdrop
        string nftMetadata;       // For NFT rewards
    }
    
    struct Bounty {
        uint256 id;
        string title;
        string description;
        uint256 rewardTemplateId;  // Links to specific reward template
        bool active;
        uint256 expiry;
        uint256 maxCompletions;    // 0 = unlimited
        uint256 currentCompletions;
    }
    
    struct Prize {
        uint256 id;
        string name;
        string description;
        uint256 pointsCost;        // Points required to claim
        bool active;
        uint256 maxClaims;         // 0 = unlimited
        uint256 currentClaims;
        string metadata;           // Prize-specific data
    }
    
    struct UserData {
        uint256 totalPoints;
        uint256[] completedBounties;
        uint256[] ownedVouchers;   // NFT token IDs for vouchers
        uint256[] claimedPrizes;   // Prize IDs claimed with points
        string ensName;            // Full ENS name (e.g., "sarah.joescoffee.eth")
        uint256 joinedAt;          // Timestamp when user joined
        mapping(uint256 => uint256) bountyCompletionTime;
        mapping(uint256 => uint256) prizeClaimTime;
    }
    
    // ==================== STATE VARIABLES ====================
    
    string public businessUuid;
    string public businessName;
    string public businessDescription;
    address public factoryContract;
    
    // ENS integration (off-chain assigned)
    string public businessENSDomain;     // e.g., "joescoffee.eth"
    
    mapping(string => bool) public ensNameExists;    // ENS name => exists
    mapping(address => string) public userToENSName; // user address => ENS name
    mapping(string => address) public ensNameToUser; // ENS name => user address
    
    uint256 public nextBountyId = 1;
    uint256 public nextRewardId = 1;
    uint256 public nextPrizeId = 1;
    uint256 private _nextTokenId = 1;
    
    // Business management
    mapping(address => bool) public loyaltyMembers;
    mapping(uint256 => Bounty) public bounties;
    mapping(uint256 => RewardTemplate) public rewardTemplates;
    mapping(uint256 => Prize) public prizes;
    mapping(address => UserData) private userData;
    
    uint256[] public activeBountyIds;
    uint256[] public activeRewardIds;
    uint256[] public activePrizeIds;
    address[] public allMembers;
    
    // ==================== EVENTS ====================
    
    event LoyaltyMemberAdded(address indexed member, string ensName);
    event LoyaltyMemberRemoved(address indexed member, string ensName);
    event BountyCreated(uint256 indexed bountyId, string title, uint256 rewardTemplateId);
    event BountyCompleted(address indexed user, uint256 indexed bountyId, uint256 pointsEarned, bool hasDirectReward);
    event RewardTemplateAdded(uint256 indexed rewardId, string name, RewardType rewardType);
    event PrizeCreated(uint256 indexed prizeId, string name, uint256 pointsCost);
    event PrizeClaimed(address indexed user, uint256 indexed prizeId, uint256 pointsSpent);
    event VoucherMinted(address indexed user, uint256 indexed tokenId, uint256 rewardTemplateId);
    event TokensAirdropped(address indexed user, address tokenAddress, uint256 amount);
    
    // ==================== MODIFIERS ====================
    
    modifier onlyLoyaltyMember() {
        require(loyaltyMembers[msg.sender], "Not a loyalty member");
        _;
    }
    
    modifier bountyExists(uint256 _bountyId) {
        require(bounties[_bountyId].id != 0, "Bounty does not exist");
        _;
    }
    
    modifier rewardExists(uint256 _rewardId) {
        require(rewardTemplates[_rewardId].id != 0, "Reward template does not exist");
        _;
    }
    
    modifier prizeExists(uint256 _prizeId) {
        require(prizes[_prizeId].id != 0, "Prize does not exist");
        _;
    }
    
    // ==================== CONSTRUCTOR ====================
    
    constructor(
        string memory _uuid,
        string memory _name,
        string memory _description,
        address _owner,
        string memory _businessENSDomain
    ) ERC721(string(abi.encodePacked(_name, " Loyalty")), string(abi.encodePacked(_name, "LOYALTY"))) Ownable(_owner) {
        businessUuid = _uuid;
        businessName = _name;
        businessDescription = _description;
        factoryContract = msg.sender;
        businessENSDomain = _businessENSDomain;
    }
    
    // ==================== LOYALTY MEMBER MANAGEMENT ====================
    
    /**
     * @dev Add loyalty member with pre-assigned ENS name (assigned off-chain)
     * @param _user Wallet address of the user
     * @param _ensName Full ENS name (e.g., "sarah.joescoffee.eth")
     */
    function addLoyaltyMember(address _user, string memory _ensName) external onlyOwner {
        require(!loyaltyMembers[_user], "Member exists");
        require(!ensNameExists[_ensName], "ENS taken");
        require(bytes(_ensName).length > 0, "Empty ENS");
        require(_isValidENSName(_ensName), "Invalid ENS");
        
        // Update mappings
        loyaltyMembers[_user] = true;
        ensNameExists[_ensName] = true;
        userToENSName[_user] = _ensName;
        ensNameToUser[_ensName] = _user;
        allMembers.push(_user);
        
        // Update user data
        userData[_user].ensName = _ensName;
        userData[_user].joinedAt = block.timestamp;
        
        emit LoyaltyMemberAdded(_user, _ensName);
    }
    
    function removeLoyaltyMember(address _user) external onlyOwner {
        require(loyaltyMembers[_user], "Not a member");
        
        string memory ensName = userData[_user].ensName;
        
        // Clean up mappings
        loyaltyMembers[_user] = false;
        ensNameExists[ensName] = false;
        userToENSName[_user] = "";
        ensNameToUser[ensName] = address(0);
        
        // Note: ENS name ownership remains with user on Ethereum Sepolia
        // This is intentional - they keep their ENS name as a "badge"
        
        emit LoyaltyMemberRemoved(_user, ensName);
    }
    
    // ==================== REWARD TEMPLATE MANAGEMENT ====================
    
    function addRewardTemplate(
        string memory _name,
        string memory _description,
        RewardType _rewardType,
        uint256 _pointsValue,
        string memory _voucherMetadata,
        uint256 _validityPeriod,
        address _tokenAddress,
        uint256 _tokenAmount,
        string memory _nftMetadata
    ) external onlyOwner returns (uint256) {
        uint256 rewardId = nextRewardId++;
        
        rewardTemplates[rewardId] = RewardTemplate({
            id: rewardId,
            name: _name,
            description: _description,
            rewardType: _rewardType,
            pointsValue: _pointsValue,
            active: true,
            voucherMetadata: _voucherMetadata,
            validityPeriod: _validityPeriod,
            tokenAddress: _tokenAddress,
            tokenAmount: _tokenAmount,
            nftMetadata: _nftMetadata
        });
        
        activeRewardIds.push(rewardId);
        emit RewardTemplateAdded(rewardId, _name, _rewardType);
        return rewardId;
    }
    
    function toggleRewardTemplate(uint256 _rewardId) external onlyOwner rewardExists(_rewardId) {
        rewardTemplates[_rewardId].active = !rewardTemplates[_rewardId].active;
    }
    
    // ==================== BOUNTY MANAGEMENT ====================
    
    function createBounty(
        string memory _title,
        string memory _description,
        uint256 _rewardTemplateId,
        uint256 _expiry,
        uint256 _maxCompletions
    ) external onlyOwner rewardExists(_rewardTemplateId) returns (uint256) {
        require(rewardTemplates[_rewardTemplateId].active, "Inactive reward");
        
        uint256 bountyId = nextBountyId++;
        
        bounties[bountyId] = Bounty({
            id: bountyId,
            title: _title,
            description: _description,
            rewardTemplateId: _rewardTemplateId,
            active: true,
            expiry: _expiry,
            maxCompletions: _maxCompletions,
            currentCompletions: 0
        });
        
        activeBountyIds.push(bountyId);
        emit BountyCreated(bountyId, _title, _rewardTemplateId);
        return bountyId;
    }
    
    function toggleBounty(uint256 _bountyId) external onlyOwner bountyExists(_bountyId) {
        bounties[_bountyId].active = !bounties[_bountyId].active;
    }
    
    // ==================== BOUNTY COMPLETION ====================
    
    function completeBounty(address _user, uint256 _bountyId) external onlyOwner bountyExists(_bountyId) {
        require(loyaltyMembers[_user], "User not a loyalty member");
        
        Bounty storage bounty = bounties[_bountyId];
        RewardTemplate storage reward = rewardTemplates[bounty.rewardTemplateId];
        
        require(bounty.active, "Bounty not active");
        require(bounty.expiry > block.timestamp, "Bounty expired");
        require(bounty.maxCompletions == 0 || bounty.currentCompletions < bounty.maxCompletions, "Max completions reached");
        require(userData[_user].bountyCompletionTime[_bountyId] == 0, "Bounty already completed");
        
        // Award points
        userData[_user].totalPoints += reward.pointsValue;
        userData[_user].completedBounties.push(_bountyId);
        userData[_user].bountyCompletionTime[_bountyId] = block.timestamp;
        
        // Process direct reward based on type (if any)
        bool hasDirectReward = reward.rewardType != RewardType.NONE;
        if (reward.rewardType == RewardType.WEB2_VOUCHER) {
            _mintVoucher(_user, bounty.rewardTemplateId);
        } else if (reward.rewardType == RewardType.TOKEN_AIRDROP) {
            _airdropTokens(_user, reward.tokenAddress, reward.tokenAmount);
        } else if (reward.rewardType == RewardType.NFT_REWARD) {
            _mintNFTReward(_user, reward.nftMetadata);
        }
        
        bounty.currentCompletions++;
        emit BountyCompleted(_user, _bountyId, reward.pointsValue, hasDirectReward);
    }
    
    // ==================== PRIZE MANAGEMENT ====================
    
    /**
     * @dev Create a points-based prize
     */
    function createPrize(
        string memory _name,
        string memory _description,
        uint256 _pointsCost,
        uint256 _maxClaims,
        string memory _metadata
    ) external onlyOwner returns (uint256) {
        require(bytes(_name).length > 0, "Empty name");
        require(_pointsCost > 0, "Zero cost");
        
        uint256 prizeId = nextPrizeId++;
        
        prizes[prizeId] = Prize({
            id: prizeId,
            name: _name,
            description: _description,
            pointsCost: _pointsCost,
            active: true,
            maxClaims: _maxClaims,
            currentClaims: 0,
            metadata: _metadata
        });
        
        activePrizeIds.push(prizeId);
        emit PrizeCreated(prizeId, _name, _pointsCost);
        return prizeId;
    }
    
    /**
     * @dev Toggle prize active status
     */
    function togglePrize(uint256 _prizeId) external onlyOwner prizeExists(_prizeId) {
        prizes[_prizeId].active = !prizes[_prizeId].active;
    }
    
    /**
     * @dev Claim a prize with points
     */
    function claimPrize(uint256 _prizeId) external onlyLoyaltyMember prizeExists(_prizeId) {
        Prize storage prize = prizes[_prizeId];
        
        require(prize.active, "Prize not active");
        require(userData[msg.sender].totalPoints >= prize.pointsCost, "Insufficient points");
        require(prize.maxClaims == 0 || prize.currentClaims < prize.maxClaims, "Prize claim limit reached");
        require(userData[msg.sender].prizeClaimTime[_prizeId] == 0, "Prize already claimed");
        
        // Deduct points
        userData[msg.sender].totalPoints -= prize.pointsCost;
        userData[msg.sender].claimedPrizes.push(_prizeId);
        userData[msg.sender].prizeClaimTime[_prizeId] = block.timestamp;
        
        // Update claim count
        prize.currentClaims++;
        
        emit PrizeClaimed(msg.sender, _prizeId, prize.pointsCost);
    }
    
    // ==================== INTERNAL REWARD PROCESSING ====================
    
    function _mintVoucher(address _user, uint256 _rewardTemplateId) internal {
        uint256 tokenId = _nextTokenId++;
        _mint(_user, tokenId);
        userData[_user].ownedVouchers.push(tokenId);
        
        emit VoucherMinted(_user, tokenId, _rewardTemplateId);
    }
    
    function _airdropTokens(address _user, address _tokenAddress, uint256 _amount) internal {
        require(_tokenAddress != address(0), "Invalid token address");
        IERC20 token = IERC20(_tokenAddress);
        require(token.balanceOf(address(this)) >= _amount, "Insufficient token balance");
        
        token.transfer(_user, _amount);
        emit TokensAirdropped(_user, _tokenAddress, _amount);
    }
    
    function _mintNFTReward(address _user, string memory _metadata) internal {
        uint256 tokenId = _nextTokenId++;
        _mint(_user, tokenId);
        
        // Note: For full implementation, you'd store metadata mapping
        emit VoucherMinted(_user, tokenId, 0); // Using 0 for NFT rewards
    }
    
    // ==================== VIEW FUNCTIONS ====================
    
    function getUserData(address _user) external view returns (
        uint256 totalPoints,
        uint256[] memory completedBounties,
        uint256[] memory ownedVouchers,
        uint256[] memory claimedPrizes,
        string memory ensName,
        uint256 joinedAt
    ) {
        UserData storage user = userData[_user];
        return (user.totalPoints, user.completedBounties, user.ownedVouchers, user.claimedPrizes, user.ensName, user.joinedAt);
    }
    
    function getActiveBounties() external view returns (uint256[] memory) {
        return activeBountyIds;
    }
    
    function getActiveRewards() external view returns (uint256[] memory) {
        return activeRewardIds;
    }
    
    function getActivePrizes() external view returns (uint256[] memory) {
        return activePrizeIds;
    }
    
    function getAllMembers() external view returns (address[] memory) {
        return allMembers;
    }
    
    function getBounty(uint256 _bountyId) external view returns (Bounty memory) {
        return bounties[_bountyId];
    }
    
    function getRewardTemplate(uint256 _rewardId) external view returns (RewardTemplate memory) {
        return rewardTemplates[_rewardId];
    }
    
    function getPrize(uint256 _prizeId) external view returns (Prize memory) {
        return prizes[_prizeId];
    }
    
    /**
     * @dev Get available prizes for user based on their points
     */
    function getAvailablePrizes(address _user) external view returns (
        uint256[] memory prizeIds,
        string[] memory names,
        uint256[] memory pointsCosts,
        bool[] memory canAfford
    ) {
        uint256[] memory activePrizes = activePrizeIds;
        uint256 userPoints = userData[_user].totalPoints;
        uint256 availableCount = 0;
        
        // Count available prizes
        for (uint256 i = 0; i < activePrizes.length; i++) {
            Prize storage prize = prizes[activePrizes[i]];
            if (prize.active && 
                (prize.maxClaims == 0 || prize.currentClaims < prize.maxClaims) &&
                userData[_user].prizeClaimTime[activePrizes[i]] == 0) {
                availableCount++;
            }
        }
        
        // Populate arrays
        prizeIds = new uint256[](availableCount);
        names = new string[](availableCount);
        pointsCosts = new uint256[](availableCount);
        canAfford = new bool[](availableCount);
        
        uint256 index = 0;
        for (uint256 i = 0; i < activePrizes.length; i++) {
            Prize storage prize = prizes[activePrizes[i]];
            if (prize.active && 
                (prize.maxClaims == 0 || prize.currentClaims < prize.maxClaims) &&
                userData[_user].prizeClaimTime[activePrizes[i]] == 0) {
                prizeIds[index] = prize.id;
                names[index] = prize.name;
                pointsCosts[index] = prize.pointsCost;
                canAfford[index] = userPoints >= prize.pointsCost;
                index++;
            }
        }
        
        return (prizeIds, names, pointsCosts, canAfford);
    }
    
    // ==================== ENS HELPER FUNCTIONS ====================
    
    function _isValidENSName(string memory _ensName) internal pure returns (bool) {
        return bytes(_ensName).length > 0; // Simplified validation
    }
    
    /**
     * @dev Get user data by ENS name
     */
    function getUserByENSName(string memory _ensName) external view returns (
        address userAddress,
        uint256 totalPoints,
        string memory ensName,
        uint256 joinedAt
    ) {
        address user = ensNameToUser[_ensName];
        require(user != address(0), "ENS name not found");
        
        UserData storage userData_ = userData[user];
        return (user, userData_.totalPoints, userData_.ensName, userData_.joinedAt);
    }
    
    /**
     * @dev Check if ENS name is available in this business
     */
    function isENSNameAvailable(string memory _ensName) external view returns (bool) {
        if (!_isValidENSName(_ensName)) {
            return false;
        }
        return !ensNameExists[_ensName];
    }
    
    /**
     * @dev Get all ENS names in this business
     */
    function getAllENSNames() external view returns (string[] memory) {
        string[] memory ensNames = new string[](allMembers.length);
        for (uint256 i = 0; i < allMembers.length; i++) {
            ensNames[i] = userData[allMembers[i]].ensName;
        }
        return ensNames;
    }
    
    /**
     * @dev Get expected ENS name format for this business
     */
    function getExpectedENSFormat() external view returns (string memory) {
        return string(abi.encodePacked("{username}.", businessENSDomain));
    }
}