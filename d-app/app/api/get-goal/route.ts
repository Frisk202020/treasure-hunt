// "use server";

// import { getData } from "@/app/actions";
// import { NextResponse } from "next/server";

// export async function GET(request: Request): Promise<NextResponse> {
//     const { searchParams } = new URL(request.url);
//     const address = searchParams.get("address"); const id = searchParams.get("id");
//     if (!address) {
//         return NextResponse.json({code: 0}, {status: 400});
//     }

//     const data = await getData();

//     const goal = data.goals[level - 1];
//     if (goal === undefined) {
//         return NextResponse.json({code: 2}, {status: 500});
//     } else {
//         return NextResponse.json({address: goal.address, value: goal.value, level});
//     }
// }