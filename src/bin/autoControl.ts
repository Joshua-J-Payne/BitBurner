import { NS } from "@ns";
import { HWGW } from "classes/HWGW";
import { BATCHDELAY, DEBUG, HACKAMOUNT, MAXBATCHES } from "lib/constants";
import { findAdminServers, isPrepared, waitBatches } from "lib/utils";
import { prepareServer, prioritizeServers } from "lib/batchlib";

/** @param {NS} ns */
export async function main(ns: NS) {
    ns.disableLog("ALL")
    const limit = (ns.args[0]) ? +ns.args[0] : MAXBATCHES

    // eslint-disable-next-line no-constant-condition
    while (true) {
        await ns.sleep(5)
        const servers = findAdminServers(ns)
        const targets = prioritizeServers(ns, servers)
        const flights = new Map<string, Batch[]>()

        for (const t of targets) {
            ns.print(`INFO AUTOCTRL: Targeting ${t}`)
            await prepareServer(ns, t, servers)
            const batches: HWGW[] = []
            while (isPrepared(ns, t) && batches.length <= limit) {
                await ns.sleep(BATCHDELAY)
                const batch = new HWGW(ns, t, `HWGW-${batches.length}`, HACKAMOUNT)
                if (DEBUG) batch.log()
                if (!batch.deploy()) {
                    if (batches.length) flights.set(batches[0].id, batches)
                    ns.print(`WARN AUTOCTRL: RAM depleted!, Waiting on attacks of ${flights.keys()}...`)
                    for (const f of flights.values()) await waitBatches(ns, f)
                }
                else batches.push(batch)
            }
            if (!isPrepared(ns, t)) {
                ns.print(`ERROR AUTOCTRL: ${t} no longer prepared! stopping...`)
                ns.exit()
            }
            flights.set(batches[0].id, batches)
        }
    }
}