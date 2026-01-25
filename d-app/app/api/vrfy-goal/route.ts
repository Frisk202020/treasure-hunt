"use server";

import { getData } from "@/app/actions";
import { NextResponse } from "next/server";
import { ErrorCodes } from "../public";

export async function POST(request: Request) {
    const data = await getData();
    const params = await request.json();

    if (params.nonce === undefined || params.goalId === undefined) {
        return NextResponse.json(
            {code: ErrorCodes.UndefinedParams}, 
            {status: 500}
        );
    } 
    const nonce = Number.parseInt(params.nonce); const goal = Number.parseInt(params.goalId);
    if (Number.isNaN(nonce) || Number.isNaN(goal)) { return NextResponse.json(
        {code: ErrorCodes.InvalidParams},
        {status: 400}
    ); }

    if (goal >= data.goals.length) {
        return NextResponse.json(
            {code: ErrorCodes.InvalidId}, {status: 400}
    ); } 

    if (!data.checkNonce(goal, nonce)) {
        return NextResponse.json({code: ErrorCodes.Wrong}, {status: 409});
    }

    return NextResponse.json({}, {status: 200});
}