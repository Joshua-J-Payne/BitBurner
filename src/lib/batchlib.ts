import { NS } from "@ns";
import { GW } from "classes/GW";
import { DEBUG, SCRIPTS } from "lib/constants";
import { deployScript, isPrepared, isWeakened, totalAvailableThreads, waitBatches, waitPids } from "lib/utils";


/**
 * Sorts a given list of servers by priority
 * @param ns 
 * @param servers list of servers
 * @returns Sorted array of servers
 */
export function prioritizeServers(ns: NS, servers: string[]): string[] {
	return servers.sort((a: string, b: string) => priority(ns, b) - priority(ns, a))
}

/**returns server priorty calculation
 * @param ns
 * @param hostname server name
 */
// Returns a weight that can be used to sort servers by hack desirability
function priority(ns: NS, server: string) {
    if (!server) return 0;
    
    // Don't ask, endgame stuff
    if (server.startsWith('hacknet-node')) return 0;

    // Get the player information
    const player = ns.getPlayer();

    // Get the server information
    const so = ns.getServer(server);

    // Set security to minimum on the server object (for Formula.exe functions)
    so.hackDifficulty = so.minDifficulty;

    // We cannot hack a server that has more than our hacking skill so these have no value
    if (so.requiredHackingSkill > player.skills.hacking) return 0;

    // Default pre-Formulas.exe weight. minDifficulty directly affects times, so it substitutes for min security times
    let weight = so.moneyMax / so.minDifficulty;

    // If we have formulas, we can refine the weight calculation
    if (ns.fileExists('Formulas.exe')) {
        // We use weakenTime instead of minDifficulty since we got access to it, 
        // and we add hackChance to the mix (pre-formulas.exe hack chance formula is based on current security, which is useless)
        weight = so.moneyMax / ns.formulas.hacking.weakenTime(so, player) * ns.formulas.hacking.hackChance(so, player);
    }
    else
        // If we do not have formulas, we can't properly factor in hackchance, so we lower the hacking level tolerance by half
        if (so.requiredHackingSkill > player.skills.hacking / 2)
            return 0;

    return weight;
}

export async function prepareServer(ns: NS, target: string, servers: string[]) {
	//Send files to attacking servers
	servers.forEach(p => ns.scp(Object.values(SCRIPTS), p))

	let requiredWeakens = Math.ceil((ns.getServerSecurityLevel(target) - ns.getServerMinSecurityLevel(target)) / 0.05)

	ns.print(`INFO PREP: Weakening server with ${requiredWeakens} threads...`)
	const pids = []
	while (requiredWeakens > 0) {
		const deployedThreads = Math.min(totalAvailableThreads(ns, servers, SCRIPTS.WEAKEN), requiredWeakens)
		pids.push(...deployScript(
			ns,
			SCRIPTS.WEAKEN,
			deployedThreads,
			servers,
			target,
			"0"))
		requiredWeakens -= deployedThreads
	}
	await waitPids(ns, pids)
	if (!isWeakened(ns, target)) { ns.print("ERROR PREP: Weaken incomplete"), ns.exit() }

	let requiredGrows = Math.ceil(Math.log2(ns.getServerMaxMoney(target) / ns.getServerMoneyAvailable(target)) + 1)
	ns.print(`INFO PREP: Making ${requiredGrows} GW Batches...`)
	let batches: GW[] = []
	while (requiredGrows > 0) {
		const batch = new GW(ns, target, `GW-${batches.length}`)
		if (!batch.deploy()) {
			ns.print(`WARN PREP: Cannot deploy batch, waiting...`)
			await waitBatches(ns, batches)
			batches = []
		}
		else batches.push(batch)
		if (DEBUG) batch.log()
		requiredGrows -= 1
	}
	await waitBatches(ns, batches)

	if (isPrepared(ns, target)) ns.print(`SUCCESS PREP: ${target} Prepared...`)
	else { ns.print(`ERROR PREP: Failed to Prepare ${target}`), ns.exit() }
}







