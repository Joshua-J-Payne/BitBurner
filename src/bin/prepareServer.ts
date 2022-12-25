import { NS } from "@ns";
import { GW } from "classes/GW";
import { calcGrows, calcWeakens, isGrown, isPrepared, isWeakened } from "lib/batchlib";
import { DEBUG, PREPAREPORT, SCRIPTS } from "lib/constants";
import { deployScript, totalAvailableThreads, waitBatches, waitPids } from "lib/utils";

export async function main(ns: NS): Promise<void> {
    ns.disableLog("ALL")
    const [target, ...serverargs] = ns.args 
    const servers = serverargs.map(a => a.toString()) 
    if (typeof target !== "string" || !ns.serverExists(target)) {
        ns.tprint("ERROR PREP: Invalid Target!")
    }
    else {
        const prepared = await prepareServer(ns, target, servers)
        !prepared ? ns.writePort(PREPAREPORT, `ERROR PREP: ${target} Failed!`) : {}
    }
}
async function prepareServer(ns: NS, target: string, servers: string[]) {

    //Initial Weaken
    const pids = []
    while (!isWeakened(ns, target)) {
        const requiredWeakens = calcWeakens(ns, target)
        ns.print(`INFO PREP: Weakening server with ${requiredWeakens} threads...`)
        const deployedThreads = Math.min(totalAvailableThreads(ns, servers, SCRIPTS.WEAKEN), requiredWeakens)
        pids.push(...deployScript(
            ns,
            SCRIPTS.WEAKEN,
            deployedThreads,
            servers,
            target,
            "0"))
        await waitPids(ns, pids)
    }

    //GW Batches
    let batches: GW[] = []
    while (!isGrown(ns, target)) {
        const requiredGrows = calcGrows(ns, target)
        ns.print(`INFO PREP: Making ${requiredGrows} GW Batches...`)
        for (let i = 0; i < requiredGrows; i++) {
            const batch = new GW(ns, target, `GW-${target}-${i}`)
            if (!batch.deploy()) {
                ns.print(`WARN PREP: Cannot deploy batch, waiting...`)
                await waitBatches(ns, batches)
                batches = []
            }
            else batches.push(batch)
            if (DEBUG) batch.log()
        }
        await waitBatches(ns, batches)

    }
    return isPrepared(ns, target)
}






