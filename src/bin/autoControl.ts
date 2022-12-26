import { NS } from "@ns";
import { deployHWGW, isPrepared, prioritizeServers } from "lib/batchlib";
import { BATCHMAX, PREPARESCRIPT, SERVERCOUNT } from "lib/constants";
import { getAdminServers } from "lib/utils";

/** @param {NS} ns */
export async function main(ns: NS) {
    ns.disableLog("ALL")
    const servers = getAdminServers(ns)
    const targets = prioritizeServers(ns, servers).slice(0, SERVERCOUNT - 1)
    const flights = new Map<string, Batch[]>()
    // eslint-disable-next-line no-constant-condition
    while (true) {
        await ns.sleep(5)
        for (const t of targets) {
            //If the prep script is running, check the next target
            if (ns.isRunning(PREPARESCRIPT, "home", t)) continue
            //If unprepared, prepare target
            else if (!isPrepared(ns, t)) {
                ns.exec(PREPARESCRIPT, "home", 1, t)
            }
            //If we've already deployed a flight of batches, redeploy
            else if (flights.has(t)) {
                const batches = flights.get(t)
                if (batches) batches.forEach(b => b.deploy())
            }
            //create and deploy new batches
            else {
                const batches = await deployHWGW(ns, t, BATCHMAX)
                flights.set(t, batches)
            }
        }
    }
}