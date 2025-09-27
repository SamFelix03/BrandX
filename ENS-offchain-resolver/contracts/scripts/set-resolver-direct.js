const { ethers } = require("ethers");

async function main() {
  // Configuration
  const PRIVATE_KEY = "0x7a425200e31e8409c27abbc9aaae49a94c314426ef2e569d3a33ffc289a34e76";
  const RESOLVER_ADDRESS = "0xeEe706A6Ef4a1f24827a58fB7bE6a07c6F219d1A";
  const DOMAIN_NAME = "yourdomain.eth"; // CHANGE THIS TO YOUR DOMAIN
  
  // Sepolia RPC
  const provider = new ethers.providers.JsonRpcProvider("https://sepolia.infura.io/v3/b4880ead6a9a4f77a6de39dec6f3d0d0");
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  
  // ENS Registry ABI (minimal)
  const ensRegistryABI = [
    "function setResolver(bytes32 node, address resolver) external",
    "function resolver(bytes32 node) external view returns (address)"
  ];
  
  // ENS Registry address (same on all networks)
  const ensRegistryAddress = "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e";
  const ensRegistry = new ethers.Contract(ensRegistryAddress, ensRegistryABI, wallet);
  
  console.log("Setting resolver for domain:", DOMAIN_NAME);
  console.log("Resolver address:", RESOLVER_ADDRESS);
  console.log("Account:", wallet.address);
  
  const namehash = ethers.utils.namehash(DOMAIN_NAME);
  console.log("Namehash:", namehash);
  
  try {
    // Check current resolver
    const currentResolver = await ensRegistry.resolver(namehash);
    console.log("Current resolver:", currentResolver);
    
    if (currentResolver === RESOLVER_ADDRESS) {
      console.log("✅ Resolver is already set correctly!");
      return;
    }
    
    // Set the resolver
    console.log("Setting new resolver...");
    const tx = await ensRegistry.setResolver(namehash, RESOLVER_ADDRESS);
    console.log("Transaction hash:", tx.hash);
    
    console.log("Waiting for confirmation...");
    await tx.wait();
    
    console.log("✅ Successfully set resolver!");
    
    // Verify
    const newResolver = await ensRegistry.resolver(namehash);
    console.log("New resolver:", newResolver);
    
  } catch (error) {
    console.error("❌ Error:", error.message);
    
    if (error.message.includes("execution reverted")) {
      console.log("\n💡 Troubleshooting:");
      console.log("1. Make sure you own the domain:", DOMAIN_NAME);
      console.log("2. Check you're on Sepolia testnet");
      console.log("3. Verify the domain exists");
      console.log("4. Ensure you have enough ETH for gas");
    }
  }
}

main().catch(console.error);
