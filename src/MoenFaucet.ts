import { Battery, OnOff, Online, ScryptedDeviceBase, Thermometer } from "@scrypted/sdk";
import { MoenBase } from "./MoenBase";

export class MoenFaucet extends MoenBase implements OnOff, Battery, Thermometer {
    constructor(nativeId: string) {
        super(nativeId);
    }
}