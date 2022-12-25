import { NS } from "@ns";
import { canHack } from "lib/utils";


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
export function priority(ns: NS, hostname: string): number {
	const server = ns.getServer(hostname)
	if (!canHack(ns, hostname)) return 0;
	// Default pre-Formulas.exe weight. minDifficulty directly affects times, so it substitutes for min security times
	let weight = server.moneyMax / server.minDifficulty;

	// If we have formulas, we can refine the weight calculation
	if (ns.fileExists('Formulas.exe')) {
		// We use weakenTime instead of minDifficulty since we got access to it, 
		// and we add hackChance to the mix (pre-formulas.exe hack chance formula is based on current security, which is useless)
		const player = ns.getPlayer()
		weight = server.moneyMax / ns.formulas.hacking.weakenTime(server, player) * ns.formulas.hacking.hackChance(server, player);
	}
	else
		// If we do not have formulas, we can't properly factor in hackchance, so we lower the hacking level tolerance by half
		if (server.requiredHackingSkill > ns.getHackingLevel() / 2)
			return 0;

	return weight;
}








