import { getData } from "@/app/actions";
import { NextResponse } from "next/server";

const BAD_REQUEST = NextResponse.json({},{status: 400});

export async function GET(request: Request) {
    const data = await getData();
    const params = new URL(request.url).searchParams;
    const id = params.get("id");
    if (!id) { return BAD_REQUEST; }

    const n = Number.parseInt(id);
    if (Number.isNaN(n)) { return BAD_REQUEST; }

    const key = data.getNonce(n);
    if (key === undefined) { return BAD_REQUEST; }
    return NextResponse.json({key: key},{status:200});
}