import { NS } from "@ns";
import { SERVERCOUNT } from "lib/constants";
import { prioritizeServers } from "lib/batchlib";
import { getServers } from "lib/utils";

export async function main(ns: NS): Promise<void> {
  let [count] = ns.args
    if(!count) count = SERVERCOUNT
    const targets = prioritizeServers(ns, getServers(ns))
    for(let i = 0; i < count; i++)
        ns.tprint(`${targets[i]} - ${ns.getServerMaxMoney(targets[i]).toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD',})}`)
}
