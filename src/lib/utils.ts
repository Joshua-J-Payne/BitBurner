import { NS } from "@ns";
/**Uses BFS to find every server
 * @param {NS} ns
 * @returns {string[]} Array of server names 
 */
export function findServers(ns: NS): string[] {
	const queue = [ns.getHostname()]
	const visited: Set<string> = new Set()
	while (queue.length) {
		const curServer = queue.shift()
		if (!curServer) throw ("Your Server Algorithm is totally fucked up")
		visited.add(curServer)
		const nextServers = ns.scan(curServer)
		//Push unvisited servers onto queue
		queue.push(...nextServers.filter(s => !visited.has(s)))
	}
	return Array.from(visited)
}

/**Runs all existing port openers on server
 * @param {NS} ns
 * @param {string} server
 */
export function openPorts(ns: NS, server: string) {
	//Put every available port opening script here
	if (ns.fileExists("BruteSSH.exe")) ns.brutessh(server)
	if (ns.fileExists("FTPCrack.exe")) ns.ftpcrack(server)
	if (ns.fileExists("SQLInject.exe")) ns.sqlinject(server)
	if (ns.fileExists("HTTPWorm.exe")) ns.httpworm(server)
	if (ns.fileExists("relaySMTP.exe")) ns.relaysmtp(server)
}

/**Gets a list of all servernames with admin access
 * @param {NS} ns
 * @return {String[]} An array of hostnames
 */
export function findAdminServers(ns: NS): string[] {
	return findServers(ns).filter(s => ns.hasRootAccess(s))
}

/**Checks if server is hackable
 * @param {NS} ns
 * @param {string} server Server to check
 * @return {bool} true if player has root and required hacking level
 */
export function canHack(ns: NS, server: string): boolean {
	return (ns.hasRootAccess(server) && ns.getServerRequiredHackingLevel(server) <= ns.getHackingLevel())
}

/**Checks if server is prepared for batching
 * @param {NS} ns
 * @param {string} server Server to check
 * @returns {boolean} true if server at max money and min security
 */
export function isPrepared(ns: NS, server: string): boolean {
	return (ns.getServerMoneyAvailable(server) === ns.getServerMaxMoney(server))
		&& (ns.getServerSecurityLevel(server) === ns.getServerMinSecurityLevel(server))
}

/**Calculates the total amount of script threads that can be run on server list
 * @param {NS} ns
 * @param {string[]} scripts Script to run
 * @param {string[]} servers Array of server hostnames
 * @return {Number} total threadcount available 
 */
export function totalAvailableThreads(ns: NS, servers: string[], ...scripts: string[]): number {
	let total = 0
	for (const script in scripts) {
		total += servers.reduce((acc, s) => acc + calcThreads(ns, script, s), 0)
	}
	return total
}
/**Calculates number of script threads that can be run on single host server
 * @param {NS} ns
 * @param {String} host - hostname of server
 * @param {String} script - name of script
 * @return {Number} threadcount available 
 */
export function calcThreads(ns: NS, script: string, host: string): number {
	const threads = (ns.getServerMaxRam(host) - ns.getServerUsedRam(host))
		/ ns.getScriptRam(script, host)
	return Math.floor(threads)
}

/**Sleeps until all pids stop running 
 * @param {NS} ns 
 * @param {Number[]} pids Array of pids
 * @param {String} [message] Message to be sent upon completion
*/
export async function waitPids(ns: NS, pids: number[], message = "") {
	if (!Array.isArray(pids)) pids = [pids];
	while (pids.some(p => ns.isRunning(p))) { await ns.sleep(5); }
	if (message) ns.print(message)
}

/**Kills all pids in list
 * @param {NS} ns 
 * @param {Number[]} pids Array of pids
 */
export function killPids(ns: NS, pids: number[]) {
	if (!Array.isArray(pids)) pids = [pids];
	pids.forEach(p => ns.kill(p))
}

/**Deploys script threads across as many servers as necessary
 * @param {NS} ns
 * @param {string} script script to be deployed
 * @param {Number} threads number of threads to deploy
 * @param {string[]} servers Array of server hostnames
 * @param {string} [id] An ID to give the scripts at runtime
 * @return {Number[]} Array of pids of deployed scripts
 */
export function deployScript(ns: NS, script: string, threads: number, servers: string[], args: string[]): Array<number> {
	const pids = []
	for (const s of servers) {
		const deployed = Math.min(calcThreads(ns, script, s), threads)
		pids.push(ns.exec(script, s, deployed, ...args))
		threads -= deployed
		if (!threads) return pids
	}
	//Should return before exiting loop
	killPids(ns, pids)
	ns.print("ERROR Cannot Fully Deploy")
	return []
}

