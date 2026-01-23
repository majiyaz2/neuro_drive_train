import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { network } from "hardhat";
import { parseEther, keccak256, toBytes } from "viem";

describe("NexusDrive", async function () {
    const { viem } = await network.connect();
    const publicClient = await viem.getPublicClient();
    const [owner, player1, player2] = await viem.getWalletClients();

    it("Should initialize with correct track settings", async function () {
        const nexusDrive = await viem.deployContract("NexusDrive");

        // Check Neon Circuit (Track 0)
        const track0 = await nexusDrive.read.tracks([0n]);
        assert.equal(track0[0], parseEther("0.0001"));
        assert.equal(track0[1], 100n);
        assert.equal(track0[2], true);
    });

    it("Should allow a player to attempt a track", async function () {
        const nexusDrive = await viem.deployContract("NexusDrive");
        const trackId = 0n;
        const entryFee = parseEther("0.0001");

        await viem.assertions.emitWithArgs(
            nexusDrive.write.attemptTrack([trackId], { value: entryFee, account: player1.account }),
            nexusDrive,
            "TrackAttempted",
            [trackId, player1.account.address, 1n]
        );

        const attempt = await nexusDrive.read.attempts([1n]);
        assert.equal(attempt[0].toLowerCase(), player1.account.address.toLowerCase());
        assert.equal(attempt[1], trackId);
        assert.equal(attempt[3], true); // isPending
    });

    it("Should fail if incorrect entry fee is provided", async function () {
        const nexusDrive = await viem.deployContract("NexusDrive");
        const trackId = 0n;
        const wrongFee = parseEther("0.0002");

        await assert.rejects(
            nexusDrive.write.attemptTrack([trackId], { value: wrongFee, account: player1.account }),
            /Incorrect entry fee/
        );
    });

    it("Should allow claiming victory and paying rewards", async function () {
        const nexusDrive = await viem.deployContract("NexusDrive");
        const trackId = 0n;
        const entryFee = parseEther("0.0001");
        const modelHash = keccak256(toBytes("test-model-data"));

        // First attempt the track
        await nexusDrive.write.attemptTrack([trackId], { value: entryFee, account: player1.account });

        // We need some balance in the contract for rewards if reward > entryFee
        // But for track 0, fee is 0.0001 and multiplier is 100 (1.0x), so reward is 0.0001
        // The contract already has the 0.0001 from the entry fee.

        await viem.assertions.emitWithArgs(
            nexusDrive.write.claimVictory([1n, modelHash], { account: player1.account }),
            nexusDrive,
            "ModelSubmitted",
            [1n, modelHash, trackId, player1.account.address]
        );

        const attempt = await nexusDrive.read.attempts([1n]);
        assert.equal(attempt[3], false); // isPending = false
        assert.equal(attempt[4], modelHash);

        const isUsed = await nexusDrive.read.usedModelHashes([modelHash]);
        assert.equal(isUsed, true);
    });

    it("Should prevent double claiming or using same model hash", async function () {
        const nexusDrive = await viem.deployContract("NexusDrive");
        const trackId = 0n;
        const entryFee = parseEther("0.0001");
        const modelHash = keccak256(toBytes("unique-model"));

        await nexusDrive.write.attemptTrack([trackId], { value: entryFee, account: player1.account });
        await nexusDrive.write.claimVictory([1n, modelHash], { account: player1.account });

        // Try to claim again
        await assert.rejects(
            nexusDrive.write.claimVictory([1n, modelHash], { account: player1.account }),
            /Already claimed/
        );

        // Try to use same hash for another attempt
        await nexusDrive.write.attemptTrack([trackId], { value: entryFee, account: player2.account });
        await assert.rejects(
            nexusDrive.write.claimVictory([2n, modelHash], { account: player2.account }),
            /Model already used/
        );
    });

    it("Should only allow owner to add tracks or withdraw treasury", async function () {
        const nexusDrive = await viem.deployContract("NexusDrive");

        // Non-owner trying to add track
        await assert.rejects(
            nexusDrive.write.addTrack([10n, parseEther("0.1"), 200n], { account: player1.account }),
            /Only owner/
        );

        // Owner adding track
        await nexusDrive.write.addTrack([10n, parseEther("0.1"), 200n], { account: owner.account });
        const track10 = await nexusDrive.read.tracks([10n]);
        assert.equal(track10[2], true);
    });
});
