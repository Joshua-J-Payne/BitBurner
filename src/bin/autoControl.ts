import { NS } from "@ns";
import { deployHWGW, isPrepared, prioritizeServers } from "lib/batchlib";
import { BATCHMAX, PREPARESCRIPT, SERVERCOUNT } from "lib/constants";
import { getAdminServers } from "lib/utils";

/** @param {NS} ns */
export async function main(ns: NS) {
    ns.disableLog("ALL")
    const flags = ns.flags([['tail', false]])
    if (flags.tail) ns.tail()

    const servers = getAdminServers(ns)
    const targets = prioritizeServers(ns, servers).slice(0, SERVERCOUNT)
    const attacks = new Map<string, Batch[]>()
    // eslint-disable-next-line no-constant-condition
    while (true) {
        await ns.sleep(5)
        for (const t of targets) {
            if (!isPrepared(ns, t)) {
                if (ns.isRunning(PREPARESCRIPT, "home", t)) continue
                ns.print(`INFO AUTOCTRL: Prepping ${t}`)
                ns.exec(PREPARESCRIPT, "home", 1, t)
            }
            //Erase attack
            else if (attacks.has(t)) {
                const batches = attacks.get(t)
                if (!batches || batches.some(b => b.isDeployed())) continue
                ns.print(`SUCCESS AUTOCTRL: Attack on ${t} complete!`)
                attacks.delete(t)
            }
            //Create and deploy new attack
            else {
                ns.print(`INFO AUTOCTRL: Attacking ${t}`)
                const batches = await deployHWGW(ns, t, BATCHMAX)
                attacks.set(t, batches)
            }
        }
    }
}