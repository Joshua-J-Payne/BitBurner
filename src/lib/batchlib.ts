import { NS } from "@ns";
import { DEBUG } from "lib/constants";

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


export function isWeakened(ns: NS, target: string): boolean {
    return ns.getServerSecurityLevel(target) === ns.getServerMinSecurityLevel(target)
}

export function isGrown(ns: NS, target: string): boolean {
    return ns.getServerMoneyAvailable(target) === ns.getServerMaxMoney(target)
}

export function isPrepared(ns: NS, target: string): boolean {
    if (!DEBUG) return isWeakened(ns, target) && isGrown(ns, target)
    const w = isWeakened(ns, target)
    const g = isGrown(ns, target)
    ns.print(`DEBUG: isPrepared() returned isWeakened(): ${w} isGrown(): ${g}`)
    return w && g
}


export function calcGrows(ns: NS, target: string) {
    return Math.ceil(Math.log2(ns.getServerMaxMoney(target) / ns.getServerMoneyAvailable(target)))
}

export function calcWeakens(ns: NS, target: string) {
    return Math.ceil((ns.getServerSecurityLevel(target)
        - ns.getServerMinSecurityLevel(target)) / 0.05)
}