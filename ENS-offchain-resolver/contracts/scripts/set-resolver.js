const { ethers } = require("hardhat");

async function main() {
  // Get the deployed OffchainResolver address
  const resolverAddress = "0xeEe706A6Ef4a1f24827a58fB7bE6a07c6F219d1A";
  
  // Get the ENS Registry (it's already deployed on Sepolia)
  const ensRegistryAddress = "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e"; // Main ENS Registry
  const ensRegistry = await ethers.getContractAt("ENS", ensRegistryAddress);
  
  // Get the signer (your account)
  const [signer] = await ethers.getSigners();
  console.log("Setting resolver with account:", signer.address);
  
  // Domain to set resolver for (change this to your domain)
  const domainName = "yourdomain.eth"; // CHANGE THIS TO YOUR DOMAIN
  const namehash = ethers.utils.namehash(domainName);
  
  console.log(`Setting resolver for ${domainName} (${namehash}) to ${resolverAddress}`);
  
  try {
    // Set the resolver
    const tx = await ensRegistry.setResolver(namehash, resolverAddress, {
      from: signer.address
    });
    
    console.log("Transaction hash:", tx.hash);
    await tx.wait();
    
    console.log(`✅ Successfully set resolver for ${domainName}`);
    
    // Verify the resolver was set
    const currentResolver = await ensRegistry.resolver(namehash);
    console.log("Current resolver:", currentResolver);
    
  } catch (error) {
    console.error("Error setting resolver:", error.message);
    
    if (error.message.includes("execution reverted")) {
      console.log("\n💡 Possible issues:");
      console.log("1. You don't own this domain");
      console.log("2. Domain doesn't exist");
      console.log("3. You're not on the correct network (Sepolia)");
      console.log("4. Domain is already owned by someone else");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
