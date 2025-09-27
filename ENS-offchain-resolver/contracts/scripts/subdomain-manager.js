const { ethers } = require("ethers");

class SubdomainManager {
  constructor(privateKey, rpcUrl, ensRegistryAddress = "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e") {
    this.provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    this.wallet = new ethers.Wallet(privateKey, this.provider);
    this.ensRegistryAddress = ensRegistryAddress;
    
    // ENS Registry ABI
    const ensRegistryABI = [
      "function setSubnodeRecord(bytes32 node, bytes32 label, address owner, address resolver, uint64 ttl) external",
      "function setResolver(bytes32 node, address resolver) external",
      "function resolver(bytes32 node) external view returns (address)",
      "function owner(bytes32 node) external view returns (address)"
    ];
    
    this.ensRegistry = new ethers.Contract(ensRegistryAddress, ensRegistryABI, this.wallet);
  }
  
  /**
   * Create a subdomain with a specific resolver
   */
  async createSubdomain(parentDomain, subdomain, resolverAddress, ownerAddress = null) {
    try {
      const owner = ownerAddress || this.wallet.address;
      const parentNode = ethers.utils.namehash(parentDomain);
      const subdomainLabel = ethers.utils.id(subdomain);
      const fullSubdomain = `${subdomain}.${parentDomain}`;
      const subdomainNode = ethers.utils.namehash(fullSubdomain);
      
      console.log(`Creating subdomain: ${fullSubdomain}`);
      console.log(`Owner: ${owner}`);
      console.log(`Resolver: ${resolverAddress}`);
      
      // Check if caller owns the parent domain
      const parentOwner = await this.ensRegistry.owner(parentNode);
      if (parentOwner.toLowerCase() !== this.wallet.address.toLowerCase()) {
        throw new Error(`You don't own the parent domain. Owner: ${parentOwner}`);
      }
      
      // Create subdomain with resolver
      const tx = await this.ensRegistry.setSubnodeRecord(
        parentNode,
        subdomainLabel,
        owner,
        resolverAddress,
        0 // TTL
      );
      
      console.log(`Transaction hash: ${tx.hash}`);
      await tx.wait();
      
      // Verify
      const actualResolver = await this.ensRegistry.resolver(subdomainNode);
      const actualOwner = await this.ensRegistry.owner(subdomainNode);
      
      return {
        success: true,
        subdomain: fullSubdomain,
        node: subdomainNode,
        owner: actualOwner,
        resolver: actualResolver,
        transactionHash: tx.hash
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message,
        subdomain: `${subdomain}.${parentDomain}`
      };
    }
  }
  
  /**
   * Batch create multiple subdomains
   */
  async createMultipleSubdomains(parentDomain, subdomains, resolverAddress, ownerAddress = null) {
    const results = [];
    
    for (const subdomain of subdomains) {
      const result = await this.createSubdomain(parentDomain, subdomain, resolverAddress, ownerAddress);
      results.push(result);
      
      // Add delay to avoid rate limiting
      if (results.length < subdomains.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return results;
  }
  
  /**
   * Change resolver for an existing subdomain
   */
  async changeSubdomainResolver(fullSubdomain, newResolverAddress) {
    try {
      const subdomainNode = ethers.utils.namehash(fullSubdomain);
      
      // Check if caller owns the subdomain
      const currentOwner = await this.ensRegistry.owner(subdomainNode);
      if (currentOwner.toLowerCase() !== this.wallet.address.toLowerCase()) {
        throw new Error(`You don't own this subdomain. Owner: ${currentOwner}`);
      }
      
      console.log(`Changing resolver for ${fullSubdomain} to ${newResolverAddress}`);
      
      const tx = await this.ensRegistry.setResolver(subdomainNode, newResolverAddress);
      
      console.log(`Transaction hash: ${tx.hash}`);
      await tx.wait();
      
      // Verify
      const actualResolver = await this.ensRegistry.resolver(subdomainNode);
      
      return {
        success: true,
        subdomain: fullSubdomain,
        node: subdomainNode,
        resolver: actualResolver,
        transactionHash: tx.hash
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message,
        subdomain: fullSubdomain
      };
    }
  }
  
  /**
   * Get subdomain info
   */
  async getSubdomainInfo(fullSubdomain) {
    try {
      const subdomainNode = ethers.utils.namehash(fullSubdomain);
      const owner = await this.ensRegistry.owner(subdomainNode);
      const resolver = await this.ensRegistry.resolver(subdomainNode);
      
      return {
        subdomain: fullSubdomain,
        node: subdomainNode,
        owner,
        resolver,
        exists: owner !== '0x0000000000000000000000000000000000000000'
      };
      
    } catch (error) {
      return {
        subdomain: fullSubdomain,
        error: error.message,
        exists: false
      };
    }
  }
}

// CLI Usage
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.log("Usage examples:");
    console.log("node subdomain-manager.js create fablelands.xyz alice 0xeEe706A6Ef4a1f24827a58fB7bE6a07c6F219d1A");
    console.log("node subdomain-manager.js batch fablelands.xyz alice,bob,charlie 0xeEe706A6Ef4a1f24827a58fB7bE6a07c6F219d1A");
    console.log("node subdomain-manager.js info alice.fablelands.xyz");
    console.log("node subdomain-manager.js change alice.fablelands.xyz 0xNewResolverAddress");
    return;
  }
  
  const command = args[0];
  
  // Configuration - you should set these as environment variables
  const PRIVATE_KEY = process.env.DEPLOYER_KEY || "0x7a425200e31e8409c27abbc9aaae49a94c314426ef2e569d3a33ffc289a34e76";
  const RPC_URL = "https://sepolia.infura.io/v3/b4880ead6a9a4f77a6de39dec6f3d0d0";
  
  const manager = new SubdomainManager(PRIVATE_KEY, RPC_URL);
  
  switch (command) {
    case 'create':
      if (args.length < 4) {
        console.log("Usage: node subdomain-manager.js create <parentDomain> <subdomain> <resolverAddress>");
        return;
      }
      const result = await manager.createSubdomain(args[1], args[2], args[3]);
      console.log(JSON.stringify(result, null, 2));
      break;
      
    case 'batch':
      if (args.length < 4) {
        console.log("Usage: node subdomain-manager.js batch <parentDomain> <subdomain1,subdomain2,subdomain3> <resolverAddress>");
        return;
      }
      const subdomains = args[2].split(',');
      const results = await manager.createMultipleSubdomains(args[1], subdomains, args[3]);
      console.log(JSON.stringify(results, null, 2));
      break;
      
    case 'info':
      if (args.length < 2) {
        console.log("Usage: node subdomain-manager.js info <fullSubdomain>");
        return;
      }
      const info = await manager.getSubdomainInfo(args[1]);
      console.log(JSON.stringify(info, null, 2));
      break;
      
    case 'change':
      if (args.length < 3) {
        console.log("Usage: node subdomain-manager.js change <fullSubdomain> <newResolverAddress>");
        return;
      }
      const changeResult = await manager.changeSubdomainResolver(args[1], args[2]);
      console.log(JSON.stringify(changeResult, null, 2));
      break;
      
    default:
      console.log("Unknown command. Use: create, batch, info, or change");
  }
}

// Export for use as module
module.exports = SubdomainManager;

// Run CLI if called directly
if (require.main === module) {
  main().catch(console.error);
}
