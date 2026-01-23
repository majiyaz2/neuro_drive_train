// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/**
 * @title NexusDrive
 * @dev Smart contract for autonomous driving track betting and model verification.
 */
contract NexusDrive {
    struct Track {
        uint256 entryFee;
        uint256 rewardMultiplier; // Basis points (100 = 1.0x, 250 = 2.5x)
        bool isActive;
    }

    struct Attempt {
        address player;
        uint256 trackId;
        uint256 blockNumber;
        bool isPending;
        bytes32 modelHash;
    }

    address public owner;
    mapping(uint256 => Track) public tracks;
    mapping(bytes32 => bool) public usedModelHashes;

    uint256 public totalAttempts;
    mapping(uint256 => Attempt) public attempts;

    event TrackAttempted(
        uint256 indexed trackId,
        address indexed player,
        uint256 attemptId
    );
    event ModelSubmitted(
        uint256 indexed attemptId,
        bytes32 indexed modelHash,
        uint256 trackId,
        address player
    );
    event RewardPaid(address indexed player, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    constructor() {
        owner = msg.sender;

        // Initialize tracks from staging/page.tsx (Fees reduced 100x)
        tracks[0] = Track(0.0001 ether, 100, true); // Neon Circuit: 1.0x
        tracks[1] = Track(0.0002 ether, 250, true); // Brutal Desert: 2.5x
        tracks[2] = Track(0.00015 ether, 180, true); // Cyber Jungle: 1.8x
        tracks[3] = Track(0.0001 ether, 220, true); // Acid Raid: 2.2x
        tracks[4] = Track(0.0005 ether, 500, true); // Giga Void: 5.0x
    }

    function attemptTrack(uint256 trackId) external payable {
        Track memory track = tracks[trackId];
        require(track.isActive, "Track not active");
        require(msg.value == track.entryFee, "Incorrect entry fee");

        totalAttempts++;
        attempts[totalAttempts] = Attempt({
            player: msg.sender,
            trackId: trackId,
            blockNumber: block.number,
            isPending: true,
            modelHash: bytes32(0)
        });

        emit TrackAttempted(trackId, msg.sender, totalAttempts);
    }

    function claimVictory(uint256 attemptId, bytes32 modelHash) external {
        Attempt storage attempt = attempts[attemptId];
        require(attempt.player == msg.sender, "Not your attempt");
        require(attempt.isPending, "Already claimed");
        require(!usedModelHashes[modelHash], "Model already used");

        attempt.modelHash = modelHash;
        usedModelHashes[modelHash] = true;
        attempt.isPending = false;

        Track memory track = tracks[attempt.trackId];
        uint256 reward = (track.entryFee * track.rewardMultiplier) / 100;

        require(address(this).balance >= reward, "Insufficient treasury");
        payable(msg.sender).transfer(reward);

        emit ModelSubmitted(attemptId, modelHash, attempt.trackId, msg.sender);
        emit RewardPaid(msg.sender, reward);
    }

    receive() external payable {}

    function withdrawTreasury(uint256 amount) external onlyOwner {
        payable(owner).transfer(amount);
    }

    function addTrack(
        uint256 id,
        uint256 fee,
        uint256 multiplier
    ) external onlyOwner {
        tracks[id] = Track(fee, multiplier, true);
    }
}
