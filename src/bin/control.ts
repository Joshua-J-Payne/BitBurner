import { NS } from "@ns";
import { prepareServer } from "lib/batchlib"
import { findAdminServers} from "lib/utils"
import { BATCHTARGET, HACKAMOUNT } from "lib/constants";

/** @param {NS} ns */
export async function main(ns: NS) {
	ns.disableLog("ALL")

	//Handling Arguments
	if (HACKAMOUNT >= 1) {
		ns.tprint("ERROR Cannot take 100% of funds")
		ns.exit()
	}

	// eslint-disable-next-line no-constant-condition
	while (true) {
		await ns.sleep(5)

		const servers = findAdminServers(ns)
		prepareServer(ns, BATCHTARGET, servers)

		
	}




}