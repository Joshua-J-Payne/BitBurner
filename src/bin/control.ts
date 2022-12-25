import { NS } from "@ns";
import { GW } from "classes/GW";
import { HWGW } from "classes/HWGW";
import { BATCHDELAY, BATCHTARGET, DEBUG, HACKAMOUNT, SCRIPTS } from "lib/constants";
import { deployScript, findAdminServers, isPrepared, isWeakened, totalAvailableThreads, waitBatches, waitPids } from "lib/utils";

/** @param {NS} ns */
export async function main(ns: NS) {
	ns.disableLog("ALL")
	//Args Handling
	const target = (ns.args[0]) ? `${ns.args[0]}` : BATCHTARGET
	const hackAmount = (ns.args[1]) ? +ns.args[1] : HACKAMOUNT
	if (!ns.serverExists(target)) ns.tprint("ERROR Invalid target"), ns.exit()
	if (hackAmount >= 1) ns.tprint("ERROR Cannot take 100% of funds"), ns.exit()
	const servers = findAdminServers(ns)
	await prepareServer(ns, target, servers)

	/**The Main Script
	 * Create batches and deploy
	 * Once a batch can't deploy, servers are out of ram.
	 * Wait for all batches to complete
	 * Repeat while target is prepared
	 */
	let batches: HWGW[] = []
	while (isPrepared(ns, target)) {
		await ns.sleep(BATCHDELAY)
		const batch = new HWGW(ns, target, `HWGW-${batches.length}`, hackAmount)
		batches.push(batch)
		if (DEBUG) batch.log()
		if (!batch.deploy()) {
			ns.print(`WARN CONTROL Servers out of RAM, waiting...`)
			await waitBatches(ns, batches)
			batches = []
		}
	}
	ns.print(`ERROR CONTROL: ${target} no longer prepared! stopping...`)
}



async function prepareServer(ns: NS, target: string, servers: string[]) {
	//Send files to attacking servers
	servers.forEach(p => ns.scp(Object.values(SCRIPTS), p))

	let requiredWeakens = Math.ceil((ns.getServerSecurityLevel(target) - ns.getServerMinSecurityLevel(target)) / 0.05)

	ns.print(`INFO PREP: Weakening server with ${requiredWeakens} threads...`)
	const pids = []
	while (requiredWeakens > 0) {
		const deployedThreads = Math.min(totalAvailableThreads(ns, servers, SCRIPTS.WEAKEN), requiredWeakens)
		pids.push(...deployScript(ns, SCRIPTS.WEAKEN, deployedThreads, servers, target, "0"))
		requiredWeakens -= deployedThreads
	}
	await waitPids(ns, pids)
	if (!isWeakened(ns, target)) { ns.print("ERROR PREP: Weaken incomplete"), ns.exit() }

	let requiredGrows = Math.ceil(Math.log2(ns.getServerMaxMoney(target) / ns.getServerMoneyAvailable(target)))
	ns.print(`INFO PREP: Making ${requiredGrows} GW Batches...`)
	let batches: GW[] = []
	while (requiredGrows > 0) {
		const batch = new GW(ns, target, `GW-${batches.length}`)
		batches.push(batch)
		if (!batch.deploy()) {
			ns.print(`WARN PREP: Cannot deploy batch, waiting...`)
			await waitBatches(ns, batches)
			batches = []
		}
		if (DEBUG) batch.log()
		requiredGrows -= 1
	}
	await waitBatches(ns, batches)

	if (isPrepared(ns, target)) ns.print(`SUCCESS PREP: ${target} Prepared...`)
	else { ns.print(`ERROR PREP: Failed to Prepare ${target}`), ns.exit() }
}


