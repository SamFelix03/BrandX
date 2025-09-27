const { ethers } = require("hardhat");

async function main() {
  // Configuration
  const PARENT_DOMAIN = "fablelands.xyz"; // Change this to your parent domain
  const SUBDOMAINS = ["alice", "bob", "charlie", "diana"]; // Subdomains to create
  const RESOLVER_ADDRESS = "0xeEe706A6Ef4a1f24827a58fB7bE6a07c6F219d1A"; // Your OffchainResolver
  const ENS_REGISTRY_ADDRESS = "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e";
  
  // Get the signer (must be the owner of the parent domain)
  const [signer] = await ethers.getSigners();
  console.log("Creating subdomains with account:", signer.address);
  
  // ENS Registry ABI
  const ensRegistryABI = [
    "function setSubnodeRecord(bytes32 node, bytes32 label, address owner, address resolver, uint64 ttl) external",
    "function resolver(bytes32 node) external view returns (address)",
    "function owner(bytes32 node) external view returns (address)"
  ];
  
  const ensRegistry = new ethers.Contract(ENS_REGISTRY_ADDRESS, ensRegistryABI, signer);
  
  // Calculate parent node
  const parentNode = ethers.utils.namehash(PARENT_DOMAIN);
  
  console.log(`Parent domain: ${PARENT_DOMAIN}`);
  console.log(`Parent node: ${parentNode}`);
  console.log(`Resolver address: ${RESOLVER_ADDRESS}`);
  console.log(`Subdomains to create: ${SUBDOMAINS.join(", ")}`);
  console.log('');
  
  try {
    // Check if you own the parent domain
    const parentOwner = await ensRegistry.owner(parentNode);
    console.log(`Parent domain owner: ${parentOwner}`);
    
    if (parentOwner.toLowerCase() !== signer.address.toLowerCase()) {
      console.log("❌ You don't own the parent domain. You need to own the parent domain to create subdomains.");
      return;
    }
    
    console.log("✅ You own the parent domain, proceeding...");
    console.log('');
    
    // Create each subdomain
    for (const subdomain of SUBDOMAINS) {
      console.log(`Creating ${subdomain}.${PARENT_DOMAIN}...`);
      
      const subdomainLabel = ethers.utils.id(subdomain);
      const fullSubdomain = `${subdomain}.${PARENT_DOMAIN}`;
      const subdomainNode = ethers.utils.namehash(fullSubdomain);
      
      try {
        const tx = await ensRegistry.setSubnodeRecord(
          parentNode,           // Parent domain node
          subdomainLabel,       // Subdomain label hash
          signer.address,       // Owner (you)
          RESOLVER_ADDRESS,     // Resolver address
          0                     // TTL (0 = no expiry)
        );
        
        console.log(`  Transaction hash: ${tx.hash}`);
        await tx.wait();
        
        // Verify
        const subdomainResolver = await ensRegistry.resolver(subdomainNode);
        if (subdomainResolver === RESOLVER_ADDRESS) {
          console.log(`  ✅ ${fullSubdomain} created successfully`);
        } else {
          console.log(`  ❌ ${fullSubdomain} resolver not set correctly`);
        }
        
      } catch (error) {
        console.log(`  ❌ Failed to create ${fullSubdomain}: ${error.message}`);
      }
      
      console.log('');
    }
    
    console.log('🎉 Subdomain creation process completed!');
    
    // Summary verification
    console.log('\n📋 Final Verification:');
    for (const subdomain of SUBDOMAINS) {
      const fullSubdomain = `${subdomain}.${PARENT_DOMAIN}`;
      const subdomainNode = ethers.utils.namehash(fullSubdomain);
      
      try {
        const subdomainResolver = await ensRegistry.resolver(subdomainNode);
        const status = subdomainResolver === RESOLVER_ADDRESS ? "✅" : "❌";
        console.log(`${status} ${fullSubdomain} -> ${subdomainResolver}`);
      } catch (error) {
        console.log(`❌ ${fullSubdomain} -> Error checking`);
      }
    }
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

main().catch(console.error);
