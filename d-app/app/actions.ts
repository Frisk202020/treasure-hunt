"use server";

import { readFileSync, renameSync, writeFileSync } from "fs";
import { Data, MutateResult } from "./util-public";
import { lock } from "proper-lockfile";

const FILE_PATH = "data.json";
const TEMP_FILE = "data.json.tmp";

export async function getData(): Promise<Data> {
    return buildData();
}

export async function tryAddTicket(address: string): Promise<MutateResult> {
    const data = buildData().addAddressAndFormat(address);

    try {
        const release = await lock(FILE_PATH, {retries: 0});

        if (process.platform === "win32") {
            writeFileSync(FILE_PATH, data);
        } else {
            writeFileSync(TEMP_FILE, data);
            renameSync(TEMP_FILE, FILE_PATH);
        }

        await release();
        return MutateResult.Ok;
    } catch (err) {
        if (err instanceof Error && (err as any).code === "ELOCKED") {
            return MutateResult.Busy;
        } else {
            return MutateResult.Unknown;
        }
    }
}

function buildData() {
    const data = readFileSync(FILE_PATH).toString();
    const json = JSON.parse(data);

    return new Data(json.goals, json.tickets);
}