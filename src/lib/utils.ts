import { NS } from "@ns";
import { DEBUG, SERVERFILE } from "lib/constants";

/**
 * Uses BFS to find every server
 * @param ns 
 * @returns array of servers
 */
export function searchServers(ns: NS): string[] {
	ns.disableLog("scan")
	const queue = [ns.getHostname()]
	const visited: Set<string> = new Set([])
	while (queue.length) {
		const curServer = queue.shift()
		if (!curServer) throw ("Your Search Algorithm is totally fucked up")
		visited.add(curServer)
		const nextServers = ns.scan(curServer)
		//Push unvisited servers onto queue
		queue.push(...nextServers.filter(s => !visited.has(s)))
	}
	return Array.from(visited)
}

/**
 * gets servers from SERVERFILE 
 * @param ns 
 * @returns array of servers
 */ 
export function getServers(ns: NS): string[] {
	if (ns.fileExists(SERVERFILE)) return JSON.parse(ns.read(SERVERFILE))
	else {
		ns.tprint("ERROR Server file not found")
		ns.exit()
	}
}


/**
 * Gets a list of all servernames with admin access
 * @param ns 
 * @returns array of servers by order of priority()
 */
export function getAdminServers(ns: NS): string[] {
	return getServers(ns).filter(s => ns.hasRootAccess(s))
}

/**
 * Runs all existing port openers on server 
 * @param ns 
 * @param server 
 */
export function openPorts(ns: NS, server: string) {
	ns.disableLog("brutessh"), ns.disableLog("relaysmtp")
	ns.disableLog("httpworm"), ns.disableLog("sqlinject")
	ns.disableLog("ftpcrack")
	//Put every available port opening script here
	if (ns.fileExists("BruteSSH.exe")) ns.brutessh(server)
	if (ns.fileExists("FTPCrack.exe")) ns.ftpcrack(server)
	if (ns.fileExists("SQLInject.exe")) ns.sqlinject(server)
	if (ns.fileExists("HTTPWorm.exe")) ns.httpworm(server)
	if (ns.fileExists("relaySMTP.exe")) ns.relaysmtp(server)
}

/**
 * Calculates the total amount of script threads that can be run on server list 
 * @param ns 
 * @param servers list of servers to host script
 * @param script 
 * @returns the number of threads that could be run across the server list
 */
export function totalAvailableThreads(ns: NS, servers: string[], script: string): number {
	return servers.reduce((acc, s) => acc + calcThreads(ns, script, s), 0)
}

/**
 * Calculates number of script threads that can be run on single host server 
 * @param ns 
 * @param script 
 * @param host 
 * @returns thread count
 */
export function calcThreads(ns: NS, script: string, host: string): number {
	if (!ns.serverExists(host)) throw ("Invalid Server Name")
	let maxRam = ns.getServerMaxRam(host)
	if (host == "home") maxRam /= 2
	const threads = (maxRam - ns.getServerUsedRam(host))
		/ ns.getScriptRam(script, host)
	if (threads <= 0) return 0
	return Math.floor(threads)
}

/**Sleeps until all pids stop running 
 * @param ns 
 * @param pids 
*/
export async function waitPids(ns: NS, pids: number | number[]): Promise<void> {
	if (!Array.isArray(pids)) pids = [pids];
	while (pids.some(p => ns.isRunning(p))) { await ns.sleep(5); }
}
/**
 * Sleeps until any pid stop running
 * @param ns 
 * @param pids 
 */
export async function waitAnyPids(ns: NS, pids: number | number[]): Promise<void> {
	if (!Array.isArray(pids)) pids = [pids];
	while (pids.every(p => ns.isRunning(p))) { await ns.sleep(5); }
}


/**
 * Kills all pids 
 * @param ns 
 * @param pids 
 */
export function killPids(ns: NS, pids: number[]) {
	pids.forEach(p => ns.kill(p))
}

/**
 * Attempts to start a given script across server list
 * @param ns 
 * @param script 
 * @param threads 
 * @param servers servers to host script
 * @param args args to be given to script
 * @returns 
 */
export function deployScript(ns: NS, script: string, threads: number, servers: string[], ...args: string[]): number[] {
	if (threads === 0) return []
	const pids = []
	let toDeploy = threads
	for (const s of servers) {
		const maxThreads = calcThreads(ns, script, s)
		if (maxThreads === 0) continue
		const deployed = Math.min(maxThreads, toDeploy)
		pids.push(ns.exec(script, s, deployed, ...args))
		toDeploy -= deployed
		if (toDeploy === 0) {
			if (DEBUG) ns.print(`SUCCESS DEBUG: deployScript() deployed ${threads} ${script}`)
			return pids
		}
	}
	//Should return before exiting loop
	killPids(ns, pids)
	if (DEBUG) ns.print(`ERROR DEBUG deployScript() Can't deploy ${threads} ${script}`)
	return []
}


