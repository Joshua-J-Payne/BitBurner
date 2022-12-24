import { NS } from "@ns";
import { canHack, deployScript, totalAvailableThreads } from "lib/utils";
import * as C from "lib/constants";
import { Batch } from "lib/Batch";


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

//THREADS AND BATCH CALCULATIONS

/**Calcuates duration of each batch step
 * @param  ns 
 * @param  target - target server
 * @return  Array with stats
*/
export function calcBatchTimes(ns: NS, target: string, hackAmount?: number): number[] {
	const times: number[] = []
	if (hackAmount) {
		times.push(Math.ceil(ns.getHackTime(target)))
		times.push(Math.ceil(ns.getWeakenTime(target)))
	}
	times.push(Math.ceil(ns.getGrowTime(target)))
	times.push(Math.ceil(ns.getWeakenTime(target)))
	return times
}
/**
 * Calculates necessary delays to make batch end simultaneously
 * @param times array of durations
 * @param hackAmount 
 * @returns array of delays
 */
export function calcBatchDelays(times: number[], hackAmount?: number): number[] {
	const delays: number[] = []
	const maxTime = Math.max(...times)

	if (hackAmount) {
		delays.push(maxTime - times[0])
		delays.push(maxTime - times[1] + C.PSERVBUFFER)
	}
	delays.push(maxTime - times[times.length - 2] + 2 * C.PSERVBUFFER)
	delays.push(maxTime - times[times.length - 1] + 3 * C.PSERVBUFFER)

	return delays
}
/**Calculates necessary delays to make batch end simultaneously
 * @param times - array of times
 * @param delays - array of delays
 * @return Array with stats
*/
export function calcBatchEndTimes(times: number[], delays: number[]): number[] {
	if (times.length !== delays.length) throw ("ERROR Invalid Parameters: Unequal Length")
	return times.map((time, idx) => time + delays[idx])
}
/**Logs the stats for a given batch
 * @param {NS} ns 
 * @param  
 */


/**Returns the number of threads required for a batch
 * @param {NS} ns
 * @param {String} target - target server 
 * @param {Number} hackAmount - Percentage of maxMoney to take from target server 
 * @return {number[]} Array of threadcounts
*/
export function calcBatchThreads(ns: NS, target: string, hackAmount?: number): number[] {
	const threads: number[] = []
	let growAmount = C.BATCHDELAY
	if (hackAmount) {
		growAmount = 1 / (1 - hackAmount)
		threads.push(Math.ceil(ns.hackAnalyzeThreads(target, hackAmount * ns.getServerMaxMoney(target))))
		threads.push(Math.ceil(ns.hackAnalyzeSecurity(threads[0], target) / 0.05))
	}
	threads.push(Math.ceil(ns.growthAnalyze(target, growAmount)))
	threads.push(Math.ceil(ns.growthAnalyzeSecurity(threads[threads.length - 1]) / 0.05))

	return threads
}

/** Prepares Server for batching
 * @param {NS} ns 
 * @param {string} target 
 * @param {string[]} servers
 */
export function prepareServer(ns: NS, target: string, servers: string[]) {
	if (!Array.isArray(servers)) throw ("Must Provide Server Hostnames")
	servers.forEach(p => ns.scp(Object.values(C.SCRIPTS), p))

	let requiredWeakens = Math.ceil(ns.getServerSecurityLevel(target) / 0.05)
	while (requiredWeakens > 0) {
		const weakens = Math.min(totalAvailableThreads(ns, servers, C.SCRIPTS.WEAKEN), requiredWeakens)
		deployScript(ns, C.SCRIPTS.WEAKEN, weakens, servers, [target, "0"])
		requiredWeakens -= weakens
	}
	while(ns.getServerMoneyAvailable(target) < ns.getServerMaxMoney(target)) {
		let id = 1
		const batch = new Batch(ns, target, `PREP-${id}`)
		batch.deploy()
		id++
	}

}




