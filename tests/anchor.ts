import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { assert } from "chai";
import { Anchor } from "../target/types/anchor";

describe("anchor", () => {
    // Configure the client to use the local cluster.
    const provider = anchor.AnchorProvider.env()
    anchor.setProvider(provider);

    const program = anchor.workspace.Anchor as Program<Anchor>;
    const userAccount1 = anchor.web3.Keypair.generate()
    const userAccount2 = anchor.web3.Keypair.generate()

    it("Initializing account 1", async () => {
        const tx = await program.methods
            .createAccount(userAccount1.publicKey)
            .accounts({
                account: userAccount1.publicKey,
            })
            .signers([userAccount1])
            .rpc();

        // console.log("Your transaction signature", tx);

        const account = await program.account.basicAccount.fetch(userAccount1.publicKey);
        assert.ok(account.balance.eq(new anchor.BN(10)));
        assert.ok(account.owner.equals(userAccount1.publicKey));
    });

    it("Initializing account 2", async () => {
        const tx = await program.methods
            .createAccount(userAccount2.publicKey)
            .accounts({
                account: userAccount2.publicKey,
            })
            .signers([userAccount2])
            .rpc();

        // console.log("Your transaction signature", tx);

        const account = await program.account.basicAccount.fetch(userAccount2.publicKey);
        assert.ok(account.balance.eq(new anchor.BN(10)));
        assert.ok(account.owner.equals(userAccount2.publicKey));
    })

    it("Transfer - ok", async () => {
        await program.methods
            .transfer(new anchor.BN(5))
            .accounts({
                senderAcc: userAccount1.publicKey,
                receiverAcc: userAccount2.publicKey,
            })
            .signers([userAccount1])
            .rpc()

        const account1 = await program.account.basicAccount.fetch(userAccount1.publicKey);
        assert.ok(account1.balance.eq(new anchor.BN(5)));

        const account2 = await program.account.basicAccount.fetch(userAccount2.publicKey);
        assert.ok(account2.balance.eq(new anchor.BN(15)));
    })

    it("Transfer - InsufficientFunds", async () => {
        try {
            await program.methods
                .transfer(new anchor.BN(10))
                .accounts({
                    senderAcc: userAccount1.publicKey,
                    receiverAcc: userAccount2.publicKey,
                })
                .signers([userAccount1])
                .rpc()
        } catch (err) {
            assert.ok(err.error.errorCode.code, "InsufficientFunds")
            return
        }

        assert.fail("Expected InsufficientFunds error");
    })

    it("Transfer - Unauthorized", async () => {
        try {
            await program.methods
                .transfer(new anchor.BN(5))
                .accounts({
                    senderAcc: userAccount1.publicKey,
                    receiverAcc: userAccount2.publicKey,
                })
                .signers([userAccount2])
                .rpc()

        } catch (err) {
            assert.ok(err)
            return
        }

        assert.fail("Expected error");
    })
});
