import { NS } from "@ns";
import { GW } from "classes/GW";
import { deployGW, isGrown, isPrepared, isWeakened, waitBatches } from "lib/batchlib";
import { GROWTHAMOUNT, SCRIPTS } from "lib/constants";
import { deployScript, getAdminServers, totalAvailableThreads, waitPids } from "lib/utils";

export async function main(ns: NS): Promise<void> {
    ns.disableLog("ALL")
    const target = ns.args[0].toString()
    const servers = getAdminServers(ns)
    await prepareServer(ns, target, servers)
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

    //GW Batch
    while (!isGrown(ns, target)) {
        ns.print(`INFO PREP: Trying single GW batch on ${target}...`)
        let batch = undefined
        const maxMoney = ns.getServerMaxMoney(target)
        if (maxMoney === 0)
            batch = new GW(ns, target, `GW-${target}-0`)
        else {
            const growAmount = maxMoney / ns.getServerMoneyAvailable(target)
            batch = new GW(ns, target, `GW-${target}-0`, growAmount)
        }
        if (batch.deploy()) {
            ns.print(`SUCCESS PREP: Deployed ${batch.id}!`)
            await waitBatches(ns, batch)
        }
        else {
            ns.print(`FAIL PREP: Cannot deploy batch! Splitting...`)
            const grows = calcGrows(ns, target)
            const batches = await deployGW(ns, target, grows)
            ns.print(`SUCCESS PREP: Deployed ${grows} Batches! Waiting...`)
            await waitBatches(ns, batches)
        }
    }
    return isPrepared(ns, target)
}

/**
 * @param ns 
 * @param target 
 * @returns the number of default grow batches required to max out a server
 */
function calcGrows(ns: NS, target: string) {
    if (ns.getServerMoneyAvailable(target) === 0) return 1
    return Math.ceil((Math.log2(ns.getServerMaxMoney(target) / ns.getServerMoneyAvailable(target)) / Math.log2(GROWTHAMOUNT)))
}

/** 
 * @param ns 
 * @param target 
 * @returns The number of weaken threads required to take server to min security
 */
function calcWeakens(ns: NS, target: string) {
    return Math.ceil((ns.getServerSecurityLevel(target)
        - ns.getServerMinSecurityLevel(target)) / 0.05)
}




