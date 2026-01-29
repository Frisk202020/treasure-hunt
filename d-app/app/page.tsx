import { getData } from "./actions";
import "./globals.css";

// TODO - CRITICAL : store key digest in hot storage (data.json) instead of plaintext key

// TODO - /hints route

export default async function Home() {
  const data= await getData();

  return <>
    <h1 className="rainbow">Welcome to Treasure Hunt !</h1>
    
    <div id="main">
      <p>In this game, you'll need to find codes by solving puzzles accross the internet.</p>
      <p>Once you're the first to claim a <span className="gold">Hunt goal</span>, you'll win a cashprize !</p>
      <p>This hunt is held on the Ethereum blockchain, winners receive Ether directly sent to their wallet.</p>
      <p>In this current hunt, total cashprize is <span className="gold">{data.totalPot()}</span> Wei.</p>

      <p className="more-margin">If you'd like to join the hunt, you can head to the <a href="join" className="blue">Join the Hunt</a> page.</p>
      <p>When you find a goal, you can claim a prize in the <a href="goals" className="blue">Claim a Hunt goal</a> page.</p>
      <p>And you can find guidelines to find goals in the <a href="hints" className="blue">Hints</a> page.</p>

      <p>Have fun !</p>
    </div>
  </>
}
