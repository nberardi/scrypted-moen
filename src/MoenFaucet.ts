import { Battery, OnOff, Online, ScryptedDeviceBase, TemperatureUnit, Thermometer } from "@scrypted/sdk";
import { MoenBase } from "./MoenBase";

export class MoenFaucet extends MoenBase implements OnOff, Battery, Thermometer {
    constructor(nativeId: string) {
        super(nativeId);
    }
    setTemperatureUnit(temperatureUnit: TemperatureUnit): Promise<void> {
        throw new Error("Method not implemented.");
    }
    turnOff(): Promise<void> {
        throw new Error("Method not implemented.");
    }
    turnOn(): Promise<void> {
        throw new Error("Method not implemented.");
    }
}