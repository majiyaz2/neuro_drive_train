import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const NexusDriveModule = buildModule("NexusDriveModule", (m) => {
    const nexusDrive = m.contract("NexusDrive");

    return { nexusDrive };
});

export default NexusDriveModule;
