import { NS } from "@ns";
import { deployHWGW, isPrepared, prioritizeServers } from "lib/batchlib";
import { BATCHMAX, HACKAMOUNT, PREPARESCRIPT, SERVERCOUNT } from "lib/constants";
import { getAdminServers } from "lib/utils";

/** @param {NS} ns */
export async function main(ns: NS) {
    ns.disableLog("ALL")
    const f = ns.flags([
        ["servers", SERVERCOUNT],
        ["hack", HACKAMOUNT],
        ["batches", BATCHMAX],
        ["tail", false],
    ])
    if (typeof f.servers !== 'number' || typeof f.hack !== 'number' || typeof f.batches !== 'number') {
        ns.tprint("ERROR Invalid input")
        ns.exit()
    }

    if (f.tail) ns.tail()

    const servers = getAdminServers(ns)
    const targets = prioritizeServers(ns, servers).slice(0, f.servers)
    const attacks = new Map<string, Batch[]>()
    // eslint-disable-next-line no-constant-condition
    while (true) {
        await ns.sleep(5)
        for (const t of targets) {
            //Check if prepped
            if (!isPrepared(ns, t) && !ns.isRunning(PREPARESCRIPT, "home", t) && !attacks.has(t)) {
                ns.print(`INFO AUTOCTRL: Prepping ${t}`)
                ns.exec(PREPARESCRIPT, "home", 1, t)
            }
            //Check if attack is finished
            else if (attacks.has(t)) {
                const batches = attacks.get(t)
                if (!batches || batches.some(b => b.isDeployed())) continue
                ns.print(`SUCCESS AUTOCTRL: Attack on ${t} complete!`)
                attacks.delete(t)
            }
            //Create and deploy new attack
            else {
                ns.print(`INFO AUTOCTRL: Attacking ${t}`)
                const batches = await deployHWGW(ns, t, f.batches, f.hack)
                attacks.set(t, batches)
            }
        }
    }
}