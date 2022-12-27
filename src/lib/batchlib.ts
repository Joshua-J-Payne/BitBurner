import { NS } from "@ns";
import { GW } from "classes/GW";
import { HWGW } from "classes/HWGW";
import { BATCHDELAY, DEBUG } from "lib/constants";

/**
 * Sorts a given list of servers by priority
 * @param ns 
 * @param servers list of servers
 * @returns sorted array of servers
 */
export function prioritizeServers(ns: NS, servers: string[]): string[] {
	return servers.sort((a: string, b: string) => priority(ns, b) - priority(ns, a))
}


// Returns a weight that can be used to sort servers by hack desirability
function priority(ns: NS, server: string) {
	if (!server) return 0;

	if (server == "home") return 0;
	
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

export function isPrepared(ns: NS, targets: string | string[]): boolean {
	if (!Array.isArray(targets)) targets = [targets]
	return targets.every(t => isWeakened(ns, t) && isGrown(ns, t))
}


/**
 * Waits until all batches are complete
 * @param ns 
 * @param batches 
 */
export async function waitBatches(ns: NS, batches: Batch[] | Batch) {
	if (!Array.isArray(batches)) batches = [batches]
	if (DEBUG)
		ns.print(`WARN Waiting on all batches ${batches.reduce((acc, b) => acc + b.id + ',', "")}`)
	while (batches.some(b => b && b.isDeployed())) { await ns.sleep(5) }
}
/**
 * Waits until any batch completes
 * @param ns 
 * @param batches 
 */
export async function waitAnyBatches(ns: NS, batches: Batch[] | Batch) {
	if (!Array.isArray(batches)) batches = [batches]
	if (DEBUG)
		ns.print(`WARN Waiting on any batch to end ${batches.reduce((acc, b) => acc + b.id + ',', "")}`)
	while (batches.every(b => b && b.isDeployed())) { await ns.sleep(5) }
}

/**
 * Creates and deploys HWGW batches until one fails to deploy
 * @param ns 
 * @param target 
 * @param count number of batches to deploy
 * @param hackAmount hacking percentage
 * @returns array of deployed batches
 */
export async function deployHWGW(ns: NS, target: string, count: number, hackAmount?: number) {
	const batches = []
	for (let i = 0; i < count; i++) {
		await ns.sleep(BATCHDELAY)
		if (hackAmount)
			batches.push(new HWGW(ns, target, `HWGW-${target}-${i}`, hackAmount))
		else batches.push(new HWGW(ns, target, `HWGW-${target}-${i}`))
		if (!batches[i].deploy()) break
	}
	return batches
}
/**
 * Creates and deploys GW batches until one fails to deploy
 * @param ns 
 * @param target 
 * @param count number of batches to deploy
 * @param growAmount growth multiplier
 * @returns array of deployed batches
 */
export async function deployGW(ns: NS, target: string, count: number, growAmount?: number) {
	const batches = []
	for (let i = 0; i < count; i++) {
		await ns.sleep(BATCHDELAY)
		if (growAmount)
			batches.push(new GW(ns, target, `GW-${target}-${i}`, growAmount))
		else batches.push(new GW(ns, target, `GW-${target}-${i}`))
		if (!batches[i].deploy()) break
	}
	return batches
}