import { ScryptedDeviceBase, Online, OnOff, FloodSensor } from "@scrypted/sdk";
import { MoenBase } from "./MoenBase";

export class MoenWaterShutoff extends MoenBase implements OnOff, FloodSensor {
    constructor(nativeId?: string) {
        super(nativeId);
    }
    turnOff(): Promise<void> {
        throw new Error("Method not implemented.");
    }
    turnOn(): Promise<void> {
        throw new Error("Method not implemented.");
    }
}
