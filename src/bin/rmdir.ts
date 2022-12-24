import { NS } from "@ns";
/**
 * @param {NS} ns 
 */
export async function main(ns: NS) {
    if (!ns.args[0])  {
        ns.tprint("ERROR Name a Directory to Remove")
        ns.exit()
    }
    const files = ns.ls(ns.getHostname(), ns.args[0] + '/')
    if (!files.length) {
        ns.tprint("ERROR Invalid Directory")
        ns.exit()
    } 
    files.forEach(f => ns.rm(f))
}