import { NS } from "@ns";
import { SCRIPTS, SHAREPERCENT } from "lib/constants";
import { getServers } from "lib/utils";

export async function main(ns: NS): Promise<void> {
    const flags = ns.flags([['kill', false]])
    const servers = getServers(ns)
    if(flags.kill) {
        servers.forEach(s => ns.kill(SCRIPTS.SHARE, s))
        ns.exit()
    }
    servers.forEach(s => {
        ns.scp(SCRIPTS.SHARE, s)
        const shareThreads = Math.max((ns.getServerMaxRam(s) * SHAREPERCENT)/ns.getScriptRam(SCRIPTS.SHARE), 1)
        ns.exec(SCRIPTS.SHARE, s, shareThreads)
    })

}
