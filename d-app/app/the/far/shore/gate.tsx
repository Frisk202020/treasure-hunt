import { createHash } from "crypto";
import { useSearchParams } from "next/navigation";
import FarShore from "./far_shore";
import Lost from "./lost";

const CORRECT_HASH = "abb764880ea7f113a40b2193ae320742a1f504e4508fb5a49863e351b04ecd36";

export default function Gate() {
    const params = useSearchParams();
    const key = params.get("key");
    if (!key) { return <Lost></Lost>; }

    const hash = createHash("sha256");
    const digest = hash.update(key!).digest("hex");
    return digest === CORRECT_HASH
        ? <FarShore></FarShore>
        : <Lost></Lost>;
}