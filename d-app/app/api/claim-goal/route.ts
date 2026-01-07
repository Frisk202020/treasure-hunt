"use server";

import { getData, upgradeTicket } from "@/app/actions";
import { CHAIN_ID, MutateResult } from "@/app/util-public";
import { Interface } from "ethers";
import { TransactionRequest } from "ethers";
import { Wallet } from "ethers";
import { JsonRpcProvider } from "ethers";
import { NextResponse } from "next/server";

const API_KEY = "a553adfcc37a4857a76e7e472157bd77";
const PROVIDER_URL = `https://sepolia.infura.io/v3/${API_KEY}`;
const ABI = new Interface(["function claim(address user)"]);
const LOG_ABI = new Interface(["event GoalClaimed(address goal, address winner"]);

export async function POST(request: Request) {
    const data = await getData();
    const params = await request.json();

    if (params.address === undefined || params.nonce === undefined || params.level === undefined) {
        return NextResponse.json({code: 0}, {status: 400});
    } 

    const goalId = params.level - 1;
    if (data.goals[goalId] === undefined) {
        return NextResponse.json({code: 1}, {status: 400});
    } 
    
    const userLevel = data.getTicketLevel(params.address);
    if (userLevel === -1) {
        return NextResponse.json({code: 2}, {status: 409});
    } if (userLevel !== params.level) {
        return NextResponse.json({code: 3}, {status: 409});
    }

    if (params.nonce !== data.getNonce(goalId)) {
        return NextResponse.json({code: 4}, {status: 409});
    }

    const provider = new JsonRpcProvider(PROVIDER_URL);
    const wallet = new Wallet(data.key, provider);
    const tx: TransactionRequest = {
        chainId: CHAIN_ID,
        to: data.goals[goalId].address,
        from: data.address,
        value: 0,
        data: ABI.encodeFunctionData("claim", [params.address])
    };

    const res = await wallet.sendTransaction(tx);
    const receipt = await res.wait();

    if (!receipt) {
        return NextResponse.json({code: 5}, {status: 417});
    }

    if (receipt.logs.length === 0) {
        return NextResponse.json({win: false}, {status: 200});
    }

    const log = LOG_ABI.parseLog(receipt.logs[0]);
    if (!log) {
        return NextResponse.json({code: 6}, {status: 417});
    }

    if (log.args.getValue("winner") === params.address) {
        try {
            const res = await upgradeTicket(params.address);
            switch (res) {
                case MutateResult.Ok: return NextResponse.json({win: true}, {status: 200});
                case MutateResult.Busy: return NextResponse.json({code: 9}, {status: 500});
                case MutateResult.Unknown: return NextResponse.json({code: 10}, {status: 500});
            }
        } catch(err) {
            return NextResponse.json({code: 8}, {status: 417});
        }
    } else {
        return NextResponse.json({code: 7}, {status: 417});
    }
}