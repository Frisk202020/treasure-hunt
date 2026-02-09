"use server";

import { readFileSync } from "fs";
import { Data } from "./util-public";

const FILE_PATH = "data.json";

export async function getData(): Promise<Data> {
    return buildData();
}

function buildData() {
    const data = readFileSync(FILE_PATH).toString();
    const json = JSON.parse(data);

    return new Data(json.bank, json.goals);
}