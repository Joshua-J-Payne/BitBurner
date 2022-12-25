import { NS } from "@ns";
import { HWGW } from "classes/HWGW";
import { isPrepared, prioritizeServers } from "lib/batchlib";
import { BATCHDELAY, DEBUG, HACKAMOUNT, MAXBATCHES, PREPAREPORT, PREPARESCRIPT, SCRIPTS } from "lib/constants";
import { findAdminServers, waitBatches, waitPids } from "lib/utils";

/** @param {NS} ns */
export async function main(ns: NS) {
    ns.disableLog("ALL")
    const limit = (ns.args[0]) ? +ns.args[0] : MAXBATCHES

    // eslint-disable-next-line no-constant-condition
    while (true) {
        await ns.sleep(5)
        const flights = new Map<string, Batch[]>()
        const servers = findAdminServers(ns)
        const targets = prioritizeServers(ns, servers).slice(0, 6)
        const preparations = []
        ns.print(`INFO AUTOCTRL: Targeting ${targets}`)
        servers.forEach(s => ns.scp(Object.values(SCRIPTS), s))
        for (const t of targets)
            preparations.push(ns.exec(PREPARESCRIPT, "home", 1, t, ...servers))
        await waitPids(ns, preparations)
        let prepRes = ns.readPort(PREPAREPORT)
        if (prepRes === "NULL PORT DATA")
            ns.print(`SUCCESS PREP: Targets Prepared!`)
        else {
            do ns.print(prepRes), prepRes = ns.readPort(PREPAREPORT) 
            while(prepRes === "NULL PORT DATA")
        }

        for (const t of targets) {
            const batches: HWGW[] = []
            while (isPrepared(ns, t) && batches.length <= limit) {
                await ns.sleep(BATCHDELAY)
                const batch = new HWGW(ns, t, `HWGW-${t}-${batches.length}`, HACKAMOUNT)
                if (DEBUG) batch.log()
                if (!batch.deploy()) {
                    if (batches.length) flights.set(batches[0].id, batches)
                    ns.print(`WARN AUTOCTRL: RAM depleted!, Waiting on ${[...flights.keys()]}...`)
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