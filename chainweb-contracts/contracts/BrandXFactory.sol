// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "./BusinessContract.sol";

/**
 * @title BrandXFactory - Factory contract for deploying individual business contracts
 * @dev Central registry and deployment manager for all business contracts
 */
contract BrandXFactory {
    
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
    
    mapping(address => address[]) public ownerBusinesses;     // owner => business contracts
    address[] public allBusinessContracts;
    
    // ==================== EVENTS ====================
    
    event BusinessContractDeployed(
        string indexed uuid,
        address indexed contractAddress,
        address indexed owner,
        string name
    );
    
    // ==================== MODIFIERS ====================
    
    // ==================== MAIN FUNCTIONS ====================
    
    /**
     * @dev Deploy a new business contract with ENS domain
     */
    function deployBusinessContract(
        string memory _uuid,
        string memory _name,
        string memory _description,
        string memory _businessENSDomain
    ) external returns (address) {
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
        ownerBusinesses[msg.sender].push(contractAddress);
        allBusinessContracts.push(contractAddress);
        
        emit BusinessContractDeployed(_uuid, contractAddress, msg.sender, _name);
        return contractAddress;
    }
    
    // Removed bulk setup function - setup individually after deployment
    
    // Removed delegation functions - interact with BusinessContract directly
    
    // ==================== VIEW FUNCTIONS ====================
    
    /**
     * @dev Get all businesses owned by an address
     */
    function getOwnerBusinesses(address _owner) external view returns (address[] memory) {
        return ownerBusinesses[_owner];
    }
    
    /**
     * @dev Get all deployed business contracts
     */
    function getAllBusinessContracts() external view returns (address[] memory) {
        return allBusinessContracts;
    }
    
    /**
     * @dev Get total number of deployed businesses
     */
    function getTotalBusinesses() external view returns (uint256) {
        return allBusinessContracts.length;
    }
    
    // Removed batch function - call individually
}