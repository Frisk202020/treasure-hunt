"use server";

import { getData } from "@/app/actions";
import { NextResponse } from "next/server";

const INVALID = NextResponse.json({code: 0}, {status: 400});

export async function POST(request: Request) {
    const data = await getData();
    const params = await request.json();

    if (params.address === undefined || params.nonce === undefined || params.goalId === undefined) {
        return INVALID;
    } 
    const nonce = Number.parseInt(params.nonce); const goal = Number.parseInt(params.goalId);
    if (Number.isNaN(nonce) || Number.isNaN(goal)) { return INVALID; }

    if (data.goals[params.goalId] === undefined) {
        return NextResponse.json({code: 1}, {status: 400});
    } 

    if (params.nonce !== data.checkNonce(params.goalId, params.nonce)) {
        return NextResponse.json({code: 4}, {status: 409});
    }

    return NextResponse.json({}, {status: 200});
}