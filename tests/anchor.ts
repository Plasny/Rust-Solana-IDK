import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { assert } from "chai";
import { Anchor } from "../target/types/anchor";

const SEED_PREFIX = "user_acc";

const sleep = async (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

describe("anchor", () => {
    // Configure the client to use the local cluster.
    const provider = anchor.AnchorProvider.env()
    anchor.setProvider(provider);

    const program = anchor.workspace.Anchor as Program<Anchor>;

    const user1 = anchor.web3.Keypair.generate()
    const user2 = anchor.web3.Keypair.generate()

    const [user2pda] = anchor.web3.PublicKey.findProgramAddressSync(
        [anchor.utils.bytes.utf8.encode(SEED_PREFIX), user2.publicKey.toBuffer()],
        program.programId
    )

    const [user1pda] = anchor.web3.PublicKey.findProgramAddressSync(
        [anchor.utils.bytes.utf8.encode(SEED_PREFIX), user1.publicKey.toBuffer()],
        program.programId
    )

    before(async () => {
        // //AirDrop
        await provider.connection.requestAirdrop(user1.publicKey, 10000000000)
        await provider.connection.requestAirdrop(user2.publicKey, 10000000000)
        await sleep(500)
    })

    it("Initializing account 1", async () => {
        await program.methods
            .createAccount()
            .accounts({
                authority: user1.publicKey,
                account: user1pda,
            })
            .signers([user1])
            .rpc();

        const account = await program.account.basicAccount.fetch(user1pda);
        assert.ok(account.balance.eq(new anchor.BN(10)));
    });

    it("Initializing account 2", async () => {
        await program.methods
            .createAccount()
            .accounts({
                authority: user2.publicKey,
                account: user2pda,
            })
            .signers([user2])
            .rpc();

        const account = await program.account.basicAccount.fetch(user2pda);
        assert.ok(account.balance.eq(new anchor.BN(10)));
    })

    it("Transfer - ok", async () => {
        await program.methods
            .transfer(new anchor.BN(5))
            .accounts({
                sender: user1.publicKey,
                senderAcc: user1pda,
                receiverAcc: user2pda,
            })
            .signers([user1])
            .rpc()

        const account1 = await program.account.basicAccount.fetch(user1pda);
        assert.ok(account1.balance.eq(new anchor.BN(5)));

        const account2 = await program.account.basicAccount.fetch(user2pda);
        assert.ok(account2.balance.eq(new anchor.BN(15)));
    })

    it("Transfer - InsufficientFunds", async () => {
        try {
            await program.methods
                .transfer(new anchor.BN(10))
                .accounts({
                    sender: user1.publicKey,
                    senderAcc: user1pda,
                    receiverAcc: user2pda,
                })
                .signers([user1])
                .rpc()
        } catch (err) {
            if (err.error) {
                assert.ok(err.error.errorCode.code, "InsufficientFunds")
                return
            } else {
                console.error(err)
                assert.fail("Other error");
            }
        }

        assert.fail("Expected InsufficientFunds error");
    })

    it("Transfer - Unauthorized", async () => {
        try {
            await program.methods
                .transfer(new anchor.BN(5))
                .accounts({
                    senderAcc: user1.publicKey,
                    receiverAcc: user2.publicKey,
                })
                .signers([user2])
                .rpc()

        } catch (err) {
            assert.ok(err)
            return
        }

        assert.fail("Expected error");
    })
});
