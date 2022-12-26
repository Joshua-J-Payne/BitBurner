import { NS } from "@ns";
import { DEBUG, SERVERFILE } from "lib/constants";

/**Uses BFS to find every server*/
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

//returns servers in SERVERFILE. 
export function getServers(ns: NS): string[] {
	if (ns.fileExists(SERVERFILE)) return JSON.parse(ns.read(SERVERFILE))
	else {
		ns.tprint("ERROR Server file not found")
		ns.exit()
	}
}


/**Gets a list of all servernames with admin access*/
export function getAdminServers(ns: NS): string[] {
	return getServers(ns).filter(s => ns.hasRootAccess(s))
}

/**Runs all existing port openers on server */
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


/**Checks if server is hackable*/
export function canHack(ns: NS, server: string): boolean {
	return (ns.hasRootAccess(server) && ns.getServerRequiredHackingLevel(server) <= ns.getHackingLevel())
}



/**Calculates the total amount of script threads that can be run on server list */
export function totalAvailableThreads(ns: NS, servers: string[], script: string): number {
	return servers.reduce((acc, s) => acc + calcThreads(ns, script, s), 0)
}

/**Calculates number of script threads that can be run on single host server */
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
 * @param pids Array of pids
 * @param message Message to be sent upon completion
*/
export async function waitPids(ns: NS, pids: number | number[], message = ""): Promise<void> {
	if (!Array.isArray(pids)) pids = [pids];
	while (pids.some(p => ns.isRunning(p))) { await ns.sleep(5); }
	if (message) ns.print(message)
}
export async function waitAnyPids(ns: NS, pids: number | number[]): Promise<void> {
	if (!Array.isArray(pids)) pids = [pids];
	while (pids.every(p => ns.isRunning(p))) { await ns.sleep(5); }
}

export async function waitBatches(ns: NS, batches: Batch[] | Batch) {
	if (!Array.isArray(batches)) batches = [batches]
	if (DEBUG)
		ns.print(`WARN Waiting on all batches ${batches.reduce((acc, b) => acc + b.id + ',', "")}`)
	while (batches.some(b => b && b.isDeployed())) { await ns.sleep(5) }
}
export async function waitAnyBatches(ns: NS, batches: Batch[] | Batch) {
	if (!Array.isArray(batches)) batches = [batches]
	if (DEBUG)
		ns.print(`WARN Waiting on a batch to end ${batches.reduce((acc, b) => acc + b.id + ',', "")}`)
	while (batches.every(b => b && b.isDeployed())) { await ns.sleep(5) }
}

/**Kills all pids in list
 * @param {NS} ns 
 * @param {Number[]} pids Array of pids
 */
export function killPids(ns: NS, pids: number[]) {
	pids.forEach(p => ns.kill(p))
}

/**Deploys script threads across as many servers as necessary
 * @param {NS} ns
 * @param {string} script script to be deployed
 * @param {Number} threads number of threads to deploy
 * @param {string[]} servers Array of server hostnames
 * @return {Number[]} Array of pids of deployed scripts
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


