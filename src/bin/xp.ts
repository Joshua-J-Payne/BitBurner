import { NS } from "@ns";
import { isWeakened, calcWeakens } from "lib/batchlib";
import { SCRIPTS, XPTARGET } from "lib/constants";
import { totalAvailableThreads, deployScript, waitPids, findServers, waitBatches } from "lib/utils";
import { GW } from "classes/GW";

export async function main(ns: NS): Promise<void> {
    ns.disableLog("ALL")
    // eslint-disable-next-line no-constant-condition
    while (true) {
        const target = XPTARGET
        const servers = findServers(ns)
        const pids = []
        while (!isWeakened(ns, target)) {
            const requiredWeakens = calcWeakens(ns, target)
            ns.print(`INFO XP: Weakening server with ${requiredWeakens} threads...`)
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
        while (isWeakened(ns, target)) {
            ns.print(`INFO XP: Making GW Batches on ${target}...`)
            const batches: GW[] = []
            let batch = new GW(ns, target, `GW-${target}-${batches.length}`)
            while (batch.deploy()) {
                batches.push(batch)
                batch = new GW(ns, target, `GW-${target}-${batches.length}`)
            }
            ns.print(`WARN XP: RAM depleted!, Waiting...`)
            await waitBatches(ns, batches)
        }
    }
}

