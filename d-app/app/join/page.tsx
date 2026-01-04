import { getData } from "../actions";
import Client from "./client";

export default async function Join() {
    const data = await getData();
    const pot = data.totalPot(); const addresses = data.addressSet();
    return <>
        <p>Join the hunt to win up to {pot} Wei !!</p>
        <p>
            To join this treasure hunt, you'll need to claim a <span className="rainbow-text">Hunt ticket</span>, 
            which has an entry fee of <i>10 Wei</i>.
        </p>
        <Client registeredAddresses={addresses}></Client>
    </>
}