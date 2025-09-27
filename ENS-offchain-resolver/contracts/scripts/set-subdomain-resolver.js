const { ethers } = require("hardhat");

async function main() {
  // Configuration
  const PARENT_DOMAIN = "fablelands.xyz"; // Change this to your parent domain
  const SUBDOMAIN = "alice"; // Change this to the subdomain you want to create
  const RESOLVER_ADDRESS = "0xeEe706A6Ef4a1f24827a58fB7bE6a07c6F219d1A"; // Your OffchainResolver
  const ENS_REGISTRY_ADDRESS = "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e";
  
  // Get the signer (must be the owner of the parent domain)
  const [signer] = await ethers.getSigners();
  console.log("Setting subdomain resolver with account:", signer.address);
  
  // ENS Registry ABI
  const ensRegistryABI = [
    "function setSubnodeRecord(bytes32 node, bytes32 label, address owner, address resolver, uint64 ttl) external",
    "function setResolver(bytes32 node, address resolver) external",
    "function resolver(bytes32 node) external view returns (address)",
    "function owner(bytes32 node) external view returns (address)"
  ];
  
  const ensRegistry = new ethers.Contract(ENS_REGISTRY_ADDRESS, ensRegistryABI, signer);
  
  // Calculate namehashes
  const parentNode = ethers.utils.namehash(PARENT_DOMAIN);
  const subdomainLabel = ethers.utils.id(SUBDOMAIN);
  const fullSubdomain = `${SUBDOMAIN}.${PARENT_DOMAIN}`;
  const subdomainNode = ethers.utils.namehash(fullSubdomain);
  
  console.log(`Parent domain: ${PARENT_DOMAIN}`);
  console.log(`Subdomain: ${fullSubdomain}`);
  console.log(`Parent node: ${parentNode}`);
  console.log(`Subdomain label: ${subdomainLabel}`);
  console.log(`Subdomain node: ${subdomainNode}`);
  console.log(`Resolver address: ${RESOLVER_ADDRESS}`);
  console.log('');
  
  try {
    // Check if you own the parent domain
    const parentOwner = await ensRegistry.owner(parentNode);
    console.log(`Parent domain owner: ${parentOwner}`);
    
    if (parentOwner.toLowerCase() !== signer.address.toLowerCase()) {
      console.log("❌ You don't own the parent domain. You need to own the parent domain to create subdomains.");
      console.log(`Current owner: ${parentOwner}`);
      console.log(`Your address: ${signer.address}`);
      return;
    }
    
    console.log("✅ You own the parent domain, proceeding...");
    
    // Method 1: Set subdomain owner and resolver in one transaction
    console.log("Setting subdomain record (owner + resolver)...");
    const tx = await ensRegistry.setSubnodeRecord(
      parentNode,           // Parent domain node
      subdomainLabel,       // Subdomain label hash
      signer.address,       // Owner (you)
      RESOLVER_ADDRESS,     // Resolver address
      0                     // TTL (0 = no expiry)
    );
    
    console.log("Transaction hash:", tx.hash);
    await tx.wait();
    
    console.log(`✅ Successfully created subdomain ${fullSubdomain} with resolver ${RESOLVER_ADDRESS}`);
    
    // Verify the setup
    const subdomainOwner = await ensRegistry.owner(subdomainNode);
    const subdomainResolver = await ensRegistry.resolver(subdomainNode);
    
    console.log('\n📋 Verification:');
    console.log(`Subdomain owner: ${subdomainOwner}`);
    console.log(`Subdomain resolver: ${subdomainResolver}`);
    
    if (subdomainResolver === RESOLVER_ADDRESS) {
      console.log("✅ Resolver set correctly!");
    } else {
      console.log("❌ Resolver not set correctly");
    }
    
  } catch (error) {
    console.error("❌ Error:", error.message);
    
    if (error.message.includes("execution reverted")) {
      console.log("\n💡 Possible issues:");
      console.log("1. You don't own the parent domain");
      console.log("2. Insufficient gas");
      console.log("3. Network issues");
      console.log("4. Contract interaction failed");
    }
  }
}

main().catch(console.error);
