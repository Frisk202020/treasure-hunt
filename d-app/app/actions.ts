"use server";

import { readFileSync } from "fs";
import { Data } from "./util-public";
import { lock } from "proper-lockfile";

const FILE_PATH = "data.json";
const TEMP_FILE = "data.json.tmp";

export async function getData(): Promise<Data> {
    return buildData();
}

function buildData() {
    const data = readFileSync(FILE_PATH).toString();
    const json = JSON.parse(data);

    return new Data(json.goals);
}