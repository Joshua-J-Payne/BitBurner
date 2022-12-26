import { NS } from "@ns";
import { deployHWGW, isPrepared, prioritizeServers, waitAnyBatches } from "lib/batchlib";
import { BATCHMAX, PREPARESCRIPT, SERVERCOUNT } from "lib/constants";
import { getAdminServers } from "lib/utils";

/** @param {NS} ns */
export async function main(ns: NS) {
    ns.disableLog("ALL")
    const flags = ns.flags([['tail', false]])
    if (flags.tail) ns.tail()
    const servers = getAdminServers(ns)
    const targets = prioritizeServers(ns, servers).slice(0, SERVERCOUNT - 1)
    const flights = new Map<string, Batch[]>()
    // eslint-disable-next-line no-constant-condition
    while (true) {
        await ns.sleep(5)
        for (const t of targets) {
            if (ns.isRunning(PREPARESCRIPT, "home", t)) continue
            else if (!isPrepared(ns, t)) {
                ns.print(`INFO AUTOCTRL: Prepping ${t}`)
                ns.exec(PREPARESCRIPT, "home", 1, t)
            }
            //If we've already deployed a flight of batches, redeploy it
            else if (flights.has(t)) {
                const batches = flights.get(t)
                if (batches) {
                    await waitAnyBatches(ns, batches)
                    batches.forEach(b => {
                        if (!b.isDeployed()) {
                            ns.print(`INFO AUTOCTRL: Re-Attacking ${t}`)
                            b.deploy()
                        }
                    });
                }
            }
            //create and deploy new batches
            else {
                ns.print(`INFO AUTOCTRL: Attacking ${t}`)
                const batches = await deployHWGW(ns, t, BATCHMAX)
                flights.set(t, batches)
            }
        }
    }
}