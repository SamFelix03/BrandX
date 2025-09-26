// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "./BusinessContract.sol";

/**
 * @title EzEarnFactory - Factory contract for deploying individual business contracts
 * @dev Central registry and deployment manager for all business contracts
 */
contract EzEarnFactory {
    
    // ==================== STRUCTS ====================
    
    struct BusinessInfo {
        string uuid;
        string name;
        string description;
        address contractAddress;
        address owner;
        uint256 deployedAt;
        bool active;
    }
    
    // ==================== STATE VARIABLES ====================
    
    mapping(string => address) public businessContracts;     // uuid => contract address
    mapping(address => string[]) public ownerBusinesses;     // owner => business uuids
    mapping(address => string) public contractToUuid;       // contract => uuid
    
    string[] public allBusinessUuids;
    address[] public allBusinessContracts;
    
    // ==================== EVENTS ====================
    
    event BusinessContractDeployed(
        string indexed uuid,
        address indexed contractAddress,
        address indexed owner,
        string name
    );
    
    event BusinessStatusToggled(string indexed uuid, bool active);
    
    // ==================== MODIFIERS ====================
    
    modifier businessNotExists(string memory _uuid) {
        require(businessContracts[_uuid] == address(0), "Business with this UUID already exists");
        _;
    }
    
    modifier businessExists(string memory _uuid) {
        require(businessContracts[_uuid] != address(0), "Business with this UUID does not exist");
        _;
    }
    
    modifier onlyBusinessOwner(string memory _uuid) {
        address contractAddr = businessContracts[_uuid];
        require(contractAddr != address(0), "Business does not exist");
        BusinessContract businessContract = BusinessContract(contractAddr);
        require(businessContract.owner() == msg.sender, "Only business owner can call this");
        _;
    }
    
    // ==================== MAIN FUNCTIONS ====================
    
    /**
     * @dev Deploy a new business contract with ENS domain
     */
    function deployBusinessContract(
        string memory _uuid,
        string memory _name,
        string memory _description,
        string memory _businessENSDomain
    ) external businessNotExists(_uuid) returns (address) {
        require(bytes(_uuid).length > 0, "UUID cannot be empty");
        require(bytes(_name).length > 0, "Name cannot be empty");
        
        // Deploy new BusinessContract
        BusinessContract newBusiness = new BusinessContract(
            _uuid,
            _name,
            _description,
            msg.sender,
            _businessENSDomain
        );
        
        address contractAddress = address(newBusiness);
        
        // Register the business
        businessContracts[_uuid] = contractAddress;
        ownerBusinesses[msg.sender].push(_uuid);
        contractToUuid[contractAddress] = _uuid;
        allBusinessUuids.push(_uuid);
        allBusinessContracts.push(contractAddress);
        
        emit BusinessContractDeployed(_uuid, contractAddress, msg.sender, _name);
        return contractAddress;
    }
    
    // Removed bulk setup function - setup individually after deployment
    
    // Removed delegation functions - interact with BusinessContract directly
    
    // ==================== VIEW FUNCTIONS ====================
    
    /**
     * @dev Get business contract address by UUID
     */
    function getBusinessContract(string memory _uuid) external view returns (address) {
        return businessContracts[_uuid];
    }
    
    /**
     * @dev Get all businesses owned by an address
     */
    function getOwnerBusinesses(address _owner) external view returns (string[] memory) {
        return ownerBusinesses[_owner];
    }
    
    /**
     * @dev Get business info by UUID
     */
    function getBusinessInfo(string memory _uuid) external view businessExists(_uuid) returns (BusinessInfo memory) {
        address contractAddr = businessContracts[_uuid];
        BusinessContract businessContract = BusinessContract(contractAddr);
        
        return BusinessInfo({
            uuid: _uuid,
            name: businessContract.businessName(),
            description: businessContract.businessDescription(),
            contractAddress: contractAddr,
            owner: businessContract.owner(),
            deployedAt: 0, // Would need to store this in mapping if needed
            active: true   // Would need to implement status tracking if needed
        });
    }
    
    /**
     * @dev Get all deployed business contracts
     */
    function getAllBusinessContracts() external view returns (address[] memory) {
        return allBusinessContracts;
    }
    
    /**
     * @dev Get all business UUIDs
     */
    function getAllBusinessUuids() external view returns (string[] memory) {
        return allBusinessUuids;
    }
    
    /**
     * @dev Get total number of deployed businesses
     */
    function getTotalBusinesses() external view returns (uint256) {
        return allBusinessContracts.length;
    }
    
    /**
     * @dev Check if business exists
     */
    function businessExistsCheck(string memory _uuid) external view returns (bool) {
        return businessContracts[_uuid] != address(0);
    }
    
    // ==================== UTILITY FUNCTIONS ====================
    
    /**
     * @dev Get UUID from contract address
     */
    function getUuidFromContract(address _contract) external view returns (string memory) {
        return contractToUuid[_contract];
    }
    
    // Removed batch function - call individually
}