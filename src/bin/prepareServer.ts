import { NS } from "@ns";
import { GW } from "classes/GW";
import { calcGrows, calcWeakens, deployGW, isGrown, isPrepared, isWeakened } from "lib/batchlib";
import { SCRIPTS } from "lib/constants";
import { deployScript, getAdminServers, totalAvailableThreads, waitBatches, waitPids } from "lib/utils";

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
        const growAmount = ns.getServerMaxMoney(target) / ns.getServerMoneyAvailable(target)
        ns.print(`INFO PREP: Trying single GW Batch...`)
        const batch = new GW(ns, target, `GW-${target}-0`, growAmount)
        if (batch.deploy()) {
            ns.print(`SUCCESS PREP: Deployed ${batch.id}!`)
            await waitBatches(ns, batch)
        }
        else {
            ns.print(`FAIL PREP: Cannot deploy batch! Splitting...`)
            const grows = calcGrows(ns, target)
            await deployGW(ns, target, grows)
            ns.print(`SUCCESS PREP: Deployed ${grows} Batches!`)
        }
    }
    return isPrepared(ns, target)
}






