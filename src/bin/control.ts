import { NS } from "@ns";
import { HWGW } from "classes/HWGW";
import { BATCHDELAY, BATCHTARGET, DEBUG, HACKAMOUNT, PREPARESCRIPT } from "lib/constants";
import { findAdminServers, waitBatches, waitPids } from "lib/utils";
import { isPrepared } from "./prepareServer";

/** @param {NS} ns */
export async function main(ns: NS) {
	ns.disableLog("ALL")
	//Args Handling
	const target = (ns.args[0]) ? `${ns.args[0]}` : BATCHTARGET
	const hackAmount = (ns.args[1]) ? +ns.args[1] : HACKAMOUNT
	if (!ns.serverExists(target)) ns.tprint("ERROR Invalid target"), ns.exit()
	if (hackAmount >= 1) ns.tprint("ERROR Cannot take 100% of funds"), ns.exit()
	const servers = findAdminServers(ns)
	const pid = ns.exec(PREPARESCRIPT, "home", 1, target, ...servers)
	waitPids(ns, pid)

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






