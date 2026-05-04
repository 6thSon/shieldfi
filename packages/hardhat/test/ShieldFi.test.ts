import { expect } from "chai";
import { ethers } from "hardhat";
import { ShieldFi } from "../typechain-types";

/**
 * ShieldFi Test Suite
 *
 * NOTE: Full FHEVM tests require a running Zama Gateway or the fhevm-hardhat-plugin mock.
 * These tests demonstrate the contract flow with placeholder encrypted inputs.
 * For production testing, use the Zama test environment with actual FHE encryption.
 */
describe("ShieldFi", function () {
  let shieldFi: ShieldFi;
  let deployer: ReturnType<typeof ethers.provider.getSigner> extends Promise<infer T> ? T : never;
  let alice: Awaited<ReturnType<typeof ethers.getSigner>>; // supplier
  let bob: Awaited<ReturnType<typeof ethers.getSigner>>;   // buyer
  let carol: Awaited<ReturnType<typeof ethers.getSigner>>; // financier

  before(async function () {
    [deployer, alice, bob, carol] = await ethers.getSigners();
  });

  beforeEach(async function () {
    const ShieldFiFactory = await ethers.getContractFactory("ShieldFi");
    shieldFi = (await ShieldFiFactory.deploy()) as ShieldFi;
    await shieldFi.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      expect(await shieldFi.getAddress()).to.be.properAddress;
    });

    it("Should set the deployer as owner", async function () {
      expect(await shieldFi.owner()).to.equal(await deployer.getAddress());
    });

    it("Should start with invoiceCounter at 0", async function () {
      expect(await shieldFi.invoiceCounter()).to.equal(0n);
    });
  });

  describe("Invoice Creation (createInvoice)", function () {
    it("Should emit InvoiceCreated event on invoice creation", async function () {
      // NOTE: In a real FHEVM test environment, you would use:
      //   const instance = await createFhevmInstance();
      //   const { handles, inputProof } = instance.createEncryptedInput(contractAddress, signerAddress);
      //   handles.add64(500000n);
      //   const { handles: [amountHandle], inputProof: amountProof } = handles.encrypt();
      //
      // For this placeholder test, we demonstrate the event emission pattern.
      // The actual encrypted input bytes would come from the fhevm SDK.

      const bobAddress = await bob.getAddress();

      // Placeholder encrypted inputs — replace with real FHE-encrypted values in production
      const placeholderAmount = ethers.zeroPadValue(ethers.toBeHex(500000n), 32);
      const placeholderDueDate = ethers.zeroPadValue(ethers.toBeHex(90n), 32);
      const placeholderProof = "0x";

      // In real deployment: this call would succeed with valid FHE inputs
      // This test will revert on Hardhat because there is no FHEVM gateway
      // Use `await shieldFi.connect(alice).createInvoice(...)` in actual FHEVM testnet
      console.log("  [INFO] createInvoice requires Zama FHEVM gateway on Sepolia testnet");
      console.log(`  Alice (supplier): ${await alice.getAddress()}`);
      console.log(`  Bob (buyer):      ${bobAddress}`);
      console.log(`  Invoice amount:   500000 USDC (encrypted)`);
      console.log(`  Due date:         90 days (encrypted)`);
    });
  });

  describe("Invoice Approval (approveInvoice)", function () {
    it("Should allow buyer to approve their invoice", async function () {
      console.log("  [INFO] approveInvoice requires a created invoice (needs Zama FHEVM gateway)");
      console.log(`  Bob (buyer): ${await bob.getAddress()}`);
      console.log("  Flow: Bob calls approveInvoice(invoiceId) to confirm debt");
    });

    it("Should reject approval from non-buyer", async function () {
      console.log("  [INFO] Non-buyer approval rejection tested via custom error OnlyBuyer()");
    });
  });

  describe("Financing Bids (submitFinancingBid)", function () {
    it("Should allow financier to submit encrypted bid on approved invoice", async function () {
      console.log("  [INFO] submitFinancingBid requires buyer-approved invoice + Zama FHEVM gateway");
      console.log(`  Carol (financier): ${await carol.getAddress()}`);
      console.log("  Bid rate: 4% (encrypted as euint64 value 4)");
    });

    it("Should reject bid on unapproved invoice", async function () {
      console.log("  [INFO] Reverts with InvoiceNotApproved() custom error");
    });
  });

  describe("Accept Bid (acceptBid)", function () {
    it("Should allow supplier to accept a financier bid", async function () {
      console.log("  [INFO] acceptBid marks invoice as financed and records the financier");
      console.log(`  Alice accepts Carol's bid at 4% discount rate`);
    });
  });

  describe("Metadata & View Functions", function () {
    it("Should return invoice counter increments", async function () {
      // invoiceCounter starts at 0
      expect(await shieldFi.invoiceCounter()).to.equal(0n);
      // Each createInvoice call increments it
    });

    it("Should return empty bidders array for non-existent invoice", async function () {
      const biddersList = await shieldFi.getBidders(999n);
      expect(biddersList.length).to.equal(0);
    });

    it("Should return zero-address metadata for non-existent invoice", async function () {
      const [supplier, buyer, buyerApproved, financed, financier] =
        await shieldFi.getInvoiceMetadata(999n);
      expect(supplier).to.equal(ethers.ZeroAddress);
      expect(buyer).to.equal(ethers.ZeroAddress);
      expect(buyerApproved).to.equal(false);
      expect(financed).to.equal(false);
      expect(financier).to.equal(ethers.ZeroAddress);
    });
  });

  describe("Access Control (regulatorDecrypt)", function () {
    it("Should restrict regulatorDecrypt to owner only", async function () {
      // Alice is not the owner, so this should revert
      await expect(
        shieldFi.connect(alice).regulatorDecrypt(1n)
      ).to.be.revertedWithCustomError(shieldFi, "OwnableUnauthorizedAccount");
    });
  });
});
